-- 002: performance indexes (mirrors BACKEND_SKILLS.md section 2.2)

CREATE INDEX IF NOT EXISTS idx_pets_public_catalog ON pets (visibility, status, species) WHERE visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_pets_shelter_id ON pets (shelter_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON adoption_applications (applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_pet ON adoption_applications (pet_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON adoption_applications (status);
CREATE INDEX IF NOT EXISTS idx_inquiries_pet ON inquiries (pet_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_shelters_email ON shelters (email);
