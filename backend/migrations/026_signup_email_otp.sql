-- 026: Pending signup email OTP verification
--
-- Temporarily holds unverified signups until the 6-digit OTP sent to their email
-- is verified. This ensures the email address really exists and belongs to the registrant.

CREATE TABLE IF NOT EXISTS signup_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'adopter',
  otp_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_signup_verifications_email ON signup_verifications (email);
CREATE INDEX IF NOT EXISTS idx_signup_verifications_expires ON signup_verifications (expires_at);
