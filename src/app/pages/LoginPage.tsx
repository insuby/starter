import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LogIn, ShieldCheck } from 'lucide-react';
import { mockUsers, roleNames, findCabinetByUserId, getCabinetPathLabels } from '../data/mockData';
import { login, DEMO_SWITCHER_ENABLED } from '../lib/session';

interface LoginPageProps {
  onLoggedIn: () => void;
}

export function LoginPage({ onLoggedIn }: LoginPageProps) {
  const [selectedId, setSelectedId] = useState<string>(mockUsers[0]?.id ?? '');

  const selectedUser = mockUsers.find((u) => u.id === selectedId);
  const cabinet = selectedUser ? findCabinetByUserId(selectedUser.id) : undefined;
  const cabinetPath = cabinet ? getCabinetPathLabels(cabinet.id) : [];

  const handleLogin = () => {
    if (!selectedId) return;
    if (login(selectedId)) {
      onLoggedIn();
    }
  };

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
          <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-sm text-gray-700">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <span>
              Вход выполняется через доменную учётную запись (UAC). Кабинет и права
              определяются учётной записью.
            </span>
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
            {!DEMO_SWITCHER_ENABLED && (
              <p className="text-xs text-gray-500">
                В продуктивной среде учётная запись подставляется доменом автоматически.
              </p>
            )}
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

          <Button className="w-full" onClick={handleLogin} disabled={!selectedId}>
            <LogIn className="mr-2 h-4 w-4" />
            Войти
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
