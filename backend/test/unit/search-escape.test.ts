import { describe, it, expect } from 'vitest';
import { escapeLikePattern } from '../../src/services/search.service';

describe('escapeLikePattern', () => {
  it('escapes % so it is treated literally', () => {
    expect(escapeLikePattern('50%')).toBe('50\\%');
  });
  it('escapes _ so it is treated literally', () => {
    expect(escapeLikePattern('a_b')).toBe('a\\_b');
  });
  it('escapes backslash first to avoid double-escaping', () => {
    expect(escapeLikePattern('a\\b')).toBe('a\\\\b');
  });
  it('leaves plain text unchanged', () => {
    expect(escapeLikePattern('dentist')).toBe('dentist');
  });
});
