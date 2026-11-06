/**
 * Seeds two separate shelters, each with its own distinct shelter admin and pets.
 *
 * Purpose: lets you log in as either shelter admin and confirm that every record
 * they see belongs to their own shelter only (no cross-shelter leakage).
 *
 * Idempotent: re-running updates the shelters/admins and skips pets that already
 * exist for that shelter. It does NOT delete existing data.
 *
 * Usage: npm run seed:two-shelters
 */
import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';

dotenv.config();

const img = (seed) => `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=800&q=80`;

const PASSWORD = 'password123';

const dataset = [
  {
    shelter: {
      name: 'Sunny Paws Shelter',
      location: 'Quezon City, Metro Manila',
      address: '88 Sampaguita Ave, Project 3, Quezon City',
      latitude: 14.6331,
      longitude: 121.0269,
      phone: '+63 2 8555 2211',
      email: 'sunnypaws.shelter@example.ph',
      operating_hours: 'Mon-Sat, 8:00 AM - 5:00 PM',
      description:
        'Community shelter in Quezon City rehoming rescued dogs and cats from the metro.',
      image_url: img('photo-1548199973-03cce0bbc87b'),
    },
    admin: {
      name: 'Anna Reyes',
      email: 'anna.sunnypaws@example.ph',
      phone: '+63 917 555 0111',
    },
    pets: [
      {
        name: 'Pepper',
        species: 'dog',
        breed: 'Aspin',
        birthdate: '2023-03-11',
        age_group: 'young',
        size: 'medium',
        gender: 'female',
        temperament: ['Playful', 'Friendly'],
        visibility: 'public',
        description: 'Pepper was rescued from the streets of Quezon City and warms up fast.',
        medical_history: ['Vaccinated', 'Dewormed'],
        behavioral_notes: 'Great with children, learning leash manners.',
        status: 'Available',
        image_url: img('photo-1543466835-00a7907e9de1'),
        gallery: [],
        vaccinated: true,
        spayed_neutered: true,
        good_with_kids: true,
        good_with_pets: true,
      },
      {
        name: 'Sushi',
        species: 'cat',
        breed: 'Puspin',
        birthdate: '2024-01-20',
        age_group: 'young',
        size: 'small',
        gender: 'male',
        temperament: ['Curious', 'Affectionate'],
        visibility: 'public',
        description: 'Sushi is a bottle-fed kitten raised in foster care with Sunny Paws.',
        medical_history: ['Vaccinated'],
        behavioral_notes: 'Litter-trained and used to indoor living.',
        status: 'Available',
        image_url: img('photo-1514888286974-6c03e2ca1dba'),
        gallery: [],
        vaccinated: true,
        spayed_neutered: false,
        good_with_kids: true,
        good_with_pets: true,
      },
    ],
  },
  {
    shelter: {
      name: 'Coastal Critters Rescue',
      location: 'Davao City, Davao del Sur',
      address: '12 Rizal Promenade, Bajada, Davao City',
      latitude: 7.1907,
      longitude: 125.4553,
      phone: '+63 82 555 3344',
      email: 'coastalcritters.shelter@example.ph',
      operating_hours: 'Tue-Sun, 9:00 AM - 6:00 PM',
      description:
        'Coastal rescue in Davao City focusing on abandoned cats, dogs and small animals.',
      image_url: img('photo-1450778869180-41d0601e046e'),
    },
    admin: {
      name: 'Ben Cruz',
      email: 'ben.coastalcritters@example.ph',
      phone: '+63 918 555 0222',
    },
    pets: [
      {
        name: 'Mango',
        species: 'dog',
        breed: 'Shih Tzu Mix',
        birthdate: '2022-09-05',
        age_group: 'adult',
        size: 'small',
        gender: 'male',
        temperament: ['Calm', 'Cuddly'],
        visibility: 'public',
        description: 'Mango was surrendered by a family relocating abroad and is looking for a lap.',
        medical_history: ['Fully vaccinated', 'Neutered'],
        behavioral_notes: 'Quiet, apartment-friendly, house-trained.',
        status: 'Available',
        image_url: img('photo-1583511655857-d19b40a7a54e'),
        gallery: [],
        vaccinated: true,
        spayed_neutered: true,
        good_with_kids: true,
        good_with_pets: true,
      },
      {
        name: 'Coco Bean',
        species: 'rabbit',
        breed: 'Netherland Dwarf',
        birthdate: '2024-04-02',
        age_group: 'young',
        size: 'small',
        gender: 'female',
        temperament: ['Gentle', 'Timid'],
        visibility: 'private',
        description: 'Coco Bean is recovering from a minor leg injury before public listing.',
        medical_history: ['Health checked', 'Under observation'],
        behavioral_notes: 'Litter box trained, needs a quiet home.',
        status: 'Fostered',
        image_url: img('photo-1585110396000-c9ffd4e4b308'),
        gallery: [],
        vaccinated: false,
        spayed_neutered: false,
        good_with_kids: false,
        good_with_pets: false,
      },
    ],
  },
];

const seed = async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  try {
    await pool.query('BEGIN');

    for (const entry of dataset) {
      const s = entry.shelter;
      const shelterRes = await pool.query(
        `INSERT INTO shelters (name, location, address, phone, email, operating_hours, description, image_url, latitude, longitude)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           location = EXCLUDED.location,
           address = EXCLUDED.address,
           phone = EXCLUDED.phone,
           operating_hours = EXCLUDED.operating_hours,
           description = EXCLUDED.description,
           image_url = EXCLUDED.image_url,
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [
          s.name, s.location, s.address, s.phone, s.email,
          s.operating_hours, s.description, s.image_url, s.latitude, s.longitude,
        ],
      );
      const shelterId = shelterRes.rows[0].id;

      const a = entry.admin;
      const userRes = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, shelter_id, account_status, is_owner)
         VALUES ($1,$2,$3,'shelter_staff',$4,'approved',true)
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           password_hash = EXCLUDED.password_hash,
           role = 'shelter_staff',
           shelter_id = EXCLUDED.shelter_id,
           account_status = 'approved',
           is_owner = true,
           updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [a.name, a.email, passwordHash, shelterId],
      );

      let petsAdded = 0;
      for (const p of entry.pets) {
        const existing = await pool.query(
          'SELECT id FROM pets WHERE shelter_id = $1 AND name = $2 LIMIT 1',
          [shelterId, p.name],
        );
        if (existing.rowCount > 0) continue;

        await pool.query(
          `INSERT INTO pets (name, species, breed, birthdate, age_group, size, gender, temperament,
            shelter_id, visibility, description, medical_history, behavioral_notes, status,
            image_url, gallery, vaccinated, spayed_neutered, good_with_kids, good_with_pets)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
          [
            p.name, p.species, p.breed, p.birthdate, p.age_group, p.size, p.gender, p.temperament,
            shelterId, p.visibility, p.description, p.medical_history, p.behavioral_notes, p.status,
            p.image_url, p.gallery, p.vaccinated, p.spayed_neutered, p.good_with_kids, p.good_with_pets,
          ],
        );
        petsAdded += 1;
      }

      // eslint-disable-next-line no-console
      console.log(
        `Shelter: ${s.name} (${shelterId})\n  Admin: ${a.name} <${a.email}> (${userRes.rows[0].id})\n  Pets added: ${petsAdded}\n`,
      );
    }

    await pool.query('COMMIT');
    // eslint-disable-next-line no-console
    console.log(`Done. Both shelter admins use the password: ${PASSWORD}`);
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  } finally {
    await pool.end();
  }
};

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
