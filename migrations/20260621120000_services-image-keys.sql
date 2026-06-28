-- Add image_keys column to services table for InsForge storage delete operations
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS image_keys text[] NOT NULL DEFAULT '{}';
