-- 003: shelter onboarding + account approval workflow
-- Adopters are active immediately. Shelter staff register as `pending` and
-- cannot log in until a platform admin approves their shelter application.

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_status account_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS is_owner BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_note TEXT;

CREATE TABLE IF NOT EXISTS shelter_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  operating_hours VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  status account_status NOT NULL DEFAULT 'pending',
  review_note TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shelter_applications_status ON shelter_applications (status);
CREATE INDEX IF NOT EXISTS idx_shelter_applications_user ON shelter_applications (user_id);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users (account_status);
