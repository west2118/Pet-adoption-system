-- Migration 018: `Returned` application status
--
-- A completed adoption that falls through is not the same event as an adopter
-- withdrawing or a shelter cancelling before handover: the pet comes back.
-- `Returned` records that distinctly so reports and the adopter's tracker do
-- not show a returned pet as a cancelled application.
--
-- NOTE: the migrator re-applies every file on each boot with no tracking
-- table, so every statement here must be idempotent (same convention as
-- migrations 001-017).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'application_status_type'
      AND e.enumlabel = 'Returned'
  ) THEN
    ALTER TYPE application_status_type ADD VALUE 'Returned';
  END IF;
END $$;
