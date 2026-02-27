// CommonJS counterpart of env.mjs for scripts that use require

function requireEnv(key) {
  const val = process.env[key];
  if (val == null || val === '') {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return val;
}

function requireEnvInt(key) {
  const val = requireEnv(key);
  const num = parseInt(val, 10);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} must be an integer, got '${val}'`);
  }
  return num;
}

function optionalEnv(key, defaultValue = '') {
  const val = process.env[key];
  return val == null || val === '' ? defaultValue : val;
}

module.exports = {
  requireEnv,
  requireEnvInt,
  optionalEnv,
};
