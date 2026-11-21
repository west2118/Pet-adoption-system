import { pool } from '../config/database.js';
import { resolveShelterCoordinates } from '../utils/geo.js';

export const listShelters = async ({ limit = 50, offset = 0 } = {}) => {
  const { rows } = await pool.query(
    `SELECT s.*,
       (SELECT COUNT(*)::int FROM pets p WHERE p.shelter_id = s.id AND p.status != 'Adopted') AS total_pets,
       (SELECT COUNT(*)::int FROM pets p WHERE p.shelter_id = s.id AND p.visibility = 'public' AND p.status = 'Available') AS active_listings
     FROM shelters s ORDER BY s.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  const count = await pool.query('SELECT COUNT(*)::int AS total FROM shelters');
  return { rows, total: count.rows[0].total };
};

/**
 * Network-wide numbers for the shelters page header. The list itself is
 * paged, so these aggregates are fetched separately to stay correct.
 */
export const getShelterStats = async () => {
  const { rows } = await pool.query(
    `SELECT (SELECT COUNT(*)::int FROM shelters) AS total,
            (SELECT COUNT(DISTINCT location)::int FROM shelters) AS cities,
            (SELECT COUNT(*)::int FROM pets WHERE status != 'Adopted') AS pets_in_care`,
  );
  return rows[0];
};

export const findShelterById = async (id) => {
  const { rows } = await pool.query(
    `SELECT s.*,
       (SELECT COUNT(*)::int FROM pets p WHERE p.shelter_id = s.id AND p.status != 'Adopted') AS total_pets,
       (SELECT COUNT(*)::int FROM pets p WHERE p.shelter_id = s.id AND p.visibility = 'public' AND p.status = 'Available') AS active_listings
     FROM shelters s WHERE s.id = $1`,
    [id],
  );
  return rows[0] ?? null;
};

export const findShelterByEmail = async (email) => {
  const { rows } = await pool.query('SELECT * FROM shelters WHERE email = $1', [email]);
  return rows[0] ?? null;
};

export const deleteShelter = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Delete all pets belonging to this shelter (cascades to applications, visits, inquiries, favorites)
    await client.query('DELETE FROM pets WHERE shelter_id = $1', [id]);

    // 2. Delete all waiver templates and versions for this shelter
    await client.query('DELETE FROM waiver_versions WHERE shelter_id = $1', [id]);
    await client.query('DELETE FROM waivers WHERE shelter_id = $1', [id]);
    await client.query('DELETE FROM waiver_templates WHERE shelter_id = $1', [id]);

    // 3. Delete shelter applications associated with staff of this shelter or matching shelter email
    const shelterRow = await client.query('SELECT email FROM shelters WHERE id = $1', [id]);
    const shelterEmail = shelterRow.rows[0]?.email;
    if (shelterEmail) {
      await client.query('DELETE FROM shelter_applications WHERE email = $1', [shelterEmail]);
    }

    // 4. Delete staff accounts assigned to this shelter (cascades to their applications, challenges, tokens)
    await client.query(
      `DELETE FROM users WHERE shelter_id = $1 AND role = 'shelter_staff'`,
      [id],
    );

    // 5. Finally delete the shelter record itself
    const { rows } = await client.query('DELETE FROM shelters WHERE id = $1 RETURNING id', [id]);

    await client.query('COMMIT');
    return rows[0] ?? null;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const createShelter = async (input) => {
  const { latitude, longitude } = resolveShelterCoordinates(input);
  const { rows } = await pool.query(
    `INSERT INTO shelters (name, location, address, phone, email, operating_hours, description, image_url, latitude, longitude)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      input.name,
      input.location,
      input.address,
      input.phone,
      input.email,
      input.operatingHours,
      input.description,
      input.imageUrl,
      latitude,
      longitude,
    ],
  );
  return rows[0];
};

export const updateShelter = async (id, patch) => {
  const current = await findShelterById(id);
  if (!current) return null;
  const addressChanged = patch.location !== undefined || patch.address !== undefined;
  const coordinates =
    patch.latitude !== undefined || patch.longitude !== undefined
      ? resolveShelterCoordinates({
          latitude: patch.latitude,
          longitude: patch.longitude,
          location: patch.location ?? current.location,
          address: patch.address ?? current.address,
        })
      : addressChanged
        ? resolveShelterCoordinates({
            location: patch.location ?? current.location,
            address: patch.address ?? current.address,
          })
        : { latitude: current.latitude, longitude: current.longitude };
  const merged = {
    name: patch.name ?? current.name,
    location: patch.location ?? current.location,
    address: patch.address ?? current.address,
    phone: patch.phone ?? current.phone,
    email: patch.email ?? current.email,
    operating_hours: patch.operatingHours ?? current.operating_hours,
    description: patch.description ?? current.description,
    image_url: patch.imageUrl ?? current.image_url,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  };
  const { rows } = await pool.query(
    `UPDATE shelters SET name=$1, location=$2, address=$3, phone=$4, email=$5,
       operating_hours=$6, description=$7, image_url=$8, latitude=$9, longitude=$10,
       updated_at=CURRENT_TIMESTAMP
     WHERE id=$11 RETURNING *`,
    [merged.name, merged.location, merged.address, merged.phone, merged.email,
      merged.operating_hours, merged.description, merged.image_url,
      merged.latitude, merged.longitude, id],
  );
  return rows[0];
};
