-- Crowns Enchanted — Supabase schema
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
-- Auth is handled by Clerk. `clients.id` holds the Clerk user id (text, e.g. "user_2ab…").
-- All app access uses the service_role key server-side, which bypasses RLS.
-- RLS is enabled with no policies so the anon/authenticated keys can read nothing.

create extension if not exists "pgcrypto";

-- ─────────────────────────────── core tables ───────────────────────────────

create table if not exists staff (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  role             text not null default 'stylist',
  bio              text,
  avatar_url       text,
  commission_rate  numeric not null default 0.4,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create table if not exists services (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  category         text not null default 'hair',
  description      text,
  duration_minutes integer not null default 60,
  price_cents      integer not null default 0,
  deposit_cents    integer not null default 0,
  image_urls       text[] not null default '{}',
  image_keys       text[] not null default '{}',
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create table if not exists clients (
  id                 text primary key,               -- Clerk user id
  full_name          text not null default 'Guest',
  email              text not null default '',
  phone              text,
  preferred_staff_id uuid references staff(id) on delete set null,
  intake_notes       text,
  admin_notes        text,
  stripe_customer_id text,
  telegram_chat_id   text,
  whatsapp_phone     text,
  imessage_address   text,
  preferred_channel  text not null default 'email',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists staff_services (
  staff_id   uuid not null references staff(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  primary key (staff_id, service_id)
);

create table if not exists appointments (
  id                  uuid primary key default gen_random_uuid(),
  client_id           text references clients(id) on delete set null,
  guest_name          text,
  guest_phone         text,
  guest_email         text,
  staff_id            uuid references staff(id) on delete set null,
  service_id          uuid not null references services(id) on delete restrict,
  start_time          timestamptz not null,
  end_time            timestamptz not null,
  status              text not null default 'pending',
  intake_notes        text,
  admin_notes         text,
  payment_status      text not null default 'none',
  stripe_session_id   text,
  cancellation_reason text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists appointments_start_time_idx on appointments (start_time);
create index if not exists appointments_client_idx on appointments (client_id);
create index if not exists appointments_staff_idx on appointments (staff_id);

create table if not exists reviews (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references appointments(id) on delete cascade,
  client_id      text references clients(id) on delete set null,
  staff_id       uuid references staff(id) on delete set null,
  service_id     uuid references services(id) on delete set null,
  rating         integer not null check (rating between 1 and 5),
  comment        text,
  is_public      boolean not null default true,
  created_at     timestamptz not null default now()
);

create table if not exists settings (
  id                        uuid primary key,
  salon_name                text not null default 'Crowns Enchanted',
  phone                     text not null default '',
  email                     text not null default '',
  address                   text not null default '',
  open_time                 text not null default '09:00',
  close_time                text not null default '18:00',
  slot_interval_minutes     integer not null default 30,
  cancellation_policy_hours integer not null default 24,
  no_show_fee_cents         integer not null default 5000,
  reminder_hours_before     integer not null default 24,
  google_calendar_id        text,
  google_refresh_token      text,
  telegram_bot_token        text,
  telegram_chat_id          text,
  whatsapp_phone_id         text,
  whatsapp_token            text,
  obsidian_rest_url         text,
  obsidian_api_key          text,
  hermes_reminders_enabled     boolean not null default false,
  hermes_marketing_enabled     boolean not null default false,
  hermes_reengagement_enabled  boolean not null default false,
  updated_at                timestamptz not null default now()
);

-- ─────────────────────────── operations tables ────────────────────────────

create table if not exists products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  category         text not null default 'retail',
  sku              text,
  description      text,
  quantity_on_hand integer not null default 0,
  reorder_level    integer not null default 0,
  cost_cents       integer not null default 0,
  price_cents      integer not null default 0,
  supplier_name    text,
  supplier_contact text,
  image_url        text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists booth_renters (
  id                    uuid primary key default gen_random_uuid(),
  staff_id              uuid not null unique references staff(id) on delete cascade,
  monthly_rent_cents    integer not null default 0,
  billing_day           integer not null default 1,
  stripe_subscription_id text,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now()
);

create table if not exists payroll_records (
  id                  uuid primary key default gen_random_uuid(),
  staff_id            uuid not null references staff(id) on delete cascade,
  period_start        date not null,
  period_end          date not null,
  total_services      integer not null default 0,
  gross_revenue_cents integer not null default 0,
  commission_rate     numeric not null default 0,
  commission_cents    integer not null default 0,
  booth_rent_cents    integer not null default 0,
  net_payout_cents    integer not null default 0,
  status              text not null default 'pending',
  created_at          timestamptz not null default now()
);

-- ─────────────────────────── marketing / revenue ──────────────────────────

create table if not exists campaigns (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  subject       text not null default '',
  body_template text not null default '',
  segment       text not null default 'all',
  channel       text not null default 'email',
  status        text not null default 'draft',
  sent_at       timestamptz,
  sent_count    integer not null default 0,
  created_by    text,
  created_at    timestamptz not null default now()
);

create table if not exists campaign_sends (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references campaigns(id) on delete cascade,
  client_id    text references clients(id) on delete set null,
  channel_used text not null default 'email',
  sent_at      timestamptz not null default now(),
  status       text not null default 'sent'
);

create table if not exists memberships (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  description      text not null default '',
  price_cents      integer not null default 0,
  billing_interval text not null default 'monthly',
  features         text[] not null default '{}',
  stripe_price_id  text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create table if not exists client_memberships (
  id                    uuid primary key default gen_random_uuid(),
  client_id             text not null references clients(id) on delete cascade,
  membership_id         uuid not null references memberships(id) on delete restrict,
  stripe_subscription_id text,
  status                text not null default 'active',
  started_at            timestamptz not null default now(),
  next_billing_date     date
);

create table if not exists intake_forms (
  id                   uuid primary key default gen_random_uuid(),
  client_id            text references clients(id) on delete set null,
  appointment_id       uuid not null unique references appointments(id) on delete cascade,
  hair_type            text,
  hair_density         text,
  hair_texture         text,
  concerns             text[] not null default '{}',
  goals                text[] not null default '{}',
  current_products     text,
  health_conditions    text,
  allergies            text,
  last_chemical_service text,
  signature            text,
  signed_at            timestamptz,
  created_at           timestamptz not null default now()
);

create table if not exists gift_cards (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  amount_cents    integer not null default 0,
  balance_cents   integer not null default 0,
  purchased_by    text references clients(id) on delete set null,
  recipient_email text,
  message         text,
  expires_at      timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists shop_products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  price_cents     integer not null default 0,
  category        text not null default 'retail',
  image_url       text,
  stripe_price_id text,
  inventory       integer not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists google_calendar_sync (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  google_event_id text not null,
  synced_at      timestamptz not null default now(),
  last_updated   timestamptz not null default now()
);

-- ─────────────────────── imported client list (staging) ───────────────────
-- Contacts brought over from another system (e.g. Vagaro export). Kept
-- separate from `clients` so there is no fake Clerk id and no FK tangle.
-- When a real person signs up, syncClient() matches an unclaimed row here by
-- normalised email or phone, copies the useful fields onto their `clients`
-- row, and stamps `claimed_by` / `claimed_at`.
create table if not exists imported_clients (
  id                uuid primary key default gen_random_uuid(),
  source            text not null default 'vagaro',
  source_ref        text,                 -- external id from the source system, if any
  full_name         text,
  first_name        text,
  last_name         text,
  email             text,
  email_norm        text,                 -- lower(trim(email))
  phone             text,
  phone_norm        text,                 -- last 10 digits
  notes             text,
  tags              text,
  birthday          date,
  address           text,
  last_visit        date,
  total_visits      integer,
  total_spent_cents integer,
  raw               jsonb,                -- the original CSV row, verbatim
  claimed_by        text references clients(id) on delete set null,
  claimed_at        timestamptz,
  created_at        timestamptz not null default now()
);
create index if not exists imported_clients_email_norm_idx on imported_clients (email_norm);
create index if not exists imported_clients_phone_norm_idx on imported_clients (phone_norm);
-- Plain (non-partial) unique index so `on conflict (source, source_ref)` can use
-- it. Rows with a NULL source_ref never collide (NULLs are distinct in Postgres).
create unique index if not exists imported_clients_source_ref_key
  on imported_clients (source, source_ref);

-- ─────────────────────────────── storage ──────────────────────────────────

insert into storage.buckets (id, name, public)
values ('services', 'services', true), ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ─────────────────────────────────── RLS ──────────────────────────────────
-- Enabled with no policies: anon/authenticated keys see nothing.
-- The app only ever connects with the service_role key, which bypasses RLS.

do $$
declare t text;
begin
  foreach t in array array[
    'staff','services','clients','staff_services','appointments','reviews','settings',
    'products','booth_renters','payroll_records','campaigns','campaign_sends',
    'memberships','client_memberships','intake_forms','gift_cards','shop_products',
    'google_calendar_sync','imported_clients'
  ]
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;
