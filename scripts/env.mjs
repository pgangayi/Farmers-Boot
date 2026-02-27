// env.mjs
// Shared helper for validating environment variables in Node scripts.

export function requireEnv(key) {
  const val = process.env[key];
  if (val == null || val === '') {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return val;
}

export function requireEnvInt(key) {
  const val = requireEnv(key);
  const num = parseInt(val, 10);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} must be an integer, got '${val}'`);
  }
  return num;
}

export function optionalEnv(key, defaultValue = '') {
  const val = process.env[key];
  return val == null || val === '' ? defaultValue : val;
}
