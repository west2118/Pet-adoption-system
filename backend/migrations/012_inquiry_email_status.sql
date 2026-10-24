-- Migration 012: Inquiry email reply status
--
-- Persists the reply email sent from the shelter inbox so the Email action
-- can disappear after a successful send, and the details modal can show a
-- read-only record of what was sent.

ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS emailed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_subject VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_message TEXT;
