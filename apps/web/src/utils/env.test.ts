import { describe, it, expect, vi, afterEach } from 'vitest';
import { requiredEnv, envOrDefault } from './env';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('requiredEnv', () => {
  it('returns the value when the variable is set', () => {
    vi.stubEnv('VITE_TEST_REQUIRED', 'hello');
    expect(requiredEnv('VITE_TEST_REQUIRED')).toBe('hello');
  });

  it('coerces non-string values to string', () => {
    vi.stubEnv('VITE_TEST_NUMBER', '123');
    expect(requiredEnv('VITE_TEST_NUMBER')).toBe('123');
  });

  it('throws when the variable is missing', () => {
    vi.stubEnv('VITE_TEST_MISSING', '');
    // ensure it is seen as missing
    expect(() => requiredEnv('VITE_TEST_MISSING_XYZ_NEVER_SET')).toThrow(
      /required but was not provided/
    );
  });

  it('throws when the variable is an empty string', () => {
    vi.stubEnv('VITE_TEST_EMPTY', '');
    expect(() => requiredEnv('VITE_TEST_EMPTY')).toThrow(/VITE_TEST_EMPTY/);
  });

  it('error message includes the key name', () => {
    try {
      requiredEnv('VITE_DEFINITELY_NOT_SET_12345');
      expect.unreachable();
    } catch (e) {
      expect((e as Error).message).toContain('VITE_DEFINITELY_NOT_SET_12345');
    }
  });
});

describe('envOrDefault', () => {
  it('returns the env value when set', () => {
    vi.stubEnv('VITE_TEST_WITH_VALUE', 'from-env');
    expect(envOrDefault('VITE_TEST_WITH_VALUE', 'fallback')).toBe('from-env');
  });

  it('returns the default when missing', () => {
    expect(envOrDefault('VITE_TEST_DEFAULT_MISSING_XYZ', 'fallback')).toBe('fallback');
  });

  it('returns the default when value is empty string', () => {
    vi.stubEnv('VITE_TEST_EMPTY_DEFAULT', '');
    expect(envOrDefault('VITE_TEST_EMPTY_DEFAULT', 'fallback')).toBe('fallback');
  });

  it('supports empty-string defaults', () => {
    expect(envOrDefault('VITE_TEST_EMPTY_DEFAULT_2_XYZ', '')).toBe('');
  });
});
