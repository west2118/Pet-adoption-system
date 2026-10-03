import { pool } from '../config/database.js';

export const listFavoritesByUser = async (userId) => {
  const { rows } = await pool.query(
    `SELECT p.* FROM favorites f JOIN pets p ON f.pet_id = p.id
     WHERE f.user_id = $1 AND p.visibility = 'public' ORDER BY f.created_at DESC`,
    [userId],
  );
  return rows;
};

export const addFavorite = async (userId, petId) => {
  await pool.query(
    `INSERT INTO favorites (user_id, pet_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [userId, petId],
  );
  const { rows } = await pool.query('SELECT * FROM pets WHERE id = $1', [petId]);
  return rows[0] ?? null;
};

export const removeFavorite = async (userId, petId) => {
  const { rowCount } = await pool.query(
    'DELETE FROM favorites WHERE user_id = $1 AND pet_id = $2',
    [userId, petId],
  );
  return rowCount > 0;
};
