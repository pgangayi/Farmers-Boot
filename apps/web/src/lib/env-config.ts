/**
 * ============================================================================
 * ENVIRONMENT CONFIGURATION
 * ============================================================================
 * Centralized environment configuration for Farmers Boot
 * Provides graceful fallbacks for missing environment variables
 * ============================================================================
 */

// Environment configuration interface
export interface EnvConfig {
  // Supabase configuration
  supabaseUrl: string;
  supabasePublishableKey: string;
  supabaseServiceRoleKey?: string;

  // Application URLs
  appUrl: string;
  webUrl: string;
  apiUrl: string;

  // External services
  mapboxToken?: string;
  googleAiApiKey?: string;
  resendApiKey?: string;
  fromEmail?: string;

  // Development/production flags
  environment: 'development' | 'staging' | 'production';
  isDevelopment: boolean;
  isProduction: boolean;

  // Feature flags
  enableAuditLogging: boolean;
  enableRealtime: boolean;
  enableNotifications: boolean;
  enableAI: boolean;
  enableWeather: boolean;

  // Optional services
  sentryDsn?: string;
  cloudflareAccountId?: string;
  cloudflareApiToken?: string;
}

// Configuration validation result
export interface ConfigValidationResult {
  isValid: boolean;
  missingRequired: string[];
  warnings: string[];
}

// Get environment variable with fallback
function getEnvVar(key: string, fallback?: string): string | undefined {
  return getOptionalEnvVar(key, fallback);
}

// Get optional environment variable
function getOptionalEnvVar(key: string, fallback?: string): string | undefined {
  // Check for Deno environment (Edge Functions)
  if (typeof globalThis !== 'undefined' && 'Deno' in globalThis) {
    const denoEnv = (
      globalThis as { Deno?: { env?: { get?: (key: string) => string | undefined } } }
    ).Deno?.env;
    return denoEnv?.get?.(key) || fallback;
  }

  // Check for Node.js environment
  if (typeof globalThis !== 'undefined' && 'process' in globalThis) {
    const processEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } })
      .process?.env;
    return processEnv?.[key] || fallback;
  }

  // Check for Vite environment (import.meta.env)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env as Record<string, string | undefined>)[key] || fallback;
  }

  return fallback;
}

// Check if running in browser
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// Default values for development
const DEV_DEFAULTS = {
  appUrl: 'http://localhost:3000',
  webUrl: 'http://localhost:3000',
  apiUrl: 'http://localhost:8787',
  supabaseUrl: 'http://localhost:54321',
  supabasePublishableKey: '',
};

// Default values for production
const PROD_DEFAULTS = {
  appUrl: 'https://farmersboot.com',
  webUrl: 'https://farmersboot.com',
  apiUrl: 'https://api.farmersboot.com',
  supabaseUrl: '',
  supabasePublishableKey: '',
};

