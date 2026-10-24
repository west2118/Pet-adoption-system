-- 011: shelter geolocation (powers "Near me" distance sorting on the public catalogue)

ALTER TABLE shelters ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6);
ALTER TABLE shelters ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6);

DO $$ BEGIN
  ALTER TABLE shelters ADD CONSTRAINT shelters_latitude_range
    CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE shelters ADD CONSTRAINT shelters_longitude_range
    CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Backfill existing shelters from their city/address. Each statement only
-- touches rows that are still missing coordinates and the more specific
-- Metro Manila cities run before the generic "Manila" fallback.
UPDATE shelters
   SET latitude = 14.479100, longitude = 121.019800
 WHERE latitude IS NULL
   AND (location ILIKE '%para%aque%' OR address ILIKE '%para%aque%');

UPDATE shelters
   SET latitude = 14.676000, longitude = 121.043700
 WHERE latitude IS NULL
   AND (location ILIKE '%quezon city%' OR address ILIKE '%quezon city%');

UPDATE shelters
   SET latitude = 14.554700, longitude = 121.024400
 WHERE latitude IS NULL
   AND (location ILIKE '%makati%' OR address ILIKE '%makati%');

UPDATE shelters
   SET latitude = 14.517600, longitude = 121.050900
 WHERE latitude IS NULL
   AND (location ILIKE '%taguig%' OR address ILIKE '%taguig%');

UPDATE shelters
   SET latitude = 14.576400, longitude = 121.085100
 WHERE latitude IS NULL
   AND (location ILIKE '%pasig%' OR address ILIKE '%pasig%');

UPDATE shelters
   SET latitude = 14.579400, longitude = 121.035900
 WHERE latitude IS NULL
   AND (location ILIKE '%mandaluyong%' OR address ILIKE '%mandaluyong%');

UPDATE shelters
   SET latitude = 14.444500, longitude = 120.993900
 WHERE latitude IS NULL
   AND (location ILIKE '%las pi%as%' OR address ILIKE '%las pi%as%');

UPDATE shelters
   SET latitude = 14.408100, longitude = 121.041500
 WHERE latitude IS NULL
   AND (location ILIKE '%muntinlupa%' OR address ILIKE '%muntinlupa%');

UPDATE shelters
   SET latitude = 14.648800, longitude = 120.967500
 WHERE latitude IS NULL
   AND (location ILIKE '%caloocan%' OR address ILIKE '%caloocan%');

UPDATE shelters
   SET latitude = 14.701100, longitude = 120.983000
 WHERE latitude IS NULL
   AND (location ILIKE '%valenzuela%' OR address ILIKE '%valenzuela%');

UPDATE shelters
   SET latitude = 14.650700, longitude = 121.102900
 WHERE latitude IS NULL
   AND (location ILIKE '%marikina%' OR address ILIKE '%marikina%');

UPDATE shelters
   SET latitude = 14.601900, longitude = 121.035500
 WHERE latitude IS NULL
   AND (location ILIKE '%san juan%' OR address ILIKE '%san juan%');

UPDATE shelters
   SET latitude = 14.666700, longitude = 120.941700
 WHERE latitude IS NULL
   AND (location ILIKE '%navotas%' OR address ILIKE '%navotas%');

UPDATE shelters
   SET latitude = 14.662900, longitude = 120.956900
 WHERE latitude IS NULL
   AND (location ILIKE '%malabon%' OR address ILIKE '%malabon%');

UPDATE shelters
   SET latitude = 14.555700, longitude = 121.069700
 WHERE latitude IS NULL
   AND (location ILIKE '%pateros%' OR address ILIKE '%pateros%');

UPDATE shelters
   SET latitude = 14.599500, longitude = 120.984200
 WHERE latitude IS NULL
   AND (location ILIKE '%manila%' OR address ILIKE '%manila%');

UPDATE shelters
   SET latitude = 10.315700, longitude = 123.885400
 WHERE latitude IS NULL
   AND (location ILIKE '%cebu%' OR address ILIKE '%cebu%');

UPDATE shelters
   SET latitude = 7.190700, longitude = 125.455300
 WHERE latitude IS NULL
   AND (location ILIKE '%davao%' OR address ILIKE '%davao%');

UPDATE shelters
   SET latitude = 14.115300, longitude = 120.962100
 WHERE latitude IS NULL
   AND (location ILIKE '%tagaytay%' OR address ILIKE '%tagaytay%');

UPDATE shelters
   SET latitude = 14.586000, longitude = 121.176000
 WHERE latitude IS NULL
   AND (location ILIKE '%antipolo%' OR address ILIKE '%antipolo%');

UPDATE shelters
   SET latitude = 13.756500, longitude = 121.058300
 WHERE latitude IS NULL
   AND (location ILIKE '%batangas%' OR address ILIKE '%batangas%');

UPDATE shelters
   SET latitude = 16.402300, longitude = 120.596000
 WHERE latitude IS NULL
   AND (location ILIKE '%baguio%' OR address ILIKE '%baguio%');

UPDATE shelters
   SET latitude = 10.720200, longitude = 122.562100
 WHERE latitude IS NULL
   AND (location ILIKE '%iloilo%' OR address ILIKE '%iloilo%');

UPDATE shelters
   SET latitude = 10.676500, longitude = 122.950900
 WHERE latitude IS NULL
   AND (location ILIKE '%bacolod%' OR address ILIKE '%bacolod%');

UPDATE shelters
   SET latitude = 8.454200, longitude = 124.631900
 WHERE latitude IS NULL
   AND (location ILIKE '%cagayan de oro%' OR address ILIKE '%cagayan de oro%');

UPDATE shelters
   SET latitude = 6.116400, longitude = 125.171600
 WHERE latitude IS NULL
   AND (location ILIKE '%general santos%' OR address ILIKE '%general santos%');

CREATE INDEX IF NOT EXISTS idx_shelters_geo
  ON shelters (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
