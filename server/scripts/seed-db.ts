// Загрузка демо-данных в PostgreSQL.
// Запуск: DATABASE_URL=postgres://... npm run db:seed
// Бланки получают UUID от БД; ссылки операций переотображаются на новые id.
import pg from 'pg';
import * as seed from '../src/seed-data.js';

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL не задан');
    process.exit(1);
  }
  const pool = new pg.Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const u of seed.orgUnits) {
      await client.query(
        `INSERT INTO org_units (id, parent_id, level, name, is_active) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (id) DO NOTHING`,
        [u.id, u.parent_id, u.level, u.name, u.is_active],
      );
    }
    for (const u of seed.users) {
      await client.query(
        `INSERT INTO users (id, name, role, org_unit_id, vkmo_id, is_active) VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO NOTHING`,
        [u.id, u.name, u.role, u.org_unit_id, u.vkmo_id, u.is_active],
      );
    }
    for (const c of seed.citizens) {
      await client.query(
        `INSERT INTO citizens (id, full_name, snils) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING`,
        [c.id, c.full_name, c.snils],
      );
    }

    // Бланки: БД назначает UUID, запоминаем сопоставление демо-id → uuid.
    const idMap = new Map<string, string>();
    for (const b of seed.blanks) {
      const res = await client.query(
        `INSERT INTO blanks (number, type, status, place, location_label, vkmo_id, owner_id, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (number) DO UPDATE SET number = EXCLUDED.number
         RETURNING id`,
        [b.number, b.type, b.status, b.place, b.location_label, b.vkmo_id, b.owner_id, b.created_at, b.updated_at],
      );
      idMap.set(b.id, res.rows[0].id);
    }

    for (const o of seed.operations) {
      const blankId = idMap.get(o.blank_id);
      if (!blankId) continue;
      await client.query(
        `INSERT INTO operations
           (blank_id, type, status, reason, from_location, to_location, owner_id, operator_id,
            commissioner_id, commissioner_signature, old_blank_id, new_blank_id, comment, operator_comment, created_at, approved_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          blankId,
          o.type,
          o.status,
          o.reason,
          o.from_location,
          o.to_location,
          o.owner_id,
          o.operator_id,
          o.commissioner_id,
          o.commissioner_signature,
          o.old_blank_id ? idMap.get(o.old_blank_id) ?? null : null,
          o.new_blank_id ? idMap.get(o.new_blank_id) ?? null : null,
          o.comment,
          o.operator_comment,
          o.created_at,
          o.approved_at,
        ],
      );
    }

    await client.query('COMMIT');
    console.log(`Загружено: org_units=${seed.orgUnits.length}, users=${seed.users.length}, citizens=${seed.citizens.length}, blanks=${seed.blanks.length}, operations=${seed.operations.length}`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

void main();
