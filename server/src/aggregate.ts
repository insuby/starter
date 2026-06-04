import type { Blank, BlankType, Operation, OrgLevel, OrgUnit } from './domain.js';

// Чистые функции агрегации над массивами доменных строк.
// Используются и in-memory, и PostgreSQL репозиториями (после выборки проекций).

export interface SummaryCounts {
  total: number;
  in_circulation: number;
  issued: number;
  on_hold: number;
  written_off: number;
  by_type: Record<BlankType, number>;
}

const emptyByType = (): Record<BlankType, number> => ({ military_id: 0, certificate: 0, credential: 0 });

// Все узлы-потомки заданного корня (включая сам корень).
export function descendantOrgIds(orgUnits: OrgUnit[], rootId: string): Set<string> {
  const childrenOf = new Map<string, string[]>();
  for (const u of orgUnits) {
    if (u.parent_id) {
      const arr = childrenOf.get(u.parent_id) ?? [];
      arr.push(u.id);
      childrenOf.set(u.parent_id, arr);
    }
  }
  const result = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    if (result.has(id)) continue;
    result.add(id);
    for (const c of childrenOf.get(id) ?? []) stack.push(c);
  }
  return result;
}

// Множество ВК МО (листьев), относящихся к узлу (для подсчёта бланков).
export function vkmoIdsUnder(orgUnits: OrgUnit[], rootId: string): Set<string> {
  const all = descendantOrgIds(orgUnits, rootId);
  const result = new Set<string>();
  for (const u of orgUnits) {
    if (u.level === 'vk_mo' && all.has(u.id)) result.add(u.id);
  }
  return result;
}

export function summarize(blanks: Blank[], allowedVkmo: Set<string> | null): SummaryCounts {
  const counts: SummaryCounts = {
    total: 0,
    in_circulation: 0,
    issued: 0,
    on_hold: 0,
    written_off: 0,
    by_type: emptyByType(),
  };
  for (const b of blanks) {
    if (allowedVkmo && !allowedVkmo.has(b.vkmo_id)) continue;
    counts.total += 1;
    counts[b.status] += 1;
    counts.by_type[b.type] += 1;
  }
  return counts;
}

const dayKey = (iso: string): string => iso.slice(0, 10);

const addDays = (ymd: string, delta: number): string => {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
};

export interface ChartPoint {
  date: string;
  issue: number;
  return: number;
  write_off: number;
}

export interface ChartResult {
  from: string;
  to: string;
  series: ChartPoint[];
}

// Динамика операций по дням. `to` привязывается к последней операции в выборке
// (или к todayYmd, если операций нет), чтобы график был наглядным.
export function operationsChart(
  operations: Operation[],
  days: number,
  vkmoBlankIds: Set<string> | null,
  todayYmd: string,
): ChartResult {
  const relevant = operations.filter(
    (o) => !vkmoBlankIds || vkmoBlankIds.has(o.blank_id),
  );
  const latest = relevant.reduce<string | null>((acc, o) => {
    const k = dayKey(o.created_at);
    return acc === null || k > acc ? k : acc;
  }, null);
  const to = latest ?? todayYmd;
  const from = addDays(to, -(days - 1));

  const buckets = new Map<string, ChartPoint>();
  for (let i = 0; i < days; i++) {
    const date = addDays(from, i);
    buckets.set(date, { date, issue: 0, return: 0, write_off: 0 });
  }
  for (const o of relevant) {
    const k = dayKey(o.created_at);
    const point = buckets.get(k);
    if (!point) continue;
    if (o.type === 'issue') point.issue += 1;
    else if (o.type === 'return') point.return += 1;
    else if (o.type === 'write_off') point.write_off += 1;
  }
  return { from, to, series: Array.from(buckets.values()) };
}

export interface DistributionRow {
  org_unit_id: string;
  org_unit_name: string;
  level: OrgLevel;
  by_type: Record<BlankType, number>;
  total: number;
}

export function distributionByOrg(
  orgUnits: OrgUnit[],
  blanks: Blank[],
  parentId: string,
  level: OrgLevel,
): DistributionRow[] {
  const children = orgUnits.filter((u) => u.parent_id === parentId && u.level === level);
  return children.map((child) => {
    const vkmo = vkmoIdsUnder(orgUnits, child.id);
    const byType = emptyByType();
    let total = 0;
    for (const b of blanks) {
      if (b.status === 'written_off') continue; // остатки — без списанных
      if (!vkmo.has(b.vkmo_id)) continue;
      byType[b.type] += 1;
      total += 1;
    }
    return {
      org_unit_id: child.id,
      org_unit_name: child.name,
      level: child.level,
      by_type: byType,
      total,
    };
  });
}
