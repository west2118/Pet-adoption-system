import { pool } from '../config/database.js';

export const listShelters = async ({ limit = 50, offset = 0 } = {}) => {
  const { rows } = await pool.query(
    `SELECT s.*,
       (SELECT COUNT(*)::int FROM pets p WHERE p.shelter_id = s.id) AS total_pets,
       (SELECT COUNT(*)::int FROM pets p WHERE p.shelter_id = s.id AND p.visibility = 'public' AND p.status = 'Available') AS active_listings
     FROM shelters s ORDER BY s.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  const count = await pool.query('SELECT COUNT(*)::int AS total FROM shelters');
  return { rows, total: count.rows[0].total };
};

export const findShelterById = async (id) => {
  const { rows } = await pool.query(
    `SELECT s.*,
       (SELECT COUNT(*)::int FROM pets p WHERE p.shelter_id = s.id) AS total_pets,
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

export const createShelter = async (input) => {
  const { rows } = await pool.query(
    `INSERT INTO shelters (name, location, address, phone, email, operating_hours, description, image_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      input.name,
      input.location,
      input.address,
      input.phone,
      input.email,
      input.operatingHours,
      input.description,
      input.imageUrl,
    ],
  );
  return rows[0];
};

export const updateShelter = async (id, patch) => {
  const current = await findShelterById(id);
  if (!current) return null;
  const merged = {
    name: patch.name ?? current.name,
    location: patch.location ?? current.location,
    address: patch.address ?? current.address,
    phone: patch.phone ?? current.phone,
    email: patch.email ?? current.email,
    operating_hours: patch.operatingHours ?? current.operating_hours,
    description: patch.description ?? current.description,
    image_url: patch.imageUrl ?? current.image_url,
  };
  const { rows } = await pool.query(
    `UPDATE shelters SET name=$1, location=$2, address=$3, phone=$4, email=$5,
       operating_hours=$6, description=$7, image_url=$8, updated_at=CURRENT_TIMESTAMP
     WHERE id=$9 RETURNING *`,
    [merged.name, merged.location, merged.address, merged.phone, merged.email,
      merged.operating_hours, merged.description, merged.image_url, id],
  );
  return rows[0] ?? null;
};
