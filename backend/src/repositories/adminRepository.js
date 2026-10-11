import { pool } from '../config/database.js';

export const getSystemStats = async () => {
  const [sheltersRes, usersRes, petsRes, visibilityRes, appsRes] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total,
        COUNT(DISTINCT location)::int AS locations FROM shelters`),
    pool.query(`SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE role = 'adopter')::int AS adopters,
        COUNT(*) FILTER (WHERE role = 'shelter_staff')::int AS staff,
        COUNT(*) FILTER (WHERE role = 'platform_admin')::int AS admins
      FROM users`),
    pool.query('SELECT COUNT(*)::int AS total FROM pets'),
    pool.query(`SELECT COUNT(*) FILTER (WHERE visibility = 'public')::int AS public,
        COUNT(*) FILTER (WHERE visibility = 'private')::int AS private
      FROM pets`),
    pool.query(`SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'Submitted')::int AS submitted,
        COUNT(*) FILTER (WHERE status = 'Under Review')::int AS under_review,
        COUNT(*) FILTER (WHERE status = 'Approved')::int AS approved,
        COUNT(*) FILTER (WHERE status = 'Rejected')::int AS rejected,
        COUNT(*) FILTER (WHERE status = 'Adopted')::int AS adopted
      FROM adoption_applications`),
  ]);
  const shelters = sheltersRes.rows[0];
  const users = usersRes.rows[0];
  const pets = petsRes.rows[0];
  const visibility = visibilityRes.rows[0];
  const apps = appsRes.rows[0];
  return {
    shelters: { total: shelters.total, locations: shelters.locations },
    users: { total: users.total, adopters: users.adopters, staff: users.staff, admins: users.admins },
    pets: { total: pets.total, public: visibility.public, private: visibility.private },
    applications: apps,
  };
};

/**
 * Per-shelter rollups for the admin Shelters summary table — counted in SQL
 * so the dashboard never derives them from capped/filtered client lists.
 */
export const getShelterSummaries = async () => {
  const { rows } = await pool.query(
    `SELECT s.*,
        (SELECT COUNT(*)::int FROM pets p WHERE p.shelter_id = s.id) AS pet_count,
        (SELECT COUNT(*)::int FROM pets p WHERE p.shelter_id = s.id AND p.visibility = 'public') AS public_pets,
        (SELECT COUNT(*)::int FROM adoption_applications a
           JOIN pets p ON p.id = a.pet_id
          WHERE p.shelter_id = s.id AND a.status IN ('Submitted', 'Under Review')) AS pending_applications,
        (SELECT COUNT(*)::int FROM users u WHERE u.shelter_id = s.id) AS staff
      FROM shelters s
      ORDER BY pet_count DESC, s.name ASC`,
  );
  return rows;
};

/** Newest platform-wide adoption applications for the admin Recent table. */
export const getRecentApplications = async (limit = 5) => {
  const { rows } = await pool.query(
    'SELECT * FROM adoption_applications ORDER BY submitted_at DESC LIMIT $1',
    [limit],
  );
  const { rows: pets } = await pool.query(
    `SELECT DISTINCT p.* FROM pets p WHERE p.id = ANY($1)`,
    [rows.map((r) => r.pet_id)],
  );
  return { rows, pets };
};

/**
 * Admin Shelters table page: search across name/location/email with
 * per-row counts, so the table never slices a capped client list.
 */
export const listSheltersWithCounts = async ({ limit = 10, offset = 0, search } = {}) => {
  const conditions = [];
  const values = [];
  if (search) {
    values.push(`%${search}%`);
    conditions.push(
      `(s.name ILIKE $1 OR s.location ILIKE $1 OR s.email ILIKE $1)`,
    );
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT s.*,
        (SELECT COUNT(*)::int FROM pets p WHERE p.shelter_id = s.id) AS pet_count,
        (SELECT COUNT(*)::int FROM pets p WHERE p.shelter_id = s.id AND p.visibility = 'public') AS public_pets,
        (SELECT COUNT(*)::int FROM adoption_applications a
           JOIN pets p ON p.id = a.pet_id
          WHERE p.shelter_id = s.id AND a.status IN ('Submitted', 'Under Review')) AS pending_applications,
        (SELECT COUNT(*)::int FROM users u WHERE u.shelter_id = s.id) AS staff
      FROM shelters s ${where}
      ORDER BY s.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset],
  );
  const count = await pool.query(
    `SELECT COUNT(*)::int AS total FROM shelters s ${where}`,
    values,
  );
  return { rows, total: count.rows[0].total };
};

/** Single shelter with counts + assigned staff for the admin details modal. */
export const findShelterWithStaff = async (id) => {
  const { rows } = await pool.query(
    `SELECT s.*,
        (SELECT COUNT(*)::int FROM pets p WHERE p.shelter_id = s.id) AS pet_count,
        (SELECT COUNT(*)::int FROM pets p WHERE p.shelter_id = s.id AND p.visibility = 'public') AS public_pets,
        (SELECT COUNT(*)::int FROM adoption_applications a
           JOIN pets p ON p.id = a.pet_id
          WHERE p.shelter_id = s.id AND a.status IN ('Submitted', 'Under Review')) AS pending_applications
      FROM shelters s WHERE s.id = $1`,
    [id],
  );
  if (!rows[0]) return null;
  const { rows: staff } = await pool.query(
    'SELECT id, name, email FROM users WHERE shelter_id = $1 ORDER BY name ASC',
    [id],
  );
  return { shelter: rows[0], staff };
};
