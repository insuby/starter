const CYR_LETTERS = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';

export const normalizeSerialInput = (raw: string) => raw.trim().toUpperCase().replace(/Ё/g, 'Е');

export const sanitizeSerialInput = (raw: string) => {
  const u = normalizeSerialInput(raw);
  let out = '';
  for (let i = 0; i < u.length && out.length < 8; i++) {
    const c = u[i];
    if (out.length < 2) {
      if (CYR_LETTERS.includes(c)) out += c;
    } else if (/\d/.test(c)) {
      out += c;
    }
  }
  return out;
};

type ParsedSerial = {
  letters: string;
  num: number;
};

export const parseSerialNumber = (raw: string): ParsedSerial | null => {
  const s = normalizeSerialInput(raw);
  if (s.length !== 8) return null;
  const letters = s.slice(0, 2);
  const digits = s.slice(2);
  if (!/^\d{6}$/.test(digits)) return null;
  if (!CYR_LETTERS.includes(letters[0]) || !CYR_LETTERS.includes(letters[1])) return null;
  const num = parseInt(digits, 10);
  return { letters, num };
};

export const countInclusiveInSeries = (from: string, to: string): number | null => {
  const a = parseSerialNumber(from);
  const b = parseSerialNumber(to);
  if (!a || !b || a.letters !== b.letters) return null;
  if (b.num < a.num) return null;
  return b.num - a.num + 1;
};
