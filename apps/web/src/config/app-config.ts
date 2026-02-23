/**
 * ============================================================================
 * APPLICATION CONFIGURATION
 * ============================================================================
 * Centralized configuration for UI constants, default values, and settings
 * Externalizes hardcoded values for easier maintenance
 * ============================================================================
 */

// ============================================================================
// CROP TYPES
// ============================================================================

export const CROP_TYPES = [
  { value: 'wheat', label: 'Wheat' },
  { value: 'corn', label: 'Corn' },
  { value: 'soybean', label: 'Soybean' },
  { value: 'rice', label: 'Rice' },
  { value: 'maize', label: 'Maize' },
  { value: 'sorghum', label: 'Sorghum' },
  { value: 'millet', label: 'Millet' },
  { value: 'barley', label: 'Barley' },
  { value: 'oats', label: 'Oats' },
  { value: 'potatoes', label: 'Potatoes' },
  { value: 'tomatoes', label: 'Tomatoes' },
  { value: 'onions', label: 'Onions' },
  { value: 'cabbage', label: 'Cabbage' },
  { value: 'carrots', label: 'Carrots' },
] as const;

export type CropTypeValue = (typeof CROP_TYPES)[number]['value'];

// ============================================================================
// LIVESTOCK TYPES
// ============================================================================

export const LIVESTOCK_TYPES = [
  { value: 'cattle', label: 'Cattle' },
  { value: 'goats', label: 'Goats' },
  { value: 'sheep', label: 'Sheep' },
  { value: 'pigs', label: 'Pigs' },
  { value: 'poultry', label: 'Poultry' },
  { value: 'horses', label: 'Horses' },
  { value: 'donkeys', label: 'Donkeys' },
  { value: 'rabbits', label: 'Rabbits' },
  { value: 'fish', label: 'Fish' },
  { value: 'other', label: 'Other' },
] as const;

export type LivestockTypeValue = (typeof LIVESTOCK_TYPES)[number]['value'];

// ============================================================================
// TASK PRIORITIES
// ============================================================================

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'medium', label: 'Medium', color: 'blue' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'urgent', label: 'Urgent', color: 'red' },
] as const;

export type TaskPriorityValue = (typeof TASK_PRIORITIES)[number]['value'];

// ============================================================================
// TASK STATUSES
// ============================================================================

export const TASK_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'in_progress', label: 'In Progress', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'gray' },
] as const;

export type TaskStatusValue = (typeof TASK_STATUSES)[number]['value'];

// ============================================================================
// CROP STATUSES
// ============================================================================

export const CROP_STATUSES = [
  { value: 'planned', label: 'Planned', color: 'gray' },
  { value: 'planted', label: 'Planted', color: 'blue' },
  { value: 'growing', label: 'Growing', color: 'green' },
  { value: 'harvested', label: 'Harvested', color: 'amber' },
  { value: 'failed', label: 'Failed', color: 'red' },
] as const;

export type CropStatusValue = (typeof CROP_STATUSES)[number]['value'];

// ============================================================================
// INVENTORY CATEGORIES
// ============================================================================

export const INVENTORY_CATEGORIES = [
  { value: 'seed', label: 'Seed' },
  { value: 'fertilizer', label: 'Fertilizer' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'feed', label: 'Feed' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'supply', label: 'Supply' },
  { value: 'other', label: 'Other' },
] as const;

export type InventoryCategoryValue = (typeof INVENTORY_CATEGORIES)[number]['value'];

// ============================================================================
// FINANCE CATEGORIES
// ============================================================================

export const INCOME_CATEGORIES = [
  { value: 'crop_sales', label: 'Crop Sales' },
  { value: 'livestock_sales', label: 'Livestock Sales' },
  { value: 'produce_sales', label: 'Produce Sales' },
  { value: 'services', label: 'Services' },
  { value: 'grants', label: 'Grants' },
  { value: 'other_income', label: 'Other Income' },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: 'seeds', label: 'Seeds' },
  { value: 'fertilizer', label: 'Fertilizer' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'labor', label: 'Labor' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'feed', label: 'Feed' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'transport', label: 'Transport' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other_expenses', label: 'Other Expenses' },
] as const;

// ============================================================================
// UI CONFIGURATION
// ============================================================================

export const UI_CONFIG = {
  // Pagination defaults
  defaultPageSize: 20,
  maxPageSize: 100,

  // Dashboard limits
  recentActivitiesLimit: 5,
  maxNotificationsShown: 10,

  // Form validation
  minPasswordLength: 6,
  maxNameLength: 100,
  maxDescriptionLength: 1000,
  maxNotesLength: 2000,

  // Debounce delays (in milliseconds)
  searchDebounceDelay: 300,
  autoSaveDelay: 1000,

  // Toast notification duration (in milliseconds)
  toastDuration: 5000,
  toastErrorDuration: 7000,

  // Animation durations (in milliseconds)
  transitionDuration: 200,
  animationDuration: 300,

  // Modal sizes
  modalMaxWidth: '600px',
  modalMaxHeight: '80vh',

  // Table defaults
  tableRowHeight: 48,
  tableHeaderHeight: 56,

  // Chart colors
  chartColors: {
    primary: '#22c55e',
    secondary: '#3b82f6',
    tertiary: '#f59e0b',
    quaternary: '#ef4444',
    quinary: '#8b5cf6',
  },
} as const;

// ============================================================================
// DATE FORMATS
// ============================================================================

export const DATE_FORMATS = {
  display: 'MMM d, yyyy',
  displayWithTime: 'MMM d, yyyy h:mm a',
  input: 'yyyy-MM-dd',
  time: 'h:mm a',
  monthYear: 'MMMM yyyy',
  short: 'MM/dd/yyyy',
  iso: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// ============================================================================
// VALIDATION PATTERNS
// ============================================================================

export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s-]{10,}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  tagNumber: /^[A-Z0-9-]{1,50}$/,
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email address',
  invalidPhone: 'Please enter a valid phone number',
  passwordTooShort: 'Password must be at least 6 characters',
  passwordMismatch: 'Passwords do not match',
  generic: 'An error occurred. Please try again.',
  networkError: 'Network error. Please check your connection.',
  unauthorized: 'You are not authorized to perform this action',
  notFound: 'The requested resource was not found',
  validationFailed: 'Please check your input and try again',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  saved: 'Changes saved successfully',
  created: 'Item created successfully',
  updated: 'Item updated successfully',
  deleted: 'Item deleted successfully',
  loggedIn: 'Welcome back!',
  loggedOut: 'You have been logged out',
  passwordReset: 'Password reset email sent',
} as const;

// ============================================================================
// APP METADATA
// ============================================================================

export const APP_CONFIG = {
  name: 'Farmers Boot',
  version: '0.1.0',
  description: 'Comprehensive Farm Management Application',
  author: 'Farmers Boot Team',
  supportEmail: 'support@farmersboot.com',
  defaultTimezone: 'UTC',
  defaultLocale: 'en',
} as const;

// Default export
export default {
  CROP_TYPES,
  LIVESTOCK_TYPES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  CROP_STATUSES,
  INVENTORY_CATEGORIES,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  UI_CONFIG,
  DATE_FORMATS,
  VALIDATION_PATTERNS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  APP_CONFIG,
};
