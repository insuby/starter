import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Search, Filter, AlertCircle } from 'lucide-react';
import {
  currentUser,
  blankTypeNames,
  placeNames,
  type BlankPlace,
  type BlankStatus,
  type BlankType,
} from '../data/mockData';
import { fetchBlanks } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { PlaceBadge } from '../components/PlaceBadge';
import { StatusBadge } from '../components/StatusBadge';
import { TablePagination } from '../components/TablePagination';

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export function BlanksPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BlankStatus | 'all'>('all');
  const [placeFilter, setPlaceFilter] = useState<BlankPlace | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<BlankType | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const navigate = useNavigate();

  // Дебаунс ввода поиска, чтобы не дёргать сервер на каждый символ.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Любая смена фильтра/поиска возвращает на первую страницу.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, placeFilter, typeFilter, pageSize]);

  // Оператор ВК МО видит свой ВК; при активном поиске по номеру снимаем
  // ограничение, чтобы найти бланк в любом ВК (как раньше — только чтение).
  const vkmoScope =
    currentUser.role === 'vkmo_operator' && !search ? currentUser.vkmo_id : undefined;

  const result = useAsync(
    (signal) =>
      fetchBlanks(
        {
          page,
          per_page: pageSize,
          status: statusFilter === 'all' ? undefined : statusFilter,
          type: typeFilter === 'all' ? undefined : typeFilter,
          place: placeFilter === 'all' ? undefined : placeFilter,
          search: search || undefined,
          vkmo_id: vkmoScope,
        },
        signal,
      ),
    [page, pageSize, statusFilter, typeFilter, placeFilter, search, vkmoScope],
  );

  const blanks = result.data?.data ?? [];
  const total = result.data?.total ?? 0;
  const hasFilters =
    !!search || statusFilter !== 'all' || placeFilter !== 'all' || typeFilter !== 'all';

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatusFilter('all');
    setPlaceFilter('all');
    setTypeFilter('all');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Бланки</h2>
        <p className="text-gray-600">Управление и просмотр всех бланков</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фильтры и поиск</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Поиск по номеру бланка..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as BlankStatus | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="in_circulation">В обороте</SelectItem>
                <SelectItem value="issued">Выдан</SelectItem>
                <SelectItem value="on_hold">На удержании</SelectItem>
                <SelectItem value="written_off">Списан (архив)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as BlankType | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="military_id">Военный билет</SelectItem>
                <SelectItem value="certificate">Справка</SelectItem>
                <SelectItem value="credential">Удостоверение</SelectItem>
              </SelectContent>
            </Select>

            <Select value={placeFilter} onValueChange={(value) => setPlaceFilter(value as BlankPlace | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Где находится" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все места</SelectItem>
                {(Object.keys(placeNames) as BlankPlace[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {placeNames[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span>
              {result.error
                ? '—'
                : result.loading && !result.data
                  ? 'Загрузка…'
                  : `Найдено бланков: ${total.toLocaleString('ru-RU')}`}
            </span>
            {hasFilters && (
              <Button variant="link" size="sm" onClick={resetFilters}>
                Сбросить фильтры
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3">
          {result.error ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>Не удалось загрузить бланки: {result.error}</span>
            </div>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Номер</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Где находится</TableHead>
                    <TableHead>Владелец</TableHead>
                    <TableHead>Последнее изменение</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blanks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-gray-600">
                        {result.loading ? 'Загрузка…' : 'Бланки не найдены'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    blanks.map((blank) => {
                      const isOwnBlank =
                        currentUser.role !== 'vkmo_operator' || blank.vkmo_id === currentUser.vkmo_id;
                      return (
                        <TableRow
                          key={blank.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => navigate(`/blanks/${blank.id}`)}
                        >
                          <TableCell className="font-medium">{blank.number}</TableCell>
                          <TableCell>{blankTypeNames[blank.type]}</TableCell>
                          <TableCell>
                            <StatusBadge status={blank.status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <PlaceBadge place={blank.place} />
                              <span className="text-xs text-gray-600">{blank.location}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{blank.owner_name || '—'}</TableCell>
                          <TableCell className="text-sm text-gray-600">{formatDate(blank.updated_at)}</TableCell>
                          <TableCell>
                            {!isOwnBlank && <span className="text-xs text-gray-500">Другой ВК</span>}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {total > 0 && (
                <TablePagination
                  total={total}
                  page={page}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
