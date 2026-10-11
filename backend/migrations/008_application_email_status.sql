-- Migration 008: Shelter application notification email status
--
-- Persists whether the approve/reject notification email was actually
-- delivered, so the admin portal can show per-application email status.
-- NULL means no review email has been attempted yet.

ALTER TABLE shelter_applications
  ADD COLUMN IF NOT EXISTS email_sent BOOLEAN,
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;
