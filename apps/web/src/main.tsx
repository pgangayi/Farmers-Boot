import React, { Suspense, lazy, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { validateEnv } from './utils/envValidation';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import * as Sentry from '@sentry/react';
import { Loader2 } from 'lucide-react';
import './index.css';
import './App.css';

import { ErrorBoundary, RouteErrorBoundary, DataErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './hooks/AuthContext';
import { ToastProvider } from './components/ui/use-toast';
import { OfflineWrapper, OfflineBanner, SyncStatus } from './components/OfflineIndicator';
import { useOfflineSync } from './hooks/useOfflineSync';
import { initializeDatabase } from './lib/offline-db';
import { PageLoading } from './components/common/LoadingStates';

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

// Early validation of environment variables.  This throws if any required
// variable is missing, preventing the app from booting with a bad config.
validateEnv();

// Sentry configuration helper
const isSentryEnabled = (): boolean => {
  const dsn = import.meta.env['VITE_SENTRY_DSN'] as string;
  return (
    import.meta.env.PROD &&
    Boolean(dsn) &&
    dsn !== 'your-sentry-dsn-here' &&
    dsn.startsWith('https://')
  );
};

// Initialize Sentry with proper configuration
if (isSentryEnabled()) {
  Sentry.init({
    dsn: import.meta.env['VITE_SENTRY_DSN'],
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 1.0,
    tracePropagationTargets: [import.meta.env['VITE_API_URL'] || ''].filter(Boolean),
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
    enabled: true,
  });
}

// Lazy Load Pages
// Named exports require .then(module => ({ default: module.Component })) handling
const LandingPage = lazy(() =>
  import('./pages/LandingPage').then(module => ({ default: module.LandingPage }))
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then(module => ({ default: module.LoginPage }))
);
const SignupPage = lazy(() =>
  import('./pages/SignupPage').then(module => ({ default: module.SignupPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage').then(module => ({ default: module.ResetPasswordPage }))
);
// Default exports are simpler
const Dashboard = lazy(() => import('./pages/Dashboard'));
const FarmsPage = lazy(() =>
  import('./pages/FarmsPage').then(module => ({ default: module.FarmsPage }))
);
const FieldsPage = lazy(() =>
  import('./pages/FieldsPage').then(module => ({ default: module.FieldsPage }))
);
const LivestockPage = lazy(() => import('./pages/LivestockPage'));
const TasksPage = lazy(() =>
  import('./pages/TasksPage').then(module => ({ default: module.TasksPage }))
);
const CropsPage = lazy(() =>
  import('./pages/CropsPage').then(module => ({ default: module.CropsPage }))
);
const InventoryPage = lazy(() =>
  import('./pages/InventoryPage').then(module => ({ default: module.InventoryPage }))
);
const FinancePage = lazy(() =>
  import('./pages/FinancePage').then(module => ({ default: module.FinancePage }))
);
const QueuePage = lazy(() =>
  import('./pages/QueuePage').then(module => ({ default: module.QueuePage }))
);
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

// Shared Loading Screen Component
function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
}

// 404 Not Found Page
function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          to={ROUTES.HOME}
          className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}

// Create Query Client with enhanced configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (replaces cacheTime in v5)
      retry: failureCount => {
        // Retry up to 2 times for any errors
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      onError: error => {
        // Global mutation error handler
        console.error('Mutation error:', error);
        // Send to Sentry in production
        if (import.meta.env.PROD) {
          Sentry.captureException(error);
        }
      },
    },
  },
});

// Protected Route Component with proper loading state
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
}

// Home Component with proper auth state handling
function Home() {
  const { user, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  // Redirect authenticated users to dashboard
  if (user) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // Show landing page for unauthenticated users
  return <LandingPage />;
}

// Service Worker Registration with update handling
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered successfully');

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              // New version available - could show notification to user
              console.log('New version available! Please refresh.');
            }
          });
        });
      })
      .catch(error => {
        console.warn('Service Worker registration failed:', error);
        if (isSentryEnabled()) {
          Sentry.captureException(error);
        }
      });
  });
}

// Initialize offline database
initializeDatabase().catch(error => {
  console.warn('Failed to initialize offline database:', error);
});

// Offline status indicator component
function OfflineStatusIndicator() {
  const { isOnline, isSyncing, sync } = useOfflineSync({
    autoSync: true,
    onOnline: () => console.log('[App] Back online'),
    onOffline: () => console.log('[App] Gone offline'),
    onSyncComplete: stats => console.log('[App] Sync complete:', stats),
  });

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <SyncStatus compact />
    </div>
  );
}

// App initializer component
function AppInitializer({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    // Initialize offline database
    initializeDatabase()
      .then(() => {
        console.log('[App] Offline database initialized');
        setIsInitialized(true);
      })
      .catch(error => {
        console.warn('[App] Failed to initialize offline database:', error);
        // Continue anyway - app can work without offline storage
        setIsInitialized(true);
      });
  }, []);

  if (!isInitialized) {
    return <PageLoading />;
  }

  return <>{children}</>;
}

// Render Application
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
            <AppInitializer>
              <OfflineWrapper showBanner={true} showSyncStatus={true}>
                <BrowserRouter>
                  <Suspense fallback={<LoadingScreen />}>
                    <Routes>
                      <Route path={ROUTES.HOME} element={<Home />} />
                      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                      <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
                      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
                      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

                      {/* Protected Routes */}
                      <Route
                        path={ROUTES.DASHBOARD}
                        element={
                          <ProtectedRoute>
                            <RouteErrorBoundary>
                              <Dashboard />
                            </RouteErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.FARMS}
                        element={
                          <ProtectedRoute>
                            <RouteErrorBoundary>
                              <FarmsPage />
                            </RouteErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.FIELDS}
                        element={
                          <ProtectedRoute>
                            <RouteErrorBoundary>
                              <FieldsPage />
                            </RouteErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.LIVESTOCK}
                        element={
                          <ProtectedRoute>
                            <RouteErrorBoundary>
                              <LivestockPage />
                            </RouteErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      {/* Redirect legacy /animals to /livestock if needed, or handle via ROUTES constant aliases */}
                      {ROUTES.ANIMALS !== ROUTES.LIVESTOCK && (
                        <Route
                          path={ROUTES.ANIMALS}
                          element={<Navigate to={ROUTES.LIVESTOCK} replace />}
                        />
                      )}
                      <Route
                        path={ROUTES.CROPS}
                        element={
                          <ProtectedRoute>
                            <RouteErrorBoundary>
                              <CropsPage />
                            </RouteErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.TASKS}
                        element={
                          <ProtectedRoute>
                            <RouteErrorBoundary>
                              <TasksPage />
                            </RouteErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.INVENTORY}
                        element={
                          <ProtectedRoute>
                            <RouteErrorBoundary>
                              <InventoryPage />
                            </RouteErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.FINANCE}
                        element={
                          <ProtectedRoute>
                            <RouteErrorBoundary>
                              <FinancePage />
                            </RouteErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.QUEUE}
                        element={
                          <ProtectedRoute>
                            <RouteErrorBoundary>
                              <QueuePage />
                            </RouteErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.ANALYTICS}
                        element={
                          <ProtectedRoute>
                            <RouteErrorBoundary>
                              <AnalyticsPage />
                            </RouteErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* 404 Not Found */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </OfflineWrapper>
            </AppInitializer>
          </QueryClientProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Load console filter (non-critical, can fail gracefully)
if (import.meta.env.DEV) {
  import('./lib/consoleFilter').catch(error => {
    console.warn('Console filter not loaded:', error);
  });
}
