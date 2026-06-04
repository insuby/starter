import type { Blank, BlankType, BlankStatus, BlankPlace, Citizen, Operation, OrgUnit, User } from './domain.js';

// Демонстрационный набор данных, согласованный с фронтендом (src/app/data/mockData.ts)
// и контрактом. Используется in-memory репозиторием и сидом БД.

export const orgUnits: OrgUnit[] = [
  { id: 'center', parent_id: null, level: 'center', name: 'Центр учёта БСО', is_active: true },
  { id: 'district_001', parent_id: 'center', level: 'district', name: 'Военный округ №1', is_active: true },
  { id: 'omu_001', parent_id: 'district_001', level: 'omu', name: 'ОМУ №1', is_active: true },
  { id: 'vk_sub_001', parent_id: 'omu_001', level: 'vk_subject', name: 'ВК субъекта №1', is_active: true },
  { id: 'vk_mo_0001', parent_id: 'vk_sub_001', level: 'vk_mo', name: 'ВК МО №1', is_active: true },
  { id: 'vk_mo_0002', parent_id: 'vk_sub_001', level: 'vk_mo', name: 'ВК МО №2', is_active: true },
];

export const users: User[] = [
  { id: 'user1', name: 'Петров Петр Петрович', role: 'vkmo_operator', org_unit_id: 'vk_mo_0001', vkmo_id: 'vk_mo_0001', is_active: true },
  { id: 'user2', name: 'Иванов Иван Иванович', role: 'commissioner', org_unit_id: 'vk_mo_0001', vkmo_id: 'vk_mo_0001', is_active: true },
  { id: 'user3', name: 'Сидоров Сергей Сергеевич', role: 'auditor', org_unit_id: null, vkmo_id: null, is_active: true },
  { id: 'user4', name: 'Алексеев Алексей Алексеевич', role: 'center_operator', org_unit_id: 'center', vkmo_id: null, is_active: true },
  { id: 'user5', name: 'Михайлов Михаил Михайлович', role: 'district_operator', org_unit_id: 'district_001', vkmo_id: null, is_active: true },
  { id: 'user6', name: 'Николаев Николай Николаевич', role: 'subject_operator', org_unit_id: 'omu_001', vkmo_id: null, is_active: true },
  { id: 'user7', name: 'Орлов Олег Олегович', role: 'subject_operator', org_unit_id: 'vk_sub_001', vkmo_id: null, is_active: true },
];

export const citizens: Citizen[] = [
  { id: 'citizen_001', full_name: 'Смирнов Дмитрий Александрович', snils: null },
  { id: 'citizen_002', full_name: 'Козлов Андрей Владимирович', snils: null },
  { id: 'citizen_003', full_name: 'Волков Игорь Сергеевич', snils: null },
  { id: 'citizen_004', full_name: 'Новиков Павел Михайлович', snils: null },
  { id: 'citizen_005', full_name: 'Соколов Максим Андреевич', snils: null },
  { id: 'citizen_006', full_name: 'Егоров Олег Александрович', snils: null },
  { id: 'citizen_007', full_name: 'Лебедев Артём Сергеевич', snils: null },
];

const baseBlanks: Blank[] = [
  { id: '1', number: 'АА123456', type: 'military_id', status: 'issued', place: 'with_recipient', location_label: 'Военкомат МО Москва №1', vkmo_id: 'vk_mo_0001', owner_id: 'citizen_001', created_at: '2026-01-15T10:00:00Z', updated_at: '2026-02-10T14:30:00Z' },
  { id: '2', number: 'АА123457', type: 'military_id', status: 'in_circulation', place: 'at_vk_mo', location_label: 'Военкомат МО Москва №1', vkmo_id: 'vk_mo_0001', owner_id: null, created_at: '2026-01-15T10:00:00Z', updated_at: '2026-01-15T10:00:00Z' },
  { id: '3', number: 'АА123458', type: 'certificate', status: 'in_circulation', place: 'at_vk_mo', location_label: 'Военкомат МО Москва №1', vkmo_id: 'vk_mo_0001', owner_id: null, created_at: '2026-01-15T10:00:00Z', updated_at: '2026-01-15T10:00:00Z' },
  { id: '4', number: 'АА123459', type: 'credential', status: 'on_hold', place: 'at_vk_mo', location_label: 'Военкомат МО Москва №1', vkmo_id: 'vk_mo_0001', owner_id: 'citizen_002', created_at: '2026-01-15T10:00:00Z', updated_at: '2026-02-20T11:15:00Z' },
  { id: '5', number: 'АА123460', type: 'military_id', status: 'written_off', place: 'archived', location_label: 'Военкомат МО Москва №1', vkmo_id: 'vk_mo_0001', owner_id: null, created_at: '2026-01-15T10:00:00Z', updated_at: '2026-03-01T09:00:00Z' },
  { id: '6', number: 'АА123461', type: 'military_id', status: 'issued', place: 'with_recipient', location_label: 'Военкомат МО Москва №1', vkmo_id: 'vk_mo_0001', owner_id: 'citizen_003', created_at: '2026-01-15T10:00:00Z', updated_at: '2026-02-25T16:45:00Z' },
  { id: '7', number: 'ББ234567', type: 'certificate', status: 'in_circulation', place: 'at_vk_mo', location_label: 'Военкомат МО Москва №2', vkmo_id: 'vk_mo_0002', owner_id: null, created_at: '2026-01-20T11:00:00Z', updated_at: '2026-01-20T11:00:00Z' },
  { id: '8', number: 'АА123462', type: 'certificate', status: 'written_off', place: 'archived', location_label: 'Военкомат МО Москва №1', vkmo_id: 'vk_mo_0001', owner_id: 'citizen_004', created_at: '2026-02-05T10:00:00Z', updated_at: '2026-03-06T09:30:00Z' },
  { id: '9', number: 'АА123463', type: 'military_id', status: 'written_off', place: 'archived', location_label: 'Военкомат МО Москва №1', vkmo_id: 'vk_mo_0001', owner_id: 'citizen_006', created_at: '2026-02-07T10:00:00Z', updated_at: '2026-03-05T11:00:00Z' },
];

