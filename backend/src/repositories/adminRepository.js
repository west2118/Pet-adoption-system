import { pool } from '../config/database.js';

export const getSystemStats = async () => {
  const [sheltersRes, usersRes, petsRes, visibilityRes, appsRes] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS total FROM shelters'),
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
    shelters: shelters.total,
    users: { total: users.total, adopters: users.adopters, staff: users.staff, admins: users.admins },
    pets: { total: pets.total, public: visibility.public, private: visibility.private },
    applications: apps,
  };
};
