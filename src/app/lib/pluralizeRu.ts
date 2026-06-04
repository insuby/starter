export const pluralizeRu = (n: number, one: string, few: string, many: string): string => {
  const nAbs = Math.abs(Math.floor(n)) % 100;
  const n1 = nAbs % 10;
  if (nAbs > 10 && nAbs < 20) {
    return `${n} ${many}`;
  }
  if (n1 === 1) {
    return `${n} ${one}`;
  }
  if (n1 >= 2 && n1 <= 4) {
    return `${n} ${few}`;
  }
  return `${n} ${many}`;
};
