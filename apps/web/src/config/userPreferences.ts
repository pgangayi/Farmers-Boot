/**
 * ============================================================================
 * USER PREFERENCES SYSTEM
 * ============================================================================
 * User preferences management for Farmers-Boot application
 * ============================================================================
 */

export interface UserPreferences {
  // Display preferences
  theme: 'light' | 'dark' | 'auto';
  language: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';

  // Regional preferences
  timezone: string;
  currency: string;
  numberFormat: 'en-US' | 'en-GB' | 'de-DE' | 'fr-FR' | 'es-ES';

  // Farm preferences
  defaultFarmId?: string;
  measurementSystem: 'metric' | 'imperial';
  temperatureUnit: 'celsius' | 'fahrenheit';

  // Notification preferences
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly';

  // Dashboard preferences
  dashboardLayout: 'grid' | 'list' | 'cards';
  itemsPerPage: number;
  showQuickActions: boolean;

  // Feature preferences
  enableBetaFeatures: boolean;
  enableAnalytics: boolean;
  enableAutoSave: boolean;

  // Privacy preferences
  shareDataWithCommunity: boolean;
  allowPersonalizedRecommendations: boolean;
  dataRetentionDays: number;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  // Display preferences
  theme: 'auto',
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',

  // Regional preferences
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  currency: 'USD',
  numberFormat: 'en-US',

  // Farm preferences
  measurementSystem: 'metric',
  temperatureUnit: 'celsius',

  // Notification preferences
  emailNotifications: true,
  pushNotifications: false,
  smsNotifications: false,
  notificationFrequency: 'daily',

  // Dashboard preferences
  dashboardLayout: 'grid',
  itemsPerPage: 20,
  showQuickActions: true,

  // Feature preferences
  enableBetaFeatures: false,
  enableAnalytics: true,
  enableAutoSave: true,

  // Privacy preferences
  shareDataWithCommunity: false,
  allowPersonalizedRecommendations: true,
  dataRetentionDays: 365,
};

// User preferences manager class
export class UserPreferencesManager {
  private preferences: UserPreferences;
  private userId?: string;
  private storageKey: string;

  constructor(userId?: string, initialPreferences?: Partial<UserPreferences>) {
    this.userId = userId;
    this.storageKey = `user_preferences_${userId || 'guest'}`;

    // Load preferences from storage or use defaults
    this.preferences = this.loadPreferences(initialPreferences);
  }

  // Get all preferences
  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  // Get a specific preference
  getPreference<K extends keyof UserPreferences>(key: K): UserPreferences[K] {
    return this.preferences[key];
  }

  // Update a specific preference
  setPreference<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void {
    this.preferences[key] = value;
    this.savePreferences();
  }

  // Update multiple preferences
  updatePreferences(updates: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.savePreferences();
  }

  // Reset preferences to defaults
  resetPreferences(): void {
    this.preferences = { ...DEFAULT_USER_PREFERENCES };
    this.savePreferences();
  }

  // Reset specific preferences to defaults
  resetPreferenceKeys<K extends keyof UserPreferences>(keys: K[]): void {
    keys.forEach(key => {
      this.preferences[key] = DEFAULT_USER_PREFERENCES[key];
    });
    this.savePreferences();
  }

