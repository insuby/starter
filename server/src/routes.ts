import type { FastifyInstance } from 'fastify';
import type { Repository } from './repo/index.js';
import type { OrgUnit } from './domain.js';
import { buildLookups, presentBlank, presentBlankCard, presentOperation, presentPendingSignature, type Lookups } from './presenters.js';
import { distributionByOrg, operationsChart, summarize, vkmoIdsUnder } from './aggregate.js';
import {
  auditListSchema,
  blankCardSchema,
  blanksListSchema,
  citizensListSchema,
  dashboardSummarySchema,
  distributionSchema,
  operationsChartSchema,
  distributeSchema,
  operationCreateSchema,
  operationRejectSchema,
  operationSignSchema,
  operationsListSchema,
  orgUnitsSchema,
  pendingSignaturesSchema,
  receiptSchema,
} from './schemas.js';
import type { BlankListFilters, OperationListFilters } from './repo/types.js';
import { expandSeries, isValidBlankNumber, placeForLevel } from './series.js';
import { labelsRu, SIGNATURE_REQUIRED_TYPES } from './domain.js';

export interface RouteContext {
  repo: Repository;
  kind: 'postgres' | 'memory';
}

const todayYmd = (): string => new Date().toISOString().slice(0, 10);
const nowIso = (): string => new Date().toISOString();

