-- 027: Password reset via emailed 6-digit code
--
-- Holds one short-lived, hashed OTP per reset request. The row is deleted once
-- the password is changed so a code can never be reused.

CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets (user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets (expires_at);
