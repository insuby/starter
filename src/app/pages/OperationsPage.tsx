import { useEffect, useState } from 'react';
import type { ElementType } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  ArrowLeft,
  HandHelping,
  Archive,
  RotateCcw,
  RefreshCw,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import {
  currentUser,
  operationReasons,
  formatBlankCountRu,
  type OperationType,
  type Blank,
  blankTypeNames,
  type BlankStatus,
  type BlankType,
  type CitizenLookup,
} from '../data/mockData';
import { ApiError, createOperation, fetchBlanks, fetchCitizens, fetchInventory } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { PlaceBadge } from '../components/PlaceBadge';
import { StatusBadge } from '../components/StatusBadge';
import { cn } from '../components/ui/utils';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { toast } from 'sonner';

// Статусы бланка, допустимые к выбору для каждого типа операции.
const ALLOWED_STATUSES: Partial<Record<OperationType, BlankStatus[]>> = {
  storage: ['issued', 'on_hold'],
  return: ['issued', 'on_hold'],
  replacement: ['issued', 'on_hold'],
  write_off: ['in_circulation', 'on_hold'],
};

const OPERATION_CONFIG: { type: OperationType; label: string; description: string; icon: ElementType }[] = [
  { type: 'issue', label: 'Выдача', description: 'Выдать бланк гражданину', icon: HandHelping },
  { type: 'storage', label: 'Сдача на хранение', description: 'Принять бланк на хранение', icon: Archive },
  { type: 'return', label: 'Возврат', description: 'Возврат бланка гражданином', icon: RotateCcw },
  { type: 'replacement', label: 'Замена', description: 'Заменить старый бланк на новый', icon: RefreshCw },
  { type: 'write_off', label: 'Списание', description: 'Списать бланк', icon: Trash2 },
];

const BLANK_TYPES: BlankType[] = ['military_id', 'certificate', 'credential'];

