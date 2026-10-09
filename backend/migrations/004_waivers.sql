-- 004: e-waiver templates (per shelter) + issued waivers (one per adoption application)

CREATE TABLE IF NOT EXISTS waiver_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shelter_id UUID NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Adoption',
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Draft')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_waiver_templates_shelter ON waiver_templates(shelter_id);

CREATE TABLE IF NOT EXISTS waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL UNIQUE REFERENCES adoption_applications(id) ON DELETE CASCADE,
  shelter_id UUID NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_waivers_application ON waivers(application_id);
CREATE INDEX IF NOT EXISTS idx_waivers_shelter ON waivers(shelter_id);
