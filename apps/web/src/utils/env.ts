// centralized helpers for accessing Vite environment variables

/**
 * Read a Vite environment variable and throw if it is not defined or empty.
 *
 * Vite loads `.env`, `.env.local`, `.env.[mode]`, etc. at build time and exposes
 * the ones prefixed with `VITE_` through `import.meta.env`.  By default the code
 *base has been littered with `||` fallbacks; this helper makes missing values
 *fail early so nothing silently falls back to a hard‑coded constant.
 */
export function requiredEnv(key: string): string {
  const value = (import.meta.env as Record<string, unknown>)[key];
  if (value == null || value === '') {
    throw new Error(`environment variable \`${key}\` is required but was not provided`);
  }
  return String(value);
}

/**
 * Like requiredEnv but allows a default when the caller really wants one.  Prefer
 * using `requiredEnv` everywhere and explicitly set defaults in config files
 * rather than inline with `||`.
 */
export function envOrDefault(key: string, defaultValue: string): string {
  const value = (import.meta.env as Record<string, unknown>)[key];
  return value == null || value === '' ? defaultValue : String(value);
}
