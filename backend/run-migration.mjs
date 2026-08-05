import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node run-migration.mjs <path-to-sql-file>');
  process.exit(1);
}

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

const sql = fs.readFileSync(migrationFile, 'utf8');
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    await client.connect();
    await client.query(sql);
    console.log('Migration applied successfully:', migrationFile);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exit(1);
  }
})();
