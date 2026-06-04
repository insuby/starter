import { pluralizeRu } from '../lib/pluralizeRu';

// Типы и интерфейсы
export type BlankStatus = 'in_circulation' | 'issued' | 'on_hold' | 'written_off';
export type BlankPlace =
  | 'at_center'
  | 'at_district'
  | 'at_omu'
  | 'at_vk_subject'
  | 'at_vk_mo'
  | 'in_transit'
  | 'with_recipient'
  | 'archived';
export type BlankType = 'military_id' | 'certificate' | 'credential';
export type OperationType = 'receipt' | 'transfer' | 'issue' | 'storage' | 'return' | 'replacement' | 'write_off';
export type UserRole = 'center_operator' | 'district_operator' | 'subject_operator' | 'vkmo_operator' | 'commissioner' | 'auditor';

export interface Blank {
  id: string;
  number: string;
  type: BlankType;
  status: BlankStatus;
  place: BlankPlace;
  location: string;
  owner_id?: string;
  owner_name?: string;
  vkmo_id: string;
  created_at: string;
  updated_at: string;
}

export interface Operation {
  id: string;
  blank_id: string;
  type: OperationType;
  reason: string;
  from_location?: string;
  to_location?: string;
  owner_id?: string;
  owner_name?: string;
  operator_id: string;
  operator_name: string;
  commissioner_signature?: string;
  commissioner_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  operator_comment?: string;
  created_at: string;
  old_blank_id?: string;
  new_blank_id?: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  vkmo_id?: string;
  district_id?: string;
  omu_id?: string;
  vk_subject_id?: string;
}

export type CabinetId =
  | 'cab_admin'
  | 'cab_district'
  | 'cab_omu'
  | 'cab_vk_s'
  | 'cab_vk_mo'
  | 'cab_commissioner';

export type CabinetDef = {
  id: CabinetId;
  label: string;
  parentId: CabinetId | null;
  userId: string;
};

export const cabinetDefinitions: CabinetDef[] = [
  { id: 'cab_admin', label: 'Админ', parentId: null, userId: 'user4' },
  { id: 'cab_district', label: 'Оператор военного округа', parentId: 'cab_admin', userId: 'user5' },
  { id: 'cab_vk_s', label: 'Оператор ВК(с)', parentId: 'cab_omu', userId: 'user7' },
  { id: 'cab_vk_mo', label: 'Оператор ВК(мо)', parentId: 'cab_vk_s', userId: 'user1' },
  { id: 'cab_commissioner', label: 'Военный комиссар', parentId: 'cab_vk_mo', userId: 'user2' },
];

export const getCabinetPathLabels = (id: CabinetId) => {
  const path: string[] = [];
  let current: CabinetDef | undefined = cabinetDefinitions.find((c) => c.id === id);
  while (current) {
    path.unshift(current.label);
    current = current.parentId
      ? cabinetDefinitions.find((c) => c.id === current!.parentId)
      : undefined;
  }
  return path;
};

export const findCabinetByUserId = (userId: string) =>
  cabinetDefinitions.find((c) => c.userId === userId);

// Текущий пользователь (можно переключать)
export let currentUser: User = {
  id: 'user1',
  name: 'Петров Петр Петрович',
  role: 'vkmo_operator',
  vkmo_id: 'vk_mo_0001',
};

export const setCurrentUser = (user: User) => {
  currentUser = user;
};

export const isVkSubjectOperator = (user: User): boolean =>
  user.role === 'subject_operator' && Boolean(user.vk_subject_id);

export const getHomeRouteForUser = (user: User): string => {
  if (user.role === 'center_operator') return '/';
  if (user.role === 'vkmo_operator') return '/blanks';
  if (user.role === 'commissioner') return '/signatures';
  if (user.role === 'auditor') return '/blanks';
  if (user.role === 'district_operator' || user.role === 'subject_operator') return '/distribution';
  return '/blanks';
};

// Мок пользователи
export type CitizenLookup = {
  id: string;
  name: string;
};

export const mockCitizens: CitizenLookup[] = [
  { id: 'citizen_001', name: 'Смирнов Дмитрий Александрович' },
  { id: 'citizen_002', name: 'Козлов Андрей Владимирович' },
  { id: 'citizen_003', name: 'Волков Игорь Сергеевич' },
  { id: 'citizen_004', name: 'Новиков Павел Михайлович' },
  { id: 'citizen_005', name: 'Соколов Максим Андреевич' },
  { id: 'citizen_006', name: 'Егоров Олег Александрович' },
  { id: 'citizen_007', name: 'Лебедев Артём Сергеевич' },
];

