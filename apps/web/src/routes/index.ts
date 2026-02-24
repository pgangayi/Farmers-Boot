/**
 * ============================================================================
 * ROUTE CONFIGURATION
 * ============================================================================
 * Centralized route definitions for the Farmers-Boot application.
 * Provides type-safe route constants and route configuration.
 * ============================================================================
 */

// Route constants for type safety
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  FARMS: '/farms',
  FIELDS: '/fields',
  ANIMALS: '/livestock', // Renamed route path, keeping key for compatibility
  LIVESTOCK: '/livestock', // New key
  CROPS: '/crops',
  TASKS: '/tasks',
  INVENTORY: '/inventory',
  FINANCE: '/finance',
  QUEUE: '/queue',
  ANALYTICS: '/analytics',
} as const;

// Route type
export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];

// Route metadata for navigation
export interface RouteConfig {
  path: string;
  label: string;
  icon?: string;
  protected: boolean;
  navVisible: boolean;
}

// Full route configurations
export const ROUTE_CONFIGS: Record<RouteKey, RouteConfig> = {
  HOME: {
    path: ROUTES.HOME,
    label: 'Home',
    protected: false,
    navVisible: false,
  },
  LOGIN: {
    path: ROUTES.LOGIN,
    label: 'Sign In',
    protected: false,
    navVisible: false,
  },
  SIGNUP: {
    path: ROUTES.SIGNUP,
    label: 'Sign Up',
    protected: false,
    navVisible: false,
  },
  FORGOT_PASSWORD: {
    path: ROUTES.FORGOT_PASSWORD,
    label: 'Forgot Password',
    protected: false,
    navVisible: false,
  },
  RESET_PASSWORD: {
    path: ROUTES.RESET_PASSWORD,
    label: 'Reset Password',
    protected: false,
    navVisible: false,
  },
  DASHBOARD: {
    path: ROUTES.DASHBOARD,
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    protected: true,
    navVisible: true,
  },
  FARMS: {
    path: ROUTES.FARMS,
    label: 'Farms',
    icon: 'Warehouse',
    protected: true,
    navVisible: true,
  },
  FIELDS: {
    path: ROUTES.FIELDS,
    label: 'Fields',
    icon: 'Map',
    protected: true,
    navVisible: true,
  },
  ANIMALS: {
    path: ROUTES.LIVESTOCK,
    label: 'Livestock',
    icon: 'Beef',
    protected: true,
    navVisible: true,
  },
  LIVESTOCK: {
    path: ROUTES.LIVESTOCK,
    label: 'Livestock',
    icon: 'Beef',
    protected: true,
    navVisible: true,
  },
  CROPS: {
    path: ROUTES.CROPS,
    label: 'Crops',
    icon: 'Wheat',
    protected: true,
    navVisible: true,
  },
  TASKS: {
    path: ROUTES.TASKS,
    label: 'Tasks',
    icon: 'CheckSquare',
    protected: true,
    navVisible: true,
  },
  INVENTORY: {
    path: ROUTES.INVENTORY,
    label: 'Inventory',
    icon: 'Package',
    protected: true,
    navVisible: true,
  },
  FINANCE: {
    path: ROUTES.FINANCE,
    label: 'Finance',
    icon: 'DollarSign',
    protected: true,
    navVisible: true,
  },
  QUEUE: {
    path: ROUTES.QUEUE,
    label: 'Sync Queue',
    icon: 'RefreshCw',
    protected: true,
    navVisible: false,
  },
  ANALYTICS: {
    path: ROUTES.ANALYTICS,
    label: 'Analytics',
    icon: 'BarChart3',
    protected: true,
    navVisible: true,
  },
};

// Navigation routes (visible in sidebar)
export const NAV_ROUTES = Object.entries(ROUTE_CONFIGS)
  .filter(([, config]) => config.navVisible)
  .map(([key, config]) => ({
    key: key as RouteKey,
    ...config,
  }));

// Protected routes
export const PROTECTED_ROUTES = Object.entries(ROUTE_CONFIGS)
  .filter(([, config]) => config.protected)
  .map(([key]) => key as RouteKey);

// Public routes
export const PUBLIC_ROUTES = Object.entries(ROUTE_CONFIGS)
  .filter(([, config]) => !config.protected)
  .map(([key]) => key as RouteKey);

/**
 * Check if a path is a protected route
 */
export function isProtectedRoute(path: string): boolean {
  return Object.values(ROUTES).some(
    route => route === path && PROTECTED_ROUTES.some(key => ROUTES[key] === route)
  );
}

/**
 * Get route config by path
 */
export function getRouteByPath(path: string): RouteConfig | undefined {
  return Object.values(ROUTE_CONFIGS).find(config => config.path === path);
}

/**
 * Get route config by key
 */
export function getRouteByKey(key: RouteKey): RouteConfig {
  return ROUTE_CONFIGS[key];
}
