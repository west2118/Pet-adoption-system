import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';

dotenv.config();

const img = (seed) => `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=800&q=80`;

const shelters = [
  {
    name: 'Happy Tails Rescue',
    location: 'Manila',
    address: '123 Bayani St, Quezon City, Manila',
    phone: '+63 2 8555 0101',
    email: 'hello@happytails.ph',
    operating_hours: 'Mon-Sat, 9:00 AM - 6:00 PM',
    description: 'Non-profit rescue focused on rehabilitating stray dogs and cats across Metro Manila.',
    image_url: img('photo-1548199973-03cce0bbc87b'),
  },
  {
    name: 'Second Chance Shelter',
    location: 'Cebu',
    address: '45 Mango Ave, Cebu City',
    phone: '+63 32 555 0142',
    email: 'adopt@secondchance.ph',
    operating_hours: 'Tue-Sun, 10:00 AM - 5:00 PM',
    description: 'Cebu-based shelter specializing in senior pets and special-needs adoptions.',
    image_url: img('photo-1450778869180-41d0601e046e'),
  },
];

const seed = async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query('BEGIN');

    await pool.query('DELETE FROM favorites');
    await pool.query('DELETE FROM inquiries');
    await pool.query('DELETE FROM application_history');
    await pool.query('DELETE FROM adoption_applications');
    await pool.query('DELETE FROM pets');
    await pool.query('DELETE FROM users');
    await pool.query('DELETE FROM shelters');

    const shelterIds = [];
    for (const s of shelters) {
      const r = await pool.query(
        `INSERT INTO shelters (name, location, address, phone, email, operating_hours, description, image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [s.name, s.location, s.address, s.phone, s.email, s.operating_hours, s.description, s.image_url],
      );
      shelterIds.push(r.rows[0].id);
    }

    const passwordHash = await bcrypt.hash('password123', 10);
    const adminRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,'platform_admin') RETURNING id`,
      ['Platform Admin', 'admin@pawsandhomes.ph', passwordHash],
    );
    const staffRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, shelter_id) VALUES ($1,$2,$3,'shelter_staff',$4) RETURNING id`,
      ['Maria Santos', 'staff@happytails.ph', passwordHash, shelterIds[0]],
    );
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,'adopter')`,
      ['Juan Dela Cruz', 'juan@example.com', passwordHash],
    );

    const pets = [
      {
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        age_years: 2,
        age_group: 'young',
        size: 'large',
        gender: 'male',
        temperament: ['Friendly', 'Playful', 'Loyal'],
        shelter_id: shelterIds[0],
        visibility: 'public',
        description: 'Buddy is a cheerful Golden Retriever who loves fetch, swimming, and cuddles.',
        medical_history: ['Fully vaccinated', 'Dewormed'],
        behavioral_notes: 'Great with kids and other dogs. House-trained.',
        status: 'Available',
        image_url: img('photo-1552053831-71594a27632d'),
        gallery: [img('photo-1552053831-71594a27632d')],
        vaccinated: true,
        spayed_neutered: true,
        good_with_kids: true,
        good_with_pets: true,
      },
      {
        name: 'Mittens',
        species: 'cat',
        breed: 'Siamese',
        age_years: 1,
        age_group: 'young',
        size: 'small',
        gender: 'female',
        temperament: ['Calm', 'Affectionate'],
        shelter_id: shelterIds[1],
        visibility: 'public',
        description: 'Mittens is a gentle Siamese cat looking for a quiet, loving indoor home.',
        medical_history: ['Vaccinated'],
        behavioral_notes: 'Litter-trained. Shy at first.',
        status: 'Available',
        image_url: img('photo-1514888286974-6c03e2ca1dba'),
        gallery: [],
        vaccinated: true,
        spayed_neutered: true,
        good_with_kids: false,
        good_with_pets: true,
      },
      {
        name: 'Rocky (Private)',
        species: 'dog',
        breed: 'Aspins',
        age_years: 3,
        age_group: 'adult',
        size: 'medium',
        gender: 'male',
        temperament: ['Recovering'],
        shelter_id: shelterIds[0],
        visibility: 'private',
        description: 'Rocky is under medical treatment and kept in internal inventory for now.',
        medical_history: ['Under treatment'],
        behavioral_notes: 'Not yet ready for public listing.',
        status: 'Fostered',
        image_url: img('photo-1587300003388-59208cc962cb'),
        gallery: [],
        vaccinated: false,
        spayed_neutered: false,
        good_with_kids: false,
        good_with_pets: false,
      },
    ];

    for (const p of pets) {
      await pool.query(
        `INSERT INTO pets (name, species, breed, age_years, age_group, size, gender, temperament,
          shelter_id, visibility, description, medical_history, behavioral_notes, status,
          image_url, gallery, vaccinated, spayed_neutered, good_with_kids, good_with_pets)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [
          p.name, p.species, p.breed, p.age_years, p.age_group, p.size, p.gender, p.temperament,
          p.shelter_id, p.visibility, p.description, p.medical_history, p.behavioral_notes, p.status,
          p.image_url, p.gallery, p.vaccinated, p.spayed_neutered, p.good_with_kids, p.good_with_pets,
        ],
      );
    }

    // eslint-disable-next-line no-console
    console.log(`Seeded ${shelters.length} shelters, 3 users, 3 pets.`);
    // eslint-disable-next-line no-console
    console.log(`Admin: admin@pawsconnect.ph / password123 (id ${adminRes.rows[0].id})`);
    // eslint-disable-next-line no-console
    console.log(`Staff: staff@happytails.ph / password123 (id ${staffRes.rows[0].id})`);
    await pool.query('COMMIT');
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
