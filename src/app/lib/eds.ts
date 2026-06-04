import type { User } from '../data/mockData';

// Электронная подпись комиссара (1.16).
// Демонстрационная реализация: набор сертификатов и формирование подписи.
// Алгоритмы соответствуют отечественным ГОСТ (как в реальной системе с СКЗИ).

export const EDS_SIGN_ALGORITHM = 'ГОСТ Р 34.10-2012 (256 бит)';
export const EDS_HASH_ALGORITHM = 'ГОСТ Р 34.11-2012 (Стрибог, 256 бит)';

export interface Certificate {
  id: string;
  subject: string; // владелец
  position: string;
  serial: string;
  issuer: string;
  validFrom: string; // ISO date
  validTo: string; // ISO date
}

export interface Signature {
  signedAt: string; // ISO
  signerName: string;
  certificate: Certificate;
  signAlgorithm: string;
  hashAlgorithm: string;
  dataHash: string; // hex
  signatureValue: string; // base64
}

// Сертификаты привязаны к учётным записям комиссаров (демо).
const certificatesByUser: Record<string, Certificate[]> = {
  user2: [
    {
      id: 'cert_user2_1',
      subject: 'Иванов Иван Иванович',
      position: 'Военный комиссар',
      serial: '1A 2B 3C 4D 5E 6F 70 81 92 A3',
      issuer: 'УЦ Минобороны России',
      validFrom: '2026-01-15',
      validTo: '2027-01-15',
    },
  ],
};

export function getAvailableCertificates(user: User): Certificate[] {
  return certificatesByUser[user.id] ?? [];
}

export function isCertificateValid(cert: Certificate, at: Date = new Date()): boolean {
  const from = new Date(`${cert.validFrom}T00:00:00`).getTime();
  const to = new Date(`${cert.validTo}T23:59:59`).getTime();
  const t = at.getTime();
  return t >= from && t <= to;
}

// Детерминированный псевдо-хеш (только для демонстрации, не криптостойкий).
const pseudoHashHex = (input: string): string => {
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = (h1 ^ c) >>> 0;
    h1 = (h1 * 0x01000193) >>> 0;
    h2 = (h2 + c * (i + 1)) >>> 0;
    h2 = (h2 ^ (h2 << 5)) >>> 0;
  }
  const block = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  // 64 hex-символа — имитация 256-битного хеша Стрибог.
  return (
    block(h1) +
    block(h2) +
    block((h1 ^ h2) >>> 0) +
    block((h1 + h2) >>> 0) +
    block((h1 * 3) >>> 0) +
    block((h2 * 7) >>> 0) +
    block((h1 ^ (h2 << 3)) >>> 0) +
    block((h2 ^ (h1 << 7)) >>> 0)
  );
};

const toBase64 = (input: string): string => {
  if (typeof btoa === 'function') {
    // btoa требует latin1 — кодируем в безопасный вид.
    return btoa(unescape(encodeURIComponent(input)));
  }
  return input;
};

export function signData(cert: Certificate, payload: string, signerName: string): Signature {
  const signedAt = new Date().toISOString();
  const dataHash = pseudoHashHex(payload);
  const signatureValue = toBase64(`${dataHash}.${cert.serial}.${signedAt}`);
  return {
    signedAt,
    signerName,
    certificate: cert,
    signAlgorithm: EDS_SIGN_ALGORITHM,
    hashAlgorithm: EDS_HASH_ALGORITHM,
    dataHash,
    signatureValue,
  };
}

// Хранилище подписей операций (демо). В продуктиве подпись хранится на сервере
// рядом с операцией (бэкенд 2.7).
const operationSignatures = new Map<string, Signature>();

export function recordOperationSignature(operationId: string, signature: Signature): void {
  operationSignatures.set(operationId, signature);
}

export function getOperationSignature(operationId: string): Signature | undefined {
  return operationSignatures.get(operationId);
}
