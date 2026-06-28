-- ============================================================
-- Crowns Enchanted — Initial Schema
-- 18 tables + RLS policies + seed data
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Trigger function used by clients, appointments, and products tables
CREATE OR REPLACE FUNCTION system.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. SETTINGS (singleton row)
-- ============================================================
CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  open_time time NOT NULL DEFAULT '09:00',
  close_time time NOT NULL DEFAULT '18:00',
  slot_interval_minutes integer NOT NULL DEFAULT 30,
  cancellation_policy_hours integer NOT NULL DEFAULT 24,
  no_show_fee_cents integer NOT NULL DEFAULT 0,
  reminder_hours_before integer NOT NULL DEFAULT 48,
  google_calendar_id text,
  google_refresh_token text,
  telegram_bot_token text,
  telegram_chat_id text,
  whatsapp_phone_id text,
  whatsapp_token text,
  obsidian_rest_url text,
  obsidian_api_key text,
  hermes_reminders_enabled boolean NOT NULL DEFAULT false,
  hermes_marketing_enabled boolean NOT NULL DEFAULT false,
  hermes_reengagement_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON settings
  FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON settings TO anon, authenticated;

-- ============================================================
-- 2. STAFF
-- ============================================================
CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT 'stylist',
  bio text,
  avatar_url text,
  commission_rate numeric(5,4) NOT NULL DEFAULT 0.4000,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_role_check CHECK (
    role IN ('stylist','colorist','nail_tech','esthetician','other')
  )
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff public read" ON staff
  FOR SELECT TO anon, authenticated USING (is_active = true);
GRANT SELECT ON staff TO anon, authenticated;

-- ============================================================
-- 3. SERVICES
-- ============================================================
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'hair',
  description text,
  duration_minutes integer NOT NULL DEFAULT 60,
  price_cents integer NOT NULL DEFAULT 0,
  deposit_cents integer NOT NULL DEFAULT 0,
  image_urls text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT services_category_check CHECK (
    category IN ('hair','color','nails','skin','other')
  )
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services public read" ON services
  FOR SELECT TO anon, authenticated USING (is_active = true);
GRANT SELECT ON services TO anon, authenticated;

-- ============================================================
-- 4. STAFF_SERVICES (junction)
-- ============================================================
CREATE TABLE staff_services (
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, service_id)
);

ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_services public read" ON staff_services
  FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON staff_services TO anon, authenticated;

-- ============================================================
-- 5. CLIENTS (id mirrors auth.users id)
-- ============================================================
CREATE TABLE clients (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  preferred_staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  intake_notes text,
  admin_notes text,
  stripe_customer_id text,
  telegram_chat_id text,
  whatsapp_phone text,
  imessage_address text,
  preferred_channel text NOT NULL DEFAULT 'email',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clients_channel_check CHECK (
    preferred_channel IN ('telegram','whatsapp','imessage','email')
  )
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- Clients read and update only their own row
CREATE POLICY "clients own row select" ON clients
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));
CREATE POLICY "clients own row update" ON clients
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));
-- admin_notes is excluded from client update at the app layer (service role handles admin writes)
GRANT SELECT, UPDATE ON clients TO authenticated;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

-- ============================================================
-- 6. APPOINTMENTS
-- ============================================================
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  intake_notes text,
  admin_notes text,
  payment_status text NOT NULL DEFAULT 'none',
  stripe_session_id text,
  cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointments_status_check CHECK (
    status IN ('pending','confirmed','completed','cancelled','no_show')
  ),
  CONSTRAINT appointments_payment_check CHECK (
    payment_status IN ('none','deposit_pending','deposit_paid','fully_paid')
  ),
  CONSTRAINT appointments_time_check CHECK (end_time > start_time)
);

CREATE INDEX appointments_client_idx ON appointments(client_id);
CREATE INDEX appointments_staff_idx ON appointments(staff_id);
CREATE INDEX appointments_start_idx ON appointments(start_time);
CREATE INDEX appointments_status_idx ON appointments(status);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
-- Clients can view and manage their own appointments
CREATE POLICY "appointments client select" ON appointments
  FOR SELECT TO authenticated
  USING (client_id = (SELECT auth.uid()));
CREATE POLICY "appointments client insert" ON appointments
  FOR INSERT TO authenticated
  WITH CHECK (client_id = (SELECT auth.uid()));
-- Clients can update status to 'cancelled' only; other status updates via service role
CREATE POLICY "appointments client update" ON appointments
  FOR UPDATE TO authenticated
  USING (client_id = (SELECT auth.uid()))
  WITH CHECK (client_id = (SELECT auth.uid()));
GRANT SELECT, INSERT, UPDATE ON appointments TO authenticated;

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

-- ============================================================
-- 7. REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public select" ON reviews
  FOR SELECT TO anon, authenticated USING (is_public = true);
