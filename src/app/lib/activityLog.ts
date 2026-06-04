import { currentUser, roleNames, type UserRole } from '../data/mockData';

// Журнал действий пользователей в интерфейсе (1.14).
// Хранится в localStorage; в продуктивной версии события дублируются на сервер
// (см. бэкенд 2.13 — неизменяемый журнал аудита).

export type ActivityCategory =
  | 'auth'
  | 'blank'
  | 'operation'
  | 'signature'
  | 'report'
  | 'distribution'
  | 'admin';

export interface ActivityEntry {
  id: string;
  at: string; // ISO
  userId: string;
  userName: string;
  role: UserRole;
  category: ActivityCategory;
  action: string;
  target?: string;
  details?: string;
}

export const activityCategoryNames: Record<ActivityCategory, string> = {
  auth: 'Вход / выход',
  blank: 'Бланки',
  operation: 'Операции',
  signature: 'Подписание ЭЦП',
  report: 'Отчёты',
  distribution: 'Распределение',
  admin: 'Администрирование',
};

const STORAGE_KEY = 'bso_activity_log';
const MAX_ENTRIES = 500;

type Listener = () => void;
const listeners = new Set<Listener>();

let counter = 0;
const nextId = (): string => {
  counter += 1;
  return `act_${Date.now()}_${counter}`;
};

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const read = (): ActivityEntry[] => {
  if (!isBrowser) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ActivityEntry[]) : [];
  } catch {
    return [];
  }
};

const write = (entries: ActivityEntry[]): void => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    /* квота переполнена — игнорируем */
  }
};

let cache: ActivityEntry[] | null = null;

const ensureSeed = (): void => {
  if (!isBrowser) return;
  if (localStorage.getItem(STORAGE_KEY) !== null) return;
  // Демонстрационные записи, чтобы журнал не был пустым при первом открытии.
  const seed: ActivityEntry[] = [
    {
      id: nextId(),
      at: '2026-06-01T08:32:00.000Z',
      userId: 'user4',
      userName: 'Алексеев Алексей Алексеевич',
      role: 'center_operator',
      category: 'auth',
      action: 'Вход в систему',
      details: 'Аутентификация через домен',
    },
    {
      id: nextId(),
      at: '2026-06-01T09:05:00.000Z',
      userId: 'user1',
      userName: 'Петров Петр Петрович',
      role: 'vkmo_operator',
      category: 'operation',
      action: 'Отправлена операция на подпись',
      target: 'АА123457',
      details: 'Выдача · Призыв',
    },
    {
      id: nextId(),
      at: '2026-06-01T09:18:00.000Z',
      userId: 'user2',
      userName: 'Иванов Иван Иванович',
      role: 'commissioner',
      category: 'signature',
      action: 'Операция подписана ЭЦП',
      target: 'АА123457',
      details: 'Сертификат: Иванов И.И., ГОСТ Р 34.10-2012',
    },
    {
      id: nextId(),
      at: '2026-06-01T12:40:00.000Z',
      userId: 'user4',
      userName: 'Алексеев Алексей Алексеевич',
      role: 'center_operator',
      category: 'report',
      action: 'Сформирован отчёт',
      target: 'Остатки бланков',
      details: 'Период 01.01.2026 — 01.06.2026 · Все уровни',
    },
  ];
  write(seed);
};

const load = (): ActivityEntry[] => {
  if (cache === null) {
    ensureSeed();
    // Храним и отдаём в порядке убывания даты (свежие сверху).
    cache = read().sort((a, b) => b.at.localeCompare(a.at));
  }
  return cache;
};

// Возвращает стабильную ссылку на текущий снимок (меняется только при записи).
// Это требование useSyncExternalStore — иначе бесконечный ререндер.
export function getActivity(): ActivityEntry[] {
  return load();
}

export function logActivity(input: {
  category: ActivityCategory;
  action: string;
  target?: string;
  details?: string;
}): void {
  const entry: ActivityEntry = {
    id: nextId(),
    at: new Date().toISOString(),
    userId: currentUser.id,
    userName: currentUser.name,
    role: currentUser.role,
    category: input.category,
    action: input.action,
    target: input.target,
    details: input.details,
  };
  const entries = [entry, ...load()].slice(0, MAX_ENTRIES);
  cache = entries;
  write(entries);
  listeners.forEach((l) => l());
}

export function clearActivity(): void {
  cache = [];
  write([]);
  listeners.forEach((l) => l());
}

export function subscribeActivity(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export { roleNames };
