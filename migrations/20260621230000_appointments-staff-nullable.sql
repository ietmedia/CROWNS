-- Allow appointments without a specific staff member (e.g. "any available stylist")
ALTER TABLE appointments ALTER COLUMN staff_id DROP NOT NULL;
