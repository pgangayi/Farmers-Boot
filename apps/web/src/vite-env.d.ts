/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_MAPBOX_TOKEN: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_DEBUG: string;
  readonly VITE_API_TIMEOUT_MS: string;
  readonly VITE_API_RETRY_ATTEMPTS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
