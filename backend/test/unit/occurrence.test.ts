import { describe, it, expect } from 'vitest';
import { computeOccurrences } from '../../src/lib/occurrence';

describe('computeOccurrences', () => {
  it('weekly: generates every 7 days from startDate through upToDate inclusive', () => {
    const dates = computeOccurrences({ frequency: 'weekly', startDate: '2026-01-06', endDate: null }, '2026-01-27');
    expect(dates).toEqual(['2026-01-06', '2026-01-13', '2026-01-20', '2026-01-27']);
  });

  it('monthly: falls back to the last day of shorter months without skipping', () => {
    const dates = computeOccurrences({ frequency: 'monthly', startDate: '2026-01-31', endDate: null }, '2026-04-30');
    expect(dates).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
  });

  it('yearly: falls back from Feb 29 to Feb 28 in non-leap years', () => {
    const dates = computeOccurrences({ frequency: 'yearly', startDate: '2024-02-29', endDate: null }, '2026-03-01');
    expect(dates).toEqual(['2024-02-29', '2025-02-28', '2026-02-28']);
  });

  it('respects an inclusive endDate', () => {
    const dates = computeOccurrences({ frequency: 'weekly', startDate: '2026-01-06', endDate: '2026-01-13' }, '2026-02-01');
    expect(dates).toEqual(['2026-01-06', '2026-01-13']);
  });

  it('generates nothing when upToDate is before startDate', () => {
    const dates = computeOccurrences({ frequency: 'monthly', startDate: '2026-05-01', endDate: null }, '2026-04-01');
    expect(dates).toEqual([]);
  });
});