export const searchCitizensMock = (query: string): CitizenLookup[] => {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  return mockCitizens.filter(
    (c) => c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
  );
};

export const mockUsers: User[] = [
  {
    id: 'user1',
    name: 'Петров Петр Петрович',
    role: 'vkmo_operator',
    vkmo_id: 'vk_mo_0001',
  },
  {
    id: 'user2',
    name: 'Иванов Иван Иванович',
    role: 'commissioner',
    vkmo_id: 'vk_mo_0001',
  },
  {
    id: 'user3',
    name: 'Сидоров Сергей Сергеевич',
    role: 'auditor',
  },
  {
    id: 'user4',
    name: 'Алексеев Алексей Алексеевич',
    role: 'center_operator',
  },
  {
    id: 'user5',
    name: 'Михайлов Михаил Михайлович',
    role: 'district_operator',
    district_id: 'district_001',
  },
  {
    id: 'user6',
    name: 'Николаев Николай Николаевич',
    role: 'subject_operator',
    omu_id: 'omu_001',
  },
  {
    id: 'user7',
    name: 'Орлов Олег Олегович',
    role: 'subject_operator',
    omu_id: 'omu_001',
    vk_subject_id: 'vk_sub_001',
  },
];

// Мок бланки
export const mockBlanks: Blank[] = [
  {
    id: '1',
    number: 'АА123456',
    type: 'military_id',
    status: 'issued',
    place: 'with_recipient',
    location: 'Военкомат МО Москва №1',
    owner_id: 'citizen_001',
    owner_name: 'Смирнов Дмитрий Александрович',
    vkmo_id: 'vk_mo_0001',
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-02-10T14:30:00Z',
  },
  {
    id: '2',
    number: 'АА123457',
    type: 'military_id',
    status: 'in_circulation',
    place: 'at_vk_mo',
    location: 'Военкомат МО Москва №1',
    vkmo_id: 'vk_mo_0001',
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
  },
  {
    id: '3',
    number: 'АА123458',
    type: 'certificate',
    status: 'in_circulation',
    place: 'at_vk_mo',
    location: 'Военкомат МО Москва №1',
    vkmo_id: 'vk_mo_0001',
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
  },
  {
    id: '4',
    number: 'АА123459',
    type: 'credential',
    status: 'on_hold',
    place: 'at_vk_mo',
    location: 'Военкомат МО Москва №1',
    owner_id: 'citizen_002',
    owner_name: 'Козлов Андрей Владимирович',
    vkmo_id: 'vk_mo_0001',
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-02-20T11:15:00Z',
  },
  {
    id: '5',
    number: 'АА123460',
    type: 'military_id',
    status: 'written_off',
    place: 'archived',
    location: 'Военкомат МО Москва №1',
    vkmo_id: 'vk_mo_0001',
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-03-01T09:00:00Z',
  },
  {
    id: '6',
    number: 'АА123461',
    type: 'military_id',
    status: 'issued',
    place: 'with_recipient',
    location: 'Военкомат МО Москва №1',
    owner_id: 'citizen_003',
    owner_name: 'Волков Игорь Сергеевич',
    vkmo_id: 'vk_mo_0001',
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-02-25T16:45:00Z',
  },
  {
    id: '7',
    number: 'ББ234567',
    type: 'certificate',
    status: 'in_circulation',
    place: 'at_vk_mo',
    location: 'Военкомат МО Москва №2',
    vkmo_id: 'vk_mo_0002',
    created_at: '2026-01-20T11:00:00Z',
    updated_at: '2026-01-20T11:00:00Z',
  },
  {
    id: '8',
    number: 'АА123462',
    type: 'certificate',
    status: 'written_off',
    place: 'archived',
    location: 'Военкомат МО Москва №1',
    owner_id: 'citizen_004',
    owner_name: 'Новиков Павел Михайлович',
    vkmo_id: 'vk_mo_0001',
    created_at: '2026-02-05T10:00:00Z',
    updated_at: '2026-03-06T09:30:00Z',
  },
  {
    id: '9',
    number: 'АА123463',
    type: 'military_id',
    status: 'written_off',
    place: 'archived',
    location: 'Военкомат МО Москва №1',
    owner_id: 'citizen_006',
    owner_name: 'Егоров Олег Александрович',
    vkmo_id: 'vk_mo_0001',
    created_at: '2026-02-07T10:00:00Z',
    updated_at: '2026-03-05T11:00:00Z',
  },
];

