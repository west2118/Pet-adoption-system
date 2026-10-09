-- Migration 005: Convert age_years to birthdate DATE on pets table

DO $$
BEGIN
  -- 1. Add birthdate column if it does not exist yet
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pets' AND column_name = 'birthdate'
  ) THEN
    ALTER TABLE pets ADD COLUMN birthdate DATE;
  END IF;

  -- 2. Populate birthdate for existing rows from age_years if age_years column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pets' AND column_name = 'age_years'
  ) THEN
    UPDATE pets 
    SET birthdate = CURRENT_DATE - (COALESCE(age_years, 1) || ' years')::INTERVAL 
    WHERE birthdate IS NULL;

    -- Drop the legacy age_years column
    ALTER TABLE pets DROP COLUMN age_years;
  END IF;

  -- 3. Fallback for any null birthdates, then enforce NOT NULL
  UPDATE pets SET birthdate = CURRENT_DATE WHERE birthdate IS NULL;
  ALTER TABLE pets ALTER COLUMN birthdate SET NOT NULL;
END $$;
