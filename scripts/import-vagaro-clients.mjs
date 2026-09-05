// Import a Vagaro customer-list CSV into the `imported_clients` staging table.
//
//   node scripts/import-vagaro-clients.mjs <path-to.csv> [--dry-run] [--source=vagaro]
//
// Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local.
// Idempotent: rows with a source id upsert on (source, source_ref); rows
// without one are skipped if an unclaimed contact with the same normalised
// email or phone already exists.
//
// Nothing here touches the `clients` table — real accounts are linked later by
// syncClient() in lib/current-user.ts on first sign-up.

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ── args ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const csvPath = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");
const source = (args.find((a) => a.startsWith("--source=")) || "--source=vagaro").split("=")[1];

if (!csvPath) {
  console.error("Usage: node scripts/import-vagaro-clients.mjs <file.csv> [--dry-run]");
  process.exit(1);
}

// ── env ───────────────────────────────────────────────────────────────────────
const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"(.*)"$/, "$1");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── minimal RFC-4180 CSV parser (handles quotes, escaped quotes, newlines) ────
function parseCsv(text) {
  text = text.replace(/^﻿/, ""); // strip BOM
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\r") { /* ignore */ }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

// ── header mapping (fuzzy, order matters — first match wins) ───────────────────
const FIELD_PATTERNS = {
  source_ref:   [/^client\s*id$/i, /^customer\s*id$/i, /^id$/i],
  first_name:   [/^first\s*name$/i, /^firstname$/i, /^first$/i],
  last_name:    [/^last\s*name$/i, /^lastname$/i, /^last$/i],
  full_name:    [/^name$/i, /^full\s*name$/i, /^client\s*name$/i, /^customer\s*name$/i],
  email:        [/e-?mail/i],
  phone:        [/^cell\s*phone$/i, /^mobile\s*phone$/i, /^mobile$/i, /^cell$/i, /^phone(\s*number)?$/i, /^primary\s*phone$/i],
  notes:        [/^customer\s*notes$/i, /^client\s*notes$/i, /^notes$/i, /^note$/i],
  tags:         [/^tags?$/i, /^group(s)?$/i, /^categor(y|ies)$/i],
  birthday:     [/^birth\s*day$/i, /^birth\s*date$/i, /^birthday$/i, /^dob$/i],
  address:      [/^address$/i, /^street$/i, /^address\s*1$/i],
  last_visit:   [/^last\s*visit$/i, /^last\s*appointment$/i, /^last\s*seen$/i, /^last\s*booking$/i],
  total_visits: [/^total\s*visits$/i, /^visits$/i, /^appointments$/i, /^#\s*visits$/i],
  total_spent:  [/^total\s*(sales|spent|revenue)$/i, /^lifetime\s*(sales|spend|value)$/i, /^ltv$/i],
};

function mapHeaders(headers) {
  const map = {};
  headers.forEach((h, idx) => {
    const clean = h.trim();
    for (const [field, pats] of Object.entries(FIELD_PATTERNS)) {
      if (map[field] !== undefined) continue;
      if (pats.some((p) => p.test(clean))) { map[field] = idx; break; }
    }
  });
  return map;
}

// ── normalisers ──────────────────────────────────────────────────────────────
const normEmail = (v) => {
  const e = (v || "").trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? e : null;
};
const normPhone = (v) => {
  const d = (v || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return d.slice(1);
  return d.length >= 10 ? d.slice(-10) : null;
};
const toDate = (v) => {
  const s = (v || "").trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
};
const toInt = (v) => {
  const n = parseInt(String(v || "").replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};
const toCents = (v) => {
  const n = parseFloat(String(v || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};

// ── run ──────────────────────────────────────────────────────────────────────
const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
if (rows.length < 2) { console.error("CSV has no data rows."); process.exit(1); }

const headers = rows[0];
const map = mapHeaders(headers);
console.log("Header mapping:");
for (const [f, i] of Object.entries(map)) console.log(`  ${f.padEnd(13)} <- "${headers[i].trim()}"`);
const unmapped = Object.keys(FIELD_PATTERNS).filter((f) => map[f] === undefined);
if (unmapped.length) console.log("  (no column matched: " + unmapped.join(", ") + ")");

const get = (row, field) => (map[field] !== undefined ? (row[map[field]] || "").trim() : "");

const staged = [];
let noContact = 0;
for (const row of rows.slice(1)) {
  const first = get(row, "first_name");
  const last = get(row, "last_name");
  const full = get(row, "full_name") || [first, last].filter(Boolean).join(" ").trim() || null;
  const email = normEmail(get(row, "email"));
  const phone_norm = normPhone(get(row, "phone"));

  if (!email && !phone_norm) { noContact++; continue; }

  const rawObj = {};
  headers.forEach((h, i) => { if ((row[i] || "").trim() !== "") rawObj[h.trim()] = row[i].trim(); });

  staged.push({
    source,
    source_ref: get(row, "source_ref") || null,
    full_name: full,
    first_name: first || null,
    last_name: last || null,
    email: get(row, "email") || null,
    email_norm: email,
    phone: get(row, "phone") || null,
    phone_norm,
    notes: get(row, "notes") || null,
    tags: get(row, "tags") || null,
    birthday: toDate(get(row, "birthday")),
    address: get(row, "address") || null,
    last_visit: toDate(get(row, "last_visit")),
    total_visits: toInt(get(row, "total_visits")),
    total_spent_cents: toCents(get(row, "total_spent")),
    raw: rawObj,
  });
}

console.log(`\nParsed ${rows.length - 1} data rows → ${staged.length} with a usable email/phone, ${noContact} skipped (no contact info).`);

if (dryRun) {
  console.log("\n--dry-run — first 3 staged records:");
  console.log(JSON.stringify(staged.slice(0, 3), null, 2));
  process.exit(0);
}

// Split: rows with source_ref can upsert; rows without must be dedupe-checked.
const withRef = staged.filter((s) => s.source_ref);
const withoutRef = staged.filter((s) => !s.source_ref);

let inserted = 0, updated = 0, skippedDupe = 0;

if (withRef.length) {
  for (let i = 0; i < withRef.length; i += 200) {
    const chunk = withRef.slice(i, i + 200);
    const { error } = await sb.from("imported_clients").upsert(chunk, { onConflict: "source,source_ref" });
    if (error) { console.error("upsert error:", error.message); process.exit(1); }
    inserted += chunk.length;
  }
}

for (const rec of withoutRef) {
  let q = sb.from("imported_clients").select("id", { head: false }).eq("source", source).limit(1);
  if (rec.email_norm && rec.phone_norm)
    q = q.or(`email_norm.eq.${rec.email_norm},phone_norm.eq.${rec.phone_norm}`);
  else if (rec.email_norm) q = q.eq("email_norm", rec.email_norm);
  else q = q.eq("phone_norm", rec.phone_norm);
  const { data: existing } = await q;
  if (existing && existing.length) { skippedDupe++; continue; }
  const { error } = await sb.from("imported_clients").insert(rec);
  if (error) { console.error("insert error:", error.message); process.exit(1); }
  inserted++;
}

const { count } = await sb.from("imported_clients").select("*", { count: "exact", head: true }).eq("source", source);
console.log(`\nDone. inserted/updated ${inserted}, skipped ${skippedDupe} duplicates.`);
console.log(`imported_clients now holds ${count} rows for source "${source}".`);
console.log(`They link to real accounts automatically as those people sign up.`);
