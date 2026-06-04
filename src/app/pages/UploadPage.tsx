import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { AlertCircle } from 'lucide-react';
import { currentUser, blankTypeNames, type BlankType } from '../data/mockData';
import { countInclusiveInSeries, sanitizeSerialInput } from '../lib/blankSerialRange';
import { pluralizeRu } from '../lib/pluralizeRu';
import { fetchOrgUnits, createReceipt, ApiError } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { toast } from 'sonner';

const BLANK_TYPES: BlankType[] = ['military_id', 'certificate', 'credential'];

const TOTAL_STEPS = 4;

const STEP_TITLES = ['Диапазон номеров', 'Проверка серии', 'Распределение по типам', 'Подтверждение'];

type TypeCounts = Record<BlankType, string>;

const emptyCounts = (): TypeCounts => ({
  military_id: '',
  certificate: '',
  credential: '',
});

const formatNumberWord = (n: number) => pluralizeRu(n, 'номер', 'номера', 'номеров');

export function UploadPage() {
  const [step, setStep] = useState(1);
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [seriesTotal, setSeriesTotal] = useState<number | null>(null);
  const [incomingByType, setIncomingByType] = useState<TypeCounts>(emptyCounts);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Орг-узлы: нужен идентификатор приёмного узла центра для оформления поступления.
  const orgUnits = useAsync((signal) => fetchOrgUnits(signal), []);
  const centerOrgId = orgUnits.data?.find((u) => u.level === 'center')?.id ?? 'center';

  const setIncoming = (type: BlankType, value: string) => {
    setIncomingByType((prev) => ({ ...prev, [type]: value }));
  };

  const sumByTypes = useMemo(() => {
    return BLANK_TYPES.reduce((acc, t) => acc + parseInt(incomingByType[t] || '0', 10), 0);
  }, [incomingByType]);

  const remainder = seriesTotal !== null ? seriesTotal - sumByTypes : 0;

  const goStep1Next = () => {
    if (!rangeFrom.trim() || !rangeTo.trim()) {
      toast.error('Укажите номер с и номер по');
      return;
    }
    const n = countInclusiveInSeries(rangeFrom, rangeTo);
    if (n === null) {
      toast.error(
        'Неверный формат: две буквы кириллицы (А–Я, Ё как Е) и 6 цифр; у «с» и «по» одна буквенная серия; «по» не меньше «с»',
      );
      return;
    }
    if (n === 0) {
      toast.error('В серии 0 номеров — проверьте диапазон');
      return;
    }
    setSeriesTotal(n);
    setStep(2);
  };

  const goStep2Next = () => {
    setStep(3);
  };

  const goStep3Next = () => {
    if (seriesTotal === null) return;
    if (sumByTypes !== seriesTotal) {
      toast.error(`Сумма по типам должна совпадать с размером серии (${seriesTotal}). Остаток: ${remainder}`);
      return;
    }
    setStep(4);
  };

  const handleFinalConfirm = async () => {
    if (seriesTotal === null || isSubmitting) return;
    // rangeFrom уже провалидирован выше: две буквы кириллицы + 6 цифр.
    const letters = rangeFrom.slice(0, 2);
    const fromNum = parseInt(rangeFrom.slice(2), 10);

    setIsSubmitting(true);
    try {
      let cursor = fromNum;
      let totalCreated = 0;
      let totalSkipped = 0;
      // Раскладываем серию на смежные под-диапазоны по типам в порядке BLANK_TYPES.
      for (const type of BLANK_TYPES) {
        const n = parseInt(incomingByType[type] || '0', 10);
        if (n <= 0) continue;
        const from = cursor;
        const to = cursor + n - 1;
        cursor += n;
        const r = await createReceipt({
          org_unit_id: centerOrgId,
          operator_id: currentUser.id,
          type,
          series: { letters, from, to },
          reason: 'Поступление от типографии',
        });
        totalCreated += r.created_count;
        totalSkipped += r.skipped_count;
      }

      let message = 'Принято бланков: ' + totalCreated;
      if (totalSkipped > 0) message += ', пропущено: ' + totalSkipped;
      toast.success(message);

      setStep(1);
      setRangeFrom('');
      setRangeTo('');
      setSeriesTotal(null);
      setIncomingByType(emptyCounts());
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error('Не удалось выполнить операцию');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    if (step <= 1) return;
    setStep((s) => s - 1);
  };

  if (currentUser.role !== 'center_operator') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Поступление номеров</h2>
          <p className="text-gray-600">Эта страница доступна только в кабинете администратора центра</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Поступление номеров от типографии</h2>
        <p className="text-gray-600">
          Пошаговый ввод: диапазон → проверка расчёта серии → распределение по типам бланков → подтверждение.
          Распределение по округам — в разделе «Распределение».
        </p>
      </div>

      {orgUnits.error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>Не удалось загрузить структуру организаций: {orgUnits.error}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <CardTitle>{STEP_TITLES[step - 1]}</CardTitle>
            <span className="text-sm text-gray-500">
              Шаг {step} из {TOTAL_STEPS}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <>
              <p className="text-sm text-gray-600">
                Формат: две буквы из русского алфавита (Ё при вводе приводится к Е) и шесть цифр. «Номер с» и «номер по»
                должны относиться к одной буквенной серии (одинаковые две буквы). В общей нумерации после …999999 в
                этой серии идёт начало следующей (например, после АА999999 — АБ000000); внутри одного поступления указывают
                диапазон только внутри одной пары букв.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="range-from">Номер с</Label>
                  <Input
                    id="range-from"
                    placeholder="АА100000"
                    value={rangeFrom}
                    onChange={(e) => setRangeFrom(sanitizeSerialInput(e.target.value))}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="range-to">Номер по</Label>
                  <Input
                    id="range-to"
                    placeholder="АА100099"
                    value={rangeTo}
                    onChange={(e) => setRangeTo(sanitizeSerialInput(e.target.value))}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={goStep1Next}>
                  Далее
                </Button>
              </div>
            </>
          )}

          {step === 2 && seriesTotal !== null && (
            <>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-medium text-gray-900">Расчёт системы</p>
                <p className="mt-2 text-sm text-gray-800">
                  В указанной серии <span className="font-semibold">{formatNumberWord(seriesTotal)}</span> (от{' '}
                  <span className="font-mono">{rangeFrom}</span> до <span className="font-mono">{rangeTo}</span>).
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Нажмите «ОК», чтобы перейти к распределению этих номеров по типам бланков.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={goBack}>
                  Назад
                </Button>
                <Button type="button" onClick={goStep2Next}>
                  ОК, продолжить
                </Button>
              </div>
            </>
          )}

          {step === 3 && seriesTotal !== null && (
            <>
              <p className="text-sm text-gray-600">
                Размер серии: <span className="font-semibold">{formatNumberWord(seriesTotal)}</span>. Распределите все
                номера по типам — сумма должна совпасть с размером серии.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {BLANK_TYPES.map((type) => (
                  <div key={type} className="space-y-2">
                    <Label htmlFor={`type-${type}`}>{blankTypeNames[type]}</Label>
                    <Input
                      id={`type-${type}`}
                      inputMode="numeric"
                      placeholder="0"
                      value={incomingByType[type]}
                      onChange={(e) => setIncoming(type, e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                ))}
              </div>
              <div
                className={`rounded-lg border p-3 text-sm ${
                  remainder === 0 ? 'border-green-200 bg-green-50 text-green-900' : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
              >
                Остаток к распределению:{' '}
                <span className="font-semibold">{remainder}</span>
                {remainder === 0 ? ' — можно переходить к подтверждению' : ' — укажите количества так, чтобы сумма совпала с размером серии'}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={goBack}>
                  Назад
                </Button>
                <Button type="button" onClick={goStep3Next} disabled={remainder !== 0}>
                  Далее к подтверждению
                </Button>
              </div>
            </>
          )}

          {step === 4 && seriesTotal !== null && (
            <>
              <div className="space-y-3 rounded-lg border bg-gray-50 p-4 text-sm">
                <p>
                  <span className="text-gray-600">Диапазон:</span>{' '}
                  <span className="font-mono font-medium">
                    {rangeFrom} — {rangeTo}
                  </span>
                </p>
                <p>
                  <span className="text-gray-600">Всего номеров в серии:</span>{' '}
                  <span className="font-medium">{seriesTotal}</span>
                </p>
                <div>
                  <p className="text-gray-600">По типам:</p>
                  <ul className="mt-1 list-inside list-disc">
                    {BLANK_TYPES.map((type) => (
                      <li key={type}>
                        {blankTypeNames[type]}: {parseInt(incomingByType[type] || '0', 10)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                После подтверждения данные поступления будут переданы в учёт (в демо — только уведомление).
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={goBack} disabled={isSubmitting}>
                  Назад
                </Button>
                <Button type="button" onClick={handleFinalConfirm} disabled={isSubmitting}>
                  {isSubmitting ? 'Загрузка…' : 'Подтвердить поступление'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
