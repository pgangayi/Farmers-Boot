/// <reference types="vite/client" />

interface ImportMetaEnv {
  // core variables that must be provided via .env[.local]
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_MAPBOX_TOKEN: string;
  readonly VITE_API_TIMEOUT_MS: string;
  readonly VITE_API_RETRY_ATTEMPTS: string;
  readonly VITE_APP_URL: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_OTLP_API_KEY: string;
  readonly VITE_OTLP_ENDPOINT: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_DEBUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
