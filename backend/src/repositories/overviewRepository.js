import { pool } from '../config/database.js';

/**
 * Shelter-portal overview aggregates. Every figure is counted in SQL and
 * scoped to one shelter — the frontend must never derive KPIs by counting
 * local arrays (mock stores, page caps, and cross-shelter lists all skew
 * the numbers).
 */

const PET_STATUSES = ['Available', 'In Process', 'Adopted', 'Fostered'];
const APP_STATUSES = [
  'Submitted',
  'Under Review',
  'Approved',
  'Rejected',
  'Cancelled',
  'Adopted',
  'Returned',
];

export const getShelterOverview = async (shelterId) => {
  const [
    petKpis,
    speciesRes,
    petStatusRes,
    appKpis,
    appStatusRes,
    trendRes,
    recentAppsRes,
    inventoryRes,
  ] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE visibility = 'public')::int AS public,
              COUNT(*) FILTER (WHERE visibility = 'private')::int AS private,
              COUNT(*) FILTER (WHERE status = 'Available')::int AS open,
              COUNT(*) FILTER (WHERE status = 'Adopted')::int AS adopted
         FROM pets WHERE shelter_id = $1`,
      [shelterId],
    ),
    pool.query(
      `SELECT species, COUNT(*)::int AS count FROM pets
        WHERE shelter_id = $1 GROUP BY species`,
      [shelterId],
    ),
    pool.query(
      `SELECT status, COUNT(*)::int AS count FROM pets
        WHERE shelter_id = $1 GROUP BY status`,
      [shelterId],
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE a.status IN ('Submitted', 'Under Review'))::int AS pending,
              COUNT(*) FILTER (WHERE a.status = 'Submitted')::int AS submitted,
              COUNT(*) FILTER (WHERE a.status = 'Under Review')::int AS under_review,
              COUNT(*) FILTER (WHERE a.status = 'Approved')::int AS approved,
              COUNT(*) FILTER (WHERE a.status = 'Rejected')::int AS rejected,
              COUNT(*) FILTER (WHERE a.status = 'Adopted')::int AS adopted
         FROM adoption_applications a
         JOIN pets p ON p.id = a.pet_id
        WHERE p.shelter_id = $1`,
      [shelterId],
    ),
    pool.query(
      `SELECT a.status, COUNT(*)::int AS count
         FROM adoption_applications a
         JOIN pets p ON p.id = a.pet_id
        WHERE p.shelter_id = $1 GROUP BY a.status`,
      [shelterId],
    ),
    pool.query(
      `SELECT TO_CHAR(a.submitted_at, 'YYYY-MM') AS month,
              COUNT(*)::int AS applications,
              COUNT(*) FILTER (WHERE a.status IN ('Approved', 'Adopted'))::int AS approved
         FROM adoption_applications a
         JOIN pets p ON p.id = a.pet_id
        WHERE p.shelter_id = $1
        GROUP BY month ORDER BY month ASC`,
      [shelterId],
    ),
    pool.query(
      `SELECT a.* FROM adoption_applications a
         JOIN pets p ON p.id = a.pet_id
        WHERE p.shelter_id = $1
        ORDER BY a.submitted_at DESC LIMIT 5`,
      [shelterId],
    ),
    pool.query(
      `SELECT * FROM pets WHERE shelter_id = $1 ORDER BY date_added DESC LIMIT 5`,
      [shelterId],
    ),
  ]);

  // Pets referenced by the recent applications, for table lookups.
  const { rows: recentPets } = await pool.query(
    `SELECT DISTINCT p.* FROM pets p
      WHERE p.id IN (
        SELECT a.pet_id FROM adoption_applications a
         JOIN pets sp ON sp.id = a.pet_id
        WHERE sp.shelter_id = $1
        ORDER BY a.submitted_at DESC LIMIT 5
      )`,
    [shelterId],
  );

  return {
    petKpis: petKpis.rows[0],
    species: speciesRes.rows,
    petStatuses: petStatusRes.rows,
    appKpis: appKpis.rows[0],
    appStatuses: appStatusRes.rows,
    trend: trendRes.rows,
    recentApplications: recentAppsRes.rows,
    recentPets,
    inventory: inventoryRes.rows,
  };
};

export { PET_STATUSES, APP_STATUSES };
