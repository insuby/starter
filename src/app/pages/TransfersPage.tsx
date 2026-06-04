import { useState } from 'react';
import { Navigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { currentUser, isVkSubjectOperator, type BlankType } from '../data/mockData';
import {
  fetchOrgUnits,
  orgChildren,
  fetchBlanks,
  fetchOperations,
  createTransfer,
  ApiError,
} from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { toast } from 'sonner';

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

export const TransfersPage = () => {
  if (!isVkSubjectOperator(currentUser)) {
    return <Navigate to="/distribution" replace />;
  }

  const fromOrg = currentUser.vk_subject_id as string;

  const [recipient, setRecipient] = useState('');
  const [count, setCount] = useState('');
  const [type, setType] = useState<BlankType | 'any'>('any');
  const [refresh, setRefresh] = useState(0);

  // Прямые дочерние орг-узлы субъекта — получатели передачи.
  const orgUnits = useAsync((signal) => fetchOrgUnits(signal), []);
  const recipients = orgUnits.data ? orgChildren(orgUnits.data, fromOrg) : [];

  // Остаток «в обороте» у субъекта — сколько можно передать.
  const available = useAsync(
    (signal) =>
      fetchBlanks({ page: 1, per_page: 1, status: 'in_circulation', vkmo_id: fromOrg }, signal),
    [refresh],
  );
  const availableCount = available.data?.total ?? 0;

  // Последние перемещения.
  const transfers = useAsync((signal) => fetchOperations({ type: 'transfer' }, signal), [refresh]);
  const recentTransfers = (transfers.data ?? []).slice(0, 10);

  const handleTransfer = async () => {
    if (!recipient) {
      toast.error('Выберите получателя');
      return;
    }
    const parsedCount = Number.parseInt(count, 10);
    if (!Number.isFinite(parsedCount) || parsedCount <= 0) {
      toast.error('Укажите количество бланков');
      return;
    }

    try {
      const result = await createTransfer({
        from_org_unit_id: fromOrg,
        to_org_unit_id: recipient,
        operator_id: currentUser.id,
        count: parsedCount,
        type: type === 'any' ? undefined : type,
        reason: 'Распределение бланков',
      });
      toast.success('Передано бланков: ' + result.moved_count);
      setRecipient('');
      setCount('');
      setType('any');
      setRefresh((x) => x + 1);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error('Не удалось выполнить операцию');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Перемещения</h2>
        <p className="text-gray-600">Передача бланков между организациями</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Новое перемещение</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {orgUnits.error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>Не удалось загрузить получателей: {orgUnits.error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="recipient">Получатель</Label>
            <Select value={recipient} onValueChange={setRecipient}>
              <SelectTrigger id="recipient">
                <SelectValue placeholder={orgUnits.loading ? 'Загрузка…' : 'Выберите получателя'} />
              </SelectTrigger>
              <SelectContent>
                {recipients.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="count">Количество</Label>
              <Input
                id="count"
                type="number"
                min={1}
                placeholder="50"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Тип бланка</Label>
              <Select value={type} onValueChange={(value) => setType(value as BlankType | 'any')}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Любой тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Любой тип</SelectItem>
                  <SelectItem value="military_id">Военный билет</SelectItem>
                  <SelectItem value="certificate">Справка</SelectItem>
                  <SelectItem value="credential">Удостоверение</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-gray-700">
              Доступно для передачи:{' '}
              <span className="font-semibold">
                {available.loading && !available.data ? 'Загрузка…' : availableCount}
              </span>{' '}
              бланков
            </p>
          </div>

          <Button className="w-full" size="lg" onClick={handleTransfer}>
            <ArrowRight className="mr-2 h-4 w-4" />
            Передать бланки
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Последние перемещения</CardTitle>
        </CardHeader>
        <CardContent>
          {transfers.error ? (
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>Не удалось загрузить перемещения: {transfers.error}</span>
            </div>
          ) : transfers.loading && !transfers.data ? (
            <p className="text-sm text-gray-600">Загрузка…</p>
          ) : recentTransfers.length === 0 ? (
            <p className="text-sm text-gray-600">Перемещений пока нет</p>
          ) : (
            <div className="space-y-4">
              {recentTransfers.map((op) => (
                <div key={op.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">{op.blank_number || op.reason}</p>
                    <p className="text-sm text-gray-600">{op.to_location || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">{formatDate(op.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
