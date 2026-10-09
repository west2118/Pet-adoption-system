-- 001: enums + core tables (mirrors BACKEND_SKILLS.md section 2.1)

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('adopter', 'shelter_staff', 'platform_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE species_type AS ENUM ('dog', 'cat', 'rabbit', 'bird', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE age_group_type AS ENUM ('puppy-kitten', 'young', 'adult', 'senior');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pet_size_type AS ENUM ('small', 'medium', 'large');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('male', 'female');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pet_status_type AS ENUM ('Available', 'Pending Adoption', 'Adopted', 'Fostered');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pet_visibility_type AS ENUM ('public', 'private');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE application_status_type AS ENUM ('Submitted', 'Under Review', 'Approved', 'Rejected', 'Adopted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE housing_type AS ENUM ('house', 'apartment', 'condo', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS shelters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  operating_hours VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'adopter',
  shelter_id UUID REFERENCES shelters(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  species species_type NOT NULL,
  breed VARCHAR(255) NOT NULL,
  birthdate DATE NOT NULL,
  age_group age_group_type NOT NULL,
  size pet_size_type NOT NULL,
  gender gender_type NOT NULL,
  temperament TEXT[] NOT NULL DEFAULT '{}',
  shelter_id UUID NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
  visibility pet_visibility_type NOT NULL DEFAULT 'public',
  description TEXT NOT NULL,
  medical_history TEXT[] NOT NULL DEFAULT '{}',
  behavioral_notes TEXT NOT NULL DEFAULT '',
  status pet_status_type NOT NULL DEFAULT 'Available',
  image_url TEXT NOT NULL,
  gallery TEXT[] NOT NULL DEFAULT '{}',
  vaccinated BOOLEAN NOT NULL DEFAULT false,
  spayed_neutered BOOLEAN NOT NULL DEFAULT false,
  good_with_kids BOOLEAN NOT NULL DEFAULT false,
  good_with_pets BOOLEAN NOT NULL DEFAULT false,
  date_added DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS adoption_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  applicant_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  housing_type housing_type NOT NULL,
  has_other_pets BOOLEAN NOT NULL DEFAULT false,
  experience TEXT NOT NULL,
  reason TEXT NOT NULL,
  status application_status_type NOT NULL DEFAULT 'Submitted',
  staff_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS application_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES adoption_applications(id) ON DELETE CASCADE,
  status application_status_type NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  from_name VARCHAR(255) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, pet_id)
);