export function OperationsPage() {
  const [step, setStep] = useState(2);
  const [operationType, setOperationType] = useState<OperationType | ''>('');
  const [issueBlankType, setIssueBlankType] = useState<BlankType | ''>('');
  const [reason, setReason] = useState('');
  const [selectedBlank, setSelectedBlank] = useState('');
  const [newBlankNumber, setNewBlankNumber] = useState('');
  const [citizenSearchQuery, setCitizenSearchQuery] = useState('');
  const [issueRecipient, setIssueRecipient] = useState<CitizenLookup | null>(null);
  const [issueConfirmOpen, setIssueConfirmOpen] = useState(false);
  const [operatorComment, setOperatorComment] = useState('');
  const [refresh, setRefresh] = useState(0);

  const vk = currentUser.vkmo_id;

  // Остаток «в обороте» по типам + первый бланк каждого типа (для выдачи из пула).
  const inventory = useAsync((signal) => fetchInventory(vk, signal), [vk, refresh]);
  const issueStockByType = inventory.data?.byType;
  const nextPooledBlank =
    operationType === 'issue' && issueBlankType
      ? inventory.data?.firstByType[issueBlankType] ?? null
      : null;

  // Дебаунс ввода поиска гражданина (300 мс), затем запрос к серверу.
  const [citizenQuery, setCitizenQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setCitizenQuery(citizenSearchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [citizenSearchQuery]);

  const citizens = useAsync(
    (signal) => (citizenQuery.length === 0 ? Promise.resolve([]) : fetchCitizens(citizenQuery, signal)),
    [citizenQuery],
  );
  const citizenSearchResults = citizens.data ?? [];

  // Бланки, доступные к выбору для текущего типа операции (scope = ВК оператора).
  // Серверный фильтр статуса одиночный — собираем по каждому допустимому статусу и склеиваем.
  const availableResult = useAsync(
    async (signal) => {
      const statuses = operationType ? ALLOWED_STATUSES[operationType] : undefined;
      if (!statuses) return [] as Blank[];
      const pages = await Promise.all(
        statuses.map((status) => fetchBlanks({ page: 1, per_page: 200, status, vkmo_id: vk }, signal)),
      );
      return pages.flatMap((p) => p.data);
    },
    [operationType, vk, refresh],
  );
  const availableBlanks = availableResult.data ?? [];

  const blockOpen = operationType !== '';

  const resetIssueFields = () => {
    setIssueBlankType('');
    setReason('');
    setSelectedBlank('');
    setNewBlankNumber('');
    setCitizenSearchQuery('');
    setIssueRecipient(null);
    setIssueConfirmOpen(false);
    setOperatorComment('');
  };

  const openBlock = (type: OperationType) => {
    setOperationType(type);
    setStep(2);
    resetIssueFields();
  };

  const switchType = (type: OperationType) => {
    setOperationType(type);
    setStep(2);
    resetIssueFields();
  };

  const handleNext = () => {
    if (!operationType) return;

    if (operationType === 'issue') {
      if (step === 2 && !issueBlankType) {
        toast.error('Выберите тип бланка');
        return;
      }
      if (step === 3) {
        if (!reason) {
          toast.error('Выберите причину');
          return;
        }
        if (!nextPooledBlank) {
          toast.error('Нет бланков выбранного типа в пуле');
          return;
        }
      }
      if (step === 4) return;
      setStep(step + 1);
      return;
    }

    if (step === 2 && !reason) {
      toast.error('Выберите причину');
      return;
    }
    if (step === 3) {
      if (!selectedBlank) {
        toast.error('Выберите бланк');
        return;
      }
      if (operationType === 'replacement' && !newBlankNumber) {
        toast.error('Укажите номер нового бланка');
        return;
      }
      handleSubmit();
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!operationType || operationType === 'issue' || !selectedBlank) return;
    const comment =
      operationType === 'replacement' && newBlankNumber.trim()
        ? `Новый бланк: ${newBlankNumber.trim()}`
        : undefined;
    try {
      const result = await createOperation({
        blank_id: selectedBlank,
        type: operationType,
        operator_id: currentUser.id,
        reason,
        comment,
        operator_comment: operatorComment.trim() || undefined,
      });
      toast.success(
        result.requires_signature
          ? 'Операция отправлена комиссару на подпись'
          : 'Операция зарегистрирована',
      );
      setRefresh((x) => x + 1);
      closeBlock();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error('Не удалось выполнить операцию');
    }
  };

  const submitIssueAfterConfirm = async () => {
    if (!nextPooledBlank || !issueRecipient) return;
    setIssueConfirmOpen(false);
    try {
      const result = await createOperation({
        blank_id: nextPooledBlank.id,
        type: 'issue',
        operator_id: currentUser.id,
        reason,
        owner_id: issueRecipient.id,
        operator_comment: operatorComment.trim() || undefined,
      });
      toast.success(
        result.requires_signature
          ? 'Операция отправлена комиссару на подпись'
          : 'Операция зарегистрирована',
      );
      setRefresh((x) => x + 1);
      closeBlock();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error('Не удалось выполнить операцию');
    }
  };

  const openIssueConfirm = (recipient: CitizenLookup) => {
    setIssueRecipient(recipient);
    setIssueConfirmOpen(true);
  };

  const closeBlock = () => {
    setOperationType('');
    setStep(2);
    resetIssueFields();
  };

  const progressText =
    operationType === 'issue' ? `Шаг ${step - 1} из 3` : `Шаг ${step - 1} из 2`;

  const isPrimarySubmit = operationType !== 'issue' && step === 3;

  const showFooterPrimary = operationType !== 'issue' || step < 4;

  if (currentUser.role !== 'vkmo_operator') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Операции</h2>
          <p className="text-gray-600">Эта страница доступна только операторам ВК МО</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">

        <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-medium uppercase tracking-wider text-gray-500">Доступные операции</h3>
          <p className="mb-6 text-gray-600">Нажмите на нужный тип — блок с формой появится ниже</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {OPERATION_CONFIG.map(({ type, label, description, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => openBlock(type)}
                className={`group flex flex-col items-start gap-2 rounded-xl border-2 p-5 text-left shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  operationType === type
                    ? 'border-blue-500 bg-blue-50 shadow-[inset_0_0_0_1px_#93c5fd]'
                    : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-md'
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                    operationType === type ? 'bg-blue-200 text-blue-700' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-semibold text-gray-900">{label}</span>
                <span className="text-sm text-gray-500">{description}</span>
              </button>
            ))}
          </div>
        </div>

        {blockOpen && operationType && (
          <Card className="overflow-hidden border-2 border-blue-100 bg-white shadow-md">
            <CardHeader className="border-b bg-gray-50/80 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Новая операция</CardTitle>
                  <span className="text-sm text-gray-500">{progressText}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {OPERATION_CONFIG.map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => switchType(type)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-all ${
                        operationType === type
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-[inset_0_0_0_1px_#93c5fd] hover:bg-blue-100'
                          : 'border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {operationType === 'issue' && step === 2 && (
                <div className="space-y-4">
                  <Label>Тип бланка</Label>
                  <p className="text-sm text-gray-600">
                    Сначала выберите тип — затем причину выдачи и получателя; бланк подставится из пула автоматически
                  </p>
                  {inventory.error && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Не удалось загрузить остатки: {inventory.error}</AlertDescription>
                    </Alert>
                  )}
                  {!issueStockByType ? (
                    <p className="text-sm text-gray-500">Загрузка…</p>
                  ) : (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {BLANK_TYPES.map((t) => {
                      const count = issueStockByType[t];
                      const noStock = count === 0;
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={noStock}
                          onClick={() => {
                            if (noStock) return;
                            setIssueBlankType(t);
                          }}
                          className={cn(
                            'rounded-xl border-2 p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
                            noStock
                              ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-60'
                              : issueBlankType === t
                                ? 'border-blue-500 bg-blue-50 shadow-[inset_0_0_0_1px_#93c5fd] focus:ring-blue-500'
                                : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/50 focus:ring-blue-500',
                          )}
                        >
                          <span className="font-semibold text-gray-900">{blankTypeNames[t]}</span>
                          <p className={cn('mt-2 text-sm', noStock ? 'text-gray-400' : 'text-gray-600')}>
                            {noStock ? (
                              'Нет в обороте'
                            ) : (
                              <>
                                Остаток —{' '}
                                <span className="font-medium text-gray-900">{formatBlankCountRu(t, count)}</span>
                              </>
                            )}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  )}
                </div>
              )}

              {operationType === 'issue' && step === 3 && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
                    <p className="text-sm font-medium text-gray-900">Бланк из пула</p>
                    {nextPooledBlank ? (
                      <p className="mt-2 text-sm text-gray-800">
                        Будет выдан следующий по очереди:{' '}
                        <span className="font-mono font-semibold">{nextPooledBlank.number}</span>
                        {issueBlankType ? (
                          <span className="text-gray-600"> ({blankTypeNames[issueBlankType]})</span>
                        ) : null}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-amber-800">Нет бланков этого типа в обороте — вернитесь и выберите другой тип</p>
                    )}
                  </div>
                  <Label>Причина выдачи</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите причину" />
                    </SelectTrigger>
                    <SelectContent>
                      {operationReasons.issue.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="space-y-2">
                    <Label htmlFor="issue-operator-comment">Комментарий для военного комиссара</Label>
                    <Textarea
                      id="issue-operator-comment"
                      placeholder="Необязательно: уточнения к выдаче, ссылки на документы"
                      rows={3}
                      value={operatorComment}
                      onChange={(e) => setOperatorComment(e.target.value)}
                      className="resize-y min-h-[4.5rem]"
                    />
                  </div>
                </div>
              )}

              {operationType !== 'issue' && step === 2 && (
                <div className="space-y-4">
                  <Label>Выберите причину</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите причину" />
                    </SelectTrigger>
                    <SelectContent>
                      {operationReasons[operationType].map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {operationType === 'issue' && step === 4 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Label>Получатель</Label>
                    <span className="text-sm text-gray-600">
                      Бланк из пула:{' '}
                      <span className="font-mono font-medium text-gray-900">
                        {nextPooledBlank?.number ?? '—'}
                      </span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Поиск по ФИО или по ID гражданина. Выберите строку — откроется подтверждение выдачи.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="citizen-search">ФИО или ID</Label>
                    <Input
                      id="citizen-search"
                      placeholder="Например: Смирнов или citizen_001"
                      value={citizenSearchQuery}
                      onChange={(e) => setCitizenSearchQuery(e.target.value)}
                    />
                  </div>
                  {citizenSearchQuery.trim().length === 0 ? (
                    <p className="text-sm text-gray-500">Введите часть ФИО или ID для поиска</p>
                  ) : citizens.error ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Не удалось выполнить поиск: {citizens.error}</AlertDescription>
                    </Alert>
                  ) : citizens.loading && citizens.data === null ? (
                    <p className="text-sm text-gray-500">Загрузка…</p>
                  ) : citizenSearchResults.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Ничего не найдено — уточните запрос</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="max-h-64 overflow-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>ФИО</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {citizenSearchResults.map((c) => (
                            <TableRow key={c.id}>
                              <TableCell className="font-mono text-sm">{c.id}</TableCell>
                              <TableCell>{c.full_name}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  type="button"
                                  onClick={() => openIssueConfirm({ id: c.id, name: c.full_name })}
                                >
                                  Выбрать
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}

              {operationType !== 'issue' && step === 3 && (
                <div className="space-y-4">
                  <Label>Выберите бланк</Label>
                  {availableResult.error ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Не удалось загрузить бланки: {availableResult.error}</AlertDescription>
                    </Alert>
                  ) : availableResult.loading && availableResult.data === null ? (
                    <p className="text-sm text-gray-500">Загрузка…</p>
                  ) : availableBlanks.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Нет доступных бланков для данной операции</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="max-h-64 overflow-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Номер</TableHead>
                            <TableHead>Тип</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Где</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {availableBlanks.map((blank) => (
                            <TableRow
                              key={blank.id}
                              className={selectedBlank === blank.id ? 'bg-blue-50' : ''}
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
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant={selectedBlank === blank.id ? 'focus' : 'outline'}
                                  onClick={() => setSelectedBlank(blank.id)}
                                >
                                  {selectedBlank === blank.id ? 'Выбрано' : 'Выбрать'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {operationType === 'replacement' && (
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="new-blank">Номер нового бланка</Label>
                      <Input
                        id="new-blank"
                        placeholder="АА999999"
                        value={newBlankNumber}
                        onChange={(e) => setNewBlankNumber(e.target.value)}
                      />
                    </div>
                  )}

                  {(operationType === 'storage' || operationType === 'replacement') && (
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="op-operator-comment">Комментарий для военного комиссара</Label>
                      <Textarea
                        id="op-operator-comment"
                        placeholder="Необязательно: важные детали для подписания"
                        rows={3}
                        value={operatorComment}
                        onChange={(e) => setOperatorComment(e.target.value)}
                        className="resize-y min-h-[4.5rem]"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                {step > 2 ? (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Назад
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={closeBlock}>
                    Свернуть
                  </Button>
                )}
                {showFooterPrimary ? (
                  <Button onClick={handleNext}>{isPrimarySubmit ? 'Отправить комиссару' : 'Далее'}</Button>
                ) : (
                  <span className="text-sm text-gray-500">Выберите получателя в таблице</span>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={issueConfirmOpen} onOpenChange={setIssueConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтверждение выдачи</AlertDialogTitle>
            <AlertDialogDescription className="text-left text-gray-700">
              {nextPooledBlank && issueRecipient && issueBlankType ? (
                <>
                  Вы уверены, что хотите выдать бланк{' '}
                  <span className="font-mono font-semibold text-foreground">{nextPooledBlank.number}</span> (
                  {blankTypeNames[issueBlankType]}) гражданину{' '}
                  <span className="font-medium text-foreground">{issueRecipient.name}</span> (ID:{' '}
                  <span className="font-mono">{issueRecipient.id}</span>)?
                </>
              ) : (
                'Недостаточно данных для подтверждения.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={() => {
                if (nextPooledBlank && issueRecipient) submitIssueAfterConfirm();
              }}
            >
              Да, отправить комиссару
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
