import type { BlankType } from './mockData';

export type OrgLevel = 'center' | 'district' | 'omu' | 'vk_subject' | 'vk_mo';

export type OrgUnit = {
  id: string;
  parentId: string | null;
  level: OrgLevel;
  name: string;
};

export const ORG_CENTER_ID = 'center_001';

export const ORG_TOTAL_OMU = 4;
export const ORG_TOTAL_VK_SUBJECT = 87;
export const ORG_TOTAL_VK_MO = 1500;

const DISTRICTS: { id: string; name: string }[] = [
  { id: 'district_001', name: 'Центральный военный округ' },
];

const OMU_CONFIG: { id: string; parentId: string; name: string }[] = [
  { id: 'omu_001', parentId: 'district_001', name: 'ОМУ №1 (ЦВО)' },
  { id: 'omu_002', parentId: 'district_001', name: 'ОМУ №2 (ЦВО)' },
  { id: 'omu_003', parentId: 'district_002', name: 'ОМУ №1 (ЗВО)' },
  { id: 'omu_004', parentId: 'district_003', name: 'ОМУ №1 (ЮВО)' },
];

const OMU_VK_SUBJECT_COUNTS = [22, 22, 21, 22];

const buildOrgUnits = (): OrgUnit[] => {
  const list: OrgUnit[] = [];
  list.push({
    id: ORG_CENTER_ID,
    parentId: null,
    level: 'center',
    name: 'Центр (администратор)',
  });

  DISTRICTS.forEach((d) => {
    list.push({ id: d.id, parentId: ORG_CENTER_ID, level: 'district', name: d.name });
  });

  OMU_CONFIG.forEach((o) => {
    list.push({ id: o.id, parentId: o.parentId, level: 'omu', name: o.name });
  });

  let vkSubIdx = 0;
  OMU_CONFIG.forEach((o, oi) => {
    const n = OMU_VK_SUBJECT_COUNTS[oi] ?? 0;
    for (let k = 0; k < n; k++) {
      vkSubIdx += 1;
      const id = `vk_sub_${String(vkSubIdx).padStart(3, '0')}`;
      list.push({
        id,
        parentId: o.id,
        level: 'vk_subject',
        name: `ВК субъекта №${vkSubIdx}`,
      });
    }
  });

  const vkSubjects = list.filter((u) => u.level === 'vk_subject');
  let moIdx = 0;
  vkSubjects.forEach((vs, i) => {
    const count = i < 21 ? 18 : 17;
    for (let m = 0; m < count; m++) {
      moIdx += 1;
      list.push({
        id: `vk_mo_${String(moIdx).padStart(4, '0')}`,
        parentId: vs.id,
        level: 'vk_mo',
        name: `ВК МО №${moIdx}`,
      });
    }
  });

  return list;
};

export const ORG_UNITS: OrgUnit[] = buildOrgUnits();

export const getOrgUnit = (id: string) => ORG_UNITS.find((u) => u.id === id);

export const getOrgChildren = (parentId: string) =>
  ORG_UNITS.filter((u) => u.parentId === parentId);

export const getOrgPath = (id: string) => {
  const path: OrgUnit[] = [];
  let cur: OrgUnit | undefined = getOrgUnit(id);
  while (cur) {
    path.unshift(cur);
    cur = cur.parentId ? getOrgUnit(cur.parentId) : undefined;
  }
  return path;
};

export type TypeCounts = Record<BlankType, number>;

export const emptyTypeCounts = (): TypeCounts => ({
  military_id: 0,
  certificate: 0,
  credential: 0,
});

export const demoIncomingFromParent: Record<string, TypeCounts> = (() => {
  const map: Record<string, TypeCounts> = {};
  DISTRICTS.forEach((d) => {
    map[d.id] = { military_id: 1200, certificate: 400, credential: 200 };
  });
  OMU_CONFIG.forEach((o) => {
    map[o.id] = { military_id: 500, certificate: 150, credential: 80 };
  });
  for (let i = 1; i <= ORG_TOTAL_VK_SUBJECT; i++) {
    const id = `vk_sub_${String(i).padStart(3, '0')}`;
    map[id] = { military_id: 80, certificate: 25, credential: 12 };
  }
  return map;
})();
