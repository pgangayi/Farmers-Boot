import { requiredEnv } from './env';

// list of env vars the client expects to exist.  Adding a name here will make
// the application fail to start if the variable is missing, providing a clear
// error message when someone forgets to populate .env.
const REQUIRED_CLIENT_VARS = [
  'VITE_API_BASE_URL',
  'VITE_API_URL',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SENTRY_DSN',
  'VITE_MAPBOX_TOKEN',
  'VITE_APP_URL',
  'VITE_APP_VERSION',
];

export function validateEnv(): void {
  for (const key of REQUIRED_CLIENT_VARS) {
    requiredEnv(key);
  }
}
