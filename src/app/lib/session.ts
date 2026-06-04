import {
  currentUser,
  setCurrentUser,
  mockUsers,
  findCabinetByUserId,
  getCabinetPathLabels,
  roleNames,
  type User,
} from '../data/mockData';
import { logActivity } from './activityLog';

// Сессия и привязка кабинета к учётной записи (1.15).
// Кабинет (роль и уровень иерархии) определяется аутентифицированной учётной
// записью, а не свободным переключателем. Демо-переключение ролей доступно
// только в режиме разработки (import.meta.env.DEV).

export const DEMO_SWITCHER_ENABLED: boolean = Boolean(import.meta.env?.DEV);

const STORAGE_KEY = 'bso_session_user';

type Listener = () => void;
const listeners = new Set<Listener>();

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

let authedUserId: string | null = null;

const notify = () => listeners.forEach((l) => l());

const restore = (): void => {
  if (!isBrowser) return;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;
  const user = mockUsers.find((u) => u.id === stored);
  if (user) {
    authedUserId = user.id;
    setCurrentUser(user);
  }
};

restore();

export function isAuthenticated(): boolean {
  return authedUserId !== null;
}

export function getSessionUser(): User | null {
  if (!authedUserId) return null;
  return mockUsers.find((u) => u.id === authedUserId) ?? null;
}

export function login(userId: string): boolean {
  const user = mockUsers.find((u) => u.id === userId);
  if (!user) return false;
  authedUserId = user.id;
  setCurrentUser(user);
  if (isBrowser) localStorage.setItem(STORAGE_KEY, user.id);
  logActivity({
    category: 'auth',
    action: 'Вход в систему',
    details: `${roleNames[user.role]} · аутентификация через домен`,
  });
  notify();
  return true;
}

export function logout(): void {
  logActivity({ category: 'auth', action: 'Выход из системы' });
  authedUserId = null;
  if (isBrowser) localStorage.removeItem(STORAGE_KEY);
  notify();
}

// Переключение кабинета внутри одной сессии — только в режиме разработки.
export function devSwitchAccount(userId: string): boolean {
  if (!DEMO_SWITCHER_ENABLED) return false;
  const user = mockUsers.find((u) => u.id === userId);
  if (!user) return false;
  authedUserId = user.id;
  setCurrentUser(user);
  if (isBrowser) localStorage.setItem(STORAGE_KEY, user.id);
  notify();
  return true;
}

export function getBoundCabinetPath(): string[] {
  const cabinet = findCabinetByUserId(currentUser.id);
  return cabinet ? getCabinetPathLabels(cabinet.id) : [];
}

export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
