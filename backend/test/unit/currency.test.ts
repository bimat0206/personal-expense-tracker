import { describe, it, expect } from 'vitest';
import { isValidAmountCents, roundToCents } from '../../src/lib/currency';

describe('isValidAmountCents', () => {
  it('accepts positive integers', () => {
    expect(isValidAmountCents(100)).toBe(true);
  });
  it('rejects zero', () => {
    expect(isValidAmountCents(0)).toBe(false);
  });
  it('rejects negative numbers', () => {
    expect(isValidAmountCents(-50)).toBe(false);
  });
  it('rejects non-integers', () => {
    expect(isValidAmountCents(10.5)).toBe(false);
  });
  it('rejects non-numbers', () => {
    expect(isValidAmountCents('100')).toBe(false);
  });
});

describe('roundToCents', () => {
  it('rounds a decimal amount to the nearest cent (round-half-up)', () => {
    expect(roundToCents(10.005)).toBe(1001); // 1000.5 -> rounds up to 1001
    expect(roundToCents(9.99)).toBe(999);
    expect(roundToCents(0.1)).toBe(10);
  });
});
