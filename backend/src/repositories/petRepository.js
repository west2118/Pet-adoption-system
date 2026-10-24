import { pool } from '../config/database.js';

const selectPets = 'SELECT * FROM pets';

/**
 * Haversine distance in kilometres from ($latParam, $lngParam) to the joined
 * shelter row (`s`). Postgres returns numeric, which pg hands back as a string;
 * the mapper converts it to a number for the API.
 */
const distanceFromSql = (latParam, lngParam) => `(6371 * acos(
  LEAST(1, GREATEST(-1,
    sin(radians(${latParam})) * sin(radians(s.latitude)) +
    cos(radians(${latParam})) * cos(radians(s.latitude)) *
    cos(radians(s.longitude) - radians(${lngParam}))
  ))
))`;


export const buildPublicFilters = (filters) => {
  // In-process pets (accepted application, adoption underway) are hidden from
  // every public surface — adopters browse adoptable pets only. Adopted pets
  // stay visible so their profiles can show the "found a home" state.
  const conditions = [`visibility = 'public'`, `status <> 'In Process'`];
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
  // Browse facets: temperament lives in a TEXT[] column, so match any element
  // case-insensitively — mirrors the old client-side comparison.
  if (filters.temperament) {
    values.push(filters.temperament.trim().toLowerCase());
    conditions.push(
      `EXISTS (SELECT 1 FROM unnest(temperament) t WHERE lower(t) = $${values.length})`,
    );
  }
  // Location is a shelter property, so resolve it through shelters.location.
  if (filters.location) {
    values.push(filters.location);
    conditions.push(
      `shelter_id IN (SELECT id FROM shelters WHERE location = $${values.length})`,
    );
  }
  if (filters.excludeAdopted) {
    conditions.push(`status <> 'Adopted'`);
  }
  return { conditions, values };
};

/**
 * Facet options + hero counts for the browse page.
 *
 * One cheap request (DISTINCT + COUNT aggregates over the public set) so the
 * page never has to download the whole catalogue just to fill its dropdowns
 * and headline numbers. Scope matches `buildPublicFilters`'s base set, minus
 * adopted pets — exactly what the grid shows.
 */
export const listPetFacets = async (shelterId) => {
  const scope = shelterId ? ` AND shelter_id = $1` : '';
  const params = shelterId ? [shelterId] : [];
  const base = `WHERE visibility = 'public' AND status <> 'In Process'${scope}`;
  const browsable = `${base} AND status <> 'Adopted'`;

  const [breeds, temperaments, stats, species] = await Promise.all([
    pool.query(`SELECT DISTINCT breed FROM pets ${browsable} ORDER BY breed`, params),
    pool.query(
      `SELECT DISTINCT t AS temperament
         FROM pets CROSS JOIN unnest(pets.temperament) t
        ${browsable}
        ORDER BY 1`,
      params,
    ),
    pool.query(
      `SELECT COUNT(*) FILTER (WHERE status <> 'Adopted')::int AS listed,
              COUNT(*) FILTER (WHERE status = 'Available')::int AS available,
              COUNT(*) FILTER (WHERE status = 'Adopted')::int AS adopted
         FROM pets ${base}`,
      params,
    ),
    pool.query(
      `SELECT species, COUNT(*)::int AS count FROM pets
        ${browsable} GROUP BY species ORDER BY count DESC`,
      params,
    ),
  ]);

  return {
    breeds: breeds.rows.map((r) => r.breed),
    temperaments: temperaments.rows.map((r) => r.temperament),
    stats: stats.rows[0],
    species: species.rows,
  };
};

