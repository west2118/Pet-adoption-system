-- 025: MFA OTP verification for suspicious / new login locations
--
-- Records last known login location (city, country, ip, coordinates) on users.
-- Stores short-lived OTP challenges for suspicious / new location logins.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_ip TEXT,
  ADD COLUMN IF NOT EXISTS last_login_city TEXT,
  ADD COLUMN IF NOT EXISTS last_login_country TEXT,
  ADD COLUMN IF NOT EXISTS last_login_lat NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS last_login_lon NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS login_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_hash TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  city TEXT,
  country TEXT,
  client_location TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  attempts INT NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_challenges_user_id ON login_challenges (user_id);
CREATE INDEX IF NOT EXISTS idx_login_challenges_expires ON login_challenges (expires_at);
