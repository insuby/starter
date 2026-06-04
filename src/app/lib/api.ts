// Тонкий клиент серверного API (server/, Fastify, префикс /v1).
// В деве запросы идут на относительный /v1 и проксируются Vite на :3001
// (см. vite.config.ts). База переопределяется через VITE_API_BASE_URL.
import type {
  Blank,
  BlankPlace,
  BlankStatus,
  BlankType,
  Operation,
  OperationType,
  UserRole,
} from '../data/mockData';

const API_BASE: string =
  (import.meta.env?.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/v1';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Ошибка запроса (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* тело не JSON — оставляем стандартное сообщение */
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

async function apiGet<T>(path: string, query?: Query, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), { signal, headers: { Accept: 'application/json' } });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError(0, 'Сервер недоступен. Запущен ли backend (server/) на :3001?');
  }
  return handle<T>(res);
}

async function apiPost<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(buildUrl(path), {
      method: 'POST',
      signal,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError(0, 'Сервер недоступен. Запущен ли backend (server/) на :3001?');
  }
  return handle<T>(res);
}

// --- DTO сервера (см. server/src/presenters.ts, schemas.ts) -----------------

interface ServerOwner {
  id: string;
  full_name: string;
}

interface ServerBlank {
  id: string;
  number: string;
  type: BlankType;
  status: BlankStatus;
  place: BlankPlace;
  location_label: string;
  vkmo_id: string;
  owner: ServerOwner | null;
  created_at: string;
  updated_at: string;
}

interface ServerOperation {
  id: string;
  blank_id: string;
  blank_number: string | null;
  type: OperationType;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  from_location: string | null;
  to_location: string | null;
  owner: ServerOwner | null;
  operator: { id: string; name: string };
  commissioner: { id: string; name: string; signature: string | null } | null;
  comment: string | null;
  operator_comment: string | null;
  old_blank_id: string | null;
  new_blank_id: string | null;
  created_at: string;
  approved_at: string | null;
  // Только в presentPendingSignature:
  requires_commissioner_signature?: boolean;
}

// Операция в терминах фронта + дополнительные серверные поля.
export type ClientOperation = Operation & {
  blank_number?: string | null;
  approved_at?: string | null;
};

// Приводим серверный DTO бланка к типу Blank, на котором построен фронт.
function toBlank(b: ServerBlank): Blank {
  return {
    id: b.id,
    number: b.number,
    type: b.type,
    status: b.status,
    place: b.place,
    location: b.location_label,
    owner_id: b.owner?.id,
    owner_name: b.owner?.full_name,
    vkmo_id: b.vkmo_id,
    created_at: b.created_at,
    updated_at: b.updated_at,
  };
}

// Приводим серверный DTO операции к (расширенному) типу Operation фронта.
function toOperation(o: ServerOperation): ClientOperation {
  return {
    id: o.id,
    blank_id: o.blank_id,
    blank_number: o.blank_number,
    type: o.type,
    status: o.status,
    reason: o.reason,
    from_location: o.from_location ?? undefined,
    to_location: o.to_location ?? undefined,
    owner_id: o.owner?.id,
    owner_name: o.owner?.full_name,
    operator_id: o.operator?.id ?? '',
    operator_name: o.operator?.name ?? o.operator?.id ?? '',
    commissioner_id: o.commissioner?.id,
    commissioner_signature: o.commissioner?.signature ?? undefined,
    comment: o.comment ?? undefined,
    operator_comment: o.operator_comment ?? undefined,
    old_blank_id: o.old_blank_id ?? undefined,
    new_blank_id: o.new_blank_id ?? undefined,
    created_at: o.created_at,
    approved_at: o.approved_at,
  };
}

// --- Дашборд ----------------------------------------------------------------

export interface DashboardSummary {
  total: number;
  in_circulation: number;
  issued: number;
  on_hold: number;
  written_off: number;
  by_type: Record<BlankType, number>;
  operations_pending_signature: number;
}

interface ServerSummaryResponse {
  blanks: {
    total: number;
    in_circulation: number;
    issued: number;
    on_hold: number;
    written_off: number;
    by_type: Record<BlankType, number>;
  };
  operations_pending_signature: number;
}

export async function fetchDashboardSummary(
  scope?: { vkmo_id?: string; org_unit_id?: string },
  signal?: AbortSignal,
): Promise<DashboardSummary> {
  const r = await apiGet<ServerSummaryResponse>('/dashboard/summary', scope, signal);
  return { ...r.blanks, operations_pending_signature: r.operations_pending_signature };
}

// Точка графика в формате, который ожидает recharts на дашборде (ru-ключи).
export interface ChartPoint {
  date: string;
  выдача: number;
  возврат: number;
  списание: number;
}

interface ServerChartResponse {
  series: { date: string; issue: number; return: number; write_off: number }[];
}

const toDayMonth = (ymd: string): string => {
  const [, m, d] = ymd.split('-');
  return d && m ? `${d}.${m}` : ymd;
};

