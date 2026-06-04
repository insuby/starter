import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, Building2, Settings } from 'lucide-react';
import { fetchDashboardSummary } from '../lib/api';
import { useAsync } from '../lib/useAsync';

export function AdminPage() {
  // Берём «Всего бланков» из того же серверного источника, что и дашборд,
  // чтобы числа не расходились.
  const summary = useAsync((signal) => fetchDashboardSummary(undefined, signal), []);
  const totalBlanks = summary.data?.total;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Администрирование</h2>
        <p className="text-gray-600">Управление системой</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-gray-50">
          <CardContent className="p-6">
            <Users className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold mb-1">Пользователи</h3>
            <p className="text-sm text-gray-600">Управление пользователями и ролями</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-gray-50">
          <CardContent className="p-6">
            <Building2 className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold mb-1">Организации</h3>
            <p className="text-sm text-gray-600">Управление структурой военкоматов</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-gray-50">
          <CardContent className="p-6">
            <Settings className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold mb-1">Настройки</h3>
            <p className="text-sm text-gray-600">Конфигурация системы</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Статистика системы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-gray-700">Всего пользователей</p>
              <p className="text-2xl font-bold text-blue-600">127</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-gray-700">Активных военкоматов</p>
              <p className="text-2xl font-bold text-green-600">45</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4">
              <p className="text-sm text-gray-700">Всего бланков</p>
              <p className="text-2xl font-bold text-purple-600">
                {summary.error
                  ? '—'
                  : totalBlanks === undefined
                    ? '…'
                    : totalBlanks.toLocaleString('ru-RU')}
              </p>
            </div>
            <div className="rounded-lg bg-orange-50 p-4">
              <p className="text-sm text-gray-700">Операций за месяц</p>
              <p className="text-2xl font-bold text-orange-600">1,248</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
