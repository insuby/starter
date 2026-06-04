// Утилиты выгрузки табличных данных без внешних зависимостей.
// Excel: формируется HTML-таблица с MIME application/vnd.ms-excel (.xls),
// которую корректно открывают Excel, LibreOffice и МойОфис (целевая ОС Astra Linux).
// PDF: открывается окно печати со сверстанным отчётом — пользователь сохраняет в PDF.

export interface ExportColumn<T = Record<string, unknown>> {
  key: keyof T & string;
  title: string;
}

export interface ExportMeta {
  title: string;
  subtitle?: string;
  generatedAt?: string;
}

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatNow = (): string =>
  new Date().toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const buildTableHtml = <T extends Record<string, unknown>>(
  columns: ExportColumn<T>[],
  rows: T[],
): string => {
  const head = columns.map((c) => `<th>${escapeHtml(c.title)}</th>`).join('');
  const body = rows
    .map(
      (row) =>
        `<tr>${columns.map((c) => `<td>${escapeHtml(row[c.key])}</td>`).join('')}</tr>`,
    )
    .join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
};

const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'report';

export function exportToExcel<T extends Record<string, unknown>>(
  meta: ExportMeta,
  columns: ExportColumn<T>[],
  rows: T[],
): void {
  const generatedAt = meta.generatedAt ?? formatNow();
  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
<meta charset="utf-8" />
<style>
  table { border-collapse: collapse; }
  th, td { border: 1px solid #999; padding: 4px 8px; font-family: Calibri, Arial, sans-serif; font-size: 11pt; mso-number-format: '\\@'; }
  th { background: #1f3a5f; color: #fff; font-weight: bold; text-align: left; }
  caption { font-weight: bold; font-size: 13pt; text-align: left; padding-bottom: 6px; }
</style>
</head>
<body>
  <table>
    <caption>${escapeHtml(meta.title)}${meta.subtitle ? ' — ' + escapeHtml(meta.subtitle) : ''}<br/>Сформировано: ${escapeHtml(generatedAt)}</caption>
  </table>
  ${buildTableHtml(columns, rows)}
</body>
</html>`;
  // BOM для корректной кириллицы при открытии в Excel.
  const blob = new Blob(['﻿', html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  triggerDownload(blob, `${slugify(meta.title)}.xls`);
}

export function exportToPdf<T extends Record<string, unknown>>(
  meta: ExportMeta,
  columns: ExportColumn<T>[],
  rows: T[],
): void {
  const generatedAt = meta.generatedAt ?? formatNow();
  const win = window.open('', '_blank', 'noopener,width=1024,height=768');
  if (!win) return;

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(meta.title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', Georgia, serif; color: #111; margin: 24px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .subtitle { font-size: 13px; color: #444; margin: 0 0 2px; }
  .meta { font-size: 11px; color: #666; margin: 0 0 16px; }
  table { border-collapse: collapse; width: 100%; font-size: 11px; }
  th, td { border: 1px solid #888; padding: 4px 6px; text-align: left; vertical-align: top; }
  th { background: #1f3a5f; color: #fff; }
  tbody tr:nth-child(even) { background: #f3f5f8; }
  @media print { @page { size: A4 landscape; margin: 12mm; } body { margin: 0; } }
</style>
</head>
<body>
  <h1>${escapeHtml(meta.title)}</h1>
  ${meta.subtitle ? `<p class="subtitle">${escapeHtml(meta.subtitle)}</p>` : ''}
  <p class="meta">Сформировано: ${escapeHtml(generatedAt)} · Записей: ${rows.length}</p>
  ${buildTableHtml(columns, rows)}
  <script>window.onload = function () { window.focus(); window.print(); };</script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}
