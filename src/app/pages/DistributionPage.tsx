import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { AlertCircle } from 'lucide-react';
import { currentUser, blankTypeNames, formatBlankCountRu, type BlankType } from '../data/mockData';
import {
  ApiError,
  createTransfer,
  fetchDashboardSummary,
  fetchOrgUnits,
  orgChildren,
  orgPath,
  type OrgUnit,
} from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { toast } from 'sonner';

const BLANK_TYPES: BlankType[] = ['military_id', 'certificate', 'credential'];

type CellState = Record<string, Record<BlankType, string>>;

const emptyRow = (): Record<BlankType, string> => ({
  military_id: '',
  certificate: '',
  credential: '',
});

type DistributionMode = 'center' | 'district' | 'omu' | 'vk_subject' | null;

const resolveMode = (): DistributionMode => {
  if (currentUser.role === 'center_operator') return 'center';
  if (currentUser.role === 'district_operator' && currentUser.district_id) return 'district';
  if (currentUser.role === 'subject_operator' && currentUser.omu_id && !currentUser.vk_subject_id)
    return 'omu';
  if (currentUser.role === 'subject_operator' && currentUser.vk_subject_id) return 'vk_subject';
  return null;
};

export function DistributionPage() {
  const mode = resolveMode();
  const [cells, setCells] = useState<CellState>({});
  const [refresh, setRefresh] = useState(0);
  const [saving, setSaving] = useState(false);

  // Дерево орг-узлов с сервера.
  const orgState = useAsync((signal) => fetchOrgUnits(signal), [refresh]);
  const flat: OrgUnit[] = orgState.data ?? [];

  const setCell = (childId: string, type: BlankType, value: string) => {
    setCells((prev) => ({
      ...prev,
      [childId]: {
        ...(prev[childId] ?? emptyRow()),
        [type]: value.replace(/\D/g, ''),
      },
    }));
  };

  const parentForTable = useMemo<string | null>(() => {
    if (mode === 'center') return flat.find((u) => u.level === 'center')?.id ?? null;
    if (mode === 'district' && currentUser.district_id) return currentUser.district_id;
    if (mode === 'omu' && currentUser.omu_id) return currentUser.omu_id;
    if (mode === 'vk_subject' && currentUser.vk_subject_id) return currentUser.vk_subject_id;
    return null;
  }, [mode, flat]);

  const children = parentForTable ? orgChildren(flat, parentForTable) : [];
  const pathLabels = parentForTable ? orgPath(flat, parentForTable).map((u) => u.name) : [];

  // Поступление от вышестоящего уровня (остаток родителя по типам).
  const incoming = useAsync(
    (signal) =>
      parentForTable
        ? fetchDashboardSummary({ org_unit_id: parentForTable }, signal)
        : Promise.resolve(null),
    [parentForTable, refresh],
  );

  const handleSave = async () => {
    if (!parentForTable) return;
    setSaving(true);

    const jobs: { childId: string; type: BlankType; count: number }[] = [];
    for (const child of children) {
      const row = cells[child.id];
      if (!row) continue;
      for (const type of BLANK_TYPES) {
        const count = parseInt(row[type] ?? '', 10);
        if (Number.isInteger(count) && count > 0) {
          jobs.push({ childId: child.id, type, count });
        }
      }
    }

    if (jobs.length === 0) {
      setSaving(false);
      toast.error('Укажите хотя бы одно положительное количество');
      return;
    }

    let moved = 0;
    let firstError: string | null = null;
    try {
      const results = await Promise.allSettled(
        jobs.map((j) =>
          createTransfer({
            from_org_unit_id: parentForTable,
            to_org_unit_id: j.childId,
            operator_id: currentUser.id,
            type: j.type,
            count: j.count,
            reason: 'Распределение бланков',
          }),
        ),
      );
      for (const r of results) {
        if (r.status === 'fulfilled') {
          moved += r.value.moved_count;
        } else if (!firstError) {
          firstError =
            r.reason instanceof ApiError ? r.reason.message : 'Не удалось выполнить операцию';
        }
      }

      if (moved > 0) {
        toast.success(`Распределено бланков: ${moved.toLocaleString('ru-RU')}`);
        setCells({});
        setRefresh((x) => x + 1);
      }
      if (firstError) toast.error(firstError);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error('Не удалось выполнить операцию');
    } finally {
      setSaving(false);
    }
  };

  const titleByMode: Record<Exclude<DistributionMode, null>, string> = {
    center: 'Распределение: ГОМУ → военные округа',
    district: 'Распределение: военный округ',
    omu: 'Распределение: ОМУ → ВК (с)',
    vk_subject: 'Распределение: ВК (с) → ВК(мо)',
  };

  const descriptionByMode: Record<Exclude<DistributionMode, null>, string> = {
    center:
      'Вы задаёте объёмы по каждому военному округу. Округ видит только свою квоту от центра и перераспределяет её между ОМУ.',
    district:
      'Ниже — поступление от центра и распределение между ОМУ вашего округа. Каждый ОМУ дальше ведёт свою ветку до ВК субъекта и муниципальных ВК.',
    omu: `Подчинённых ВК субъекта: ${children.length}. Укажите квоты по строкам.`,
    vk_subject: `Подчинённых муниципальных ВК: ${children.length}. Укажите квоты по строкам.`,
  };

  if (!mode) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Распределение</h2>
        <p className="text-gray-600">
          Раздел доступен для кабинетов: администратор центра, округ, ОМУ и ВК субъекта.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">{titleByMode[mode]}</h2>
        <p className="mt-1 text-gray-600">{descriptionByMode[mode]}</p>
        {pathLabels.length > 0 && (
          <p className="mt-2 text-sm text-gray-500">Цепочка: {pathLabels.join(' → ')}</p>
        )}
      </div>

      {orgState.error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>Не удалось загрузить орг-структуру: {orgState.error}</span>
        </div>
      )}

      {mode !== 'center' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Поступило от вышестоящего уровня</CardTitle>
          </CardHeader>
          <CardContent>
            {incoming.error ? (
              <p className="flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                Не удалось загрузить остаток: {incoming.error}
              </p>
            ) : incoming.loading && !incoming.data ? (
              <p className="text-sm text-gray-500">Загрузка…</p>
            ) : (
              <p className="text-sm text-gray-800">
                {BLANK_TYPES.map((b) =>
                  formatBlankCountRu(b, incoming.data?.by_type[b] ?? 0),
                ).join(', ')}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Текущий остаток в обороте на вышестоящем уровне.
            </p>
          </CardContent>
        </Card>
      )}

      {mode === 'center' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Квота от центра</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              По каждому округу задаётся распределение партии бланков по типам.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'center' && 'Округа'}
            {mode === 'district' && 'ОМУ округа'}
            {mode === 'omu' && 'ВК субъекта'}
            {mode === 'vk_subject' && 'ВК МО (муниципальные)'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Подразделение</th>
                  {BLANK_TYPES.map((type) => (
                    <th key={type} className="px-3 py-2 font-medium">
                      {blankTypeNames[type]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {children.length === 0 ? (
                  <tr className="border-t">
                    <td colSpan={1 + BLANK_TYPES.length} className="px-3 py-8 text-center text-gray-600">
                      {orgState.loading ? 'Загрузка…' : 'Подразделения не найдены'}
                    </td>
                  </tr>
                ) : (
                  children.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-3 py-2 text-gray-900">
                        <span className="font-mono text-xs text-gray-500">{row.id}</span>
                        <br />
                        {row.name}
                      </td>
                      {BLANK_TYPES.map((type) => (
                        <td key={type} className="px-3 py-2">
                          <Input
                            inputMode="numeric"
                            className="h-9 max-w-[120px]"
                            placeholder="0"
                            value={cells[row.id]?.[type] ?? ''}
                            onChange={(e) => setCell(row.id, type, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Button type="button" onClick={handleSave} disabled={saving || !parentForTable}>
            {saving ? 'Сохранение…' : 'Сохранить распределение'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
