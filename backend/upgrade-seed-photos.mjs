// Second pass on the seed photo backfill. First pass used randomuser.me
// (gender-correct but only 128x128 — visibly blurry stretched across a full
// swipe-card hero). Swapped to pravatar.cc (sharp at 800x800) but its ~70
// image pool isn't gender-split, which showed up immediately as a bearded
// man's photo on a profile named "Elsa". This pass moves to xsgames.co's
// avatar set, which is both gender-split (separate male/female folders,
// 1-78 each) and a real resolution bump over randomuser.me (256x256) —
// the best available balance of "looks like the right person" and "isn't
// blurry" without hand-classifying a mixed-gender pool image by image.
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

const POOL_SIZE = 78;

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

function photoUrlFor(gender, index) {
  const pool = gender === 'male' ? 'male' : 'female';
  const n = (index % POOL_SIZE) + 1;
  return `https://xsgames.co/randomusers/assets/avatars/${pool}/${n}.jpg`;
}

(async () => {
  try {
    await client.connect();

    const { rows } = await client.query(`
      select pp.id, p.gender
      from public.profile_photos pp
      join public.profiles p on p.id = pp.profile_id
      where pp.storage_path like 'https://i.pravatar.cc/%'
         or pp.storage_path like 'https://randomuser.me/%'
      order by pp.profile_id
    `);

    console.log(`Rows to upgrade: ${rows.length}`);

    let maleIdx = 0;
    let femaleIdx = 0;

    for (const row of rows) {
      const isMale = row.gender === 'male';
      const index = isMale ? maleIdx++ : femaleIdx++;
      const url = photoUrlFor(isMale ? 'male' : 'female', index);
      await client.query(`update public.profile_photos set storage_path = $1 where id = $2`, [url, row.id]);
    }

    console.log(`Upgraded ${rows.length} photo rows to gender-matched xsgames avatars.`);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Upgrade failed:', err.message || err);
    process.exit(1);
  }
})();
