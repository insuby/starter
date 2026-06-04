import pg from 'pg';
import type { Blank, Operation, OrgUnit, User, Citizen } from '../domain.js';
import { SIGNATURE_REQUIRED_TYPES } from '../domain.js';
import { planOperation, planApproval } from '../operations.js';
import type { ManualOperationType } from '../operations.js';
import type {
  AuditEntry,
  AuditInput,
  AuditListFilters,
  BlankListFilters,
  CreateOperationInput,
  CreateOperationResult,
  DistributeInput,
  DistributeResult,
  OperationListFilters,
  ReceiptInput,
  ReceiptResult,
  RejectOperationInput,
  RejectOperationResult,
  Repository,
  SignOperationInput,
  SignOperationResult,
} from './types.js';

const iso = (v: unknown): string => (v instanceof Date ? v.toISOString() : String(v));

const mapBlank = (r: Record<string, unknown>): Blank => ({
  id: String(r.id),
  number: String(r.number),
  type: r.type as Blank['type'],
  status: r.status as Blank['status'],
  place: r.place as Blank['place'],
  location_label: String(r.location_label ?? ''),
  vkmo_id: String(r.vkmo_id),
  owner_id: (r.owner_id as string | null) ?? null,
  created_at: iso(r.created_at),
  updated_at: iso(r.updated_at),
});

const mapOperation = (r: Record<string, unknown>): Operation => ({
  id: String(r.id),
  blank_id: String(r.blank_id),
  type: r.type as Operation['type'],
  status: r.status as Operation['status'],
  reason: String(r.reason ?? ''),
  from_location: (r.from_location as string | null) ?? null,
  to_location: (r.to_location as string | null) ?? null,
  owner_id: (r.owner_id as string | null) ?? null,
  operator_id: String(r.operator_id),
  commissioner_id: (r.commissioner_id as string | null) ?? null,
  commissioner_signature: (r.commissioner_signature as string | null) ?? null,
  old_blank_id: (r.old_blank_id as string | null) ?? null,
  new_blank_id: (r.new_blank_id as string | null) ?? null,
  comment: (r.comment as string | null) ?? null,
  operator_comment: (r.operator_comment as string | null) ?? null,
  created_at: iso(r.created_at),
  approved_at: r.approved_at ? iso(r.approved_at) : null,
});

