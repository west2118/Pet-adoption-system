-- 016: e-signature, generated audit trail, and version history for waivers
--
-- `waivers` stays one current row per application (the existing UNIQUE
-- application_id). Every regeneration archives the previous snapshot into
-- `waiver_versions` and increments `version`. A signed waiver is immutable:
-- the service rejects regeneration before this migration's version bump runs.
--
-- NOTE: idempotent statements only — the migrator re-applies every file on
-- each boot with no tracking table.

ALTER TABLE waivers
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Issued',
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS generated_by_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS signed_by_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS signature_name VARCHAR(255);

-- Existing waivers predate the audit columns; their original creation time is
-- the best available issue time.
UPDATE waivers
   SET generated_at = created_at
 WHERE generated_at IS NULL;

ALTER TABLE waivers
  ALTER COLUMN generated_at SET DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'waivers_status_check'
       AND conrelid = 'waivers'::regclass
  ) THEN
    ALTER TABLE waivers
      ADD CONSTRAINT waivers_status_check
      CHECK (status IN ('Issued', 'Signed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'waivers_version_check'
       AND conrelid = 'waivers'::regclass
  ) THEN
    ALTER TABLE waivers
      ADD CONSTRAINT waivers_version_check
      CHECK (version >= 1);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS waiver_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waiver_id UUID NOT NULL REFERENCES waivers(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES adoption_applications(id) ON DELETE CASCADE,
  shelter_id UUID NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version >= 1),
  snapshot JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Superseded'
    CHECK (status IN ('Issued', 'Signed', 'Superseded')),
  generated_at TIMESTAMPTZ,
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  generated_by_name VARCHAR(255),
  signed_at TIMESTAMPTZ,
  signed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  signed_by_name VARCHAR(255),
  signature_name VARCHAR(255),
  archived_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (waiver_id, version)
);

CREATE INDEX IF NOT EXISTS idx_waiver_versions_waiver
  ON waiver_versions(waiver_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_waiver_versions_application
  ON waiver_versions(application_id);
