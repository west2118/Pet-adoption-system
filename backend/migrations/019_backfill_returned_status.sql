-- Migration 019: Backfill returns recorded as `Cancelled`
--
-- Before `Returned` existed, reversing a completed adoption stored the
-- application as `Cancelled`. Any such row has an `Adopted` entry in its
-- history, so those are moved to the new status; a genuine pre-handover
-- cancellation never has an adoption in its trail.
--
-- NOTE: the migrator re-applies every file on each boot with no tracking
-- table, so every statement here must be idempotent (same convention as
-- migrations 001-018).

UPDATE adoption_applications a
   SET status = 'Returned'
 WHERE a.status = 'Cancelled'
   AND EXISTS (
     SELECT 1
       FROM application_history h
      WHERE h.application_id = a.id
        AND h.status = 'Adopted'
   );

UPDATE application_history h
   SET status = 'Returned'
  FROM adoption_applications a
 WHERE h.application_id = a.id
   AND a.status = 'Returned'
   AND h.status = 'Cancelled';