  // Load preferences from localStorage
  private loadPreferences(initialPreferences?: Partial<UserPreferences>): UserPreferences {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_USER_PREFERENCES, ...parsed, ...initialPreferences };
      }
    } catch (error) {
      console.warn('Failed to load user preferences from localStorage:', error);
    }

    return { ...DEFAULT_USER_PREFERENCES, ...initialPreferences };
  }

  // Save preferences to localStorage
  private savePreferences(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to save user preferences to localStorage:', error);
    }
  }

  // Export preferences as JSON
  exportPreferences(): string {
    return JSON.stringify(this.preferences, null, 2);
  }

  // Import preferences from JSON
  importPreferences(json: string): boolean {
    try {
      const imported = JSON.parse(json);
      this.updatePreferences(imported);
      return true;
    } catch (error) {
      console.error('Failed to import user preferences:', error);
      return false;
    }
  }

  // Validate preferences
  validatePreferences(preferences: Partial<UserPreferences>): boolean {
    try {
      // Check if all keys are valid
      const keys = Object.keys(preferences) as (keyof UserPreferences)[];
      for (const key of keys) {
        if (!(key in DEFAULT_USER_PREFERENCES)) {
          return false;
        }
      }

      // Validate specific values
      if (preferences.theme && !['light', 'dark', 'auto'].includes(preferences.theme)) {
        return false;
      }

      if (
        preferences.measurementSystem &&
        !['metric', 'imperial'].includes(preferences.measurementSystem)
      ) {
        return false;
      }

      if (
        preferences.temperatureUnit &&
        !['celsius', 'fahrenheit'].includes(preferences.temperatureUnit)
      ) {
        return false;
      }

      if (
        preferences.notificationFrequency &&
        !['immediate', 'hourly', 'daily', 'weekly'].includes(preferences.notificationFrequency)
      ) {
        return false;
      }

      if (
        preferences.dashboardLayout &&
        !['grid', 'list', 'cards'].includes(preferences.dashboardLayout)
      ) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Get timezone display name
  getTimezoneDisplay(): string {
    try {
      const timeZone = this.preferences.timezone;
      const formatter = new Intl.DateTimeFormat('en', {
        timeZone,
        timeZoneName: 'long',
      });
      const parts = formatter.formatToParts(new Date());
      const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value;
      return timeZoneName || timeZone;
    } catch (error) {
      return this.preferences.timezone;
    }
  }

  // Get currency display name
  getCurrencyDisplay(): string {
    try {
      const currency = this.preferences.currency;
      const formatter = new Intl.NumberFormat(this.preferences.numberFormat, {
        style: 'currency',
        currency,
      });
      const parts = formatter.formatToParts(1);
      const currencySymbol = parts.find(part => part.type === 'currency')?.value;
      return `${currencySymbol} ${currency}`;
    } catch (error) {
      return this.preferences.currency;
    }
  }

  // Format date according to user preferences
  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    try {
      const formatMap = {
        'MM/DD/YYYY': 'MM/dd/yyyy',
        'DD/MM/YYYY': 'dd/MM/yyyy',
        'YYYY-MM-DD': 'yyyy-MM-dd',
      } as const;

      return new Intl.DateTimeFormat(this.preferences.numberFormat, {
        timeZone: this.preferences.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(dateObj);
    } catch (error) {
      return dateObj.toLocaleDateString();
    }
  }

  // Format time according to user preferences
  formatTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    try {
      return new Intl.DateTimeFormat(this.preferences.numberFormat, {
        timeZone: this.preferences.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: this.preferences.timeFormat === '12h',
      }).format(dateObj);
    } catch (error) {
      return dateObj.toLocaleTimeString();
    }
  }

  // Format number according to user preferences
  formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    try {
      return new Intl.NumberFormat(this.preferences.numberFormat, options).format(number);
    } catch (error) {
      return number.toString();
    }
  }

  // Format currency according to user preferences
  formatCurrency(amount: number): string {
    try {
      return new Intl.NumberFormat(this.preferences.numberFormat, {
        style: 'currency',
        currency: this.preferences.currency,
      }).format(amount);
    } catch (error) {
      return `${this.preferences.currency} ${amount.toFixed(2)}`;
    }
  }

  // Format temperature according to user preferences
  formatTemperature(celsius: number): string {
    const temperature =
      this.preferences.temperatureUnit === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius;

    const unit = this.preferences.temperatureUnit === 'fahrenheit' ? '°F' : '°C';

    return `${Math.round(temperature)}${unit}`;
  }

  // Convert measurement units
  convertMeasurement(
    value: number,
    fromUnit: 'metric' | 'imperial',
    toUnit: 'metric' | 'imperial'
  ): number {
    if (fromUnit === toUnit) return value;

    // Convert from metric to imperial
    if (fromUnit === 'metric' && toUnit === 'imperial') {
      return value * 3.28084; // meters to feet
    }

    // Convert from imperial to metric
    if (fromUnit === 'imperial' && toUnit === 'metric') {
      return value * 0.3048; // feet to meters
    }

    return value;
  }
}

// Hook for using user preferences in React components
export const useUserPreferences = (userId?: string): UserPreferencesManager => {
  // In a real implementation, this would fetch preferences from an API
  // For now, we use localStorage
  return new UserPreferencesManager(userId);
};

// Utility functions for common preference operations
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const getUserCurrency = (): string => {
  try {
    const locale = navigator.language || 'en-US';
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
    });
    const parts = formatter.formatToParts(1);
    const currency = parts.find(part => part.type === 'currency')?.value;
    return currency || 'USD';
  } catch (error) {
    return 'USD';
  }
};

export const getUserLocale = (): string => {
  return navigator.language || 'en-US';
};

// Available timezones
export const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
];

// Available currencies
export const COMMON_CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'CNY', label: 'Chinese Yuan (¥)' },
  { value: 'AUD', label: 'Australian Dollar ($)' },
  { value: 'CAD', label: 'Canadian Dollar ($)' },
  { value: 'CHF', label: 'Swiss Franc (Fr)' },
  { value: 'INR', label: 'Indian Rupee (₹)' },
  { value: 'BRL', label: 'Brazilian Real (R$)' },
];

// Available languages
export const COMMON_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'ar', label: 'العربية' },
];

export default UserPreferencesManager;