// Create environment configuration with graceful fallbacks
export function createEnvConfig(): EnvConfig {
  const environment =
    (getOptionalEnvVar('ENVIRONMENT', 'development') as 'development' | 'staging' | 'production') ||
    'development';
  const isDevelopment = environment === 'development';
  const isProduction = environment === 'production';

  const defaults = isDevelopment ? DEV_DEFAULTS : PROD_DEFAULTS;

  return {
    // Supabase configuration - use empty strings as fallback for development
    supabaseUrl:
      getOptionalEnvVar('SUPABASE_URL') ||
      getOptionalEnvVar('VITE_SUPABASE_URL') ||
      defaults.supabaseUrl,
    supabasePublishableKey:
      getOptionalEnvVar('SUPABASE_PUBLISHABLE_KEY') ||
      getOptionalEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY') ||
      getOptionalEnvVar('SUPABASE_ANON_KEY') ||
      getOptionalEnvVar('VITE_SUPABASE_ANON_KEY') ||
      defaults.supabasePublishableKey,
    supabaseServiceRoleKey: getOptionalEnvVar('SUPABASE_SERVICE_ROLE_KEY'),

    // Application URLs
    appUrl: getOptionalEnvVar('APP_URL') || defaults.appUrl,
    webUrl: getOptionalEnvVar('WEB_URL') || defaults.webUrl,
    apiUrl: getOptionalEnvVar('API_URL') || defaults.apiUrl,

    // External services
    mapboxToken: getOptionalEnvVar('VITE_MAPBOX_TOKEN'),
    googleAiApiKey: getOptionalEnvVar('GOOGLE_AI_API_KEY'),
    resendApiKey: getOptionalEnvVar('RESEND_API_KEY'),
    fromEmail: getOptionalEnvVar('FROM_EMAIL', 'noreply@farmersboot.com'),

    // Environment flags
    environment,
    isDevelopment,
    isProduction,

    // Feature flags
    enableAuditLogging: getOptionalEnvVar('ENABLE_AUDIT_LOGGING', 'true') === 'true',
    enableRealtime: getOptionalEnvVar('ENABLE_REALTIME', 'true') === 'true',
    enableNotifications: getOptionalEnvVar('ENABLE_NOTIFICATIONS', 'true') === 'true',
    enableAI: getOptionalEnvVar('ENABLE_AI', 'true') === 'true',
    enableWeather: getOptionalEnvVar('ENABLE_WEATHER', 'true') === 'true',

    // Optional services
    sentryDsn: getOptionalEnvVar('SENTRY_DSN'),
    cloudflareAccountId: getOptionalEnvVar('CF_ACCOUNT_ID'),
    cloudflareApiToken: getOptionalEnvVar('CF_API_TOKEN'),
  };
}

// Default export for easy import
export const env = createEnvConfig();

// Validate required environment variables
export function validateEnvConfig(): ConfigValidationResult {
  const missingRequired: string[] = [];
  const warnings: string[] = [];

  // Check for required Supabase configuration
  const supabaseUrl = getOptionalEnvVar('SUPABASE_URL') || getOptionalEnvVar('VITE_SUPABASE_URL');
  const supabasePublishableKey =
    getOptionalEnvVar('SUPABASE_PUBLISHABLE_KEY') ||
    getOptionalEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY') ||
    getOptionalEnvVar('SUPABASE_ANON_KEY') ||
    getOptionalEnvVar('VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl) {
    missingRequired.push('SUPABASE_URL or VITE_SUPABASE_URL');
  }

  if (!supabasePublishableKey) {
    missingRequired.push('SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_PUBLISHABLE_KEY');
  }

  // Check for recommended but not required variables
  if (!getOptionalEnvVar('APP_URL') && !getOptionalEnvVar('VITE_APP_URL')) {
    warnings.push('APP_URL is not set, using default value');
  }

  if (!getOptionalEnvVar('API_URL') && !getOptionalEnvVar('VITE_API_URL')) {
    warnings.push('API_URL is not set, using default value');
  }

  // Check for production-specific requirements
  const environment = getOptionalEnvVar('ENVIRONMENT', 'development');
  if (environment === 'production') {
    if (!getOptionalEnvVar('SENTRY_DSN')) {
      warnings.push('SENTRY_DSN is recommended for production');
    }
  }

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    warnings,
  };
}

// Check if configuration is valid (non-throwing version)
export function isConfigValid(): boolean {
  const result = validateEnvConfig();
  return result.isValid;
}

// Log configuration warnings (useful during development)
export function logConfigWarnings(): void {
  if (typeof console === 'undefined') return;

  const result = validateEnvConfig();

  if (result.warnings.length > 0) {
    result.warnings.forEach(warning => {
      console.warn(`[Config] ${warning}`);
    });
  }

  if (result.missingRequired.length > 0 && env.isDevelopment) {
    console.warn(
      `[Config] Missing required environment variables: ${result.missingRequired.join(', ')}. ` +
        `Some features may not work correctly.`
    );
  }
}

// Initialize and log warnings in development
if (typeof window !== 'undefined' && env.isDevelopment) {
  logConfigWarnings();
}
