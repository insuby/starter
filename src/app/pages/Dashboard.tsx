import { Navigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, FileCheck, Clock, FileX, AlertCircle } from 'lucide-react';
import { currentUser, getHomeRouteForUser } from '../data/mockData';
import { fetchDashboardSummary, fetchOperationsChart } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const Dashboard = () => {
  const summary = useAsync((signal) => fetchDashboardSummary(undefined, signal), []);
  const chart = useAsync((signal) => fetchOperationsChart({ days: 7 }, signal), []);

  // Гард роли — после вызова всех хуков (правило react-hooks/rules-of-hooks).
  if (currentUser.role !== 'center_operator') {
    return <Navigate to={getHomeRouteForUser(currentUser)} replace />;
  }

  const stats = summary.data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Дашборд</h2>
        <p className="text-gray-600">Общая статистика по бланкам</p>
      </div>

      {summary.error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>Не удалось загрузить статистику: {summary.error}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="В обороте"
          icon={<FileText className="h-4 w-4 text-green-600" />}
          value={stats?.in_circulation}
          loading={summary.loading}
          hint="Доступно для выдачи"
          color="text-green-600"
        />
        <StatCard
          title="Выдано"
          icon={<FileCheck className="h-4 w-4 text-blue-600" />}
          value={stats?.issued}
          loading={summary.loading}
          hint="У граждан на руках"
          color="text-blue-600"
        />
        <StatCard
          title="На удержании"
          icon={<Clock className="h-4 w-4 text-yellow-600" />}
          value={stats?.on_hold}
          loading={summary.loading}
          hint="Временное хранение"
          color="text-yellow-600"
        />
        <StatCard
          title="Списано"
          icon={<FileX className="h-4 w-4 text-gray-600" />}
          value={stats?.written_off}
          loading={summary.loading}
          hint="Выведено из оборота"
          color="text-gray-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Операции за последние 7 дней</CardTitle>
        </CardHeader>
        <CardContent>
          {chart.error ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-gray-500">
              Не удалось загрузить график: {chart.error}
            </div>
          ) : chart.loading && !chart.data ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-gray-500">
              Загрузка графика…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chart.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="выдача" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="возврат" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="списание" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface StatCardProps {
  title: string;
  icon: React.ReactNode;
  value: number | undefined;
  loading: boolean;
  hint: string;
  color: string;
}

function StatCard({ title, icon, value, loading, hint, color }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>
          {loading && value === undefined ? (
            <span className="text-gray-300">…</span>
          ) : (
            (value ?? 0).toLocaleString('ru-RU')
          )}
        </div>
        <p className="text-xs text-gray-600">{hint}</p>
      </CardContent>
    </Card>
  );
}
