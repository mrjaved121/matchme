// Targeted photo fix for the 40-profile Pakistani+Indian seed batch
// (backend/supabase/seed_pk_in.sql) — the earlier generic backfill gave
// these profiles round-robin xsgames.co avatars with no ethnicity
// matching. Swaps just this batch to real, individually-reviewed Unsplash
// photos of South Asian women (Unsplash License, free for commercial use;
// each one checked by eye — several initial search-result candidates were
// rejected for showing what looked like a minor, an elderly woman, an
// obscured/veiled face, or sunglasses, none of which suit a dating profile).
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  const envPath = path.resolve(process.cwd(), '.env');
  const envFile = fs.readFileSync(envPath, 'utf8');
  const line = envFile.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL='));
  if (line) connectionString = line.replace('DATABASE_URL=', '').trim();
}
if (!connectionString) {
  console.error('No DATABASE_URL in environment or backend/.env');
  process.exit(1);
}

const SEED_SQL_PATH = path.resolve(process.cwd(), 'supabase/seed_pk_in.sql');

// Photo IDs verified by eye: adult woman, face clearly visible, appropriate
// for a dating profile.
const PHOTO_IDS = [
  '1631005436794-ccaa79de61ba',
  '1607189200597-4d0923ef98c6',
  '1734865812496-b2fe2e1a56ca',
  '1618559850638-2aed8a8e8cdc',
  '1739429942851-9083ee185d3d',
  '1619002117199-47c7f0427d21',
  '1558377235-76f53857000b',
];

function photoUrlFor(index) {
  const id = PHOTO_IDS[index % PHOTO_IDS.length];
  return `https://images.unsplash.com/photo-${id}?w=800&h=1000&fit=crop&q=80`;
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    const sql = fs.readFileSync(SEED_SQL_PATH, 'utf8');
    const ids = [...new Set(sql.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g))].filter(
      (id) => id !== '00000000-0000-0000-0000-000000000000',
    );
    console.log(`Seed profile IDs found: ${ids.length}`);

    await client.connect();

    const { rows } = await client.query(
      `select pp.id, pp.profile_id from public.profile_photos pp where pp.profile_id = any($1::uuid[])`,
      [ids],
    );
    console.log(`Matching profile_photos rows: ${rows.length}`);

    for (let i = 0; i < rows.length; i++) {
      await client.query(`update public.profile_photos set storage_path = $1 where id = $2`, [photoUrlFor(i), rows[i].id]);
    }

    console.log(`Updated ${rows.length} rows with ethnicity-matched photos.`);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message || err);
    process.exit(1);
  }
})();
