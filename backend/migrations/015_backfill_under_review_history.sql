-- Migration 015: Backfill the missing Under Review step.
--
-- Earlier approvals could jump straight from Submitted to Approved/Adopted,
-- leaving the adopter's progress track with a checked-but-undated Under
-- Review step. Give those applications a dated audit entry just before their
-- decision so the timeline is complete.
--
-- NOTE: the migrator re-applies every file on each boot with no tracking
-- table, so every statement here must be idempotent (same convention as
-- migrations 001-014).

INSERT INTO application_history (application_id, status, note, created_at)
SELECT a.id,
       'Under Review',
       'Reviewed by shelter before approval',
       COALESCE(
         (
           SELECT MIN(h.created_at)
             FROM application_history h
            WHERE h.application_id = a.id
              AND h.status IN ('Approved', 'Adopted')
         ),
         a.updated_at,
         a.submitted_at
       ) - INTERVAL '1 second'
  FROM adoption_applications a
 WHERE a.status IN ('Approved', 'Adopted')
   AND NOT EXISTS (
     SELECT 1
       FROM application_history h
      WHERE h.application_id = a.id
        AND h.status = 'Under Review'
   );
