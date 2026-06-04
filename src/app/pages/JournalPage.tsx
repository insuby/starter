import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Search, Download, ScrollText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { currentUser, getHomeRouteForUser, roleNames } from '../data/mockData';
import { fetchAudit, type AuditEntry } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { TablePagination } from '../components/TablePagination';
import { exportToExcel } from '../lib/exportTable';

// Подписи категорий аудита (серверные строки -> ru). Список открытый: для
// неизвестной категории показываем сырую строку.
const categoryLabels: Record<string, string> = {
  receipt: 'Поступление',
  transfer: 'Распределение',
  operation: 'Операции',
  signature: 'Подписание ЭЦП',
  report: 'Отчёты',
  distribution: 'Распределение',
  blank: 'Бланки',
  auth: 'Вход / выход',
  admin: 'Администрирование',
};

const categoryLabel = (category: string) => categoryLabels[category] ?? category;

const categoryBadgeClass: Record<string, string> = {
  receipt: 'bg-cyan-100 text-cyan-700',
  transfer: 'bg-violet-100 text-violet-700',
  operation: 'bg-indigo-100 text-indigo-700',
  signature: 'bg-emerald-100 text-emerald-700',
  report: 'bg-amber-100 text-amber-700',
  distribution: 'bg-violet-100 text-violet-700',
  blank: 'bg-blue-100 text-blue-700',
  auth: 'bg-slate-100 text-slate-700',
  admin: 'bg-rose-100 text-rose-700',
};

const DEFAULT_BADGE_CLASS = 'bg-gray-100 text-gray-700';

const roleLabel = (role: AuditEntry['role']) => (role ? roleNames[role] : '—');

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export function JournalPage() {
  const [refresh] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Аудит компактен: тянем до 200 записей и фильтруем/пагинируем на клиенте,
  // чтобы сохранить прежний UX (поиск, фильтры, страницы).
  const audit = useAsync((signal) => fetchAudit({ page: 1, per_page: 200 }, signal), [refresh]);
  const entries = useMemo(() => audit.data?.data ?? [], [audit.data]);

  // Категории строим из реально присутствующих в записях значений.
  const categories = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => set.add(e.category));
    return Array.from(set).sort();
  }, [entries]);

  const users = useMemo(() => {
    const map = new Map<string, string>();
    entries.forEach((e) => {
      if (e.user_id) map.set(e.user_id, e.user_name ?? e.user_id);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [entries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (userFilter !== 'all' && e.user_id !== userFilter) return false;
      if (q) {
        const hay = `${e.action} ${e.target ?? ''} ${e.details ?? ''} ${e.user_name ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, search, categoryFilter, userFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, userFilter, pageSize]);

  // Журнал доступен оператору центра и аудитору. Гард — после всех хуков
  // (правило react-hooks/rules-of-hooks).
  if (currentUser.role !== 'center_operator' && currentUser.role !== 'auditor') {
    return <Navigate to={getHomeRouteForUser(currentUser)} replace />;
  }

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error('Нет записей для выгрузки');
      return;
    }
    exportToExcel(
      { title: 'Журнал действий пользователей', subtitle: `Записей: ${filtered.length}` },
      [
        { key: 'date', title: 'Дата и время' },
        { key: 'user', title: 'Пользователь' },
        { key: 'role', title: 'Роль' },
        { key: 'category', title: 'Категория' },
        { key: 'action', title: 'Действие' },
        { key: 'target', title: 'Объект' },
        { key: 'details', title: 'Детали' },
      ],
      filtered.map((e) => ({
        date: formatDateTime(e.at),
        user: e.user_name ?? '—',
        role: roleLabel(e.role),
        category: categoryLabel(e.category),
        action: e.action,
        target: e.target ?? '',
        details: e.details ?? '',
      })),
    );
    toast.success('Журнал выгружен в Excel');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Журнал действий</h2>
        <p className="text-gray-600">Действия пользователей в интерфейсе системы</p>
      </div>

      {audit.error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>Не удалось загрузить журнал: {audit.error}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Поиск по действию, объекту, пользователю..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Категория</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {categoryLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Пользователь</Label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все пользователи</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {audit.error
                ? '—'
                : audit.loading && !audit.data
                  ? 'Загрузка…'
                  : `Найдено записей: ${filtered.length}`}
            </span>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Экспорт в Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Дата и время</TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Действие</TableHead>
                <TableHead>Объект</TableHead>
                <TableHead>Детали</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-gray-500">
                    <ScrollText className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    {audit.loading && !audit.data ? 'Загрузка…' : 'Записи не найдены'}
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-sm text-gray-600">
                      {formatDateTime(e.at)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900">{e.user_name ?? '—'}</div>
                      <div className="text-xs text-gray-500">{roleLabel(e.role)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={categoryBadgeClass[e.category] ?? DEFAULT_BADGE_CLASS}
                      >
                        {categoryLabel(e.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{e.action}</TableCell>
                    <TableCell className="font-mono text-sm">{e.target ?? '—'}</TableCell>
                    <TableCell className="max-w-[280px] text-xs text-gray-600">{e.details ?? '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {filtered.length > 0 && (
            <TablePagination
              total={filtered.length}
              page={safePage}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
