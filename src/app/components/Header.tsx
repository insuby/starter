import { useNavigate } from 'react-router';
import { Bell, User as UserIcon, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import {
  currentUser,
  roleNames,
  mockUsers,
  blankTypeShortLabels,
  getHomeRouteForUser,
  type User,
  type UserRole,
} from '../data/mockData';
import { fetchInventory, fetchPendingSignatures } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { DEMO_SWITCHER_ENABLED, devSwitchAccount, logout } from '../lib/session';

const OPERATOR_ROLES: UserRole[] = [
  'vkmo_operator',
  'center_operator',
  'district_operator',
  'subject_operator',
];

interface HeaderProps {
  onUserChange?: () => void;
}

export function Header({ onUserChange }: HeaderProps) {
  const navigate = useNavigate();

  // Остаток «в обороте» по типам. Оператор ВК МО — только свой ВК; центр/
  // район/субъект — вся подведомственная область (без scope).
  const inventoryState = useAsync(
    (signal) =>
      fetchInventory(
        currentUser.role === 'vkmo_operator' ? currentUser.vkmo_id : undefined,
        signal,
      ),
    [currentUser.id, currentUser.vkmo_id],
  );

  // Бейдж «на подписании» для оператора ВК МО / уполномоченного.
  const pendingState = useAsync(
    (signal) => fetchPendingSignatures(currentUser.vkmo_id, signal),
    [currentUser.id, currentUser.vkmo_id],
  );

  const showOperatorInventory = OPERATOR_ROLES.includes(currentUser.role);
  // Пока грузится или при ошибке — прячем полоску остатка (не валимся).
  const inventory =
    showOperatorInventory && !inventoryState.loading && !inventoryState.error
      ? inventoryState.data
      : null;

  const pendingSignaturesCount = pendingState.data?.length ?? 0;
  const showPendingSignaturesBell =
    (currentUser.role === 'vkmo_operator' || currentUser.role === 'commissioner') &&
    pendingSignaturesCount > 0;

  const handleUserSwitch = (user: User) => {
    if (!devSwitchAccount(user.id)) return;
    onUserChange?.();
    navigate(getHomeRouteForUser(user));
  };

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <span className="text-lg font-bold">БСО</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Портал военкоматов</h1>
            <p className="text-sm text-gray-600">Учет бланков строгой отчетности</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {showOperatorInventory && inventory && (
            <div className="flex max-w-[min(100vw-12rem,22rem)] flex-col items-end text-right">
              <span className="text-xs font-semibold text-gray-900">Остаток: </span>
              <div className="mt-0.5 flex flex-wrap justify-end gap-x-2 gap-y-0.5 text-[11px] text-gray-600">
                <span>
                  {blankTypeShortLabels.military_id}: {inventory.byType.military_id}
                </span>
                <span className="text-gray-300">·</span>
                <span>
                  {blankTypeShortLabels.certificate}: {inventory.byType.certificate}
                </span>
                <span className="text-gray-300">·</span>
                <span>
                  {blankTypeShortLabels.credential}: {inventory.byType.credential}
                </span>
              </div>
            </div>
          )}
          {showPendingSignaturesBell && (
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={() => navigate('/signatures')}
              title="На подписании"
            >
              <Bell className="h-5 w-5" />
              {pendingSignaturesCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-2 -top-2 h-5 min-w-5 rounded-full px-1 text-xs"
                >
                  {pendingSignaturesCount}
                </Badge>
              )}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">{currentUser.name}</div>
                  <div className="text-xs text-gray-600">{roleNames[currentUser.role]}</div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Мой профиль</DropdownMenuLabel>
              <DropdownMenuLabel className="pt-0 text-xs font-normal text-gray-600">
                {currentUser.name} · {roleNames[currentUser.role]}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {DEMO_SWITCHER_ENABLED && (
                <>
                  <DropdownMenuLabel className="text-xs font-normal text-amber-600">
                    Переключить роль (режим разработки):
                  </DropdownMenuLabel>
                  {mockUsers.map((user) => (
                    <DropdownMenuItem
                      key={user.id}
                      onClick={() => handleUserSwitch(user)}
                      className={currentUser.id === user.id ? 'bg-blue-50' : ''}
                    >
                      <div>
                        <div className="text-sm">{user.name}</div>
                        <div className="text-xs text-gray-600">{roleNames[user.role]}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem className="text-red-600" onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => logout()}
            title="Выйти из учётной записи"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </Button>
        </div>
      </div>
    </header>
  );
}
