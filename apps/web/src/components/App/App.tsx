/**
 * ============================================================================
 * APP COMPONENT
 * ============================================================================
 * Main application component that handles routing, providers, and layout.
 * Separated from main.tsx for better organization.
 * ============================================================================
 */

import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Loader2 } from 'lucide-react';

import { ErrorBoundary, RouteErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider, useAuth } from '@/hooks/AuthContext';
import { ToastProvider } from '@/components/ui/use-toast';
import { OfflineWrapper, SyncStatus } from '@/components/OfflineIndicator';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { initializeDatabase } from '@/lib/offline-db';
import { PageLoading } from '@/components/common/LoadingStates';
import { ROUTES } from '@/routes';

// Lazy Load Pages
const LandingPage = React.lazy(() =>
  import('@/pages/LandingPage').then(module => ({ default: module.LandingPage }))
);
const LoginPage = React.lazy(() =>
  import('@/pages/LoginPage').then(module => ({ default: module.LoginPage }))
);
const SignupPage = React.lazy(() =>
  import('@/pages/SignupPage').then(module => ({ default: module.SignupPage }))
);
const ForgotPasswordPage = React.lazy(() =>
  import('@/pages/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage }))
);
const ResetPasswordPage = React.lazy(() =>
  import('@/pages/ResetPasswordPage').then(module => ({ default: module.ResetPasswordPage }))
);
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const FarmsPage = React.lazy(() =>
  import('@/pages/FarmsPage').then(module => ({ default: module.FarmsPage }))
);
const FieldsPage = React.lazy(() =>
  import('@/pages/FieldsPage').then(module => ({ default: module.FieldsPage }))
);
const LivestockPage = React.lazy(() => import('@/pages/LivestockPage'));
const TasksPage = React.lazy(() =>
  import('@/pages/TasksPage').then(module => ({ default: module.TasksPage }))
);
const CropsPage = React.lazy(() =>
  import('@/pages/CropsPage').then(module => ({ default: module.CropsPage }))
);
const InventoryPage = React.lazy(() =>
  import('@/pages/InventoryPage').then(module => ({ default: module.InventoryPage }))
);
const FinancePage = React.lazy(() =>
  import('@/pages/FinancePage').then(module => ({ default: module.FinancePage }))
);
const QueuePage = React.lazy(() =>
  import('@/pages/QueuePage').then(module => ({ default: module.QueuePage }))
);
const AnalyticsPage = React.lazy(() => import('@/pages/AnalyticsPage'));

// ============================================================================
// QUERY CLIENT
// ============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: failureCount => failureCount < 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      onError: error => {
        console.error('Mutation error:', error);
      },
    },
  },
});

// ============================================================================
// LOADING COMPONENTS
// ============================================================================

function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-green-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-green-50 to-blue-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist or has been moved.
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

// ============================================================================
// ROUTE COMPONENTS
// ============================================================================

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

function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <LandingPage />;
}

// ============================================================================
// APP INITIALIZER
// ============================================================================

function AppInitializer({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    initializeDatabase()
      .then(() => {
        console.log('[App] Offline database initialized');
        setIsInitialized(true);
      })
      .catch(error => {
        console.warn('[App] Failed to initialize offline database:', error);
        setIsInitialized(true);
      });
  }, []);

  if (!isInitialized) {
    return <PageLoading />;
  }

  return <>{children}</>;
}

// ============================================================================
// OFFLINE STATUS
// ============================================================================

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

// ============================================================================
// APP ROUTES
// ============================================================================

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public Routes */}
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
        {ROUTES.ANIMALS !== ROUTES.LIVESTOCK && (
          <Route path={ROUTES.ANIMALS} element={<Navigate to={ROUTES.LIVESTOCK} replace />} />
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
  );
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
            <AppInitializer>
              <OfflineWrapper showBanner={true} showSyncStatus={true}>
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </OfflineWrapper>
            </AppInitializer>
          </QueryClientProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
