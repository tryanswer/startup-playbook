/**
 * API utilities tests — covers traceId generation, response helpers, input validation.
 */

import { describe, it, expect } from 'vitest';
import { generateTraceId, validateRequestBody } from '../api-utils';

describe('generateTraceId', () => {
  it('returns a string starting with sp-', () => {
    const traceId = generateTraceId();
    expect(traceId).toMatch(/^sp-\d+-[a-z0-9]+$/);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateTraceId()));
    expect(ids.size).toBe(100);
  });
});

describe('validateRequestBody', () => {
  it('accepts valid body', () => {
    const result = validateRequestBody({ message: 'hello' });
    expect(result).toBe(true);
  });

  it('accepts null body within size limit', () => {
    const result = validateRequestBody(null);
    expect(result).toBe(true);
  });

  it('throws on oversized body', () => {
    const bigBody = { data: 'x'.repeat(2_000_000) };
    expect(() => validateRequestBody(bigBody, 1_000_000)).toThrow('too large');
  });
});
