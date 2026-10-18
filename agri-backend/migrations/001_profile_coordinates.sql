-- Add precise profile coordinates used by the Expo mobile app.
-- Safe to run repeatedly against the existing Supabase PostgreSQL database.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_latitude_range,
  DROP CONSTRAINT IF EXISTS profiles_longitude_range;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_latitude_range
    CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  ADD CONSTRAINT profiles_longitude_range
    CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);
