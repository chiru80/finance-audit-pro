export type CsvCell = string | number | boolean | null | undefined;

export function escapeCsvCell(cell: CsvCell): string {
  const value = String(cell ?? '');
  if (/[",\n\r]/.test(value) || value !== value.trim()) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadCsv(filename: string, rows: CsvCell[][]): void {
  const csvBody = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
  const link = document.createElement('a');
  const supportsBlobUrl =
    typeof Blob !== 'undefined' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function';

  let objectUrl: string | null = null;
  if (supportsBlobUrl) {
    const blob = new Blob([csvBody], { type: 'text/csv;charset=utf-8;' });
    objectUrl = URL.createObjectURL(blob);
    link.setAttribute('href', objectUrl);
  } else {
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvBody));
  }

  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (objectUrl && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(objectUrl);
  }
}