// Синтетический набор бланков для демонстрации масштаба (~1500 ВК МО).
// Базовые бланки 1–9 (с реальной историей операций) сохраняются, к ним
// добавляется крупный детерминированный набор для проверки постраничной загрузки.
// Общий объём набора (база + синтетика) доводится до 1 000 000 записей.
export const TOTAL_BLANKS = 1_000_000;

const generateSyntheticBlanks = (target: number, sink: Blank[]): void => {
  const letters = ['АА', 'АБ', 'АВ', 'БА', 'ББ', 'ВА', 'ВГ', 'ГД', 'ДЕ', 'ЕЖ'];
  const types: BlankType[] = ['military_id', 'certificate', 'credential'];
  const statuses: BlankStatus[] = ['in_circulation', 'in_circulation', 'issued', 'on_hold', 'written_off'];
  const placeByStatus: Record<BlankStatus, BlankPlace> = {
    in_circulation: 'at_vk_mo',
    issued: 'with_recipient',
    on_hold: 'at_vk_mo',
    written_off: 'archived',
  };

  const VK_COUNT = 1500;

  for (let seq = 1; seq <= target; seq++) {
    // Распределяем бланки по 1500 ВК МО по кругу.
    const v = ((seq - 1) % VK_COUNT) + 1;
    const vkmoId = `vk_mo_${String(v).padStart(4, '0')}`;
    const status = statuses[seq % statuses.length];
    const type = types[seq % types.length];
    const letter = letters[v % letters.length];
    const number = `${letter}${String(1000000 + seq).slice(-6)}`;
    const day = (seq % 27) + 1;
    const month = (seq % 5) + 1;
    const created = `2026-0${month}-${String(day).padStart(2, '0')}T09:00:00Z`;
    const updMonth = month + (status === 'written_off' ? 1 : 0);
    const updated = `2026-0${Math.min(updMonth, 5)}-${String(day).padStart(2, '0')}T12:30:00Z`;
    const hasOwner = status === 'issued' || status === 'on_hold';
    sink.push({
      id: `g${seq}`,
      number,
      type,
      status,
      place: placeByStatus[status],
      location: `Военкомат МО №${v}`,
      owner_id: hasOwner ? `citizen_${String((seq % 7) + 1).padStart(3, '0')}` : undefined,
      owner_name: hasOwner ? mockCitizens[(seq % mockCitizens.length)].name : undefined,
      vkmo_id: vkmoId,
      created_at: created,
      updated_at: updated,
    });
  }
};

// Синтетический набор отключён: данные бланков теперь приходят с бэкенда
// (см. src/app/lib/api.ts). Генератор сохранён только для справки и не вызывается,
// чтобы не создавать ~1 млн объектов при каждой загрузке приложения.
void generateSyntheticBlanks;

