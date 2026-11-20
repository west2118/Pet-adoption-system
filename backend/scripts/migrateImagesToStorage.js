/**
 * One-off migration: moves base64 data URLs stored in pets/shelters image
 * columns into Supabase Storage and replaces them with public URLs.
 *
 * Row-by-row and resumable: rows already holding URLs are skipped, so the
 * script can be re-run after a timeout or dropped connection. Large data URLs
 * are slow to read from the database, so progress prints as it goes.
 *
 *   npm run migrate:images
 */
import { pool } from '../src/config/database.js';
import { isStorageConfigured, parseDataUrl, uploadImage } from '../src/services/storageService.js';

const isDataImage = (value) => typeof value === 'string' && value.startsWith('data:image/');

/** Uploads one base64 value, reusing the URL for repeated content. */
const toStoredUrl = async (value, folder, cache) => {
  if (!isDataImage(value)) return value;
  const cached = cache.get(value);
  if (cached) return cached;

  const parsed = parseDataUrl(value);
  if (!parsed) {
    console.warn('  skipped an unreadable data URL');
    return value;
  }
  const url = await uploadImage({ ...parsed, folder });
  cache.set(value, url);
  return url;
};

const migratePets = async (cache) => {
  const { rows: pets } = await pool.query(
    `SELECT id,
            (gallery = ARRAY[image_url]) AS gallery_is_cover
       FROM pets
      WHERE image_url LIKE 'data:image/%'
         OR EXISTS (SELECT 1 FROM unnest(gallery) AS g WHERE g LIKE 'data:image/%')
      ORDER BY length(image_url) ASC`,
  );

  let migrated = 0;
  for (const pet of pets) {
    const started = Date.now();
    // Only read `gallery` when it adds something beyond the cover: it is a
    // full copy of the same base64 string for the common single-photo row.
    const columns = pet.gallery_is_cover ? 'image_url' : 'image_url, gallery';
    const { rows } = await pool.query(`SELECT ${columns} FROM pets WHERE id = $1`, [pet.id]);
    const { image_url: imageUrl, gallery } = rows[0];

    const storedCover = await toStoredUrl(imageUrl, 'pets', cache);

    let storedGallery = gallery ?? [];
    if (pet.gallery_is_cover) {
      storedGallery = [storedCover];
    } else {
      const next = [];
      for (const item of storedGallery) {
        next.push(item === imageUrl ? storedCover : await toStoredUrl(item, 'pets', cache));
      }
      storedGallery = next;
    }

    await pool.query('UPDATE pets SET image_url = $2, gallery = $3 WHERE id = $1', [
      pet.id,
      storedCover,
      storedGallery,
    ]);
    migrated += 1;
    console.log(`pet ${pet.id}: migrated in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  }
  return migrated;
};

const migrateShelters = async (cache) => {
  const { rows: shelters } = await pool.query(
    `SELECT id FROM shelters WHERE image_url LIKE 'data:image/%' ORDER BY length(image_url) ASC`,
  );

  for (const shelter of shelters) {
    const started = Date.now();
    const { rows } = await pool.query('SELECT image_url FROM shelters WHERE id = $1', [shelter.id]);
    const stored = await toStoredUrl(rows[0].image_url, 'shelters', cache);
    await pool.query('UPDATE shelters SET image_url = $2 WHERE id = $1', [shelter.id, stored]);
    console.log(`shelter ${shelter.id}: migrated in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  }
  return shelters.length;
};

const run = async () => {
  if (!isStorageConfigured()) {
    console.error('Storage is not configured. Set SUPABASE_SERVICE_ROLE_KEY first.');
    process.exitCode = 1;
    return;
  }

  const cache = new Map();
  const pets = await migratePets(cache);
  const shelters = await migrateShelters(cache);
  console.log(`Done. ${pets} pet row(s) and ${shelters} shelter logo(s) moved to storage.`);
};

run()
  .catch((error) => {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
