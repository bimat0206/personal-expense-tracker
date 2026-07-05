import Papa from 'papaparse';

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

/** Only standard comma-delimited, UTF-8 CSV is supported in v1 (PRD §5.8). */
export function parseCsv(content: string): ParsedCsv {
  const result = Papa.parse<string[]>(content, {
    delimiter: ',',
    skipEmptyLines: true,
  });
  if (result.errors.length > 0) {
    throw new Error(`Unsupported CSV format: ${result.errors[0].message}`);
  }
  const [headers, ...rows] = result.data;
  if (!headers || headers.length === 0) {
    throw new Error('CSV file has no header row');
  }
  return { headers, rows };
}
