import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LogIn, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import { mockUsers, roleNames, findCabinetByUserId, getCabinetPathLabels } from '../data/mockData';
import { login, loginWithPassword, isAuthGateEnabled, setAuthGateEnabled } from '../lib/session';
import { testAccounts } from '../lib/credentials';

interface LoginPageProps {
  onLoggedIn: () => void;
}

export function LoginPage({ onLoggedIn }: LoginPageProps) {
  const [gateEnabled, setGateEnabled] = useState<boolean>(isAuthGateEnabled());

  // Режим входа по логину и паролю.
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Режим отладки: быстрый выбор кабинета без пароля.
  const [selectedId, setSelectedId] = useState<string>(mockUsers[0]?.id ?? '');
  const selectedUser = mockUsers.find((u) => u.id === selectedId);
  const cabinet = selectedUser ? findCabinetByUserId(selectedUser.id) : undefined;
  const cabinetPath = cabinet ? getCabinetPathLabels(cabinet.id) : [];

  const toggleGate = (enabled: boolean) => {
    setAuthGateEnabled(enabled);
    setGateEnabled(enabled);
    setError(null);
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Введите логин и пароль');
      return;
    }
    if (loginWithPassword(username, password)) {
      onLoggedIn();
    } else {
      setError('Неверный логин или пароль');
    }
  };

  const handleQuickLogin = () => {
    if (!selectedId) return;
    if (login(selectedId)) {
      onLoggedIn();
    }
  };

  // Подписи учётных записей для подсказки (роль + кабинет, если есть).
  const accountHints = testAccounts.map((acc) => {
    const user = mockUsers.find((u) => u.id === acc.userId);
    const cab = user ? findCabinetByUserId(user.id) : undefined;
    const label = cab?.label ?? (user ? roleNames[user.role] : acc.userId);
    return { ...acc, label };
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white">
            <span className="text-xl font-bold">БСО</span>
          </div>
          <div>
            <CardTitle className="text-xl">Портал военкоматов</CardTitle>
            <p className="mt-1 text-sm text-gray-600">Учёт бланков строгой отчётности</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {gateEnabled ? (
            <form className="space-y-5" onSubmit={handlePasswordLogin}>
              <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-sm text-gray-700">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <span>Вход по логину и паролю. Используйте выданные тестовые учётные записи.</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Логин</Label>
                <Input
                  id="username"
                  autoFocus
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  placeholder="Например, center"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={!username || !password}>
                <LogIn className="mr-2 h-4 w-4" />
                Войти
              </Button>

              <details className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                <summary className="cursor-pointer select-none text-gray-700">
                  Тестовые учётные записи (по одной на уровень)
                </summary>
                <ul className="mt-2 space-y-1">
                  {accountHints.map((acc) => (
                    <li key={acc.userId} className="flex items-baseline justify-between gap-2">
                      <span className="text-gray-500">{acc.label}</span>
                      <span className="font-mono text-gray-900">
                        {acc.username} / {acc.password}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/70 p-3 text-sm text-gray-700">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>Режим отладки: вход без пароля, быстрый выбор кабинета.</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account">Учётная запись</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger id="account">
                    <SelectValue placeholder="Выберите учётную запись" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} — {roleNames[u.role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUser && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                  <div className="text-gray-900">
                    <span className="text-gray-500">Роль: </span>
                    {roleNames[selectedUser.role]}
                  </div>
                  <div className="mt-1 text-gray-900">
                    <span className="text-gray-500">Кабинет: </span>
                    {cabinetPath.length > 0 ? cabinetPath.join(' → ') : '— (вне иерархии кабинетов)'}
                  </div>
                </div>
              )}

              <Button className="w-full" onClick={handleQuickLogin} disabled={!selectedId}>
                <LogIn className="mr-2 h-4 w-4" />
                Войти
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white p-3">
            <div>
              <Label htmlFor="auth-gate" className="text-sm text-gray-900">
                Вход через авторизацию
              </Label>
              <p className="text-xs text-gray-500">
                {gateEnabled ? 'Требуется логин и пароль' : 'Отключено — быстрый вход для отладки'}
              </p>
            </div>
            <Switch id="auth-gate" checked={gateEnabled} onCheckedChange={toggleGate} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