CREATE POLICY "reviews client insert" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (client_id = (SELECT auth.uid()));
GRANT SELECT ON reviews TO anon, authenticated;
GRANT INSERT ON reviews TO authenticated;

-- ============================================================
-- 8. PRODUCTS (retail + supply inventory)
-- ============================================================
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'retail',
  sku text,
  description text,
  quantity_on_hand integer NOT NULL DEFAULT 0,
  reorder_level integer NOT NULL DEFAULT 5,
  cost_cents integer NOT NULL DEFAULT 0,
  price_cents integer NOT NULL DEFAULT 0,
  supplier_name text,
  supplier_contact text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_category_check CHECK (
    category IN ('retail','supply','equipment')
  )
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- Admin only — no policies for authenticated; service role bypasses RLS

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

-- ============================================================
-- 9. PAYROLL_RECORDS
-- ============================================================
CREATE TABLE payroll_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_services integer NOT NULL DEFAULT 0,
  gross_revenue_cents integer NOT NULL DEFAULT 0,
  commission_rate numeric(5,4) NOT NULL DEFAULT 0.4000,
  commission_cents integer NOT NULL DEFAULT 0,
  booth_rent_cents integer NOT NULL DEFAULT 0,
  net_payout_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payroll_status_check CHECK (status IN ('pending','paid'))
);

ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
-- Admin only

-- ============================================================
-- 10. BOOTH_RENTERS
-- ============================================================
CREATE TABLE booth_renters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL UNIQUE REFERENCES staff(id) ON DELETE CASCADE,
  monthly_rent_cents integer NOT NULL DEFAULT 0,
  billing_day integer NOT NULL DEFAULT 1,
  stripe_subscription_id text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booth_renters_billing_day_check CHECK (billing_day BETWEEN 1 AND 28)
);

ALTER TABLE booth_renters ENABLE ROW LEVEL SECURITY;
-- Admin only

-- ============================================================
-- 11. CAMPAIGNS
-- ============================================================
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL DEFAULT '',
  body_template text NOT NULL DEFAULT '',
  segment text NOT NULL DEFAULT 'all',
  channel text NOT NULL DEFAULT 'email',
  status text NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  sent_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_status_check CHECK (status IN ('draft','approved','sent')),
  CONSTRAINT campaigns_channel_check CHECK (
    channel IN ('telegram','whatsapp','imessage','email','all')
  ),
  CONSTRAINT campaigns_segment_check CHECK (
    segment IN ('all','inactive_30_days','inactive_60_days','custom')
  )
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
-- Admin only

-- ============================================================
-- 12. CAMPAIGN_SENDS
-- ============================================================
CREATE TABLE campaign_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  channel_used text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent',
  CONSTRAINT campaign_sends_status_check CHECK (status IN ('sent','delivered','failed')),
  CONSTRAINT campaign_sends_channel_check CHECK (
    channel_used IN ('telegram','whatsapp','imessage','email')
  )
);

ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;
-- Admin only

-- ============================================================
-- 13. MEMBERSHIPS
-- ============================================================
CREATE TABLE memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  price_cents integer NOT NULL DEFAULT 0,
  billing_interval text NOT NULL DEFAULT 'monthly',
  features text[] NOT NULL DEFAULT '{}',
  stripe_price_id text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memberships_billing_check CHECK (
    billing_interval IN ('monthly','quarterly')
  )
);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "memberships public read" ON memberships
  FOR SELECT TO anon, authenticated USING (is_active = true);
GRANT SELECT ON memberships TO anon, authenticated;

-- ============================================================
-- 14. CLIENT_MEMBERSHIPS
-- ============================================================
CREATE TABLE client_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  next_billing_date date,
  CONSTRAINT client_memberships_status_check CHECK (
    status IN ('active','cancelled','past_due')
  )
);

ALTER TABLE client_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_memberships client select" ON client_memberships
  FOR SELECT TO authenticated
  USING (client_id = (SELECT auth.uid()));
GRANT SELECT ON client_memberships TO authenticated;

-- ============================================================
-- 15. INTAKE_FORMS
-- ============================================================
CREATE TABLE intake_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id uuid NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  hair_type text,
  hair_density text,
  hair_texture text,
  concerns text[] NOT NULL DEFAULT '{}',
  goals text[] NOT NULL DEFAULT '{}',
  current_products text,
  health_conditions text,
  allergies text,
  last_chemical_service text,
  signature text,
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intake_forms client select" ON intake_forms
  FOR SELECT TO authenticated
  USING (client_id = (SELECT auth.uid()));
CREATE POLICY "intake_forms client insert" ON intake_forms
  FOR INSERT TO authenticated
  WITH CHECK (client_id = (SELECT auth.uid()));
GRANT SELECT, INSERT ON intake_forms TO authenticated;

