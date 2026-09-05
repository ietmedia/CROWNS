-- Crowns Enchanted — seed data. Safe to re-run.
-- Run in the Supabase SQL editor after schema.sql.

-- ── settings (fixed id referenced by actions/settings.ts) ──
insert into settings (id, salon_name, phone, email, address, open_time, close_time,
  slot_interval_minutes, cancellation_policy_hours, no_show_fee_cents, reminder_hours_before)
values (
  '00000000-0000-0000-0000-000000000001',
  'Crowns Enchanted',
  '470-495-8894',
  'Info@crownsenchanted.com',
  '2900 Delk Road SE, Suite 17, Marietta, GA 30067',
  '09:00', '18:00', 30, 24, 5000, 24
)
on conflict (id) do nothing;

-- ── services ──
insert into services (name, category, description, duration_minutes, price_cents, deposit_cents)
select * from (values
  ('Natural Hair Care',        'hair',  'Signature cleansing, conditioning, and styling for natural textures.', 60,  10000, 2500),
  ('Scalp Rehab',              'skin',  'Comprehensive scalp restoration for buildup, flaking, and thinning.',  90,  39900, 5000),
  ('Reiki Infused Hair Care',  'other', 'Holistic energy work paired with a full natural hair service.',        90,  12500, 2500),
  ('Beauty Assessment',        'other', 'Personalized consultation mapping your hair goals and routine.',       45,  15000, 2500),
  ('Editorial Styling',        'hair',  'High-fashion, camera-ready looks for shoots and events.',              120, 35000, 5000),
  ('Curl Rehab',               'hair',  'Curl pattern restoration and moisture rebuilding.',                    90,  27500, 5000),
  ('Hydrate + Protein Balance','hair',  'Targeted moisture-protein treatment to rebuild strength.',             75,  28500, 5000),
  ('Enchanted Cut Executive',  'hair',  'Precision cut and shaping for natural textures.',                      60,  12500, 2500)
) as v(name, category, description, duration_minutes, price_cents, deposit_cents)
where not exists (select 1 from services);

-- ── staff ──
insert into staff (name, role, bio, commission_rate)
select * from (values
  ('Ashley Harris', 'stylist', 'Founder of Crowns Enchanted. Holistic natural hair care, scalp science, and spiritual wellness.', 0.5),
  ('Jordan Blake',  'stylist', 'Editorial and curl specialist with a decade behind the chair.', 0.4)
) as v(name, role, bio, commission_rate)
where not exists (select 1 from staff);

-- ── every stylist can perform every service ──
insert into staff_services (staff_id, service_id)
select s.id, sv.id from staff s cross join services sv
on conflict do nothing;

-- ── memberships ──
insert into memberships (name, slug, description, price_cents, billing_interval, features) values
  ('Royal Beauty Society', 'royal_beauty_society',
   'Monthly maintenance for the woman who keeps her crown pristine.',
   9900, 'monthly',
   array['One signature service per month','10% off additional services','Priority booking window']),
  ('Inner Glow', 'inner_glow',
   'Hair plus wellness — treatments that restore body and spirit.',
   14900, 'monthly',
   array['One premium service per month','Monthly scalp treatment','15% off retail','Priority booking']),
  ('Content Creator', 'content_creator',
   'For creators who need to stay camera-ready.',
   19900, 'monthly',
   array['Two services per month','One editorial style per quarter','20% off add-ons','Same-week booking']),
  ('Influencer', 'influencer',
   'High-touch styling for a public-facing schedule.',
   29900, 'monthly',
   array['Unlimited maintenance styling','One editorial style per month','25% off retail','Concierge scheduling']),
  ('VIP Creator', 'vip_creator',
   'White-glove access to Ashley and the full studio.',
   49900, 'monthly',
   array['Unlimited services','Dedicated stylist','On-location options','First access to new offerings'])
on conflict (slug) do nothing;