export async function fetchOperationsChart(
  params?: { days?: number; vkmo_id?: string; org_unit_id?: string },
  signal?: AbortSignal,
): Promise<ChartPoint[]> {
  const r = await apiGet<ServerChartResponse>('/dashboard/operations-chart', params, signal);
  return r.series.map((p) => ({
    date: toDayMonth(p.date),
    выдача: p.issue,
    возврат: p.return,
    списание: p.write_off,
  }));
}

// --- Реестр бланков (серверная пагинация) -----------------------------------

export interface BlanksQuery {
  page: number;
  per_page: number;
  status?: BlankStatus;
  type?: BlankType;
  place?: BlankPlace;
  search?: string;
  vkmo_id?: string;
}

export interface BlanksPage {
  data: Blank[];
  total: number;
  page: number;
  per_page: number;
}

interface ServerBlanksResponse {
  data: ServerBlank[];
  meta: { page: number; per_page: number; total: number };
}

export async function fetchBlanks(q: BlanksQuery, signal?: AbortSignal): Promise<BlanksPage> {
  const r = await apiGet<ServerBlanksResponse>('/blanks', q, signal);
  return {
    data: r.data.map(toBlank),
    total: r.meta.total,
    page: r.meta.page,
    per_page: r.meta.per_page,
  };
}

// Загружает ВСЕ бланки по фильтру постранично (для отчётов/инвентаризации).
// Серверный per_page ограничен 200; ходим страницами до исчерпания (с защитным лимитом).
export async function fetchAllBlanks(
  filter: Omit<BlanksQuery, 'page' | 'per_page'> = {},
  signal?: AbortSignal,
  maxPages = 200,
): Promise<Blank[]> {
  const out: Blank[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const r = await fetchBlanks({ ...filter, page, per_page: 200 }, signal);
    out.push(...r.data);
    if (out.length >= r.total || r.data.length === 0) break;
  }
  return out;
}

// --- Карточка бланка --------------------------------------------------------

export interface BlankCard extends Blank {
  type_label: string;
  status_label: string;
  place_label: string;
  vkmo_name: string | null;
  operations: ClientOperation[];
}

interface ServerBlankCard extends ServerBlank {
  type_label: string;
  status_label: string;
  place_label: string;
  vkmo_name: string | null;
  operations: ServerOperation[];
}

export async function fetchBlankCard(id: string, signal?: AbortSignal): Promise<BlankCard> {
  const c = await apiGet<ServerBlankCard>(`/blanks/${encodeURIComponent(id)}`, undefined, signal);
  return {
    ...toBlank(c),
    type_label: c.type_label,
    status_label: c.status_label,
    place_label: c.place_label,
    vkmo_name: c.vkmo_name,
    operations: c.operations.map(toOperation),
  };
}

// --- Операции ---------------------------------------------------------------

export interface OperationsQuery {
  blank_id?: string;
  status?: 'pending' | 'approved' | 'rejected';
  type?: OperationType;
  vkmo_id?: string;
  date_from?: string;
  date_to?: string;
}

interface ServerOperationsResponse {
  data: ServerOperation[];
  meta: { total: number };
}

export async function fetchOperations(
  q: OperationsQuery = {},
  signal?: AbortSignal,
): Promise<ClientOperation[]> {
  const r = await apiGet<ServerOperationsResponse>('/operations', q, signal);
  return r.data.map(toOperation);
}

export async function fetchPendingSignatures(
  vkmo_id?: string,
  signal?: AbortSignal,
): Promise<ClientOperation[]> {
  const r = await apiGet<ServerOperation[]>('/operations/pending-signatures', { vkmo_id }, signal);
  return r.map(toOperation);
}

export interface CreateOperationBody {
  blank_id: string;
  type: 'issue' | 'return' | 'replacement' | 'storage' | 'write_off';
  operator_id: string;
  reason?: string;
  owner_id?: string;
  comment?: string;
  operator_comment?: string;
}

export interface CreateOperationResult {
  operation: ClientOperation;
  blank: Blank;
  requires_signature: boolean;
}

export async function createOperation(
  body: CreateOperationBody,
  signal?: AbortSignal,
): Promise<CreateOperationResult> {
  const r = await apiPost<{ operation: ServerOperation; blank: ServerBlank; requires_signature: boolean }>(
    '/operations',
    body,
    signal,
  );
  return { operation: toOperation(r.operation), blank: toBlank(r.blank), requires_signature: r.requires_signature };
}

export async function signOperation(
  operationId: string,
  body: { commissioner_id: string; signature: string },
  signal?: AbortSignal,
): Promise<{ operation: ClientOperation; blank: Blank }> {
  const r = await apiPost<{ operation: ServerOperation; blank: ServerBlank }>(
    `/operations/${encodeURIComponent(operationId)}/sign`,
    body,
    signal,
  );
  return { operation: toOperation(r.operation), blank: toBlank(r.blank) };
}

export async function rejectOperation(
  operationId: string,
  body: { commissioner_id: string; reason?: string },
  signal?: AbortSignal,
): Promise<{ operation: ClientOperation }> {
  const r = await apiPost<{ operation: ServerOperation }>(
    `/operations/${encodeURIComponent(operationId)}/reject`,
    body,
    signal,
  );
  return { operation: toOperation(r.operation) };
}