export async function registerRoutes(app: FastifyInstance, ctx: RouteContext): Promise<void> {
  const { repo } = ctx;

  // Справочные данные кэшируются на время жизни процесса (read-only фаза).
  let lookups: Lookups | null = null;
  let orgUnitsCache: OrgUnit[] | null = null;
  const getLookups = async (): Promise<Lookups> => {
    if (!lookups) {
      const [citizens, users, blanks] = await Promise.all([repo.citizens(), repo.users(), repo.blanksProjection()]);
      lookups = buildLookups(citizens, users, blanks);
    }
    return lookups;
  };
  const getOrgUnits = async (): Promise<OrgUnit[]> => {
    if (!orgUnitsCache) orgUnitsCache = await repo.orgUnits();
    return orgUnitsCache;
  };
  // Сбрасываем кэш справочников после операций записи (новые бланки/владельцы).
  const invalidateLookups = (): void => {
    lookups = null;
  };

  app.get('/health', { schema: { tags: ['service'], summary: 'Проверка доступности' } }, async () => ({
    status: 'ok',
    storage: ctx.kind,
    time: nowIso(),
  }));

  app.get('/dashboard/summary', { schema: { tags: ['dashboard'], summary: 'Сводные счётчики бланков', ...dashboardSummarySchema } }, async (req) => {
    const q = req.query as { vkmo_id?: string; org_unit_id?: string };
    const orgUnits = await getOrgUnits();
    const blanks = await repo.blanksProjection();

    let allowedVkmo: Set<string> | null = null;
    let scopeOrgId: string | null = null;
    if (q.vkmo_id) {
      allowedVkmo = new Set([q.vkmo_id]);
      scopeOrgId = q.vkmo_id;
    } else if (q.org_unit_id) {
      allowedVkmo = vkmoIdsUnder(orgUnits, q.org_unit_id);
      scopeOrgId = q.org_unit_id;
    }
    const scopeUnit = scopeOrgId ? orgUnits.find((u) => u.id === scopeOrgId) : undefined;

    const counts = summarize(blanks, allowedVkmo);
    const blankVkmo = new Map(blanks.map((b) => [b.id, b.vkmo_id]));
    const pending = await repo.pendingSignatures(q.vkmo_id);
    const pendingCount = q.vkmo_id
      ? pending.length
      : allowedVkmo
        ? (await repo.pendingSignatures()).filter((o) => allowedVkmo!.has(blankVkmo.get(o.blank_id) ?? '')).length
        : (await repo.pendingSignatures()).length;

    return {
      scope: {
        org_unit_id: scopeOrgId,
        org_unit_name: scopeUnit?.name ?? null,
        level: scopeUnit?.level ?? null,
      },
      blanks: counts,
      operations_pending_signature: pendingCount,
      generated_at: nowIso(),
    };
  });

  app.get('/dashboard/operations-chart', { schema: { tags: ['dashboard'], summary: 'Динамика операций по дням', ...operationsChartSchema } }, async (req) => {
    const q = req.query as { days?: number; vkmo_id?: string; org_unit_id?: string };
    const days = q.days ?? 7;
    const orgUnits = await getOrgUnits();
    const blanks = await repo.blanksProjection();

    let allowedVkmo: Set<string> | null = null;
    if (q.vkmo_id) allowedVkmo = new Set([q.vkmo_id]);
    else if (q.org_unit_id) allowedVkmo = vkmoIdsUnder(orgUnits, q.org_unit_id);

    const blankIds = allowedVkmo
      ? new Set(blanks.filter((b) => allowedVkmo!.has(b.vkmo_id)).map((b) => b.id))
      : null;

    const allOps = await repo.listOperations({});
    const chart = operationsChart(allOps, days, blankIds, todayYmd());
    return {
      period: { days, from: chart.from, to: chart.to },
      vkmo_id: q.vkmo_id ?? null,
      series: chart.series,
    };
  });

  app.get('/dashboard/distribution-by-org', { schema: { tags: ['dashboard'], summary: 'Распределение по дочерним узлам', ...distributionSchema } }, async (req) => {
    const q = req.query as { parent_org_unit_id: string; level: OrgUnit['level'] };
    const orgUnits = await getOrgUnits();
    const blanks = await repo.blanksProjection();
    return distributionByOrg(orgUnits, blanks, q.parent_org_unit_id, q.level);
  });

  app.get('/blanks', { schema: { tags: ['blanks'], summary: 'Реестр бланков (пагинация)', ...blanksListSchema } }, async (req) => {
    const q = req.query as Partial<BlankListFilters>;
    const filters: BlankListFilters = {
      page: q.page ?? 1,
      per_page: q.per_page ?? 50,
      vkmo_id: q.vkmo_id,
      status: q.status,
      type: q.type,
      place: q.place,
      search: q.search,
    };
    const { rows, total } = await repo.listBlanks(filters);
    const l = await getLookups();
    return {
      data: rows.map((b) => presentBlank(l, b)),
      meta: {
        page: filters.page,
        per_page: filters.per_page,
        total,
        filters: {
          status: filters.status ?? null,
          type: filters.type ?? null,
          place: filters.place ?? null,
          vkmo_id: filters.vkmo_id ?? null,
          search: filters.search ?? null,
        },
      },
    };
  });

  app.get('/blanks/:id', { schema: { tags: ['blanks'], summary: 'Карточка бланка с историей операций', ...blankCardSchema } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const blank = await repo.getBlank(id);
    if (!blank) {
      return reply.code(404).send({ error: 'Бланк не найден' });
    }
    const [l, orgUnits, operations] = await Promise.all([
      getLookups(),
      getOrgUnits(),
      repo.listOperations({ blank_id: id }),
    ]);
    const vkmoName = orgUnits.find((u) => u.id === blank.vkmo_id)?.name ?? null;
    return presentBlankCard(l, blank, operations, vkmoName);
  });

  app.get('/operations', { schema: { tags: ['operations'], summary: 'Журнал операций', ...operationsListSchema } }, async (req) => {
    const q = req.query as OperationListFilters;
    const rows = await repo.listOperations(q);
    const l = await getLookups();
    return { data: rows.map((o) => presentOperation(l, o)), meta: { total: rows.length } };
  });

  app.get('/operations/pending-signatures', { schema: { tags: ['operations'], summary: 'Очередь на подпись комиссара', ...pendingSignaturesSchema } }, async (req) => {
    const q = req.query as { vkmo_id?: string };
    const rows = await repo.pendingSignatures(q.vkmo_id);
    const l = await getLookups();
    return rows.map((o) => presentPendingSignature(l, o));
  });

  app.get('/citizens', { schema: { tags: ['service'], summary: 'Справочник граждан', ...citizensListSchema } }, async (req) => {
    const q = req.query as { search?: string; limit?: number };
    const all = await repo.citizens();
    const search = q.search?.trim().toLowerCase();
    const filtered = search
      ? all.filter((c) => c.full_name.toLowerCase().includes(search) || c.id.toLowerCase().includes(search))
      : all;
    const limit = q.limit ?? 50;
    return { data: filtered.slice(0, limit), meta: { total: filtered.length } };
  });

  app.get('/org-units', { schema: { tags: ['service'], summary: 'Иерархия организационных узлов', ...orgUnitsSchema } }, async (req) => {
    const q = req.query as { root_org_unit_id?: string };
    const units = await getOrgUnits();
    // Собираем дерево: каждый узел получает массив children.
    type Node = OrgUnit & { children: Node[] };
    const byId = new Map<string, Node>(units.map((u) => [u.id, { ...u, children: [] }]));
    const roots: Node[] = [];
    for (const node of byId.values()) {
      const parent = node.parent_id ? byId.get(node.parent_id) : undefined;
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
    const tree = q.root_org_unit_id
      ? byId.has(q.root_org_unit_id)
        ? [byId.get(q.root_org_unit_id)!]
        : []
      : roots;
    return { flat: units, tree };
  });

  app.get('/audit', { schema: { tags: ['service'], summary: 'Журнал аудита (2.13)', ...auditListSchema } }, async (req) => {
    const q = req.query as { page?: number; per_page?: number; category?: string; user_id?: string; date_from?: string; date_to?: string };
    const { rows, total } = await repo.listAudit({
      page: q.page ?? 1,
      per_page: q.per_page ?? 50,
      category: q.category,
      user_id: q.user_id,
      date_from: q.date_from,
      date_to: q.date_to,
    });
    return {
      data: rows,
      meta: { page: q.page ?? 1, per_page: q.per_page ?? 50, total },
    };
  });

  app.post('/receipts', { schema: { tags: ['blanks'], summary: 'Поступление серии бланков от типографии', ...receiptSchema } }, async (req, reply) => {
    const body = req.body as {
      org_unit_id: string;
      operator_id: string;
      type: 'military_id' | 'certificate' | 'credential';
      reason?: string;
      numbers?: string[];
      series?: { letters: string; from: number; to: number };
    };

    const orgUnits = await getOrgUnits();
    const org = orgUnits.find((u) => u.id === body.org_unit_id);
    if (!org) return reply.code(404).send({ error: 'Организационный узел не найден' });

    const l = await getLookups();
    if (!l.users.has(body.operator_id)) {
      return reply.code(404).send({ error: 'Оператор не найден' });
    }

    // Источник номеров: явный список или диапазон серии.
    let numbers: string[];
    if (body.numbers && body.numbers.length > 0) {
      numbers = body.numbers;
    } else if (body.series) {
      const expanded = expandSeries(body.series);
      if ('error' in expanded) return reply.code(400).send({ error: expanded.error });
      numbers = expanded.numbers;
    } else {
      return reply.code(400).send({ error: 'Укажите numbers или series' });
    }

    // Валидация формата и дедупликация в пределах запроса (порядок сохраняем).
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const n of numbers) {
      if (!isValidBlankNumber(n)) {
        return reply.code(400).send({ error: `Неверный формат номера: ${n} (ожидается ДВ123456)` });
      }
      if (!seen.has(n)) {
        seen.add(n);
        unique.push(n);
      }
    }

    const result = await repo.createReceipt({
      org_unit_id: body.org_unit_id,
      operator_id: body.operator_id,
      type: body.type,
      numbers: unique,
      reason: body.reason?.trim() || 'Поступление от типографии',
      location_label: org.name,
      place: placeForLevel[org.level],
    });

    const operator = l.users.get(body.operator_id);
    await repo.appendAudit({
      user_id: body.operator_id,
      user_name: operator?.name ?? null,
      role: operator?.role ?? null,
      category: 'receipt',
      action: 'Поступление серии бланков',
      target: org.name,
      details: `${labelsRu.blank_type[body.type]}: принято ${result.created.length}, пропущено ${result.skipped.length}`,
      payload: { receipt_id: result.receipt_id, type: body.type, created: result.created.length },
    });

    invalidateLookups();

    const range =
      result.created.length > 0
        ? { from: result.created[0]!.number, to: result.created[result.created.length - 1]!.number }
        : null;

    return reply.code(201).send({
      receipt_id: result.receipt_id,
      org_unit_id: body.org_unit_id,
      type: body.type,
      created_count: result.created.length,
      skipped_count: result.skipped.length,
      range,
      skipped: result.skipped,
    });
  });

  app.post('/transfers', { schema: { tags: ['blanks'], summary: 'Распределение бланков на дочерний узел', ...distributeSchema } }, async (req, reply) => {
    const body = req.body as {
      from_org_unit_id: string;
      to_org_unit_id: string;
      operator_id: string;
      type?: 'military_id' | 'certificate' | 'credential';
      count?: number;
      blank_ids?: string[];
      reason?: string;
    };

    const orgUnits = await getOrgUnits();
    const from = orgUnits.find((u) => u.id === body.from_org_unit_id);
    const to = orgUnits.find((u) => u.id === body.to_org_unit_id);
    if (!from) return reply.code(404).send({ error: 'Узел-отправитель не найден' });
    if (!to) return reply.code(404).send({ error: 'Узел-получатель не найден' });
    // Распределение строго на один уровень вниз (контроль структуры).
    if (to.parent_id !== from.id) {
      return reply.code(400).send({ error: `${to.name} не является прямым дочерним узлом для ${from.name}` });
    }

    const l = await getLookups();
    if (!l.users.has(body.operator_id)) {
      return reply.code(404).send({ error: 'Оператор не найден' });
    }
    if (!body.count && !(body.blank_ids && body.blank_ids.length > 0)) {
      return reply.code(400).send({ error: 'Укажите count или blank_ids' });
    }

    const result = await repo.distribute({
      from_org_unit_id: from.id,
      to_org_unit_id: to.id,
      operator_id: body.operator_id,
      type: body.type,
      count: body.count,
      blank_ids: body.blank_ids,
      reason: body.reason?.trim() || 'Распределение бланков',
      from_place: placeForLevel[from.level],
      to_place: placeForLevel[to.level],
      from_name: from.name,
      to_name: to.name,
    });

    if (!result.ok) {
      // Недостаток остатка — это конфликт лимита (409), прочее — 400.
      const code = result.available !== undefined ? 409 : 400;
      return reply.code(code).send({ error: result.error, available: result.available });
    }

    const operator = l.users.get(body.operator_id);
    await repo.appendAudit({
      user_id: body.operator_id,
      user_name: operator?.name ?? null,
      role: operator?.role ?? null,
      category: 'transfer',
      action: 'Распределение бланков',
      target: `${from.name} → ${to.name}`,
      details: `Перемещено ${result.moved.length}${body.type ? ` (${labelsRu.blank_type[body.type]})` : ''}`,
      payload: { from: from.id, to: to.id, count: result.moved.length },
    });

    invalidateLookups();
    const lk = await getLookups();
    return reply.code(201).send({
      moved_count: result.moved.length,
      from_org_unit_id: from.id,
      to_org_unit_id: to.id,
      blanks: result.moved.map((b) => presentBlank(lk, b)),
    });
  });

  app.post('/operations', { schema: { tags: ['operations'], summary: 'Регистрация операции с бланком', ...operationCreateSchema } }, async (req, reply) => {
    const body = req.body as {
      blank_id: string;
      type: 'issue' | 'return' | 'replacement' | 'storage' | 'write_off';
      operator_id: string;
      reason?: string;
      owner_id?: string;
      comment?: string;
      operator_comment?: string;
    };

    const blank = await repo.getBlank(body.blank_id);
    if (!blank) return reply.code(404).send({ error: 'Бланк не найден' });

    const l = await getLookups();
    if (!l.users.has(body.operator_id)) return reply.code(404).send({ error: 'Оператор не найден' });
    if (body.owner_id && !l.citizens.has(body.owner_id)) {
      return reply.code(404).send({ error: 'Получатель не найден' });
    }

    // Место узла-держателя для возврата вычисляем по уровню его орг-узла.
    const orgUnits = await getOrgUnits();
    const holder = orgUnits.find((u) => u.id === blank.vkmo_id);
    const holderPlace = holder ? placeForLevel[holder.level] : blank.place;

    const result = await repo.createOperation({
      blank_id: body.blank_id,
      type: body.type,
      operator_id: body.operator_id,
      reason: body.reason?.trim() || labelsRu.operation_type[body.type],
      owner_id: body.owner_id ?? null,
      comment: body.comment ?? null,
      operator_comment: body.operator_comment ?? null,
      holder_place: holderPlace,
    });

    if (!result.ok) return reply.code(result.code).send({ error: result.error });

    const operator = l.users.get(body.operator_id);
    const requiresSignature = SIGNATURE_REQUIRED_TYPES.has(body.type);
    await repo.appendAudit({
      user_id: body.operator_id,
      user_name: operator?.name ?? null,
      role: operator?.role ?? null,
      category: 'operation',
      action: requiresSignature ? 'Операция отправлена на подпись' : 'Операция зарегистрирована',
      target: blank.number,
      details: `${labelsRu.operation_type[body.type]} · ${result.operation.reason}`,
      payload: { operation_id: result.operation.id, status: result.operation.status },
    });

    invalidateLookups();
    const lk = await getLookups();
    return reply.code(201).send({
      operation: presentOperation(lk, result.operation),
      blank: presentBlank(lk, result.blank),
      requires_signature: requiresSignature,
    });
  });

  app.post('/operations/:id/sign', { schema: { tags: ['operations'], summary: 'Подписание операции комиссаром (ЭЦП)', ...operationSignSchema } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as { commissioner_id: string; signature: string };

    const l = await getLookups();
    const commissioner = l.users.get(body.commissioner_id);
    if (!commissioner) return reply.code(404).send({ error: 'Комиссар не найден' });

    const op = await repo.getOperation(id);
    if (!op) return reply.code(404).send({ error: 'Операция не найдена' });
    const blank = await repo.getBlank(op.blank_id);
    if (!blank) return reply.code(404).send({ error: 'Бланк не найден' });

    // Место узла-держателя для перехода состояния (сдача на хранение).
    const orgUnits = await getOrgUnits();
    const holder = orgUnits.find((u) => u.id === blank.vkmo_id);
    const holderPlace = holder ? placeForLevel[holder.level] : blank.place;

    const result = await repo.signOperation({
      operation_id: id,
      commissioner_id: body.commissioner_id,
      commissioner_signature: body.signature,
      holder_place: holderPlace,
    });
    if (!result.ok) return reply.code(result.code).send({ error: result.error });

    await repo.appendAudit({
      user_id: body.commissioner_id,
      user_name: commissioner.name,
      role: commissioner.role,
      category: 'signature',
      action: 'Операция подписана комиссаром',
      target: l.blankNumbers.get(result.operation.blank_id) ?? null,
      details: `${labelsRu.operation_type[result.operation.type]} · подписано ЭЦП`,
      payload: { operation_id: result.operation.id, status: 'approved' },
    });

    invalidateLookups();
    const lk = await getLookups();
    return { operation: presentOperation(lk, result.operation), blank: presentBlank(lk, result.blank) };
  });

  app.post('/operations/:id/reject', { schema: { tags: ['operations'], summary: 'Отклонение операции комиссаром', ...operationRejectSchema } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as { commissioner_id: string; reason?: string };

    const l = await getLookups();
    const commissioner = l.users.get(body.commissioner_id);
    if (!commissioner) return reply.code(404).send({ error: 'Комиссар не найден' });

    const result = await repo.rejectOperation({
      operation_id: id,
      commissioner_id: body.commissioner_id,
      reason: body.reason?.trim() || undefined,
    });
    if (!result.ok) return reply.code(result.code).send({ error: result.error });

    await repo.appendAudit({
      user_id: body.commissioner_id,
      user_name: commissioner.name,
      role: commissioner.role,
      category: 'signature',
      action: 'Операция отклонена комиссаром',
      target: l.blankNumbers.get(result.operation.blank_id) ?? null,
      details: `${labelsRu.operation_type[result.operation.type]} · отклонено`,
      payload: { operation_id: result.operation.id, status: 'rejected' },
    });

    invalidateLookups();
    const lk = await getLookups();
    return { operation: presentOperation(lk, result.operation) };
  });
}