export const listPublicPets = async (filters, { limit, offset }) => {
  const { conditions, values } = buildPublicFilters(filters);
  const params = [...values];
  const hasOrigin =
    Number.isFinite(filters.latitude) &&
    Number.isFinite(filters.longitude) &&
    Math.abs(filters.latitude) <= 90 &&
    Math.abs(filters.longitude) <= 180;

  let join = '';
  let distanceSelect = '';
  let orderBy = 'p.created_at DESC';

  if (hasOrigin) {
    join = 'JOIN shelters s ON s.id = p.shelter_id';
    // Origin parameters go after every facet value so facets keep their indexes.
    params.push(filters.latitude, filters.longitude);
    const latParam = `$${params.length - 1}`;
    const lngParam = `$${params.length}`;
    const distance = distanceFromSql(latParam, lngParam);

    distanceSelect = `, ROUND((${distance})::numeric, 2) AS distance_km`;
    conditions.push('s.latitude IS NOT NULL', 's.longitude IS NOT NULL');

    if (Number.isFinite(filters.radiusKm) && filters.radiusKm > 0) {
      params.push(filters.radiusKm);
      conditions.push(`(${distance}) <= $${params.length}`);
    }
    if (filters.sortByDistance) {
      orderBy = 'distance_km ASC NULLS LAST, p.created_at DESC';
    }
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const from = `FROM pets p ${join}`;
  const { rows } = await pool.query(
    `SELECT p.*${distanceSelect} ${from} ${where} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );
  const count = await pool.query(`SELECT COUNT(*)::int AS total ${from} ${where}`, params);
  return { rows, total: count.rows[0].total };
};

export const findPublicPetById = async (id) => {
  const { rows } = await pool.query(
    `${selectPets} WHERE id = $1 AND visibility = 'public' AND status <> 'In Process'`,
    [id],
  );
  return rows[0] ?? null;
};

export const findPetById = async (id) => {
  const { rows } = await pool.query(`${selectPets} WHERE id = $1`, [id]);
  return rows[0] ?? null;
};

export const listPetsByShelter = async (
  shelterId,
  { limit = 10, offset = 0, search, visibility, species, status } = {},
) => {
  const conditions = ['shelter_id = $1'];
  const values = [shelterId];

  if (visibility && visibility !== 'all') {
    values.push(visibility);
    conditions.push(`visibility = $${values.length}`);
  }
  // Species/status filtering is server-side so paging stays correct.
  if (species && species !== 'all') {
    values.push(species);
    conditions.push(`species = $${values.length}`);
  }
  if (status && status !== 'all') {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(name ILIKE $${values.length} OR breed ILIKE $${values.length})`);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const { rows } = await pool.query(
    `${selectPets} ${where} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset],
  );
  const count = await pool.query(
    `SELECT COUNT(*)::int AS total FROM pets ${where}`,
    values,
  );
  return { rows, total: count.rows[0].total };
};

export const listAllPets = async ({ limit = 10, offset = 0, search } = {}) => {
  const conditions = [];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(name ILIKE $${values.length} OR breed ILIKE $${values.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `${selectPets} ${where} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset],
  );
  const count = await pool.query(`SELECT COUNT(*)::int AS total FROM pets ${where}`, values);
  return { rows, total: count.rows[0].total };
};

const resolveBirthdate = (input) => {
  if (input?.birthdate && String(input.birthdate).trim().length > 0) {
    return String(input.birthdate).slice(0, 10);
  }
  if (typeof input?.ageYears === 'number' || (input?.ageYears && !isNaN(input.ageYears))) {
    const years = Number(input.ageYears);
    const now = new Date();
    if (years < 1) {
      now.setMonth(now.getMonth() - Math.round(years * 12 || 6));
    } else {
      now.setFullYear(now.getFullYear() - Math.round(years));
    }
    return now.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
};

export const createPet = async (input, shelterId) => {
  const birthdate = resolveBirthdate(input);
  const { rows } = await pool.query(
    `INSERT INTO pets (name, species, breed, birthdate, age_group, size, gender, temperament,
       shelter_id, visibility, description, medical_history, behavioral_notes, status,
       image_url, gallery, vaccinated, spayed_neutered, good_with_kids, good_with_pets)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
     RETURNING *`,
    [
      input.name, input.species, input.breed, birthdate, input.ageGroup,
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
  const birthdate =
    patch.birthdate ||
    (patch.ageYears != null ? resolveBirthdate(patch) : current.birthdate) ||
    new Date().toISOString().slice(0, 10);
  const merged = {
    name: patch.name ?? current.name,
    species: patch.species ?? current.species,
    breed: patch.breed ?? current.breed,
    birthdate,
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
    `UPDATE pets SET name=$1, species=$2, breed=$3, birthdate=$4, age_group=$5, size=$6,
       gender=$7, temperament=$8, visibility=$9, description=$10, medical_history=$11,
       behavioral_notes=$12, status=$13, image_url=$14, gallery=$15, vaccinated=$16,
       spayed_neutered=$17, good_with_kids=$18, good_with_pets=$19, updated_at=CURRENT_TIMESTAMP
     WHERE id=$20 RETURNING *`,
    [
      merged.name, merged.species, merged.breed, merged.birthdate, merged.age_group,
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
