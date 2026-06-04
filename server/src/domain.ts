// Доменные перечисления, типы и русские метки.
// Значения синхронизированы с docs/dashboard-api-schema.json и фронтендом.

export const ORG_LEVELS = ['center', 'district', 'omu', 'vk_subject', 'vk_mo'] as const;
export type OrgLevel = (typeof ORG_LEVELS)[number];

export const USER_ROLES = [
  'center_operator',
  'district_operator',
  'subject_operator',
  'vkmo_operator',
  'commissioner',
  'auditor',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const BLANK_TYPES = ['military_id', 'certificate', 'credential'] as const;
export type BlankType = (typeof BLANK_TYPES)[number];

export const BLANK_STATUSES = ['in_circulation', 'issued', 'on_hold', 'written_off'] as const;
export type BlankStatus = (typeof BLANK_STATUSES)[number];

export const BLANK_PLACES = [
  'at_center',
  'at_district',
  'at_omu',
  'at_vk_subject',
  'at_vk_mo',
  'in_transit',
  'with_recipient',
  'archived',
] as const;
export type BlankPlace = (typeof BLANK_PLACES)[number];

export const OPERATION_TYPES = [
  'receipt',
  'transfer',
  'issue',
  'storage',
  'return',
  'replacement',
  'write_off',
] as const;
export type OperationType = (typeof OPERATION_TYPES)[number];

export const OPERATION_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type OperationStatus = (typeof OPERATION_STATUSES)[number];

// Бизнес-правило контракта: типы операций, требующие ЭЦП комиссара.
export const SIGNATURE_REQUIRED_TYPES: ReadonlySet<OperationType> = new Set([
  'issue',
  'replacement',
  'storage',
]);

export interface OrgUnit {
  id: string;
  parent_id: string | null;
  level: OrgLevel;
  name: string;
  is_active: boolean;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  org_unit_id: string | null;
  vkmo_id: string | null;
  is_active: boolean;
}

export interface Citizen {
  id: string;
  full_name: string;
  snils: string | null;
}

export interface Blank {
  id: string;
  number: string;
  type: BlankType;
  status: BlankStatus;
  place: BlankPlace;
  location_label: string;
  vkmo_id: string;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Operation {
  id: string;
  blank_id: string;
  type: OperationType;
  status: OperationStatus;
  reason: string;
  from_location: string | null;
  to_location: string | null;
  owner_id: string | null;
  operator_id: string;
  commissioner_id: string | null;
  commissioner_signature: string | null;
  old_blank_id: string | null;
  new_blank_id: string | null;
  comment: string | null;
  operator_comment: string | null;
  created_at: string;
  approved_at: string | null;
}

export const labelsRu = {
  blank_status: {
    in_circulation: 'В обороте',
    issued: 'Выдан',
    on_hold: 'На удержании',
    written_off: 'Списан',
  } as Record<BlankStatus, string>,
  blank_type: {
    military_id: 'Военный билет',
    certificate: 'Справка',
    credential: 'Удостоверение',
  } as Record<BlankType, string>,
  operation_type: {
    receipt: 'Поступление',
    transfer: 'Перемещение',
    issue: 'Выдача',
    storage: 'Сдача на хранение',
    return: 'Возврат',
    replacement: 'Замена',
    write_off: 'Списание',
  } as Record<OperationType, string>,
  blank_place: {
    at_center: 'В центре',
    at_district: 'В округе',
    at_omu: 'В ОМУ',
    at_vk_subject: 'В ВК субъекта',
    at_vk_mo: 'В ВК МО',
    in_transit: 'В пути',
    with_recipient: 'У получателя',
    archived: 'В архиве',
  } as Record<BlankPlace, string>,
};

export function requiresCommissionerSignature(op: Pick<Operation, 'type' | 'status'>): boolean {
  return op.status === 'pending' && SIGNATURE_REQUIRED_TYPES.has(op.type);
}