// Мок операции
export const mockOperations: Operation[] = [
  {
    id: 'op1',
    blank_id: '1',
    type: 'issue',
    reason: 'Призыв',
    to_location: 'Военкомат МО Москва №1',
    owner_id: 'citizen_001',
    owner_name: 'Смирнов Дмитрий Александрович',
    operator_id: 'user1',
    operator_name: 'Петров Петр Петрович',
    commissioner_id: 'user2',
    commissioner_signature: 'Иванов И.И.',
    status: 'approved',
    created_at: '2026-02-10T14:30:00Z',
  },
  {
    id: 'op13',
    blank_id: '4',
    type: 'receipt',
    reason: 'Поступление от типографии',
    to_location: 'Центр учёта БСО',
    operator_id: 'user4',
    operator_name: 'Алексеев Алексей Алексеевич',
    status: 'approved',
    created_at: '2026-01-08T09:00:00Z',
  },
  {
    id: 'op14',
    blank_id: '4',
    type: 'receipt',
    reason: 'Поступление в ВК субъекта',
    from_location: 'Центр учёта БСО',
    to_location: 'ВК субъекта (Московская область)',
    operator_id: 'user4',
    operator_name: 'Алексеев Алексей Алексеевич',
    status: 'approved',
    created_at: '2026-01-12T14:00:00Z',
  },
  {
    id: 'op15',
    blank_id: '4',
    type: 'receipt',
    reason: 'Поступление в ВК МО',
    from_location: 'ВК субъекта (Московская область)',
    to_location: 'Военкомат МО Москва №1',
    operator_id: 'user1',
    operator_name: 'Петров Петр Петрович',
    commissioner_id: 'user2',
    commissioner_signature: 'Иванов И.И.',
    status: 'approved',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'op16',
    blank_id: '4',
    type: 'issue',
    reason: 'Мобилизация',
    to_location: 'Военкомат МО Москва №1',
    owner_id: 'citizen_002',
    owner_name: 'Козлов Андрей Владимирович',
    operator_id: 'user1',
    operator_name: 'Петров Петр Петрович',
    commissioner_id: 'user2',
    commissioner_signature: 'Иванов И.И.',
    status: 'approved',
    created_at: '2026-02-01T11:00:00Z',
  },
  {
    id: 'op2',
    blank_id: '4',
    type: 'storage',
    reason: 'Командировка',
    from_location: 'У получателя (на руках у военнослужащего)',
    to_location: 'Военкомат МО Москва №1, на удержании',
    owner_id: 'citizen_002',
    owner_name: 'Козлов Андрей Владимирович',
    operator_id: 'user1',
    operator_name: 'Петров Петр Петрович',
    commissioner_id: 'user2',
    commissioner_signature: 'Иванов И.И.',
    status: 'approved',
    created_at: '2026-02-20T11:15:00Z',
  },
  {
    id: 'op3',
    blank_id: '5',
    type: 'write_off',
    reason: 'Утеря',
    operator_id: 'user1',
    operator_name: 'Петров Петр Петрович',
    commissioner_id: 'user2',
    commissioner_signature: 'Иванов И.И.',
    status: 'approved',
    created_at: '2026-03-01T09:00:00Z',
  },
  {
    id: 'op6',
    blank_id: '5',
    type: 'issue',
    reason: 'Призыв',
    owner_id: 'citizen_003',
    owner_name: 'Волков Игорь Сергеевич',
    operator_id: 'user1',
    operator_name: 'Петров Петр Петрович',
    commissioner_id: 'user2',
    commissioner_signature: 'Иванов И.И.',
    status: 'approved',
    created_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 'op7',
    blank_id: '5',
    type: 'storage',
    reason: 'Командировка',
    owner_id: 'citizen_003',
    owner_name: 'Волков Игорь Сергеевич',
    operator_id: 'user1',
    operator_name: 'Петров Петр Петрович',
    commissioner_id: 'user2',
    commissioner_signature: 'Иванов И.И.',
    status: 'approved',
    created_at: '2026-02-15T10:00:00Z',
  },
  {
    id: 'op8',
    blank_id: '8',
    type: 'issue',
    reason: 'Мобилизация',
    owner_id: 'citizen_004',
    owner_name: 'Новиков Павел Михайлович',
    operator_id: 'user1',
    operator_name: 'Петров Петр Петрович',
    commissioner_id: 'user2',
    commissioner_signature: 'Иванов И.И.',
    status: 'approved',
    created_at: '2026-02-08T10:00:00Z',
  },
  {
    id: 'op9',
    blank_id: '8',
    type: 'write_off',
    reason: 'Недостача',
    operator_id: 'user1',
    operator_name: 'Петров Петр Петрович',
    commissioner_id: 'user2',
    commissioner_signature: 'Иванов И.И.',
    status: 'approved',
    created_at: '2026-03-06T09:30:00Z',
  },
  {
    id: 'op10',
    blank_id: '9',
    type: 'issue',
    reason: 'Призыв',
    owner_id: 'citizen_006',
    owner_name: 'Егоров Олег Александрович',
    operator_id: 'user1',
    operator_name: 'Петров Петр Петрович',
    commissioner_id: 'user2',
    commissioner_signature: 'Иванов И.И.',
    status: 'approved',
    created_at: '2026-02-12T10:00:00Z',
  },
  {
    id: 'op11',
    blank_id: '9',
    type: 'storage',
    reason: 'Сборы',
    owner_id: 'citizen_006',
    owner_name: 'Егоров Олег Александрович',
    operator_id: 'user1',
    operator_name: 'Петров Петр Петрович',
    commissioner_id: 'user2',
    commissioner_signature: 'Иванов И.И.',
    status: 'approved',
    created_at: '2026-02-20T10:00:00Z',
  },
  {
    id: 'op12',
    blank_id: '9',
    type: 'write_off',
    reason: 'Утеря',
    operator_id: 'user1',
    operator_name: 'Петров Петр Петрович',
    commissioner_id: 'user2',
    commissioner_signature: 'Иванов И.И.',
    status: 'approved',
    created_at: '2026-03-05T11:00:00Z',
  },
];

