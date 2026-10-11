-- Migration 010: Lockable default waiver templates
--
-- `is_default` marks the 5 platform templates seeded per shelter. Defaults
-- are readable and usable by every shelter but can never be edited,
-- deactivated, or deleted (enforced in waiverService.updateWaiverTemplate).
-- Shelter-created rows keep `is_default = false` and stay fully manageable
-- by their owning shelter only (existing `shelter_id` scoping is unchanged).
--
-- NOTE: idempotent statements only — the migrator re-applies every file on
-- each boot with no tracking table.

ALTER TABLE waiver_templates
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;

-- Backfill shelters seeded before this column existed. Matched by the exact
-- platform names; templates a shelter already renamed stay editable.
UPDATE waiver_templates
   SET is_default = true
 WHERE name IN (
   'Adoption Liability Waiver',
   'Foster Care Agreement',
   'Medical Disclosure Acknowledgment',
   'Photo & Story Release',
   'Transport Waiver'
 );
