import type { Blank, BlankPlace, BlankStatus, OperationStatus } from './domain.js';
import { SIGNATURE_REQUIRED_TYPES } from './domain.js';

// Ручные операции оператора (2.6). receipt/transfer обрабатываются отдельными маршрутами.
export const MANUAL_OPERATION_TYPES = ['issue', 'return', 'replacement', 'storage', 'write_off'] as const;
export type ManualOperationType = (typeof MANUAL_OPERATION_TYPES)[number];

export interface OpPlan {
  // pending — требует подписи комиссара (применится при подписании, 2.7);
  // approved — применяется немедленно.
  status: OperationStatus;
  // Изменение состояния бланка; null — состояние не меняется до подписания.
  blankPatch: { status?: BlankStatus; place?: BlankPlace; owner_id?: string | null } | null;
  toLocation: string;
}

export type PlanResult = { ok: true; plan: OpPlan } | { ok: false; error: string };

// Переход состояния бланка, ОТЛОЖЕННЫЙ до подписи комиссара (2.7).
// Применяется при подписании pending-операции (issue/storage/replacement),
// которая при создании оставила blankPatch = null.
export interface ApprovalPatch {
  status?: BlankStatus;
  place?: BlankPlace;
  owner_id?: string | null;
}

// holderPlace — место узла-держателя бланка (уровень его орг-узла).
export function planApproval(
  type: ManualOperationType,
  ownerId: string | null,
  holderPlace: BlankPlace,
): ApprovalPatch {
  switch (type) {
    case 'issue':
      // Выдан гражданину: на руках у получателя.
      return { status: 'issued', place: 'with_recipient', owner_id: ownerId };
    case 'storage':
      // Сдан на временное хранение в камеру хранения держателя; владелец сохраняется.
      return { status: 'on_hold', place: holderPlace, owner_id: ownerId };
    case 'replacement':
      // Заменяемый бланк выводится из оборота.
      return { status: 'written_off', place: 'archived', owner_id: null };
    default:
      // return/write_off не требуют подписи — сюда не попадают.
      return {};
  }
}

// Чистая функция: проверяет допустимость операции и вычисляет переход состояния.
// holderPlace — место, соответствующее уровню узла-держателя бланка (куда вернётся бланк).
export function planOperation(
  blank: Blank,
  type: ManualOperationType,
  ownerId: string | null,
  holderPlace: BlankPlace,
): PlanResult {
  if (blank.status === 'written_off') {
    return { ok: false, error: 'Бланк списан — операции с ним недоступны' };
  }
  const pending = SIGNATURE_REQUIRED_TYPES.has(type); // issue, storage, replacement

  switch (type) {
    case 'issue':
      if (blank.status !== 'in_circulation') return { ok: false, error: 'Выдать можно только бланк в обороте' };
      if (!ownerId) return { ok: false, error: 'Для выдачи укажите получателя (owner_id)' };
      return { ok: true, plan: { status: 'pending', blankPatch: null, toLocation: 'У получателя' } };
    case 'storage':
      if (blank.status !== 'issued') return { ok: false, error: 'Сдать на хранение можно только выданный бланк' };
      return { ok: true, plan: { status: 'pending', blankPatch: null, toLocation: 'Камера хранения' } };
    case 'replacement':
      if (blank.status !== 'issued') return { ok: false, error: 'Заменить можно только выданный бланк' };
      return { ok: true, plan: { status: 'pending', blankPatch: null, toLocation: 'Замена бланка' } };
    case 'return':
      if (blank.status !== 'issued') return { ok: false, error: 'Вернуть можно только выданный бланк' };
      return {
        ok: true,
        plan: { status: 'approved', blankPatch: { status: 'in_circulation', place: holderPlace, owner_id: null }, toLocation: blank.location_label },
      };
    case 'write_off':
      return {
        ok: true,
        plan: { status: 'approved', blankPatch: { status: 'written_off', place: 'archived', owner_id: null }, toLocation: 'Архив' },
      };
    default: {
      // Исчерпывающая проверка типов на этапе компиляции.
      const _exhaustive: never = type;
      void pending;
      return { ok: false, error: `Неизвестный тип операции: ${String(_exhaustive)}` };
    }
  }
}
