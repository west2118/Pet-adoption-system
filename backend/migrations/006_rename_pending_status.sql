-- Migration 006: Rename pet status 'Pending Adoption' to 'In Process'
--
-- Adopters see "In Process" while an accepted application is being handed
-- over; the stored enum value is renamed in place so existing rows keep
-- their meaning without data rewrites.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'pet_status_type'
      AND e.enumlabel = 'Pending Adoption'
  ) THEN
    ALTER TYPE pet_status_type RENAME VALUE 'Pending Adoption' TO 'In Process';
  END IF;
END $$;