export class PostgresRepository implements Repository {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString });
  }

  async ready(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async orgUnits(): Promise<OrgUnit[]> {
    const { rows } = await this.pool.query('SELECT * FROM org_units');
    return rows.map((r) => ({
      id: String(r.id),
      parent_id: (r.parent_id as string | null) ?? null,
      level: r.level,
      name: String(r.name),
      is_active: Boolean(r.is_active),
    }));
  }

  async users(): Promise<User[]> {
    const { rows } = await this.pool.query('SELECT * FROM users');
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      role: r.role,
      org_unit_id: (r.org_unit_id as string | null) ?? null,
      vkmo_id: (r.vkmo_id as string | null) ?? null,
      is_active: Boolean(r.is_active),
    }));
  }

  async citizens(): Promise<Citizen[]> {
    const { rows } = await this.pool.query('SELECT * FROM citizens');
    return rows.map((r) => ({ id: String(r.id), full_name: String(r.full_name), snils: (r.snils as string | null) ?? null }));
  }

  async blanksProjection(): Promise<Blank[]> {
    const { rows } = await this.pool.query('SELECT * FROM blanks');
    return rows.map(mapBlank);
  }

  async getBlank(id: string): Promise<Blank | null> {
    try {
      const { rows } = await this.pool.query('SELECT * FROM blanks WHERE id = $1', [id]);
      return rows[0] ? mapBlank(rows[0]) : null;
    } catch (err) {
      // Неверный синтаксис UUID (22P02) трактуем как «не найдено».
      if ((err as { code?: string }).code === '22P02') return null;
      throw err;
    }
  }

  async listBlanks(f: BlankListFilters): Promise<{ rows: Blank[]; total: number }> {
    const where: string[] = [];
    const params: unknown[] = [];
    const add = (clause: string, value: unknown) => {
      params.push(value);
      where.push(clause.replace('?', `$${params.length}`));
    };
    if (f.vkmo_id) add('vkmo_id = ?', f.vkmo_id);
    if (f.status) add('status = ?', f.status);
    if (f.type) add('type = ?', f.type);
    if (f.place) add('place = ?', f.place);
    if (f.search) {
      params.push(`%${f.search}%`);
      const p1 = `$${params.length}`;
      where.push(
        `(number ILIKE ${p1} OR owner_id IN (SELECT id FROM citizens WHERE full_name ILIKE ${p1}))`,
      );
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countRes = await this.pool.query(`SELECT count(*)::int AS c FROM blanks ${whereSql}`, params);
    const total = countRes.rows[0]?.c ?? 0;

    const limit = f.per_page;
    const offset = (f.page - 1) * f.per_page;
    const pageParams = [...params, limit, offset];
    const dataRes = await this.pool.query(
      `SELECT * FROM blanks ${whereSql} ORDER BY number LIMIT $${pageParams.length - 1} OFFSET $${pageParams.length}`,
      pageParams,
    );
    return { rows: dataRes.rows.map(mapBlank), total };
  }

  async listOperations(f: OperationListFilters): Promise<Operation[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    const add = (clause: string, value: unknown) => {
      params.push(value);
      where.push(clause.replace('?', `$${params.length}`));
    };
    if (f.blank_id) add('o.blank_id = ?', f.blank_id);
    if (f.status) add('o.status = ?', f.status);
    if (f.type) add('o.type = ?', f.type);
    if (f.vkmo_id) add('b.vkmo_id = ?', f.vkmo_id);
    if (f.date_from) add('o.created_at >= ?', f.date_from);
    if (f.date_to) add('o.created_at <= ?', f.date_to);
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const { rows } = await this.pool.query(
      `SELECT o.* FROM operations o JOIN blanks b ON b.id = o.blank_id ${whereSql} ORDER BY o.created_at DESC`,
      params,
    );
    return rows.map(mapOperation);
  }

  async getOperation(id: string): Promise<Operation | null> {
    try {
      const { rows } = await this.pool.query('SELECT * FROM operations WHERE id = $1', [id]);
      return rows[0] ? mapOperation(rows[0]) : null;
    } catch (err) {
      if ((err as { code?: string }).code === '22P02') return null;
      throw err;
    }
  }

  async pendingSignatures(vkmoId?: string): Promise<Operation[]> {
    const types = Array.from(SIGNATURE_REQUIRED_TYPES);
    const params: unknown[] = [types];
    let vkmoClause = '';
    if (vkmoId) {
      params.push(vkmoId);
      vkmoClause = ` AND b.vkmo_id = $${params.length}`;
    }
    const { rows } = await this.pool.query(
      `SELECT o.* FROM operations o JOIN blanks b ON b.id = o.blank_id
       WHERE o.status = 'pending' AND o.type = ANY($1::operation_type[])${vkmoClause}
       ORDER BY o.created_at DESC`,
      params,
    );
    return rows.map(mapOperation);
  }

  async createReceipt(input: ReceiptInput): Promise<ReceiptResult> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const receiptRes = await client.query(
        `INSERT INTO blank_series_receipts (range_from, range_to, series_letters, total_count, org_unit_id, operator_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          input.numbers[0],
          input.numbers[input.numbers.length - 1],
          input.numbers[0]?.slice(0, 2) ?? '',
          input.numbers.length,
          input.org_unit_id,
          input.operator_id,
        ],
      );
      const receiptId = String(receiptRes.rows[0].id);

      const created: Blank[] = [];
      const skipped: string[] = [];
      for (const number of input.numbers) {
        // ON CONFLICT по уникальному номеру — дубликаты пропускаем.
        const ins = await client.query(
          `INSERT INTO blanks (number, type, status, place, location_label, vkmo_id)
           VALUES ($1, $2, 'in_circulation', $3, $4, $5)
           ON CONFLICT (number) DO NOTHING
           RETURNING *`,
          [number, input.type, input.place, input.location_label, input.org_unit_id],
        );
        if (ins.rows.length === 0) {
          skipped.push(number);
          continue;
        }
        const blank = mapBlank(ins.rows[0]);
        created.push(blank);
        await client.query(
          `INSERT INTO operations (blank_id, type, status, reason, from_location, to_location, operator_id, approved_at)
           VALUES ($1, 'receipt', 'approved', $2, 'Типография', $3, $4, now())`,
          [blank.id, input.reason, input.location_label, input.operator_id],
        );
      }

      await client.query(
        `INSERT INTO blank_series_receipt_lines (receipt_id, blank_type, quantity) VALUES ($1, $2, $3)`,
        [receiptId, input.type, created.length],
      );

      await client.query('COMMIT');
      return { receipt_id: receiptId, created, skipped };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async distribute(input: DistributeInput): Promise<DistributeResult> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Кандидаты блокируются FOR UPDATE — защита от гонок при параллельном распределении.
      const params: unknown[] = [input.from_org_unit_id, input.from_place];
      let typeClause = '';
      if (input.type) {
        params.push(input.type);
        typeClause = ` AND type = $${params.length}`;
      }
      const { rows } = await client.query(
        `SELECT * FROM blanks
         WHERE vkmo_id = $1 AND status = 'in_circulation' AND place = $2${typeClause}
         ORDER BY number FOR UPDATE`,
        params,
      );
      const candidates = rows.map(mapBlank);

      let chosen: Blank[];
      if (input.blank_ids && input.blank_ids.length > 0) {
        const byId = new Map(candidates.map((b) => [b.id, b]));
        const missing = input.blank_ids.filter((id) => !byId.has(id));
        if (missing.length > 0) {
          await client.query('ROLLBACK');
          return { ok: false, error: `Бланки недоступны для распределения: ${missing.join(', ')}` };
        }
        chosen = input.blank_ids.map((id) => byId.get(id)!);
      } else {
        const count = input.count ?? 0;
        if (count <= 0) {
          await client.query('ROLLBACK');
          return { ok: false, error: 'Укажите count или blank_ids' };
        }
        if (candidates.length < count) {
          await client.query('ROLLBACK');
          return { ok: false, error: 'Недостаточно бланков для распределения', available: candidates.length };
        }
        chosen = candidates.slice(0, count);
      }

      const moved: Blank[] = [];
      for (const blank of chosen) {
        const upd = await client.query(
          `UPDATE blanks SET vkmo_id = $1, place = $2, location_label = $3 WHERE id = $4 RETURNING *`,
          [input.to_org_unit_id, input.to_place, input.to_name, blank.id],
        );
        moved.push(mapBlank(upd.rows[0]));
        await client.query(
          `INSERT INTO operations (blank_id, type, status, reason, from_location, to_location, operator_id, approved_at)
           VALUES ($1, 'transfer', 'approved', $2, $3, $4, $5, now())`,
          [blank.id, input.reason, input.from_name, input.to_name, input.operator_id],
        );
      }

      await client.query('COMMIT');
      return { ok: true, moved };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async createOperation(input: CreateOperationInput): Promise<CreateOperationResult> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // Блокируем бланк на время операции.
      const blankRes = await client.query('SELECT * FROM blanks WHERE id = $1 FOR UPDATE', [input.blank_id]);
      if (blankRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return { ok: false, code: 404, error: 'Бланк не найден' };
      }
      const blank = mapBlank(blankRes.rows[0]);

      const ownerId = input.owner_id ?? blank.owner_id ?? null;
      const planned = planOperation(blank, input.type, ownerId, input.holder_place);
      if (!planned.ok) {
        await client.query('ROLLBACK');
        return { ok: false, code: 400, error: planned.error };
      }
      const { plan } = planned;

      const opRes = await client.query(
        `INSERT INTO operations
           (blank_id, type, status, reason, from_location, to_location, owner_id, operator_id, old_blank_id, comment, operator_comment, approved_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, ${plan.status === 'approved' ? 'now()' : 'NULL'})
         RETURNING *`,
        [
          blank.id,
          input.type,
          plan.status,
          input.reason,
          blank.location_label,
          plan.toLocation,
          ownerId,
          input.operator_id,
          input.type === 'replacement' ? blank.id : null,
          input.comment ?? null,
          input.operator_comment ?? null,
        ],
      );
      const operation = mapOperation(opRes.rows[0]);

      let resultBlank = blank;
      if (plan.blankPatch) {
        const sets: string[] = [];
        const params: unknown[] = [];
        const add = (col: string, val: unknown) => {
          params.push(val);
          sets.push(`${col} = $${params.length}`);
        };
        if (plan.blankPatch.status !== undefined) add('status', plan.blankPatch.status);
        if (plan.blankPatch.place !== undefined) add('place', plan.blankPatch.place);
        if (plan.blankPatch.owner_id !== undefined) add('owner_id', plan.blankPatch.owner_id);
        params.push(blank.id);
        const upd = await client.query(`UPDATE blanks SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
        resultBlank = mapBlank(upd.rows[0]);
      }

      await client.query('COMMIT');
      return { ok: true, operation, blank: resultBlank };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async listAudit(f: AuditListFilters): Promise<{ rows: AuditEntry[]; total: number }> {
    const where: string[] = [];
    const params: unknown[] = [];
    const add = (clause: string, value: unknown) => {
      params.push(value);
      where.push(clause.replace('?', `$${params.length}`));
    };
    if (f.category) add('category = ?', f.category);
    if (f.user_id) add('user_id = ?', f.user_id);
    if (f.date_from) add('at >= ?', f.date_from);
    if (f.date_to) add('at <= ?', f.date_to);
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countRes = await this.pool.query(`SELECT count(*)::int AS c FROM audit_log ${whereSql}`, params);
    const total = countRes.rows[0]?.c ?? 0;

    const pageParams = [...params, f.per_page, (f.page - 1) * f.per_page];
    const dataRes = await this.pool.query(
      `SELECT * FROM audit_log ${whereSql} ORDER BY at DESC, id DESC LIMIT $${pageParams.length - 1} OFFSET $${pageParams.length}`,
      pageParams,
    );
    const rows: AuditEntry[] = dataRes.rows.map((r) => ({
      id: String(r.id),
      at: iso(r.at),
      user_id: (r.user_id as string | null) ?? null,
      user_name: (r.user_name as string | null) ?? null,
      role: (r.role as AuditEntry['role']) ?? null,
      category: String(r.category),
      action: String(r.action),
      target: (r.target as string | null) ?? null,
      details: (r.details as string | null) ?? null,
      payload: r.payload ?? null,
    }));
    return { rows, total };
  }

  async signOperation(input: SignOperationInput): Promise<SignOperationResult> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      let opRow;
      try {
        const res = await client.query('SELECT * FROM operations WHERE id = $1 FOR UPDATE', [input.operation_id]);
        opRow = res.rows[0];
      } catch (err) {
        if ((err as { code?: string }).code === '22P02') {
          await client.query('ROLLBACK');
          return { ok: false, code: 404, error: 'Операция не найдена' };
        }
        throw err;
      }
      if (!opRow) {
        await client.query('ROLLBACK');
        return { ok: false, code: 404, error: 'Операция не найдена' };
      }
      const op = mapOperation(opRow);
      if (op.status !== 'pending') {
        await client.query('ROLLBACK');
        return { ok: false, code: 409, error: 'Операция уже обработана' };
      }
      if (!SIGNATURE_REQUIRED_TYPES.has(op.type)) {
        await client.query('ROLLBACK');
        return { ok: false, code: 400, error: 'Операция не требует подписи комиссара' };
      }

      const blankRes = await client.query('SELECT * FROM blanks WHERE id = $1 FOR UPDATE', [op.blank_id]);
      if (blankRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return { ok: false, code: 404, error: 'Бланк не найден' };
      }

      const updOpRes = await client.query(
        `UPDATE operations SET status = 'approved', commissioner_id = $2, commissioner_signature = $3, approved_at = now()
         WHERE id = $1 RETURNING *`,
        [op.id, input.commissioner_id, input.commissioner_signature],
      );
      const operation = mapOperation(updOpRes.rows[0]);

      const patch = planApproval(op.type as ManualOperationType, op.owner_id, input.holder_place);
      const sets: string[] = [];
      const params: unknown[] = [];
      const add = (col: string, val: unknown) => {
        params.push(val);
        sets.push(`${col} = $${params.length}`);
      };
      if (patch.status !== undefined) add('status', patch.status);
      if (patch.place !== undefined) add('place', patch.place);
      if (patch.owner_id !== undefined) add('owner_id', patch.owner_id);
      let blank = mapBlank(blankRes.rows[0]);
      if (sets.length > 0) {
        params.push(op.blank_id);
        const updBlank = await client.query(
          `UPDATE blanks SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
          params,
        );
        blank = mapBlank(updBlank.rows[0]);
      }

      await client.query('COMMIT');
      return { ok: true, operation, blank };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async rejectOperation(input: RejectOperationInput): Promise<RejectOperationResult> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      let opRow;
      try {
        const res = await client.query('SELECT * FROM operations WHERE id = $1 FOR UPDATE', [input.operation_id]);
        opRow = res.rows[0];
      } catch (err) {
        if ((err as { code?: string }).code === '22P02') {
          await client.query('ROLLBACK');
          return { ok: false, code: 404, error: 'Операция не найдена' };
        }
        throw err;
      }
      if (!opRow) {
        await client.query('ROLLBACK');
        return { ok: false, code: 404, error: 'Операция не найдена' };
      }
      if (mapOperation(opRow).status !== 'pending') {
        await client.query('ROLLBACK');
        return { ok: false, code: 409, error: 'Операция уже обработана' };
      }
      const upd = await client.query(
        `UPDATE operations SET status = 'rejected', commissioner_id = $2, comment = COALESCE($3, comment)
         WHERE id = $1 RETURNING *`,
        [input.operation_id, input.commissioner_id, input.reason ?? null],
      );
      await client.query('COMMIT');
      return { ok: true, operation: mapOperation(upd.rows[0]) };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async appendAudit(entry: AuditInput): Promise<void> {
    await this.pool.query(
      `INSERT INTO audit_log (user_id, user_name, role, category, action, target, details, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entry.user_id,
        entry.user_name,
        entry.role,
        entry.category,
        entry.action,
        entry.target ?? null,
        entry.details ?? null,
        entry.payload === undefined ? null : JSON.stringify(entry.payload),
      ],
    );
  }
}
