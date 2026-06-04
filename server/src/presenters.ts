import type { Blank, Citizen, Operation, User } from './domain.js';
import { labelsRu, requiresCommissionerSignature } from './domain.js';

export interface Lookups {
  citizens: Map<string, Citizen>;
  users: Map<string, User>;
  blankNumbers: Map<string, string>;
}

export function buildLookups(citizens: Citizen[], users: User[], blanks: Blank[]): Lookups {
  return {
    citizens: new Map(citizens.map((c) => [c.id, c])),
    users: new Map(users.map((u) => [u.id, u])),
    blankNumbers: new Map(blanks.map((b) => [b.id, b.number])),
  };
}

const owner = (l: Lookups, id: string | null) => {
  if (!id) return null;
  const c = l.citizens.get(id);
  return c ? { id: c.id, full_name: c.full_name } : { id, full_name: id };
};

export function presentBlank(l: Lookups, b: Blank) {
  return {
    id: b.id,
    number: b.number,
    type: b.type,
    status: b.status,
    place: b.place,
    location_label: b.location_label,
    vkmo_id: b.vkmo_id,
    owner: owner(l, b.owner_id),
    created_at: b.created_at,
    updated_at: b.updated_at,
  };
}

// Карточка бланка: поля бланка + русские метки + история операций (новые сверху).
export function presentBlankCard(
  l: Lookups,
  b: Blank,
  operations: Operation[],
  vkmoName: string | null,
) {
  return {
    ...presentBlank(l, b),
    type_label: labelsRu.blank_type[b.type],
    status_label: labelsRu.blank_status[b.status],
    place_label: labelsRu.blank_place[b.place],
    vkmo_name: vkmoName,
    operations: operations.map((o) => presentOperation(l, o)),
  };
}

export function presentOperation(l: Lookups, o: Operation) {
  const operator = l.users.get(o.operator_id);
  const commissioner = o.commissioner_id ? l.users.get(o.commissioner_id) : undefined;
  return {
    id: o.id,
    blank_id: o.blank_id,
    blank_number: l.blankNumbers.get(o.blank_id) ?? null,
    type: o.type,
    status: o.status,
    reason: o.reason,
    from_location: o.from_location,
    to_location: o.to_location,
    owner: owner(l, o.owner_id),
    operator: { id: o.operator_id, name: operator?.name ?? o.operator_id },
    commissioner:
      o.commissioner_id
        ? { id: o.commissioner_id, name: commissioner?.name ?? o.commissioner_id, signature: o.commissioner_signature }
        : null,
    comment: o.comment,
    operator_comment: o.operator_comment,
    old_blank_id: o.old_blank_id,
    new_blank_id: o.new_blank_id,
    created_at: o.created_at,
    approved_at: o.approved_at,
  };
}

export function presentPendingSignature(l: Lookups, o: Operation) {
  const operator = l.users.get(o.operator_id);
  return {
    id: o.id,
    blank_id: o.blank_id,
    blank_number: l.blankNumbers.get(o.blank_id) ?? null,
    type: o.type,
    status: o.status,
    reason: o.reason,
    from_location: o.from_location,
    to_location: o.to_location,
    owner: owner(l, o.owner_id),
    operator: { id: o.operator_id, name: operator?.name ?? o.operator_id },
    operator_comment: o.operator_comment,
    created_at: o.created_at,
    requires_commissioner_signature: requiresCommissionerSignature(o),
  };
}
