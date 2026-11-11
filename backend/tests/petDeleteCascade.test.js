import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { loadEnv } from '../src/config/loadEnv.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ||= 'test-secret-at-least-16-chars';
process.env.ALLOWED_ORIGINS ||= 'http://localhost:5173';

loadEnv();

// The cascade test needs a real Postgres database: the behavior under test is
// enforced by the schema's ON DELETE CASCADE constraints. Supabase is the only
// database this project creates now, so the test uses a dedicated Supabase
// project (or branch) supplied via CASCADE_TEST_DATABASE_URL — it never creates
// or derives a database of its own.
let testDatabaseUrl = process.env.CASCADE_TEST_DATABASE_URL || null;

let pool = null;
let skipReason = 'CASCADE_TEST_DATABASE_URL is not set';
const fixtures = [];

before(async () => {
  if (!testDatabaseUrl) return;

  process.env.DATABASE_URL = testDatabaseUrl;

  try {
    const { runMigrations } = await import('../scripts/migrate.js');
    ({ pool } = await import('../src/config/database.js'));
    await runMigrations(pool);
  } catch (error) {
    skipReason = `could not prepare ${testDatabaseUrl}: ${error.message}`;
    if (pool) {
      await pool.end().catch(() => {});
      pool = null;
    }
  }
});

after(async () => {
  if (!pool) return;

  // Remove fixtures even when an assertion failed mid-test. Shelters cascade
  // to pets (and therefore to every pet-linked row); users are independent.
  for (const { shelterId } of fixtures) {
    await pool.query('DELETE FROM shelters WHERE id = $1', [shelterId]).catch(() => {});
  }
  for (const { userId } of fixtures) {
    await pool.query('DELETE FROM users WHERE id = $1', [userId]).catch(() => {});
  }

  await pool.end();
});

const seedPetGraph = async (label, existingShelterId = null) => {
  const suffix = `${label}-${randomUUID()}`;
  let shelterId = existingShelterId;

  if (!shelterId) {
    const shelter = await pool.query(
      `INSERT INTO shelters
         (name, location, address, phone, email, operating_hours, description, image_url)
       VALUES ($1, 'Test City', '1 Test Street', '555-0100', $2, 'Mon-Fri 9-5',
               'Cascade test shelter', 'https://example.test/shelter.png')
       RETURNING id`,
      [`Cascade Shelter ${suffix}`, `shelter-${suffix}@example.test`],
    );
    shelterId = shelter.rows[0].id;
  }

  const adopter = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('Cascade Adopter', $1, 'not-a-real-hash', 'adopter')
     RETURNING id`,
    [`adopter-${suffix}@example.test`],
  );
  const userId = adopter.rows[0].id;

  const pet = await pool.query(
    `INSERT INTO pets
       (name, species, breed, birthdate, age_group, size, gender,
        shelter_id, description, image_url)
     VALUES ($1, 'dog', 'Test Breed', '2020-01-01', 'adult', 'medium', 'male',
             $2, 'Cascade test pet', 'https://example.test/pet.png')
     RETURNING id`,
    [`Cascade Pet ${suffix}`, shelterId],
  );
  const petId = pet.rows[0].id;

  const application = await pool.query(
    `INSERT INTO adoption_applications
       (pet_id, applicant_id, applicant_name, email, phone, address,
        housing_type, experience, reason)
     VALUES ($1, $2, 'Cascade Adopter', $3, '555-0101', '1 Test Street',
             'house', 'None', 'Testing pet delete cascade')
     RETURNING id`,
    [petId, userId, `adopter-${suffix}@example.test`],
  );
  const applicationId = application.rows[0].id;

  await pool.query(
    `INSERT INTO application_history (application_id, status)
     VALUES ($1, 'Submitted')`,
    [applicationId],
  );

  await pool.query(
    `INSERT INTO inquiries (pet_id, from_name, from_email, message)
     VALUES ($1, 'Cascade Adopter', $2, 'Testing pet delete cascade')`,
    [petId, `adopter-${suffix}@example.test`],
  );

  await pool.query(
    `INSERT INTO favorites (user_id, pet_id) VALUES ($1, $2)`,
    [userId, petId],
  );

  await pool.query(
    `INSERT INTO visit_threads (pet_id, adopter_id, preferred_slot)
     VALUES ($1, $2, 'Saturday morning')`,
    [petId, userId],
  );

  const waiver = await pool.query(
    `INSERT INTO waivers (application_id, shelter_id, snapshot)
     VALUES ($1, $2, '{}'::jsonb)
     RETURNING id`,
    [applicationId, shelterId],
  );
  const waiverId = waiver.rows[0].id;

  await pool.query(
    `INSERT INTO waiver_versions
       (waiver_id, application_id, shelter_id, version, snapshot, status)
     VALUES ($1, $2, $3, 1, '{}'::jsonb, 'Superseded')`,
    [waiverId, applicationId, shelterId],
  );

  const fixture = { shelterId, userId, petId, applicationId, waiverId };
  fixtures.push(fixture);
  return fixture;
};

const assertPetGraphDeleted = async ({ petId, applicationId, waiverId }) => {
  const { rows } = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM pets WHERE id = $1) AS pets,
       (SELECT COUNT(*)::int FROM adoption_applications WHERE id = $2) AS applications,
       (SELECT COUNT(*)::int FROM application_history WHERE application_id = $2) AS application_history,
       (SELECT COUNT(*)::int FROM inquiries WHERE pet_id = $1) AS inquiries,
       (SELECT COUNT(*)::int FROM favorites WHERE pet_id = $1) AS favorites,
       (SELECT COUNT(*)::int FROM visit_threads WHERE pet_id = $1) AS visit_threads,
       (SELECT COUNT(*)::int FROM waivers WHERE id = $3) AS waivers,
       (SELECT COUNT(*)::int FROM waiver_versions WHERE waiver_id = $3) AS waiver_versions`,
    [petId, applicationId, waiverId],
  );

  assert.deepEqual(rows[0], {
    pets: 0,
    applications: 0,
    application_history: 0,
    inquiries: 0,
    favorites: 0,
    visit_threads: 0,
    waivers: 0,
    waiver_versions: 0,
  });
};

describe('deleting a pet listing cascades to all connected data', () => {
  it('removes applications, history, waivers, versions, inquiries, favorites, and visits', async (t) => {
    if (!pool) {
      t.skip(skipReason);
      return;
    }

    const { removeListing } = await import('../src/services/listingService.js');
    const fixture = await seedPetGraph('single');

    const result = await removeListing(fixture.petId, fixture.shelterId);

    assert.deepEqual(result, { id: fixture.petId });
    await assertPetGraphDeleted(fixture);
  });

  it('bulk delete removes connected data for every selected pet', async (t) => {
    if (!pool) {
      t.skip(skipReason);
      return;
    }

    const { removeListings } = await import('../src/services/listingService.js');
    const first = await seedPetGraph('bulk-a');
    const second = await seedPetGraph('bulk-b', first.shelterId);

    const result = await removeListings(
      [first.petId, second.petId],
      first.shelterId,
    );

    assert.deepEqual(result, { deleted: 2 });
    await assertPetGraphDeleted(first);
    await assertPetGraphDeleted(second);
  });
});
