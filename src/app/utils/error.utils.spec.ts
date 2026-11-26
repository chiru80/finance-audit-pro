import { describe, it, expect } from 'vitest';
import { extractErrorMessage, toAppError } from './error.utils';

describe('error.utils', () => {
  it('returns Error.message for Error instances', () => {
    expect(extractErrorMessage(new Error('Boom'), 'Fallback')).toBe('Boom');
  });

  it('extracts message, details, and hint from PostgrestError plain objects', () => {
    const pgErr = {
      code: 'PGRST204',
      message: "Could not find the 'amount_given' column",
      details: 'Schema cache stale',
      hint: 'Reload schema',
    };
    expect(extractErrorMessage(pgErr, 'Fallback')).toBe(
      "Could not find the 'amount_given' column — Schema cache stale — Reload schema",
    );
  });

  it('falls back when thrown object has empty or missing fields', () => {
    expect(extractErrorMessage({}, 'Fallback msg')).toBe('Fallback msg');
    expect(extractErrorMessage(null, 'Fallback msg')).toBe('Fallback msg');
  });

  it('converts plain Supabase errors into Error instances via toAppError', () => {
    const err = toAppError({ message: 'Permission denied' }, 'Fallback');
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Permission denied');
  });
});
