import {
  blankTypeNames,
  statusNames,
  placeNames,
  operationTypeNames,
  type Blank,
  type BlankStatus,
  type BlankType,
  type Operation,
} from '../data/mockData';
import type { ExportColumn } from './exportTable';

// Данные для отчёта приходят с сервера (см. lib/api), а не из моков.
export interface ReportData {
  blanks: Blank[];
  operations: Operation[];
}

export type ReportType = 'movement' | 'issued' | 'balance' | 'operations' | 'statistics';
export type ReportLevel = 'all' | 'center' | 'district' | 'subject' | 'vkmo';

export const reportTypeNames: Record<ReportType, string> = {
  movement: 'Движение бланков',
  issued: 'Выданные бланки',
  balance: 'Остатки бланков',
  operations: 'История операций',
  statistics: 'Статистика по статусам',
};

export const reportLevelNames: Record<ReportLevel, string> = {
  all: 'Все уровни',
  center: 'Центр',
  district: 'Округа',
  subject: 'Субъекты',
  vkmo: 'ВК МО',
};

export interface ReportParams {
  type: ReportType;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
  level: ReportLevel;
}

export interface ReportResult {
  title: string;
  subtitle: string;
  columns: ExportColumn[];
  rows: Record<string, string | number>[];
}

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

// Уровень иерархии сопоставляется с местонахождением бланка.
const levelMatchesBlank = (level: ReportLevel, blank: Blank): boolean => {
  switch (level) {
    case 'all':
      return true;
    case 'center':
      return blank.place === 'at_center';
    case 'district':
      return blank.place === 'at_district';
    case 'subject':
      return blank.place === 'at_vk_subject' || blank.place === 'at_omu';
    case 'vkmo':
      return blank.place === 'at_vk_mo' || blank.place === 'with_recipient';
    default:
      return true;
  }
};

const inPeriod = (iso: string, from: string, to: string): boolean => {
  const t = new Date(iso).getTime();
  const fromT = new Date(`${from}T00:00:00`).getTime();
  const toT = new Date(`${to}T23:59:59`).getTime();
  return t >= fromT && t <= toT;
};

const buildPeriodSubtitle = (params: ReportParams): string =>
  `Период: ${formatDate(`${params.dateFrom}T00:00:00`)} — ${formatDate(`${params.dateTo}T00:00:00`)} · ${reportLevelNames[params.level]}`;

export function buildReport(params: ReportParams, data: ReportData): ReportResult {
  const { type, dateFrom, dateTo, level } = params;
  const { blanks, operations } = data;
  const subtitle = buildPeriodSubtitle(params);
  const title = reportTypeNames[type];

  const blankById = new Map(blanks.map((b) => [b.id, b]));
  const opsInPeriod = operations.filter((op) => inPeriod(op.created_at, dateFrom, dateTo));

  if (type === 'movement' || type === 'operations') {
    const columns: ExportColumn[] = [
      { key: 'date', title: 'Дата' },
      { key: 'number', title: 'Номер бланка' },
      { key: 'blankType', title: 'Тип бланка' },
      { key: 'operation', title: 'Операция' },
      { key: 'from', title: 'Откуда' },
      { key: 'to', title: 'Куда' },
      { key: 'reason', title: 'Основание' },
      { key: 'operator', title: 'Оператор' },
    ];
    const rows = opsInPeriod
      .map((op) => {
        const blank = blankById.get(op.blank_id);
        return { op, blank };
      })
      .filter(({ blank }) => !blank || level === 'all' || levelMatchesBlank(level, blank))
      .sort((a, b) => b.op.created_at.localeCompare(a.op.created_at))
      .map(({ op, blank }) => ({
        date: formatDate(op.created_at),
        number: blank?.number ?? op.blank_id,
        blankType: blank ? blankTypeNames[blank.type] : '—',
        operation: operationTypeNames[op.type],
        from: op.from_location ?? '—',
        to: op.to_location ?? '—',
        reason: op.reason,
        operator: op.operator_name,
      }));
    return { title, subtitle, columns, rows };
  }

  if (type === 'issued') {
    const columns: ExportColumn[] = [
      { key: 'date', title: 'Дата выдачи' },
      { key: 'number', title: 'Номер бланка' },
      { key: 'blankType', title: 'Тип бланка' },
      { key: 'recipient', title: 'Получатель' },
      { key: 'reason', title: 'Основание' },
      { key: 'operator', title: 'Оператор' },
    ];
    const rows = opsInPeriod
      .filter((op) => op.type === 'issue')
      .map((op) => ({ op, blank: blankById.get(op.blank_id) }))
      .filter(({ blank }) => !blank || level === 'all' || levelMatchesBlank(level, blank))
      .sort((a, b) => b.op.created_at.localeCompare(a.op.created_at))
      .map(({ op, blank }) => ({
        date: formatDate(op.created_at),
        number: blank?.number ?? op.blank_id,
        blankType: blank ? blankTypeNames[blank.type] : '—',
        recipient: op.owner_name ?? '—',
        reason: op.reason,
        operator: op.operator_name,
      }));
    return { title, subtitle, columns, rows };
  }

  if (type === 'balance') {
    // Остатки бланков (в обороте) на текущий момент в разрезе типов и статусов.
    const scoped = blanks.filter((b) => level === 'all' || levelMatchesBlank(level, b));
    const types: BlankType[] = ['military_id', 'certificate', 'credential'];
    const statuses: BlankStatus[] = ['in_circulation', 'issued', 'on_hold', 'written_off'];
    const columns: ExportColumn[] = [
      { key: 'blankType', title: 'Тип бланка' },
      ...statuses.map((s) => ({ key: s, title: statusNames[s] })),
      { key: 'total', title: 'Итого' },
    ];
    const rows: Record<string, string | number>[] = types.map((t) => {
      const row: Record<string, string | number> = { blankType: blankTypeNames[t] };
      let total = 0;
      statuses.forEach((s) => {
        const count = scoped.filter((b) => b.type === t && b.status === s).length;
        row[s] = count;
        total += count;
      });
      row.total = total;
      return row;
    });
    const totalRow: Record<string, string | number> = { blankType: 'Всего' };
    let grand = 0;
    statuses.forEach((s) => {
      const count = scoped.filter((b) => b.status === s).length;
      totalRow[s] = count;
      grand += count;
    });
    totalRow.total = grand;
    rows.push(totalRow);
    return { title, subtitle, columns, rows };
  }

  // statistics — распределение по статусам с указанием места хранения.
  const scoped = blanks.filter((b) => level === 'all' || levelMatchesBlank(level, b));
  const statuses: BlankStatus[] = ['in_circulation', 'issued', 'on_hold', 'written_off'];
  const columns: ExportColumn[] = [
    { key: 'status', title: 'Статус' },
    { key: 'count', title: 'Количество' },
    { key: 'share', title: 'Доля' },
    { key: 'places', title: 'Места хранения' },
  ];
  const total = scoped.length || 1;
  const rows = statuses.map((s) => {
    const items = scoped.filter((b) => b.status === s);
    const places = Array.from(new Set(items.map((b) => placeNames[b.place]))).join(', ') || '—';
    return {
      status: statusNames[s],
      count: items.length,
      share: `${((items.length / total) * 100).toFixed(1)} %`,
      places,
    };
  });
  rows.push({ status: 'Всего', count: scoped.length, share: '100.0 %', places: '—' });
  return { title, subtitle, columns, rows };
}
