-- Crowns Enchanted — Full Database Schema
-- Run this in the InsForge / Supabase SQL editor.
-- Requires: btree_gist extension for appointment exclusion constraint.

-- ─────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ─────────────────────────────────────────
-- 1. clients
-- ─────────────────────────────────────────

CREATE TABLE clients (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT,
  preferred_staff_id  UUID,
  intake_notes        TEXT,
  admin_notes         TEXT,
  stripe_customer_id  TEXT,
  telegram_chat_id    TEXT,
  whatsapp_phone      TEXT,
  imessage_address    TEXT,
  preferred_channel   TEXT NOT NULL DEFAULT 'email'
                        CHECK (preferred_channel IN ('telegram','whatsapp','imessage','email')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 2. staff
-- ─────────────────────────────────────────

CREATE TABLE staff (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'stylist'
                    CHECK (role IN ('stylist','colorist','nail_tech','esthetician','other')),
  bio             TEXT,
  avatar_url      TEXT,
  commission_rate DECIMAL(4,2) NOT NULL DEFAULT 0.40,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 3. services
-- ─────────────────────────────────────────

CREATE TABLE services (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'hair'
                      CHECK (category IN ('hair','color','nails','skin','other')),
  description       TEXT,
  duration_minutes  INTEGER NOT NULL,
  price_cents       INTEGER NOT NULL CHECK (price_cents >= 0),
  deposit_cents     INTEGER NOT NULL DEFAULT 0 CHECK (deposit_cents >= 0),
  image_urls        TEXT[] NOT NULL DEFAULT '{}',
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 4. staff_services (junction)
-- ─────────────────────────────────────────

CREATE TABLE staff_services (
  staff_id    UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, service_id)
);

-- ─────────────────────────────────────────
-- 5. appointments
-- ─────────────────────────────────────────

CREATE TABLE appointments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id             UUID NOT NULL REFERENCES clients(id),
  staff_id              UUID NOT NULL REFERENCES staff(id),
  service_id            UUID NOT NULL REFERENCES services(id),
  start_time            TIMESTAMPTZ NOT NULL,
  end_time              TIMESTAMPTZ NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','confirmed','completed','cancelled','no_show')),
  intake_notes          TEXT,
  admin_notes           TEXT,
  payment_status        TEXT NOT NULL DEFAULT 'none'
                          CHECK (payment_status IN ('none','deposit_pending','deposit_paid','fully_paid')),
  stripe_session_id     TEXT,
  cancellation_reason   TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- No double-booking the same staff member
  CONSTRAINT no_overlapping_appointments
    EXCLUDE USING gist (
      staff_id WITH =,
      tstzrange(start_time, end_time) WITH &&
    ) WHERE (status NOT IN ('cancelled','no_show')),
  CONSTRAINT end_after_start CHECK (end_time > start_time)
);

CREATE INDEX appointments_client_idx   ON appointments(client_id);
CREATE INDEX appointments_staff_idx    ON appointments(staff_id);
CREATE INDEX appointments_start_idx   ON appointments(start_time);
CREATE INDEX appointments_status_idx  ON appointments(status);

-- ─────────────────────────────────────────
-- 6. reviews
-- ─────────────────────────────────────────

CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID NOT NULL UNIQUE REFERENCES appointments(id),
  client_id       UUID NOT NULL REFERENCES clients(id),
  staff_id        UUID NOT NULL REFERENCES staff(id),
  service_id      UUID NOT NULL REFERENCES services(id),
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  is_public       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 7. settings (single row)
-- ─────────────────────────────────────────

CREATE TABLE settings (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_name                  TEXT NOT NULL DEFAULT 'Crowns Enchanted',
  phone                       TEXT NOT NULL DEFAULT '470-495-8894',
  email                       TEXT NOT NULL DEFAULT 'Info@crownsenchanted.com',
  address                     TEXT NOT NULL DEFAULT '2900 Delk Road SE, Suite 17, Marietta, GA 30067',
  open_time                   TIME NOT NULL DEFAULT '09:00',
  close_time                  TIME NOT NULL DEFAULT '18:00',
  slot_interval_minutes       INTEGER NOT NULL DEFAULT 15,
  cancellation_policy_hours   INTEGER NOT NULL DEFAULT 24,
  no_show_fee_cents           INTEGER NOT NULL DEFAULT 0,
  reminder_hours_before       INTEGER NOT NULL DEFAULT 24,
  google_calendar_id          TEXT,
  google_refresh_token        TEXT,
  telegram_bot_token          TEXT,
  telegram_chat_id            TEXT,
  whatsapp_phone_id           TEXT,
  whatsapp_token              TEXT,
  obsidian_rest_url           TEXT,
  obsidian_api_key            TEXT,
  hermes_reminders_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  hermes_marketing_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  hermes_reengagement_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the single settings row
INSERT INTO settings DEFAULT VALUES;

-- ─────────────────────────────────────────
-- 8. products (inventory)
-- ─────────────────────────────────────────

CREATE TABLE products (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'retail'
                      CHECK (category IN ('retail','supply','equipment')),
  sku               TEXT,
  description       TEXT,
  quantity_on_hand  INTEGER NOT NULL DEFAULT 0,
  reorder_level     INTEGER NOT NULL DEFAULT 5,
  cost_cents        INTEGER NOT NULL DEFAULT 0,
  price_cents       INTEGER NOT NULL DEFAULT 0,
  supplier_name     TEXT,
  supplier_contact  TEXT,
  image_url         TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 9. payroll_records
-- ─────────────────────────────────────────

CREATE TABLE payroll_records (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id              UUID NOT NULL REFERENCES staff(id),
  period_start          DATE NOT NULL,
  period_end            DATE NOT NULL,
  total_services        INTEGER NOT NULL DEFAULT 0,
  gross_revenue_cents   INTEGER NOT NULL DEFAULT 0,
  commission_rate       DECIMAL(4,2) NOT NULL,
  commission_cents      INTEGER NOT NULL DEFAULT 0,
  booth_rent_cents      INTEGER NOT NULL DEFAULT 0,
  net_payout_cents      INTEGER NOT NULL DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','paid')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 10. booth_renters
-- ─────────────────────────────────────────

CREATE TABLE booth_renters (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id                UUID NOT NULL UNIQUE REFERENCES staff(id),
  monthly_rent_cents      INTEGER NOT NULL,
  billing_day             INTEGER NOT NULL CHECK (billing_day BETWEEN 1 AND 28),
  stripe_subscription_id  TEXT,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 11. campaigns
-- ─────────────────────────────────────────

CREATE TABLE campaigns (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  subject        TEXT NOT NULL,
  body_template  TEXT NOT NULL,
  segment        TEXT NOT NULL DEFAULT 'all'
                   CHECK (segment IN ('all','inactive_30_days','inactive_60_days','custom')),
  channel        TEXT NOT NULL DEFAULT 'email'
                   CHECK (channel IN ('telegram','whatsapp','imessage','email','all')),
  status         TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','approved','sent')),
  sent_at        TIMESTAMPTZ,
  sent_count     INTEGER NOT NULL DEFAULT 0,
  created_by     UUID REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 12. campaign_sends
-- ─────────────────────────────────────────

CREATE TABLE campaign_sends (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id   UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES clients(id),
  channel_used  TEXT NOT NULL CHECK (channel_used IN ('telegram','whatsapp','imessage','email')),
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status        TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','delivered','failed'))
);

CREATE INDEX campaign_sends_campaign_idx ON campaign_sends(campaign_id);
CREATE INDEX campaign_sends_client_idx   ON campaign_sends(client_id);

-- ─────────────────────────────────────────
-- 13. memberships
-- ─────────────────────────────────────────

CREATE TABLE memberships (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE
                      CHECK (slug IN ('royal_beauty_society','inner_glow','content_creator','influencer','vip_creator')),
  description       TEXT NOT NULL DEFAULT '',
  price_cents       INTEGER NOT NULL,
  billing_interval  TEXT NOT NULL DEFAULT 'monthly'
                      CHECK (billing_interval IN ('monthly','quarterly')),
  features          TEXT[] NOT NULL DEFAULT '{}',
  stripe_price_id   TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the 5 membership tiers
INSERT INTO memberships (name, slug, description, price_cents, billing_interval, features) VALUES
  ('Royal Beauty Society', 'royal_beauty_society',
   'Access our exclusive education community, early booking privileges, and member-only content.',
   3500, 'monthly',
   ARRAY['Private education community','Early booking access','Member-only content','Monthly hair tips']),

  ('Inner Glow', 'inner_glow',
   'Monthly visit + deep scalp cleanse + meridian facial included every month.',
   15000, 'monthly',
   ARRAY['1 monthly appointment','Deep scalp cleanse','Meridian facial','Priority scheduling']),

  ('Content Creator', 'content_creator',
   '2 reels + 3 photos + treatment every month. Our most popular tier.',
   25000, 'monthly',
   ARRAY['2 reels + 3 photos','1 treatment session','Content-ready styling','Monthly photo session']),

  ('Influencer', 'influencer',
   '3 reels + 6 photos + 2 looks + style in a 30-day window.',
   55500, 'monthly',
   ARRAY['3 reels + 6 photos','2 full looks','Style consultation','Priority access','30-day window']),

  ('VIP Creator', 'vip_creator',
   'Editorial + full production team experience over 3 months.',
   100000, 'quarterly',
   ARRAY['Full editorial shoot','Production team','3-month package','All-access styling','Obsidian profile']);

-- ─────────────────────────────────────────
-- 14. client_memberships
-- ─────────────────────────────────────────

CREATE TABLE client_memberships (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id               UUID NOT NULL REFERENCES clients(id),
  membership_id           UUID NOT NULL REFERENCES memberships(id),
  stripe_subscription_id  TEXT,
  status                  TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','cancelled','past_due')),
  started_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_billing_date       TIMESTAMPTZ,
  UNIQUE (client_id, membership_id)
);

-- ─────────────────────────────────────────
-- 15. intake_forms
-- ─────────────────────────────────────────

CREATE TABLE intake_forms (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id             UUID NOT NULL REFERENCES clients(id),
  appointment_id        UUID NOT NULL UNIQUE REFERENCES appointments(id),
  hair_type             TEXT,
  hair_density          TEXT,
  hair_texture          TEXT,
  concerns              TEXT[] NOT NULL DEFAULT '{}',
  goals                 TEXT[] NOT NULL DEFAULT '{}',
  current_products      TEXT,
  health_conditions     TEXT,
  allergies             TEXT,
  last_chemical_service TEXT,
  signature             TEXT,
  signed_at             TIMESTAMPTZ
);

-- ─────────────────────────────────────────
-- 16. gift_cards
-- ─────────────────────────────────────────

CREATE TABLE gift_cards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT NOT NULL UNIQUE,
  amount_cents    INTEGER NOT NULL CHECK (amount_cents > 0),
  balance_cents   INTEGER NOT NULL CHECK (balance_cents >= 0),
  purchased_by    UUID REFERENCES clients(id),
  recipient_email TEXT,
  message         TEXT,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 17. shop_products
-- ─────────────────────────────────────────

CREATE TABLE shop_products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT,
  price_cents     INTEGER NOT NULL CHECK (price_cents >= 0),
  category        TEXT NOT NULL DEFAULT 'retail'
                    CHECK (category IN ('kit','ebook','digital','retail')),
  image_url       TEXT,
  stripe_price_id TEXT,
  inventory       INTEGER NOT NULL DEFAULT -1, -- -1 = unlimited
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 18. google_calendar_sync
-- ─────────────────────────────────────────

CREATE TABLE google_calendar_sync (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Foreign key: clients.preferred_staff_id → staff
-- ─────────────────────────────────────────

ALTER TABLE clients
  ADD CONSTRAINT clients_preferred_staff_fk
  FOREIGN KEY (preferred_staff_id) REFERENCES staff(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────
-- Updated_at triggers
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────

ALTER TABLE clients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff              ENABLE ROW LEVEL SECURITY;
ALTER TABLE services           ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE booth_renters      ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns          ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sends     ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships        ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_forms       ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_sync ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data->>'role' = 'admin'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── clients ──
CREATE POLICY "clients_own_select" ON clients
  FOR SELECT USING (auth.uid() = id OR is_admin());

CREATE POLICY "clients_own_insert" ON clients
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "clients_own_update" ON clients
  FOR UPDATE USING (auth.uid() = id OR is_admin());

CREATE POLICY "admin_clients_delete" ON clients
  FOR DELETE USING (is_admin());

-- ── staff ── (clients read-only)
CREATE POLICY "staff_read_all" ON staff
  FOR SELECT USING (TRUE);

CREATE POLICY "admin_staff_write" ON staff
  FOR ALL USING (is_admin());

-- ── services ── (clients read-only)
CREATE POLICY "services_read_all" ON services
  FOR SELECT USING (TRUE);

CREATE POLICY "admin_services_write" ON services
  FOR ALL USING (is_admin());

-- ── staff_services ── (clients read-only)
CREATE POLICY "staff_services_read" ON staff_services
  FOR SELECT USING (TRUE);

CREATE POLICY "admin_staff_services_write" ON staff_services
  FOR ALL USING (is_admin());

-- ── appointments ──
CREATE POLICY "appointments_own_select" ON appointments
  FOR SELECT USING (auth.uid() = client_id OR is_admin());

CREATE POLICY "appointments_own_insert" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = client_id OR is_admin());

CREATE POLICY "appointments_own_update" ON appointments
  FOR UPDATE USING (auth.uid() = client_id OR is_admin());

CREATE POLICY "admin_appointments_delete" ON appointments
  FOR DELETE USING (is_admin());

-- ── reviews ──
CREATE POLICY "reviews_read_public" ON reviews
  FOR SELECT USING (is_public = TRUE OR auth.uid() = client_id OR is_admin());

CREATE POLICY "reviews_own_insert" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "admin_reviews_update" ON reviews
  FOR UPDATE USING (is_admin());

-- ── settings ── (clients can read non-sensitive fields via views if needed)
CREATE POLICY "settings_read_all" ON settings
  FOR SELECT USING (TRUE);

CREATE POLICY "admin_settings_write" ON settings
  FOR ALL USING (is_admin());

-- ── products ── (admin only)
CREATE POLICY "admin_products_all" ON products
  FOR ALL USING (is_admin());

-- ── payroll_records ── (admin only)
CREATE POLICY "admin_payroll_all" ON payroll_records
  FOR ALL USING (is_admin());

-- ── booth_renters ── (admin only)
CREATE POLICY "admin_booth_renters_all" ON booth_renters
  FOR ALL USING (is_admin());

-- ── campaigns ── (admin only)
CREATE POLICY "admin_campaigns_all" ON campaigns
  FOR ALL USING (is_admin());

-- ── campaign_sends ── (admin only)
CREATE POLICY "admin_campaign_sends_all" ON campaign_sends
  FOR ALL USING (is_admin());

-- ── memberships ── (clients can read active tiers)
CREATE POLICY "memberships_read_active" ON memberships
  FOR SELECT USING (is_active = TRUE OR is_admin());

CREATE POLICY "admin_memberships_write" ON memberships
  FOR ALL USING (is_admin());

-- ── client_memberships ──
CREATE POLICY "client_memberships_own_select" ON client_memberships
  FOR SELECT USING (auth.uid() = client_id OR is_admin());

CREATE POLICY "admin_client_memberships_write" ON client_memberships
  FOR ALL USING (is_admin());

-- ── intake_forms ──
CREATE POLICY "intake_forms_own_select" ON intake_forms
  FOR SELECT USING (auth.uid() = client_id OR is_admin());

CREATE POLICY "intake_forms_own_insert" ON intake_forms
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "admin_intake_forms_update" ON intake_forms
  FOR UPDATE USING (is_admin());

-- ── gift_cards ──
CREATE POLICY "gift_cards_own_select" ON gift_cards
  FOR SELECT USING (auth.uid() = purchased_by OR is_admin());

CREATE POLICY "admin_gift_cards_write" ON gift_cards
  FOR ALL USING (is_admin());

-- ── shop_products __ (clients read active)
CREATE POLICY "shop_products_read_active" ON shop_products
  FOR SELECT USING (is_active = TRUE OR is_admin());

CREATE POLICY "admin_shop_products_write" ON shop_products
  FOR ALL USING (is_admin());

-- ── google_calendar_sync ── (admin only)
CREATE POLICY "admin_gcal_sync_all" ON google_calendar_sync
  FOR ALL USING (is_admin());

-- ─────────────────────────────────────────
-- Storage buckets (create via InsForge dashboard or CLI)
-- ─────────────────────────────────────────
-- Bucket: avatars    → avatars/{staff_id}.jpg          (public read, admin write)
-- Bucket: services   → services/{service_id}/{n}.jpg   (public read, admin write)
-- Bucket: products   → products/{product_id}.jpg       (admin read/write only)

-- ─────────────────────────────────────────
-- Seed: real services from Crowns Enchanted
-- ─────────────────────────────────────────

INSERT INTO services (name, category, description, duration_minutes, price_cents, deposit_cents) VALUES
  ('Natural Hair Care',             'hair', 'Customized natural hair treatments tailored to your unique texture and needs.',         90,  10000, 2500),
  ('Scalp Rehab',                   'hair', 'Deep scalp analysis and therapeutic treatment to restore balance and promote growth.',  120, 39900, 10000),
  ('Scalp Rehab Deluxe',            'hair', 'Full scalp rehab with extended treatment, gua sha massage, and steam therapy.',        180, 59900, 15000),
  ('Reiki Infused Services',        'hair', 'Hair care elevated with Reiki energy healing for a truly holistic experience.',         90,  12500, 2500),
  ('Beauty Assessment',             'skin', 'Comprehensive consultation covering hair, scalp, skin, and wellness goals.',             60,  15000, 0),
  ('Editorial Styling',             'hair', 'High-fashion styling for shoots, events, and editorial content.',                      120, 35000, 10000),
  ('Curl Rehab',                    'hair', 'Curl pattern restoration and definition treatment for coily and wavy textures.',        90,  27500, 7500),
  ('Curl Rehab Deluxe',             'hair', 'Extended curl rehab with protein-moisture balance, steam, and deep conditioning.',     120, 35000, 10000),
  ('Hydrate + Protein Balance',     'hair', 'Targeted treatment to correct moisture-protein imbalance for stronger, softer hair.',   90,  28500, 7500),
  ('Enchanted Cut Executive',       'hair', 'Precision cut by Ashley with full consultation, shampoo, and blowout.',                 60,  12500, 0);
