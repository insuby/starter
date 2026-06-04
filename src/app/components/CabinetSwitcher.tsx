import { cabinetDefinitions, getCabinetPathLabels, type CabinetId } from '../data/mockData';
import { cn } from './ui/utils';

type CabinetSwitcherProps = {
  cabinetId: CabinetId | null;
  onCabinetChange: (id: CabinetId) => void;
};

export const CabinetSwitcher = ({ cabinetId, onCabinetChange }: CabinetSwitcherProps) => {
  const path = cabinetId ? getCabinetPathLabels(cabinetId) : [];

  return (
    <div className="border-b border-slate-200 bg-slate-50 px-6 py-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
          Кабинет (режим разработки)
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {cabinetDefinitions.map((def) => (
            <button
              key={def.id}
              type="button"
              onClick={() => onCabinetChange(def.id)}
              className={cn(
                'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm',
                cabinetId !== null && cabinetId === def.id
                  ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-[inset_0_0_0_1px_#93c5fd]'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50',
              )}
            >
              {def.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-[11px] text-gray-500">
        Иерархия (parentId): {path.length > 0 ? path.join(' → ') : '— (роль не из списка кабинетов)'}
      </p>
    </div>
  );
};