// Дополнительные бланки для проверки постраничной выдачи (масштаб реестра).
function generateBlanks(): Blank[] {
  const out: Blank[] = [];
  const types: BlankType[] = ['military_id', 'certificate', 'credential'];
  const statuses: BlankStatus[] = ['in_circulation', 'in_circulation', 'issued', 'on_hold', 'written_off'];
  const placeByStatus: Record<BlankStatus, BlankPlace> = {
    in_circulation: 'at_vk_mo',
    issued: 'with_recipient',
    on_hold: 'at_vk_mo',
    written_off: 'archived',
  };
  let seq = 0;
  for (const vk of ['vk_mo_0001', 'vk_mo_0002']) {
    const count = vk === 'vk_mo_0001' ? 140 : 40;
    for (let i = 0; i < count; i++) {
      seq += 1;
      const status = statuses[seq % statuses.length]!;
      const type = types[seq % types.length]!;
      const number = `ВГ${String(100000 + seq).slice(-6)}`;
      const day = String((seq % 27) + 1).padStart(2, '0');
      const month = String((seq % 5) + 1).padStart(2, '0');
      const hasOwner = status === 'issued' || status === 'on_hold';
      out.push({
        id: `g${seq}`,
        number,
        type,
        status,
        place: placeByStatus[status],
        location_label: vk === 'vk_mo_0001' ? 'Военкомат МО Москва №1' : 'Военкомат МО Москва №2',
        vkmo_id: vk,
        owner_id: hasOwner ? citizens[seq % citizens.length]!.id : null,
        created_at: `2026-${month}-${day}T09:00:00Z`,
        updated_at: `2026-${month}-${day}T12:30:00Z`,
      });
    }
  }
  return out;
}

// Запас «в обороте» на верхних уровнях иерархии, чтобы распределение
// (Центр → округ → ОМУ → субъект → ВК МО) работало из коробки. Распределение
// в repo.distribute отбирает бланки по vkmo_id === узел-отправитель и place уровня.
function generateUpperLevelStock(): Blank[] {
  const out: Blank[] = [];
  const types: BlankType[] = ['military_id', 'certificate', 'credential'];
  const levels: { org: string; place: BlankPlace; label: string; prefix: string; perType: number }[] = [
    { org: 'center', place: 'at_center', label: 'Центр учёта БСО', prefix: 'ЦБ', perType: 20 },
    { org: 'district_001', place: 'at_district', label: 'Военный округ №1', prefix: 'ОК', perType: 12 },
    { org: 'omu_001', place: 'at_omu', label: 'ОМУ №1', prefix: 'ОМ', perType: 8 },
    { org: 'vk_sub_001', place: 'at_vk_subject', label: 'ВК субъекта №1', prefix: 'СУ', perType: 8 },
  ];
  let seq = 0;
  for (const lvl of levels) {
    for (const type of types) {
      for (let i = 0; i < lvl.perType; i++) {
        seq += 1;
        const number = `${lvl.prefix}${String(100000 + seq).slice(-6)}`;
        const day = String((seq % 27) + 1).padStart(2, '0');
        const month = String((seq % 5) + 1).padStart(2, '0');
        out.push({
          id: `u${seq}`,
          number,
          type,
          status: 'in_circulation',
          place: lvl.place,
          location_label: lvl.label,
          vkmo_id: lvl.org,
          owner_id: null,
          created_at: `2026-${month}-${day}T09:00:00Z`,
          updated_at: `2026-${month}-${day}T09:00:00Z`,
        });
      }
    }
  }
  return out;
}

export const blanks: Blank[] = [...baseBlanks, ...generateBlanks(), ...generateUpperLevelStock()];

const op = (o: Partial<Operation> & Pick<Operation, 'id' | 'blank_id' | 'type' | 'status' | 'reason' | 'operator_id' | 'created_at'>): Operation => ({
  from_location: null,
  to_location: null,
  owner_id: null,
  commissioner_id: null,
  commissioner_signature: null,
  old_blank_id: null,
  new_blank_id: null,
  comment: null,
  operator_comment: null,
  approved_at: null,
  ...o,
});

