import type { Blank, BlankPlace, BlankStatus, BlankType, Citizen, Operation, OperationStatus, OperationType, OrgUnit, User } from '../domain.js';

export interface BlankListFilters {
  page: number;
  per_page: number;
  vkmo_id?: string;
  status?: BlankStatus;
  type?: BlankType;
  place?: BlankPlace;
  search?: string;
}

export interface OperationListFilters {
  blank_id?: string;
  status?: OperationStatus;
  type?: OperationType;
  vkmo_id?: string;
  date_from?: string;
  date_to?: string;
}

// Журнал аудита (2.13) — чтение.
export interface AuditEntry {
  id: string;
  at: string;
  user_id: string | null;
  user_name: string | null;
  role: User['role'] | null;
  category: string;
  action: string;
  target: string | null;
  details: string | null;
  payload: unknown;
}

export interface AuditListFilters {
  category?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  page: number;
  per_page: number;
}

// Подписание/отклонение pending-операции комиссаром (2.7).
export interface SignOperationInput {
  operation_id: string;
  commissioner_id: string;
  commissioner_signature: string;
  // Место узла-держателя бланка (для перехода состояния при сдаче на хранение).
  holder_place: BlankPlace;
}

export type SignOperationResult =
  | { ok: true; operation: Operation; blank: Blank }
  | { ok: false; code: 400 | 404 | 409; error: string };

export interface RejectOperationInput {
  operation_id: string;
  commissioner_id: string;
  reason?: string;
}

export type RejectOperationResult =
  | { ok: true; operation: Operation }
  | { ok: false; code: 400 | 404 | 409; error: string };

// Запись аудита (2.13). Пишется при каждой операции записи.
export interface AuditInput {
  user_id: string | null;
  user_name: string | null;
  role: User['role'] | null;
  category: string;
  action: string;
  target?: string | null;
  details?: string | null;
  payload?: unknown;
}

// Поступление серии бланков от типографии (2.4).
export interface ReceiptInput {
  org_unit_id: string;
  operator_id: string;
  type: BlankType;
  numbers: string[];
  reason: string;
  location_label: string;
  place: BlankPlace;
}

export interface ReceiptResult {
  receipt_id: string;
  created: Blank[];
  skipped: string[];
}

// Распределение бланков на дочерний узел с контролем лимитов (2.5).
export interface DistributeInput {
  from_org_unit_id: string;
  to_org_unit_id: string;
  operator_id: string;
  type?: BlankType;
  count?: number;
  blank_ids?: string[];
  reason: string;
  from_place: BlankPlace;
  to_place: BlankPlace;
  from_name: string;
  to_name: string;
}

export type DistributeResult =
  | { ok: true; moved: Blank[] }
  | { ok: false; error: string; available?: number };

// Регистрация ручной операции с бланком (2.6).
export interface CreateOperationInput {
  blank_id: string;
  type: 'issue' | 'return' | 'replacement' | 'storage' | 'write_off';
  operator_id: string;
  reason: string;
  owner_id?: string | null;
  comment?: string | null;
  operator_comment?: string | null;
  // Место узла-держателя (куда вернётся бланк при возврате).
  holder_place: BlankPlace;
}

export type CreateOperationResult =
  | { ok: true; operation: Operation; blank: Blank }
  | { ok: false; code: 400 | 404; error: string };

export interface Repository {
  ready(): Promise<void>;
  close(): Promise<void>;

  // Справочные таблицы (небольшие) — загружаются целиком.
  orgUnits(): Promise<OrgUnit[]>;
  users(): Promise<User[]>;
  citizens(): Promise<Citizen[]>;

  // Реестр бланков с фильтрами и пагинацией.
  listBlanks(f: BlankListFilters): Promise<{ rows: Blank[]; total: number }>;
  // Карточка одного бланка по id.
  getBlank(id: string): Promise<Blank | null>;
  // Проекция бланков (status/type/vkmo_id) для агрегаций.
  blanksProjection(): Promise<Blank[]>;

  // Операции.
  listOperations(f: OperationListFilters): Promise<Operation[]>;
  getOperation(id: string): Promise<Operation | null>;
  pendingSignatures(vkmoId?: string): Promise<Operation[]>;

  // Журнал аудита (2.13) — чтение с фильтрами и пагинацией.
  listAudit(f: AuditListFilters): Promise<{ rows: AuditEntry[]; total: number }>;

  // --- Запись ---------------------------------------------------------------
  // Поступление серии бланков от типографии (2.4).
  createReceipt(input: ReceiptInput): Promise<ReceiptResult>;
  // Распределение бланков на дочерний узел с контролем лимитов (2.5).
  distribute(input: DistributeInput): Promise<DistributeResult>;
  // Регистрация ручной операции с бланком (2.6).
  createOperation(input: CreateOperationInput): Promise<CreateOperationResult>;
  // Подписание pending-операции комиссаром: применяет отложенный переход бланка (2.7).
  signOperation(input: SignOperationInput): Promise<SignOperationResult>;
  // Отклонение pending-операции комиссаром (бланк не меняется).
  rejectOperation(input: RejectOperationInput): Promise<RejectOperationResult>;
  // Запись в неизменяемый журнал аудита (2.13).
  appendAudit(entry: AuditInput): Promise<void>;
}
