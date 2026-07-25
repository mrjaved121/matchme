import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  // Try loading from backend/.env
  const envPath = path.resolve(process.cwd(), 'backend', '.env');
  try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const line = envFile.split(/\r?\n/).find(l => l.startsWith('DATABASE_URL='));
    if (line) connectionString = line.replace('DATABASE_URL=', '').trim();
  } catch (e) {
    // ignore
  }
}

if (!connectionString) {
  console.error('No DATABASE_URL in environment or backend/.env');
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    await client.connect();
    const res = await client.query('SELECT now() as now');
    console.log('Connected successfully. Server time:', res.rows[0].now);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err.message || err);
    process.exit(1);
  }
})();
