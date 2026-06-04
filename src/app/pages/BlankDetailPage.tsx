import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Calendar, MapPin, User, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  currentUser,
  blankTypeNames,
  operationTypeNames,
  type Operation,
} from '../data/mockData';
import { fetchBlankCard } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { PlaceBadge } from '../components/PlaceBadge';
import { StatusBadge } from '../components/StatusBadge';

export function BlankDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const card = useAsync((signal) => fetchBlankCard(id ?? '', signal), [id]);
  const blank = card.data;

  const operationTimeline = useMemo(
    () =>
      [...(blank?.operations ?? [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    [blank],
  );

  const operationWhereText = (op: Operation) => {
    if (op.from_location && op.to_location) {
      return `${op.from_location} → ${op.to_location}`;
    }
    if (op.to_location) return `Куда: ${op.to_location}`;
    if (op.from_location) return `Откуда: ${op.from_location}`;
    return null;
  };

  if (!blank) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/blanks')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к списку
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            {card.loading ? (
              <p className="text-gray-600">Загрузка…</p>
            ) : card.error ? (
              <div className="flex items-center justify-center gap-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span>Бланк не найден</span>
              </div>
            ) : (
              <p className="text-gray-600">Бланк не найден</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnBlank = currentUser.role !== 'vkmo_operator' || blank.vkmo_id === currentUser.vkmo_id;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/blanks')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к списку
        </Button>
        {!isOwnBlank && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Бланк другого ВК (только просмотр)
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{blank.number}</CardTitle>
                  <p className="text-gray-600 mt-1">{blankTypeNames[blank.type]}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={blank.status} />
                  <PlaceBadge place={blank.place} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Точка учёта</p>
                    <p className="text-sm text-gray-900">{blank.location}</p>
                  </div>
                </div>

                {blank.owner_name && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Владелец</p>
                      <p className="text-sm text-gray-900">{blank.owner_name}</p>
                      {blank.owner_id && (
                        <p className="text-xs text-gray-600">ID: {blank.owner_id}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Создан</p>
                    <p className="text-sm text-gray-900">{formatDate(blank.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Обновлен</p>
                    <p className="text-sm text-gray-900">{formatDate(blank.updated_at)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>История операций</CardTitle>
              <CardDescription>
                Хронология по дате документа: сначала ранние события. Для поступлений и передач между органами
                указаны откуда и куда; для выдачи — точка учёта или назначение.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {operationTimeline.length === 0 ? (
                <p className="text-center text-gray-600 py-8">История операций пуста</p>
              ) : (
                <div className="space-y-4">
                  {operationTimeline.map((op) => {
                    const whereText = operationWhereText(op);
                    return (
                    <div key={op.id} className="flex gap-4 border-l-2 border-gray-200 pl-4 pb-4 last:pb-0">
                      <div className="flex-shrink-0">
                        {op.status === 'approved' ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          </div>
                        ) : op.status === 'rejected' ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                            <FileText className="h-5 w-5 text-red-600" />
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-gray-900">
                              {operationTypeNames[op.type]}
                            </p>
                            <p className="text-sm text-gray-600">{op.reason}</p>
                          </div>
                          <Badge variant={op.status === 'approved' ? 'default' : op.status === 'rejected' ? 'destructive' : 'secondary'}>
                            {op.status === 'approved' ? 'Подписано' : op.status === 'rejected' ? 'Отклонено' : 'На подписи'}
                          </Badge>
                        </div>
                        {whereText && (
                          <p className="text-sm text-gray-800 mt-1.5">{whereText}</p>
                        )}
                        {op.owner_name && (
                          <p className="text-sm text-gray-700 mt-1">
                            Гражданин: {op.owner_name}
                          </p>
                        )}
                        <p className="text-xs text-gray-600 mt-1">
                          {formatDate(op.created_at)} • {op.operator_name}
                        </p>
                        {op.commissioner_signature && (
                          <p className="text-xs text-green-700 mt-1">
                            ЭЦП: {op.commissioner_signature}
                          </p>
                        )}
                        {op.comment && (
                          <p className="text-sm text-gray-600 mt-2 italic">
                            {op.comment}
                          </p>
                        )}
                        {(op.old_blank_id || op.new_blank_id) && (
                          <div className="mt-2 text-sm">
                            {op.old_blank_id === id ? (
                              <p className="text-gray-600">
                                Заменен на: <button
                                  onClick={() => navigate(`/blanks/${op.new_blank_id}`)}
                                  className="text-blue-600 hover:underline"
                                >
                                  {op.new_blank_id}
                                </button>
                              </p>
                            ) : (
                              <p className="text-gray-600">
                                Замена для: <button
                                  onClick={() => navigate(`/blanks/${op.old_blank_id}`)}
                                  className="text-blue-600 hover:underline"
                                >
                                  {op.old_blank_id}
                                </button>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">ID бланка</p>
                <p className="text-sm text-gray-900">{blank.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Военкомат</p>
                <p className="text-sm text-gray-900">{blank.vkmo_id}</p>
              </div>
            </CardContent>
          </Card>

          {isOwnBlank && currentUser.role === 'vkmo_operator' && blank.status !== 'written_off' && (
            <Card>
              <CardHeader>
                <CardTitle>Действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full"
                  onClick={() => navigate('/operations')}
                >
                  Создать операцию
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
