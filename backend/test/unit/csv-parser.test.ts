import { describe, it, expect } from 'vitest';
import { parseCsv } from '../../src/lib/csv-parser';

describe('parseCsv', () => {
  it('parses headers and rows from standard comma-delimited CSV', () => {
    const { headers, rows } = parseCsv('date,amount,note\n2026-01-01,12.50,Coffee\n2026-01-02,-5,Refund');
    expect(headers).toEqual(['date', 'amount', 'note']);
    expect(rows).toEqual([
      ['2026-01-01', '12.50', 'Coffee'],
      ['2026-01-02', '-5', 'Refund'],
    ]);
  });

  it('handles quoted fields containing commas', () => {
    const { rows } = parseCsv('date,note\n2026-01-01,"Coffee, large"');
    expect(rows).toEqual([['2026-01-01', 'Coffee, large']]);
  });

  it('throws when there is no header row', () => {
    expect(() => parseCsv('')).toThrow();
  });
});
