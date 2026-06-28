-- Allow admin-created bookings without an auth account (walk-ins, phone bookings)
ALTER TABLE appointments
  ALTER COLUMN client_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS guest_name  TEXT,
  ADD COLUMN IF NOT EXISTS guest_phone TEXT,
  ADD COLUMN IF NOT EXISTS guest_email TEXT;

-- Every appointment must have either a linked client or walk-in guest info
ALTER TABLE appointments
  ADD CONSTRAINT appointments_client_or_guest
  CHECK (client_id IS NOT NULL OR guest_name IS NOT NULL);
