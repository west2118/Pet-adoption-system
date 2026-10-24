-- Migration 014: Adopters can withdraw an application.
--
-- `Cancelled` is distinct from `Rejected`: the applicant withdrew it before
-- the shelter made a decision. Pending applications can move to this status
-- through PATCH /applications/:id/cancel.
--
-- NOTE: the migrator re-applies every file on each boot with no tracking
-- table, so every statement here must be idempotent (same convention as
-- migrations 001-013).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'application_status_type'
      AND e.enumlabel = 'Cancelled'
  ) THEN
    ALTER TYPE application_status_type ADD VALUE 'Cancelled';
  END IF;
END $$;
