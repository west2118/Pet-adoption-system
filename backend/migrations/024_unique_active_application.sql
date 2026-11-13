-- 024: prevent duplicate active applications by the same adopter for the same pet.
--
-- Only one active application per (applicant_id, pet_id) is allowed.
-- An active application has status 'Submitted', 'Under Review', 'Approved', or 'Adopted'.
--
-- Clean up any existing duplicate active applications before creating the unique index
-- by keeping the most recently updated/submitted one and cancelling the older ones.

WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY applicant_id, pet_id
           ORDER BY
             CASE status
               WHEN 'Adopted' THEN 1
               WHEN 'Approved' THEN 2
               WHEN 'Under Review' THEN 3
               WHEN 'Submitted' THEN 4
               ELSE 5
             END,
             submitted_at DESC
         ) AS rn
  FROM adoption_applications
  WHERE status IN ('Submitted', 'Under Review', 'Approved', 'Adopted')
)
UPDATE adoption_applications
SET status = 'Cancelled',
    staff_notes = COALESCE(staff_notes, 'Closed as duplicate application during system deduplication.')
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_application_per_pet_adopter
  ON adoption_applications (applicant_id, pet_id)
  WHERE status IN ('Submitted', 'Under Review', 'Approved', 'Adopted');
