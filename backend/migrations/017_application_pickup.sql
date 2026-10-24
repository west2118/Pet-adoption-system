-- Migration 017: Clinic pickup scheduling on approval
--
-- When a shelter approves an application it now also schedules the handover:
-- the date/time the adopter can collect the pet at the clinic and the contact
-- email to write to about that appointment. Both are cleared again if the
-- adoption is cancelled.
--
-- NOTE: the migrator re-applies every file on each boot with no tracking
-- table, so every statement here must be idempotent (same convention as
-- migrations 001-016).

ALTER TABLE adoption_applications
  ADD COLUMN IF NOT EXISTS pickup_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pickup_email TEXT;