// --- Поступление серий / распределение --------------------------------------

export interface ReceiptBody {
  org_unit_id: string;
  operator_id: string;
  type: BlankType;
  reason?: string;
  numbers?: string[];
  series?: { letters: string; from: number; to: number };
}

export interface ReceiptResult {
  receipt_id: string;
  org_unit_id: string;
  type: BlankType;
  created_count: number;
  skipped_count: number;
  range: { from: string; to: string } | null;
  skipped: string[];
}

export async function createReceipt(body: ReceiptBody, signal?: AbortSignal): Promise<ReceiptResult> {
  return apiPost<ReceiptResult>('/receipts', body, signal);
}

export interface TransferBody {
  from_org_unit_id: string;
  to_org_unit_id: string;
  operator_id: string;
  type?: BlankType;
  count?: number;
  blank_ids?: string[];
  reason?: string;
}

export interface TransferResult {
  moved_count: number;
  from_org_unit_id: string;
  to_org_unit_id: string;
  blanks: Blank[];
}

export async function createTransfer(body: TransferBody, signal?: AbortSignal): Promise<TransferResult> {
  const r = await apiPost<{ moved_count: number; from_org_unit_id: string; to_org_unit_id: string; blanks: ServerBlank[] }>(
    '/transfers',
    body,
    signal,
  );
  return { ...r, blanks: r.blanks.map(toBlank) };
}

// --- Справочники: граждане, орг-узлы -----------------------------------------

export interface CitizenDto {
  id: string;
  full_name: string;
  snils: string | null;
}

export async function fetchCitizens(search?: string, signal?: AbortSignal): Promise<CitizenDto[]> {
  const r = await apiGet<{ data: CitizenDto[]; meta: { total: number } }>('/citizens', { search }, signal);
  return r.data;
}

export type OrgLevel = 'center' | 'district' | 'omu' | 'vk_subject' | 'vk_mo';

export interface OrgUnit {
  id: string;
  parent_id: string | null;
  level: OrgLevel;
  name: string;
  is_active: boolean;
}

export async function fetchOrgUnits(signal?: AbortSignal): Promise<OrgUnit[]> {
  const r = await apiGet<{ flat: OrgUnit[]; tree: unknown }>('/org-units', undefined, signal);
  return r.flat;
}

// Прямые дочерние узлы заданного родителя.
export function orgChildren(flat: OrgUnit[], parentId: string): OrgUnit[] {
  return flat.filter((u) => u.parent_id === parentId);
}

// Путь от корня до узла (включительно).
export function orgPath(flat: OrgUnit[], id: string): OrgUnit[] {
  const byId = new Map(flat.map((u) => [u.id, u]));
  const path: OrgUnit[] = [];
  let current = byId.get(id);
  while (current) {
    path.unshift(current);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return path;
}

// --- Инвентаризация оператора (остаток «в обороте» по типам) -----------------

export interface Inventory {
  total: number;
  byType: Record<BlankType, number>;
  // Первый по номеру доступный бланк каждого типа (для выдачи из пула).
  firstByType: Record<BlankType, Blank | null>;
}

const BLANK_TYPE_LIST: BlankType[] = ['military_id', 'certificate', 'credential'];

// Остаток in_circulation по типам для области (vkmo или весь центр).
// Делает по одному дешёвому запросу на тип (per_page=1 даёт total и первый бланк).
export async function fetchInventory(vkmo_id?: string, signal?: AbortSignal): Promise<Inventory> {
  const results = await Promise.all(
    BLANK_TYPE_LIST.map((type) =>
      fetchBlanks({ page: 1, per_page: 1, status: 'in_circulation', type, vkmo_id }, signal),
    ),
  );
  const byType = {} as Record<BlankType, number>;
  const firstByType = {} as Record<BlankType, Blank | null>;
  let total = 0;
  BLANK_TYPE_LIST.forEach((type, i) => {
    byType[type] = results[i].total;
    firstByType[type] = results[i].data[0] ?? null;
    total += results[i].total;
  });
  return { total, byType, firstByType };
}

// --- Журнал аудита -----------------------------------------------------------

export interface AuditEntry {
  id: string;
  at: string;
  user_id: string | null;
  user_name: string | null;
  role: UserRole | null;
  category: string;
  action: string;
  target: string | null;
  details: string | null;
}

export interface AuditQuery {
  page: number;
  per_page: number;
  category?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface AuditPage {
  data: AuditEntry[];
  total: number;
  page: number;
  per_page: number;
}

export async function fetchAudit(q: AuditQuery, signal?: AbortSignal): Promise<AuditPage> {
  const r = await apiGet<{ data: AuditEntry[]; meta: { page: number; per_page: number; total: number } }>(
    '/audit',
    q,
    signal,
  );
  return { data: r.data, total: r.meta.total, page: r.meta.page, per_page: r.meta.per_page };
}
