import type { BlankPlace, OrgLevel } from './domain.js';

// Номер бланка: две заглавные кириллические буквы + 6 цифр (см. CHECK в schema.sql).
export const BLANK_NUMBER_RE = /^[А-Я]{2}[0-9]{6}$/;

export function isValidBlankNumber(n: string): boolean {
  return BLANK_NUMBER_RE.test(n);
}

// Разбор номера на буквенный префикс и числовую часть.
export function parseBlankNumber(n: string): { letters: string; num: number } | null {
  if (!isValidBlankNumber(n)) return null;
  return { letters: n.slice(0, 2), num: Number(n.slice(2)) };
}

export function formatBlankNumber(letters: string, num: number): string {
  return `${letters}${String(num).padStart(6, '0')}`;
}

export const MAX_SERIES_SIZE = 5000;

export interface SeriesRange {
  letters: string;
  from: number;
  to: number;
}

// Разворачивает диапазон серии в список номеров с валидацией границ и размера.
export function expandSeries(range: SeriesRange): { numbers: string[] } | { error: string } {
  const { letters, from, to } = range;
  if (!/^[А-Я]{2}$/.test(letters)) return { error: 'Серия должна состоять из двух заглавных кириллических букв' };
  if (!Number.isInteger(from) || !Number.isInteger(to)) return { error: 'Границы диапазона должны быть целыми' };
  if (from < 0 || to > 999999) return { error: 'Границы диапазона вне допустимого (000000–999999)' };
  if (from > to) return { error: 'Начало диапазона больше конца' };
  const count = to - from + 1;
  if (count > MAX_SERIES_SIZE) return { error: `Размер серии ${count} превышает лимит ${MAX_SERIES_SIZE}` };
  const numbers: string[] = [];
  for (let n = from; n <= to; n++) numbers.push(formatBlankNumber(letters, n));
  return { numbers };
}

// Местонахождение бланка, соответствующее уровню принимающего узла.
export const placeForLevel: Record<OrgLevel, BlankPlace> = {
  center: 'at_center',
  district: 'at_district',
  omu: 'at_omu',
  vk_subject: 'at_vk_subject',
  vk_mo: 'at_vk_mo',
};
