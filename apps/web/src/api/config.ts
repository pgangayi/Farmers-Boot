const DEFAULT_RELATIVE_BASE = '/rest/v1';

// Constants for API endpoint base paths to avoid duplication
const ENDPOINT_LIVESTOCK = '/livestock';
const ENDPOINT_CROPS = '/crops';
const ENDPOINT_FIELDS = '/fields';
const ENDPOINT_FARMS = '/farms';
const ENDPOINT_TASKS = '/tasks';
const ENDPOINT_INVENTORY = '/inventory';
const ENDPOINT_FINANCE = '/finance';

const sanitizeBaseUrl = (value?: string | null): string => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return DEFAULT_RELATIVE_BASE;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      const normalizedPath =
        parsed.pathname.endsWith('/') && parsed.pathname !== '/'
          ? parsed.pathname.slice(0, -1)
          : parsed.pathname;
      return `${parsed.origin}${normalizedPath}`;
    } catch (error) {
      console.warn('Invalid VITE_API_BASE_URL provided, falling back to relative /rest/v1', error);
      return DEFAULT_RELATIVE_BASE;
    }
  }

  if (trimmed.startsWith('/')) {
    return trimmed.endsWith('/') && trimmed !== '/'
      ? trimmed.slice(0, -1)
      : trimmed || DEFAULT_RELATIVE_BASE;
  }

  console.warn(
    'VITE_API_BASE_URL must be an absolute URL or start with /. Falling back to /rest/v1.'
  );
  return DEFAULT_RELATIVE_BASE;
};

const resolvedBaseUrl = sanitizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const API_CONFIG = {
  baseUrl: resolvedBaseUrl,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 30000,
  retryAttempts: Number(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3,
};

export const STORAGE_KEYS = {
  authToken: 'auth_token',
  authUser: 'auth_user',
  theme: 'theme_preference',
  refresh: 'refresh_token',
  language: 'language',
  lastSync: 'last_sync_timestamp',
};

export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
  },
  farms: {
    list: '/farms',
    details: (id: string) => `/farms/${id}`,
    create: '/farms',
    update: (id: string) => `/farms/${id}`,
    delete: (id: string) => `/farms/${id}`,
  },
  fields: {
    list: ENDPOINT_FIELDS,
    details: (id: string) => `${ENDPOINT_FIELDS}/${id}`,
    create: ENDPOINT_FIELDS,
    update: (id: string) => `${ENDPOINT_FIELDS}/${id}`,
    delete: (id: string) => `${ENDPOINT_FIELDS}/${id}`,
    soilAnalysis: '/fields/soil-analysis',
  },
  weather: {
    farm: '/weather/farm',
    impact: '/weather/impact-analysis',
    recommendations: '/weather/recommendations',
  },
  crops: {
    list: ENDPOINT_CROPS,
    details: (id: string) => `${ENDPOINT_CROPS}/${id}`,
    create: ENDPOINT_CROPS,
    update: (id: string) => `${ENDPOINT_CROPS}/${id}`,
    delete: (id: string) => `${ENDPOINT_CROPS}/${id}`,
    history: '/crops/history',
    planning: '/crops/planning',
  },
  livestock: {
    list: ENDPOINT_LIVESTOCK,
    create: ENDPOINT_LIVESTOCK,
    update: ENDPOINT_LIVESTOCK,
    delete: (id: string) => `${ENDPOINT_LIVESTOCK}/${id}`,
    history: '/livestock/history',
  },
  tasks: {
    list: ENDPOINT_TASKS,
    create: ENDPOINT_TASKS,
    update: ENDPOINT_TASKS,
    delete: (id: string) => `${ENDPOINT_TASKS}/${id}`,
    complete: (id: string) => `${ENDPOINT_TASKS}/${id}/complete`,
  },
  inventory: {
    list: ENDPOINT_INVENTORY,
    details: (id: string) => `${ENDPOINT_INVENTORY}/${id}`,
    create: ENDPOINT_INVENTORY,
    update: (id: string) => `${ENDPOINT_INVENTORY}/${id}`,
    delete: (id: string) => `${ENDPOINT_INVENTORY}/${id}`,
    alerts: '/inventory/alerts',
  },
  finance: {
    list: ENDPOINT_FINANCE,
    create: ENDPOINT_FINANCE,
    update: ENDPOINT_FINANCE,
    delete: (id: string) => `${ENDPOINT_FINANCE}/${id}`,
    report: '/finance/report',
    stats: '/finance/stats',
  },
  animals: {
    list: ENDPOINT_LIVESTOCK,
    details: (id: string) => `${ENDPOINT_LIVESTOCK}/${id}`,
    create: ENDPOINT_LIVESTOCK,
    update: (id: string) => `${ENDPOINT_LIVESTOCK}/${id}`,
    delete: (id: string) => `${ENDPOINT_LIVESTOCK}/${id}`,
    analytics: '/livestock/stats',
    healthRecords: (animalId: string, recordId?: string) =>
      recordId
        ? `/livestock/${animalId}/health-records/${recordId}`
        : `/livestock/${animalId}/health-records`,
    production: (animalId: string, recordId?: string) =>
      recordId
        ? `/livestock/${animalId}/production/${recordId}`
        : `/livestock/${animalId}/production`,
    breeding: (animalId: string, recordId?: string) =>
      recordId ? `/livestock/${animalId}/breeding/${recordId}` : `/livestock/${animalId}/breeding`,
  },
};

export const CACHE_CONFIG = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxEntries: 100,
};

export const FEATURES = {
  enableAnalytics: true,
  enableOfflineMode: false,
  enablePushNotifications: false,
};
