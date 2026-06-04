// Применение схемы БД (db/schema.sql) к PostgreSQL.
// Запуск: DATABASE_URL=postgres://... npm run db:migrate
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL не задан');
    process.exit(1);
  }
  const sql = readFileSync(join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  const pool = new pg.Pool({ connectionString: url });
  try {
    await pool.query(sql);
    console.log('Схема применена.');
  } finally {
    await pool.end();
  }
}

void main();