export const mockPendingOperations: Operation[] = [
  {
    id: 'op4',
    blank_id: '3',
    type: 'issue',
    reason: 'Мобилизация',
    from_location: 'Военкомат МО Москва №1',
    to_location: 'У получателя (на руках у военнослужащего)',
    owner_id: 'citizen_004',
    owner_name: 'Новиков Павел Михайлович',
    operator_id: 'user1',
    operator_name: 'Петров Петр Петрович',
    status: 'pending',
    operator_comment: 'Гражданин предоставил полный пакет документов, срочная выдача по решению призывной комиссии.',
    created_at: '2026-03-13T10:00:00Z',
  },
  {
    id: 'op5',
    blank_id: '2',
    type: 'issue',
    reason: 'Призыв',
    from_location: 'Военкомат МО Москва №1',
    to_location: 'У получателя (на руках у военнослужащего)',
    owner_id: 'citizen_005',
    owner_name: 'Соколов Максим Андреевич',
    operator_id: 'user1',
    operator_name: 'Петров Петр Петрович',
    status: 'pending',
    created_at: '2026-03-13T11:30:00Z',
  },
  {
    id: 'op19',
    blank_id: '4',
    type: 'replacement',
    reason: 'Повреждение',
    from_location: 'Военкомат МО Москва №1, зал выдачи',
    to_location: 'Военкомат МО Москва №1, выдача дубликата',
    owner_id: 'citizen_002',
    owner_name: 'Козлов Андрей Владимирович',
    operator_id: 'user1',
    operator_name: 'Петров Петр Петрович',
    status: 'pending',
    old_blank_id: '4',
    new_blank_id: '3',
    operator_comment: 'Повреждение уголка после падения, фото приложено в деле №124.',
    created_at: '2026-03-14T08:15:00Z',
  },
  {
    id: 'op21',
    blank_id: '2',
    type: 'storage',
    reason: 'Временное хранение',
    from_location: 'У получателя',
    to_location: 'Военкомат МО Москва №1, камера хранения',
    owner_id: 'citizen_005',
    owner_name: 'Соколов Максим Андреевич',
    operator_id: 'user1',
    operator_name: 'Петров Петр Петрович',
    status: 'pending',
    operator_comment: 'Срок командировки 14 дней, бланк сдаётся до отъезда.',
    created_at: '2026-03-14T09:00:00Z',
  },
  {
    id: 'op20',
    blank_id: '3',
    type: 'issue',
    reason: 'Поступление на военную службу',
    from_location: 'Военкомат МО Москва №1',
    to_location: 'У получателя (на руках у военнослужащего)',
    owner_id: 'citizen_007',
    owner_name: 'Лебедев Артём Сергеевич',
    operator_id: 'user1',
    operator_name: 'Петров Петр Петрович',
    status: 'pending',
    created_at: '2026-03-14T12:00:00Z',
  },
];

export const addPendingCommissionerOperation = (op: Operation) => {
  mockPendingOperations.push(op);
};

export const commissionerSignatureOperationTypes: readonly OperationType[] = [
  'issue',
  'replacement',
  'storage',
];

export const operationRequiresCommissionerSignature = (op: Operation): boolean =>
  op.status === 'pending' &&
  commissionerSignatureOperationTypes.includes(op.type);

export const getPendingCommissionerSignatureOperations = (user: User): Operation[] => {
  return mockPendingOperations.filter((op) => {
    if (!operationRequiresCommissionerSignature(op)) return false;
    const blank = mockBlanks.find((b) => b.id === op.blank_id);
    if (!blank) return false;
    if (user.role === 'vkmo_operator' || user.role === 'commissioner') {
      return user.vkmo_id !== undefined && blank.vkmo_id === user.vkmo_id;
    }
    return false;
  });
};

export const getPendingCommissionerSignatureCount = (user: User) =>
  getPendingCommissionerSignatureOperations(user).length;

export const getPendingOperationsForUser = getPendingCommissionerSignatureOperations;

export const getPendingOperationsCountForUser = getPendingCommissionerSignatureCount;

