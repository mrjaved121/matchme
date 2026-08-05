// One-off data backfill: most demo/seed profiles have zero rows in
// profile_photos, so their Discover/Matches cards fall back to a plain
// letter-avatar placeholder. Gives each photo-less profile a real portrait
// photo from randomuser.me (a public API purpose-built for exactly this —
// realistic demo/placeholder headshots, gender-matched, no licensing
// concerns since these are fake test users, not the real app's marketing
// imagery). Requires the passthrough added to lib/photoUrl.ts so these full
// URLs aren't mistaken for a Supabase Storage path.
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

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

function photoUrlFor(gender, index) {
  const pool = gender === 'male' ? 'men' : 'women';
  const n = index % 100;
  return `https://randomuser.me/api/portraits/${pool}/${n}.jpg`;
}

(async () => {
  try {
    await client.connect();

    const { rows: missing } = await client.query(`
      select p.id, p.gender
      from public.profiles p
      left join public.profile_photos pp on pp.profile_id = p.id
      where pp.id is null
      order by p.created_at
    `);

    console.log(`Profiles missing photos: ${missing.length}`);

    let maleIdx = 0;
    let femaleIdx = 0;
    let inserted = 0;

    for (const profile of missing) {
      const isMale = profile.gender === 'male';
      const index = isMale ? maleIdx++ : femaleIdx++;
      const url = photoUrlFor(isMale ? 'male' : 'female', index);

      await client.query(
        `insert into public.profile_photos (profile_id, storage_path, position) values ($1, $2, 0)`,
        [profile.id, url],
      );
      inserted++;
    }

    console.log(`Inserted ${inserted} photo rows.`);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Backfill failed:', err.message || err);
    process.exit(1);
  }
})();
