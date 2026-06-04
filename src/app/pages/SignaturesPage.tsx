import { useState, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { FileSignature, CheckCircle2, ChevronRight, ExternalLink, AlertCircle } from 'lucide-react';
import {
  currentUser,
  getHomeRouteForUser,
  operationTypeNames,
  blankTypeNames,
  placeNames,
} from '../data/mockData';
import { ApiError, fetchPendingSignatures, fetchBlankCard, signOperation } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { toast } from 'sonner';
import { EdsSignDialog } from '../components/EdsSignDialog';
import { type Signature } from '../lib/eds';

type DetailRowProps = {
  label: string;
  children: ReactNode;
};

const DetailRow = ({ label, children }: DetailRowProps) => (
  <div className="grid grid-cols-1 gap-0.5 border-b border-gray-100 py-2.5 last:border-0 sm:grid-cols-[minmax(0,7.5rem)_1fr] sm:gap-4 sm:py-2">
    <div className="text-xs text-gray-500">{label}</div>
    <div className="min-w-0 text-sm text-gray-900">{children}</div>
  </div>
);

export const SignaturesPage = () => {
  const [refresh, setRefresh] = useState(0);
  const [detailOpId, setDetailOpId] = useState<string | null>(null);
  const [signOpId, setSignOpId] = useState<string | null>(null);

  const isCommissioner = currentUser.role === 'commissioner';

  const queue = useAsync(
    (signal) => fetchPendingSignatures(currentUser.vkmo_id, signal),
    [refresh, currentUser.vkmo_id],
  );

  const visibleQueue = queue.data ?? [];

  const detailOp = detailOpId ? visibleQueue.find((o) => o.id === detailOpId) : undefined;

  // Карточка бланка для детального диалога подгружается лениво: в очереди
  // на подписании нет места/типа бланка, поэтому берём их из карточки.
  const detailCard = useAsync(
    (signal) => (detailOp ? fetchBlankCard(detailOp.blank_id, signal) : Promise.resolve(null)),
    [detailOp?.blank_id],
  );

  // Гард роли — после вызова всех хуков (правило react-hooks/rules-of-hooks).
  if (currentUser.role !== 'vkmo_operator' && currentUser.role !== 'commissioner') {
    return <Navigate to={getHomeRouteForUser(currentUser)} replace />;
  }

  const signOp = signOpId ? visibleQueue.find((o) => o.id === signOpId) : undefined;

  const signPayload = signOp
    ? [
        `Операция: ${operationTypeNames[signOp.type]} · ${signOp.reason}`,
        signOp.blank_number ? `Бланк: ${signOp.blank_number}` : '',
        signOp.owner_name ? `Гражданин: ${signOp.owner_name}` : '',
        `Оператор: ${signOp.operator_name}`,
        `Создана: ${signOp.created_at}`,
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const openSign = () => {
    if (!detailOpId) return;
    setSignOpId(detailOpId);
    setDetailOpId(null);
  };

  const handleSigned = async (signature: Signature) => {
    if (!signOpId) return;
    try {
      await signOperation(signOpId, {
        commissioner_id: currentUser.id,
        signature: signature.signerName,
      });
      toast.success('Операция подписана ЭЦП');
      setRefresh((x) => x + 1);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error('Не удалось выполнить операцию');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">На подписании</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600">
          {isCommissioner
            ? 'Выдача, замена и сдача на хранение — откройте строку и подпишите ЭЦП при необходимости.'
            : 'Заявки оператора, ожидающие подписи комиссара. Строка открывает сводку.'}
        </p>
      </div>

      {queue.error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>Не удалось загрузить очередь: {queue.error}</span>
        </div>
      )}

      {queue.loading && !queue.data ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="py-14 text-center text-sm text-gray-600">Загрузка…</CardContent>
        </Card>
      ) : visibleQueue.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center py-14 text-center">
            <FileSignature className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-600">Нет операций на подписании</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-medium text-gray-900">Очередь</p>
            <p className="text-xs text-gray-500">{visibleQueue.length} на рассмотрении</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead className="h-10 w-[1%] whitespace-nowrap pl-4 text-xs font-medium text-gray-500">
                    Когда
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium text-gray-500">Операция</TableHead>
                  <TableHead className="h-10 text-xs font-medium text-gray-500">Бланк</TableHead>
                  <TableHead className="h-10 text-xs font-medium text-gray-500">Гражданин</TableHead>
                  <TableHead className="h-10 w-14 pr-4 text-right text-xs font-medium text-gray-500" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleQueue.map((operation) => (
                  <TableRow
                    key={operation.id}
                    className="cursor-pointer border-gray-100 transition-colors hover:bg-gray-50/80"
                    onClick={() => setDetailOpId(operation.id)}
                  >
                    <TableCell className="whitespace-nowrap pl-4 align-middle text-xs text-gray-600">
                      {formatDateShort(operation.created_at)}
                    </TableCell>
                    <TableCell className="align-middle">
                      <span className="text-sm font-medium text-gray-900">
                        {operationTypeNames[operation.type]}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500 line-clamp-1">
                        {operation.reason}
                      </span>
                    </TableCell>
                    <TableCell className="align-middle">
                      {operation.blank_number ? (
                        <>
                          <span className="font-mono text-sm text-gray-900">{operation.blank_number}</span>
                          <span className="block text-xs text-gray-500">—</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] align-middle">
                      {operation.owner_name ? (
                        <span className="text-sm text-gray-800 line-clamp-2">{operation.owner_name}</span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-4 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild title="Карточка бланка">
                          <Link to={`/blanks/${operation.blank_id}`}>
                            <ExternalLink className="h-4 w-4 text-gray-500" />
                          </Link>
                        </Button>
                        <ChevronRight className="h-4 w-4 text-gray-300" aria-hidden />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={Boolean(detailOpId && detailOp)} onOpenChange={(open) => !open && setDetailOpId(null)}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="space-y-1 border-b border-gray-100 px-5 py-4 text-left">
            <DialogTitle className="pr-8 text-base font-semibold leading-snug text-gray-900">
              {detailOp ? `${operationTypeNames[detailOp.type]} · ${detailOp.reason}` : ''}
            </DialogTitle>
            {detailOp && (
              <p className="text-xs text-gray-500">
                {formatDate(detailOp.created_at)} · {detailOp.operator_name}
              </p>
            )}
          </DialogHeader>

          {detailOp && (
            <div className="max-h-[min(58vh,22rem)] overflow-y-auto px-5 py-3">
              {detailOp.operator_comment?.trim() ? (
                <div className="mb-3 rounded-md bg-slate-100/80 px-3 py-2.5">
                  <p className="text-[11px] font-medium text-gray-500">Комментарий оператора</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-900 whitespace-pre-wrap">
                    {detailOp.operator_comment}
                  </p>
                </div>
              ) : null}

              <div className="rounded-md border border-gray-100 px-3">
                <DetailRow label="Бланк">
                  <span className="font-mono">{detailCard.data?.number ?? detailOp.blank_number ?? '—'}</span>
                  {detailCard.data && (
                    <>
                      <span className="text-gray-600"> · {blankTypeNames[detailCard.data.type]}</span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {detailCard.data.location} · {placeNames[detailCard.data.place]}
                      </span>
                    </>
                  )}
                  {detailCard.loading && !detailCard.data && (
                    <span className="mt-1 block text-xs text-gray-400">Загрузка…</span>
                  )}
                </DetailRow>
                {(detailOp.owner_name || detailOp.owner_id) && (
                  <DetailRow label="Гражданин">
                    <span className="font-medium">{detailOp.owner_name ?? '—'}</span>
                    {detailOp.owner_id ? (
                      <span className="mt-0.5 block text-xs text-gray-500">ID {detailOp.owner_id}</span>
                    ) : null}
                  </DetailRow>
                )}
                {(detailOp.from_location || detailOp.to_location) && (
                  <DetailRow label="Маршрут">
                    {detailOp.from_location && (
                      <div className="text-xs text-gray-600 sm:text-sm">
                        <span className="text-gray-400">Откуда </span>
                        {detailOp.from_location}
                      </div>
                    )}
                    {detailOp.to_location && (
                      <div className={`text-xs text-gray-600 sm:text-sm ${detailOp.from_location ? 'mt-1' : ''}`}>
                        <span className="text-gray-400">Куда </span>
                        {detailOp.to_location}
                      </div>
                    )}
                  </DetailRow>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-row justify-end gap-2 border-t border-gray-100 bg-gray-50/80 px-5 py-3 sm:justify-end">
            <Button type="button" variant="ghost" size="sm" className="text-gray-600" onClick={() => setDetailOpId(null)}>
              Закрыть
            </Button>
            {isCommissioner && (
              <Button type="button" size="sm" onClick={openSign} disabled={!detailOp}>
                <CheckCircle2 className="h-4 w-4" />
                Подписать ЭЦП
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EdsSignDialog
        open={Boolean(signOpId && signOp)}
        onOpenChange={(open) => !open && setSignOpId(null)}
        title={signOp ? `${operationTypeNames[signOp.type]} · ${signOp.reason}` : ''}
        payload={signPayload}
        onSigned={handleSigned}
      />
    </div>
  );
};