// Причины по типам операций
export const operationReasons: Record<OperationType, string[]> = {
  receipt: [
    'Поступление из типографии',
    'Передача из вышестоящего органа',
    'Поступление в ВК субъекта',
    'Поступление в ВК МО, ввод в оборот и принятие к учёту',
  ],
  transfer: ['Передача в нижестоящий орган', 'Возврат в вышестоящий орган'],
  issue: ['Призыв', 'Мобилизация', 'Поступление на военную службу', 'Переучет'],
  storage: ['Командировка', 'Временное хранение', 'Отпуск'],
  return: ['Возврат после командировки', 'Сдача на хранение'],
  replacement: ['Утеря', 'Повреждение', 'Ошибка в данных', 'Изменение личных данных'],
  write_off: ['Утеря', 'Повреждение', 'Истечение срока действия', 'Брак'],
};

// Названия типов бланков
export const blankTypeNames: Record<BlankType, string> = {
  military_id: 'Военный билет',
  certificate: 'Справка',
  credential: 'Удостоверение',
};

export const blankTypeShortLabels: Record<BlankType, string> = {
  military_id: 'ВБ',
  certificate: 'Спр.',
  credential: 'Уд.',
};

const blankTypePluralForms: Record<BlankType, [string, string, string]> = {
  military_id: ['военный билет', 'военных билета', 'военных билетов'],
  certificate: ['справка', 'справки', 'справок'],
  credential: ['удостоверение', 'удостоверения', 'удостоверений'],
};

export const formatBlankCountRu = (type: BlankType, count: number) => {
  const [one, few, many] = blankTypePluralForms[type];
  return pluralizeRu(count, one, few, many);
};

export const getOperatorBlankInventory = (user: User) => {
  const empty: Record<BlankType, number> = {
    military_id: 0,
    certificate: 0,
    credential: 0,
  };
  const inCirculation = mockBlanks.filter((b) => b.status === 'in_circulation');
  if (user.role === 'vkmo_operator' && user.vkmo_id) {
    const mine = inCirculation.filter((b) => b.vkmo_id === user.vkmo_id);
    mine.forEach((b) => {
      empty[b.type] += 1;
    });
    return { total: mine.length, byType: empty };
  }
  if (
    user.role === 'center_operator' ||
    user.role === 'district_operator' ||
    user.role === 'subject_operator'
  ) {
    inCirculation.forEach((b) => {
      empty[b.type] += 1;
    });
    return { total: inCirculation.length, byType: empty };
  }
  return { total: 0, byType: empty };
};

// Названия статусов
export const statusNames: Record<BlankStatus, string> = {
  in_circulation: 'В обороте',
  issued: 'Выдан',
  on_hold: 'На удержании',
  written_off: 'Списан',
};

export const placeNames: Record<BlankPlace, string> = {
  at_center: 'У центра',
  at_district: 'У округа',
  at_omu: 'У ОМУ',
  at_vk_subject: 'У ВК субъекта',
  at_vk_mo: 'У ВК МО',
  in_transit: 'В пути',
  with_recipient: 'У получателя',
  archived: 'В архиве',
};

// Названия типов операций
export const operationTypeNames: Record<OperationType, string> = {
  receipt: 'Поступление',
  transfer: 'Перемещение',
  issue: 'Выдача',
  storage: 'Сдача на хранение',
  return: 'Возврат',
  replacement: 'Замена',
  write_off: 'Списание',
};

// Названия ролей
export const roleNames: Record<UserRole, string> = {
  center_operator: 'Оператор центра',
  district_operator: 'Оператор округа',
  subject_operator: 'Оператор субъекта',
  vkmo_operator: 'Оператор ВК МО',
  commissioner: 'Военный комиссар',
  auditor: 'Аудитор',
};

// Статистика для дашборда
export const getDashboardStats = (vkmoId?: string) => {
  const blanks = vkmoId 
    ? mockBlanks.filter(b => b.vkmo_id === vkmoId)
    : mockBlanks;
  
  return {
    in_circulation: blanks.filter(b => b.status === 'in_circulation').length,
    issued: blanks.filter(b => b.status === 'issued').length,
    on_hold: blanks.filter(b => b.status === 'on_hold').length,
    written_off: blanks.filter(b => b.status === 'written_off').length,
    total: blanks.length,
  };
};

// График операций (последние 7 дней)
export const getOperationsChart = () => {
  const today = new Date('2026-03-13');
  const data: {
    date: string;
    выдача: number;
    возврат: number;
    списание: number;
  }[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    
    data.push({
      date: dateStr,
      выдача: Math.floor(Math.random() * 10),
      возврат: Math.floor(Math.random() * 5),
      списание: Math.floor(Math.random() * 3),
    });
  }
  
  return data;
};
