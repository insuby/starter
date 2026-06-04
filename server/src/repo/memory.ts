import type { Blank, Operation, OrgUnit, User, Citizen } from '../domain.js';
import { requiresCommissionerSignature, SIGNATURE_REQUIRED_TYPES } from '../domain.js';
import { planOperation, planApproval } from '../operations.js';
import type { ManualOperationType } from '../operations.js';
import * as seed from '../seed-data.js';
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

// In-memory репозиторий, засеянный демо-данными. Подходит для разработки,
// тестов и автономной демонстрации без поднятой PostgreSQL.
export class MemoryRepository implements Repository {
  // Клонируем сид, чтобы запись не мутировала общий модуль seed-data.
  private blanksData: Blank[] = seed.blanks.map((b) => ({ ...b }));
  private operationsData: Operation[] = seed.operations.map((o) => ({ ...o }));
  private blankVkmo = new Map<string, string>(this.blanksData.map((b) => [b.id, b.vkmo_id]));
  private numbers = new Set<string>(this.blanksData.map((b) => b.number));
  private auditData: (AuditInput & { id: number; at: string })[] = seed.auditSeed.map((e, i) => ({
    ...e,
    id: i + 1,
  }));
  private seq = 0;

  private nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}_${Date.now().toString(36)}_${this.seq}`;
  }

  async ready(): Promise<void> {}
  async close(): Promise<void> {}

  async orgUnits(): Promise<OrgUnit[]> {
    return seed.orgUnits;
  }
  async users(): Promise<User[]> {
    return seed.users;
  }
  async citizens(): Promise<Citizen[]> {
    return seed.citizens;
  }

  async blanksProjection(): Promise<Blank[]> {
    return this.blanksData;
  }

  async getBlank(id: string): Promise<Blank | null> {
    return this.blanksData.find((b) => b.id === id) ?? null;
  }

  async listBlanks(f: BlankListFilters): Promise<{ rows: Blank[]; total: number }> {
    const ownerName = new Map(seed.citizens.map((c) => [c.id, c.full_name.toLowerCase()]));
    const search = f.search?.trim().toLowerCase();
    const filtered = this.blanksData.filter((b) => {
      if (f.vkmo_id && b.vkmo_id !== f.vkmo_id) return false;
      if (f.status && b.status !== f.status) return false;
      if (f.type && b.type !== f.type) return false;
      if (f.place && b.place !== f.place) return false;
      if (search) {
        const inNumber = b.number.toLowerCase().includes(search);
        const inOwner = b.owner_id ? (ownerName.get(b.owner_id) ?? '').includes(search) : false;
        if (!inNumber && !inOwner) return false;
      }
      return true;
    });
    const total = filtered.length;
    const start = (f.page - 1) * f.per_page;
    const rows = filtered.slice(start, start + f.per_page);
    return { rows, total };
  }

  async listOperations(f: OperationListFilters): Promise<Operation[]> {
    return this.operationsData
      .filter((o) => {
        if (f.blank_id && o.blank_id !== f.blank_id) return false;
        if (f.status && o.status !== f.status) return false;
        if (f.type && o.type !== f.type) return false;
        if (f.vkmo_id && this.blankVkmo.get(o.blank_id) !== f.vkmo_id) return false;
        if (f.date_from && o.created_at < f.date_from) return false;
        if (f.date_to && o.created_at > f.date_to) return false;
        return true;
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async getOperation(id: string): Promise<Operation | null> {
    return this.operationsData.find((o) => o.id === id) ?? null;
  }

  async pendingSignatures(vkmoId?: string): Promise<Operation[]> {
    return this.operationsData
      .filter((o) => requiresCommissionerSignature(o))
      .filter((o) => !vkmoId || this.blankVkmo.get(o.blank_id) === vkmoId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async listAudit(f: AuditListFilters): Promise<{ rows: AuditEntry[]; total: number }> {
    const filtered = this.auditData.filter((e) => {
      if (f.category && e.category !== f.category) return false;
      if (f.user_id && e.user_id !== f.user_id) return false;
      if (f.date_from && e.at < f.date_from) return false;
      if (f.date_to && e.at > f.date_to) return false;
      return true;
    });
    const sorted = [...filtered].sort((a, b) => b.at.localeCompare(a.at));
    const total = sorted.length;
    const start = (f.page - 1) * f.per_page;
    const rows: AuditEntry[] = sorted.slice(start, start + f.per_page).map((e) => ({
      id: String(e.id),
      at: e.at,
      user_id: e.user_id,
      user_name: e.user_name,
      role: e.role,
      category: e.category,
      action: e.action,
      target: e.target ?? null,
      details: e.details ?? null,
      payload: e.payload ?? null,
    }));
    return { rows, total };
  }

  async signOperation(input: SignOperationInput): Promise<SignOperationResult> {
    const op = this.operationsData.find((o) => o.id === input.operation_id);
    if (!op) return { ok: false, code: 404, error: 'Операция не найдена' };
    if (op.status !== 'pending') return { ok: false, code: 409, error: 'Операция уже обработана' };
    if (!SIGNATURE_REQUIRED_TYPES.has(op.type)) {
      return { ok: false, code: 400, error: 'Операция не требует подписи комиссара' };
    }
    const blank = this.blanksData.find((b) => b.id === op.blank_id);
    if (!blank) return { ok: false, code: 404, error: 'Бланк не найден' };

    const now = new Date().toISOString();
    op.status = 'approved';
    op.commissioner_id = input.commissioner_id;
    op.commissioner_signature = input.commissioner_signature;
    op.approved_at = now;

    const patch = planApproval(op.type as ManualOperationType, op.owner_id, input.holder_place);
    if (patch.status !== undefined) blank.status = patch.status;
    if (patch.place !== undefined) blank.place = patch.place;
    if (patch.owner_id !== undefined) blank.owner_id = patch.owner_id;
    blank.updated_at = now;

    return { ok: true, operation: { ...op }, blank: { ...blank } };
  }

  async rejectOperation(input: RejectOperationInput): Promise<RejectOperationResult> {
    const op = this.operationsData.find((o) => o.id === input.operation_id);
    if (!op) return { ok: false, code: 404, error: 'Операция не найдена' };
    if (op.status !== 'pending') return { ok: false, code: 409, error: 'Операция уже обработана' };
    op.status = 'rejected';
    op.commissioner_id = input.commissioner_id;
    if (input.reason) op.comment = input.reason;
    return { ok: true, operation: { ...op } };
  }

  async createReceipt(input: ReceiptInput): Promise<ReceiptResult> {
    const now = new Date().toISOString();
    const created: Blank[] = [];
    const skipped: string[] = [];
    const receiptId = this.nextId('rcpt');

    for (const number of input.numbers) {
      if (this.numbers.has(number)) {
        skipped.push(number);
        continue;
      }
      const blank: Blank = {
        id: this.nextId('b'),
        number,
        type: input.type,
        status: 'in_circulation',
        place: input.place,
        location_label: input.location_label,
        vkmo_id: input.org_unit_id,
        owner_id: null,
        created_at: now,
        updated_at: now,
      };
      this.blanksData.push(blank);
      this.numbers.add(number);
      this.blankVkmo.set(blank.id, blank.vkmo_id);
      created.push(blank);

      this.operationsData.push({
        id: this.nextId('op'),
        blank_id: blank.id,
        type: 'receipt',
        status: 'approved',
        reason: input.reason,
        from_location: 'Типография',
        to_location: input.location_label,
        owner_id: null,
        operator_id: input.operator_id,
        commissioner_id: null,
        commissioner_signature: null,
        old_blank_id: null,
        new_blank_id: null,
        comment: null,
        operator_comment: null,
        created_at: now,
        approved_at: now,
      });
    }

    return { receipt_id: receiptId, created, skipped };
  }

  async distribute(input: DistributeInput): Promise<DistributeResult> {
    // Доступны к распределению: в обороте, на месте отправителя, нужного типа.
    const candidates = this.blanksData.filter(
      (b) =>
        b.vkmo_id === input.from_org_unit_id &&
        b.status === 'in_circulation' &&
        b.place === input.from_place &&
        (!input.type || b.type === input.type),
    );

    let chosen: Blank[];
    if (input.blank_ids && input.blank_ids.length > 0) {
      const set = new Set(candidates.map((b) => b.id));
      const missing = input.blank_ids.filter((id) => !set.has(id));
      if (missing.length > 0) {
        return { ok: false, error: `Бланки недоступны для распределения: ${missing.join(', ')}` };
      }
      const byId = new Map(candidates.map((b) => [b.id, b]));
      chosen = input.blank_ids.map((id) => byId.get(id)!);
    } else {
      const count = input.count ?? 0;
      if (count <= 0) return { ok: false, error: 'Укажите count или blank_ids' };
      if (candidates.length < count) {
        return { ok: false, error: 'Недостаточно бланков для распределения', available: candidates.length };
      }
      chosen = [...candidates].sort((a, b) => a.number.localeCompare(b.number)).slice(0, count);
    }

    const now = new Date().toISOString();
    for (const blank of chosen) {
      blank.vkmo_id = input.to_org_unit_id;
      blank.place = input.to_place;
      blank.location_label = input.to_name;
      blank.updated_at = now;
      this.blankVkmo.set(blank.id, blank.vkmo_id);
      this.operationsData.push({
        id: this.nextId('op'),
        blank_id: blank.id,
        type: 'transfer',
        status: 'approved',
        reason: input.reason,
        from_location: input.from_name,
        to_location: input.to_name,
        owner_id: null,
        operator_id: input.operator_id,
        commissioner_id: null,
        commissioner_signature: null,
        old_blank_id: null,
        new_blank_id: null,
        comment: null,
        operator_comment: null,
        created_at: now,
        approved_at: now,
      });
    }

    return { ok: true, moved: chosen };
  }

  async createOperation(input: CreateOperationInput): Promise<CreateOperationResult> {
    const blank = this.blanksData.find((b) => b.id === input.blank_id);
    if (!blank) return { ok: false, code: 404, error: 'Бланк не найден' };

    const ownerId = input.owner_id ?? blank.owner_id ?? null;
    const planned = planOperation(blank, input.type, ownerId, input.holder_place);
    if (!planned.ok) return { ok: false, code: 400, error: planned.error };
    const { plan } = planned;

    const now = new Date().toISOString();
    const operation: Operation = {
      id: this.nextId('op'),
      blank_id: blank.id,
      type: input.type,
      status: plan.status,
      reason: input.reason,
      from_location: blank.location_label,
      to_location: plan.toLocation,
      owner_id: ownerId,
      operator_id: input.operator_id,
      commissioner_id: null,
      commissioner_signature: null,
      old_blank_id: input.type === 'replacement' ? blank.id : null,
      new_blank_id: null,
      comment: input.comment ?? null,
      operator_comment: input.operator_comment ?? null,
      created_at: now,
      approved_at: plan.status === 'approved' ? now : null,
    };
    this.operationsData.push(operation);

    // Немедленно применяем переход состояния только для approved-операций.
    if (plan.blankPatch) {
      if (plan.blankPatch.status !== undefined) blank.status = plan.blankPatch.status;
      if (plan.blankPatch.place !== undefined) blank.place = plan.blankPatch.place;
      if (plan.blankPatch.owner_id !== undefined) blank.owner_id = plan.blankPatch.owner_id;
      blank.updated_at = now;
    }

    return { ok: true, operation, blank: { ...blank } };
  }

  async appendAudit(entry: AuditInput): Promise<void> {
    this.auditData.push({ ...entry, id: this.auditData.length + 1, at: new Date().toISOString() });
  }
}