-- ============================================================
-- 16. GIFT_CARDS
-- ============================================================
CREATE TABLE gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  amount_cents integer NOT NULL DEFAULT 0,
  balance_cents integer NOT NULL DEFAULT 0,
  purchased_by uuid REFERENCES clients(id) ON DELETE SET NULL,
  recipient_email text,
  message text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gift_cards client select" ON gift_cards
  FOR SELECT TO authenticated
  USING (purchased_by = (SELECT auth.uid()));
GRANT SELECT ON gift_cards TO authenticated;

-- ============================================================
-- 17. SHOP_PRODUCTS
-- ============================================================
CREATE TABLE shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'retail',
  image_url text,
  stripe_price_id text,
  inventory integer NOT NULL DEFAULT -1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shop_products_category_check CHECK (
    category IN ('kit','ebook','digital','retail')
  )
);

ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_products public read" ON shop_products
  FOR SELECT TO anon, authenticated USING (is_active = true);
GRANT SELECT ON shop_products TO anon, authenticated;

-- ============================================================
-- 18. GOOGLE_CALENDAR_SYNC
-- ============================================================
CREATE TABLE google_calendar_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  google_event_id text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  last_updated timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE google_calendar_sync ENABLE ROW LEVEL SECURITY;
-- Admin only

-- ============================================================
-- SEED DATA
-- ============================================================

-- Settings: real business data
INSERT INTO settings (
  salon_name, phone, email, address,
  open_time, close_time, slot_interval_minutes,
  cancellation_policy_hours, no_show_fee_cents, reminder_hours_before
) VALUES (
  'Crowns Enchanted',
  '470-495-8894',
  'Info@crownsenchanted.com',
  '2900 Delk Road SE, Suite 17, Marietta, GA 30067',
  '09:00', '18:00', 30,
  24, 5000, 48
);

-- Services: real pricing from reference site
INSERT INTO services (name, category, description, duration_minutes, price_cents, deposit_cents) VALUES
  ('Natural Hair Care',         'hair', 'Holistic natural hair care tailored to your unique curl pattern and needs.',         90,  10000, 2000),
  ('Scalp Rehab',               'hair', 'Targeted scalp restoration and cellular renewal treatment. Standard · Deluxe.',       120, 39900, 5000),
  ('Reiki Infused Treatment',   'hair', 'Hair care elevated with spiritual healing energy and intention.',                     75,  12500, 2500),
  ('Beauty Assessment',         'hair', 'Comprehensive hair and scalp consultation with a personalized treatment plan.',        60,  15000, 0),
  ('Editorial Styling',         'hair', 'High-fashion styling for events, shoots, and special occasions.',                    120, 35000, 7500),
  ('Curl Rehab',                'hair', 'Curl restoration and definition therapy. Standard · Deluxe.',                         90,  27500, 5000),
  ('Hydrate + Protein Balance', 'hair', 'Precision moisture-protein balance treatment for optimal hair health.',               75,  28500, 5000),
  ('Enchanted Cut Executive',   'hair', 'Precision cut with executive-level attention, technique, and finish.',                60,  12500, 2500);

-- Memberships: 5 tiers (Stripe price IDs added later via admin settings)
INSERT INTO memberships (name, slug, description, price_cents, billing_interval, features) VALUES
  (
    'Royal Beauty Society',
    'royal_beauty_society',
    'Join our education community and stay connected to holistic beauty wisdom.',
    3500, 'monthly',
    ARRAY[
      'Exclusive education content',
      'Member-only webinars',
      'Priority booking window',
      'Monthly newsletter'
    ]
  ),
  (
    'Inner Glow',
    'inner_glow',
    'Monthly luxury treatment to keep your crown radiant and your spirit restored.',
    15000, 'monthly',
    ARRAY[
      '1 monthly visit included',
      'Deep cleanse treatment',
      'Meridian facial',
      'Priority scheduling',
      '10% off retail products'
    ]
  ),
  (
    'Content Creator',
    'content_creator',
    'Built for creators who need consistent, camera-ready looks every month.',
    25000, 'monthly',
    ARRAY[
      '2 reels per month',
      '3 professional photos',
      'Monthly treatment',
      'Content strategy session',
      'Priority booking',
      '15% off services'
    ]
  ),
  (
    'Influencer',
    'influencer',
    'Full production and transformation package for growing influencers.',
    55500, 'monthly',
    ARRAY[
      '3 reels per 30 days',
      '6 professional photos',
      '2 complete looks',
      'Styling session',
      'Dedicated booking lane',
      '20% off services',
      'Brand collaboration guidance'
    ]
  ),
  (
    'VIP Creator',
    'vip_creator',
    'Editorial-level production with a dedicated full team — the ultimate creator package.',
    100000, 'quarterly',
    ARRAY[
      'Full editorial shoot',
      'Dedicated production team',
      'Unlimited looks',
      'Monthly hair care maintenance',
      'Quarterly strategy session',
      '25% off all services',
      'First access to new services'
    ]
  );