export const operations: Operation[] = [
  op({ id: 'op1', blank_id: '1', type: 'issue', status: 'approved', reason: 'Призыв', to_location: 'Военкомат МО Москва №1', owner_id: 'citizen_001', operator_id: 'user1', commissioner_id: 'user2', commissioner_signature: 'Иванов И.И.', created_at: '2026-02-10T14:30:00Z', approved_at: '2026-02-10T14:35:00Z' }),
  op({ id: 'op15', blank_id: '4', type: 'receipt', status: 'approved', reason: 'Поступление в ВК МО', from_location: 'ВК субъекта', to_location: 'Военкомат МО Москва №1', operator_id: 'user1', commissioner_id: 'user2', commissioner_signature: 'Иванов И.И.', created_at: '2026-01-15T10:00:00Z', approved_at: '2026-01-15T10:05:00Z' }),
  op({ id: 'op16', blank_id: '4', type: 'issue', status: 'approved', reason: 'Мобилизация', to_location: 'Военкомат МО Москва №1', owner_id: 'citizen_002', operator_id: 'user1', commissioner_id: 'user2', commissioner_signature: 'Иванов И.И.', created_at: '2026-02-01T11:00:00Z', approved_at: '2026-02-01T11:10:00Z' }),
  op({ id: 'op3', blank_id: '5', type: 'write_off', status: 'approved', reason: 'Утеря', operator_id: 'user1', commissioner_id: 'user2', commissioner_signature: 'Иванов И.И.', created_at: '2026-03-01T09:00:00Z', approved_at: '2026-03-01T09:05:00Z' }),
  op({ id: 'op9', blank_id: '8', type: 'write_off', status: 'approved', reason: 'Недостача', operator_id: 'user1', commissioner_id: 'user2', commissioner_signature: 'Иванов И.И.', created_at: '2026-03-06T09:30:00Z', approved_at: '2026-03-06T09:35:00Z' }),
  op({ id: 'op12', blank_id: '9', type: 'write_off', status: 'approved', reason: 'Утеря', operator_id: 'user1', commissioner_id: 'user2', commissioner_signature: 'Иванов И.И.', created_at: '2026-03-05T11:00:00Z', approved_at: '2026-03-05T11:05:00Z' }),
  // Ожидают подписи комиссара
  op({ id: 'op4', blank_id: '3', type: 'issue', status: 'pending', reason: 'Мобилизация', from_location: 'Военкомат МО Москва №1', to_location: 'У получателя', owner_id: 'citizen_004', operator_id: 'user1', operator_comment: 'Срочная выдача по решению призывной комиссии.', created_at: '2026-03-13T10:00:00Z' }),
  op({ id: 'op5', blank_id: '2', type: 'issue', status: 'pending', reason: 'Призыв', from_location: 'Военкомат МО Москва №1', to_location: 'У получателя', owner_id: 'citizen_005', operator_id: 'user1', created_at: '2026-03-13T11:30:00Z' }),
  op({ id: 'op21', blank_id: '2', type: 'storage', status: 'pending', reason: 'Временное хранение', from_location: 'У получателя', to_location: 'Камера хранения', owner_id: 'citizen_005', operator_id: 'user1', created_at: '2026-03-14T09:00:00Z' }),
];

// Демонстрационные записи журнала аудита (2.13), чтобы журнал не был пустым.
// Поля совпадают с AuditInput + at. Реальные записи добавляются при операциях.
export const auditSeed: {
  at: string;
  user_id: string | null;
  user_name: string | null;
  role: User['role'] | null;
  category: string;
  action: string;
  target: string | null;
  details: string | null;
  payload: unknown;
}[] = [
  { at: '2026-03-13T10:00:00Z', user_id: 'user1', user_name: 'Петров Петр Петрович', role: 'vkmo_operator', category: 'operation', action: 'Операция отправлена на подпись', target: 'АА123458', details: 'Выдача · Мобилизация', payload: null },
  { at: '2026-03-13T11:30:00Z', user_id: 'user1', user_name: 'Петров Петр Петрович', role: 'vkmo_operator', category: 'operation', action: 'Операция отправлена на подпись', target: 'АА123457', details: 'Выдача · Призыв', payload: null },
  { at: '2026-03-06T09:30:00Z', user_id: 'user1', user_name: 'Петров Петр Петрович', role: 'vkmo_operator', category: 'operation', action: 'Операция зарегистрирована', target: 'АА123462', details: 'Списание · Недостача', payload: null },
  { at: '2026-02-10T14:35:00Z', user_id: 'user2', user_name: 'Иванов Иван Иванович', role: 'commissioner', category: 'signature', action: 'Операция подписана комиссаром', target: 'АА123456', details: 'Выдача · подписано ЭЦП', payload: null },
  { at: '2026-01-15T10:05:00Z', user_id: 'user1', user_name: 'Петров Петр Петрович', role: 'vkmo_operator', category: 'receipt', action: 'Поступление серии бланков', target: 'Военкомат МО Москва №1', details: 'Поступление в ВК МО', payload: null },
];
