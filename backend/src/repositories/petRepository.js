import { pool } from '../config/database.js';

const selectPets = 'SELECT * FROM pets';

export const buildPublicFilters = (filters) => {
  const conditions = [`visibility = 'public'`];
  const values = [];

  const push = (clause, value) => {
    values.push(value);
    conditions.push(clause.replace('?', `$${values.length}`));
  };

  if (filters.species) push('species = ?', filters.species);
  if (filters.status) push('status = ?', filters.status);
  if (filters.ageGroup) push('age_group = ?', filters.ageGroup);
  if (filters.size) push('size = ?', filters.size);
  if (filters.gender) push('gender = ?', filters.gender);
  if (filters.shelterId) push('shelter_id = ?', filters.shelterId);
  if (filters.breed) {
    values.push(`%${filters.breed}%`);
    conditions.push(`breed ILIKE $${values.length}`);
  }
  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(`(name ILIKE $${values.length} OR breed ILIKE $${values.length} OR description ILIKE $${values.length})`);
  }
  return { conditions, values };
};

export const listPublicPets = async (filters, { limit, offset }) => {
  const { conditions, values } = buildPublicFilters(filters);
  const where = `WHERE ${conditions.join(' AND ')}`;
  const { rows } = await pool.query(
    `${selectPets} ${where} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset],
  );
  const count = await pool.query(`SELECT COUNT(*)::int AS total FROM pets ${where}`, values);
  return { rows, total: count.rows[0].total };
};

export const findPublicPetById = async (id) => {
  const { rows } = await pool.query(
    `${selectPets} WHERE id = $1 AND visibility = 'public'`,
    [id],
  );
  return rows[0] ?? null;
};

export const findPetById = async (id) => {
  const { rows } = await pool.query(`${selectPets} WHERE id = $1`, [id]);
  return rows[0] ?? null;
};

export const listPetsByShelter = async (shelterId, { limit, offset }) => {
  const { rows } = await pool.query(
    `${selectPets} WHERE shelter_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [shelterId, limit, offset],
  );
  const count = await pool.query(
    'SELECT COUNT(*)::int AS total FROM pets WHERE shelter_id = $1',
    [shelterId],
  );
  return { rows, total: count.rows[0].total };
};

export const listAllPets = async ({ limit, offset }) => {
  const { rows } = await pool.query(
    `${selectPets} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  const count = await pool.query('SELECT COUNT(*)::int AS total FROM pets');
  return { rows, total: count.rows[0].total };
};

export const createPet = async (input, shelterId) => {
  const { rows } = await pool.query(
    `INSERT INTO pets (name, species, breed, age_years, age_group, size, gender, temperament,
       shelter_id, visibility, description, medical_history, behavioral_notes, status,
       image_url, gallery, vaccinated, spayed_neutered, good_with_kids, good_with_pets)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
     RETURNING *`,
    [
      input.name, input.species, input.breed, input.ageYears, input.ageGroup,
      input.size, input.gender, input.temperament ?? [], shelterId,
      input.visibility ?? 'public', input.description, input.medicalHistory ?? [],
      input.behavioralNotes ?? '', input.status ?? 'Available', input.imageUrl,
      input.gallery ?? [], input.vaccinated ?? false, input.spayedNeutered ?? false,
      input.goodWithKids ?? false, input.goodWithPets ?? false,
    ],
  );
  return rows[0];
};

export const updatePet = async (id, patch) => {
  const current = await findPetById(id);
  if (!current) return null;
  const merged = {
    name: patch.name ?? current.name,
    species: patch.species ?? current.species,
    breed: patch.breed ?? current.breed,
    age_years: patch.ageYears ?? current.age_years,
    age_group: patch.ageGroup ?? current.age_group,
    size: patch.size ?? current.size,
    gender: patch.gender ?? current.gender,
    temperament: patch.temperament ?? current.temperament,
    visibility: patch.visibility ?? current.visibility,
    description: patch.description ?? current.description,
    medical_history: patch.medicalHistory ?? current.medical_history,
    behavioral_notes: patch.behavioralNotes ?? current.behavioral_notes,
    status: patch.status ?? current.status,
    image_url: patch.imageUrl ?? current.image_url,
    gallery: patch.gallery ?? current.gallery,
    vaccinated: patch.vaccinated ?? current.vaccinated,
    spayed_neutered: patch.spayedNeutered ?? current.spayed_neutered,
    good_with_kids: patch.goodWithKids ?? current.good_with_kids,
    good_with_pets: patch.goodWithPets ?? current.good_with_pets,
  };
  const { rows } = await pool.query(
    `UPDATE pets SET name=$1, species=$2, breed=$3, age_years=$4, age_group=$5, size=$6,
       gender=$7, temperament=$8, visibility=$9, description=$10, medical_history=$11,
       behavioral_notes=$12, status=$13, image_url=$14, gallery=$15, vaccinated=$16,
       spayed_neutered=$17, good_with_kids=$18, good_with_pets=$19, updated_at=CURRENT_TIMESTAMP
     WHERE id=$20 RETURNING *`,
    [
      merged.name, merged.species, merged.breed, merged.age_years, merged.age_group,
      merged.size, merged.gender, merged.temperament, merged.visibility, merged.description,
      merged.medical_history, merged.behavioral_notes, merged.status, merged.image_url,
      merged.gallery, merged.vaccinated, merged.spayed_neutered, merged.good_with_kids,
      merged.good_with_pets, id,
    ],
  );
  return rows[0] ?? null;
};

export const deletePet = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM pets WHERE id = $1', [id]);
  return rowCount > 0;
};
