import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Extend ImportMeta for Vite environment variables
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Import internal components
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));

// Simple Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
  </div>
);

// Error Fallback Component
const ErrorFallback = ({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4">
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
      <h2 className="text-red-800 text-xl font-semibold mb-2">Application Error</h2>
      <p className="text-red-600 mb-4">{error.message}</p>
      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Reload Application
        </button>
      )}
    </div>
  </div>
);

// Auth Context Provider (inline minimal implementation)
interface AuthContextType {
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Initialize auth state from Supabase
    const initAuth = async () => {
      try {
        const { getSupabaseClientFromEnv } = await import('@farmers-boot/shared');
        const env = import.meta.env as ImportMetaEnv;
        const supabase = getSupabaseClientFromEnv(env);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { getSupabaseClientFromEnv } = await import('@farmers-boot/shared');
    const env = import.meta.env as ImportMetaEnv;
    const supabase = getSupabaseClientFromEnv(env);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { getSupabaseClientFromEnv } = await import('@farmers-boot/shared');
    const env = import.meta.env as ImportMetaEnv;
    const supabase = getSupabaseClientFromEnv(env);
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
};

// Mount the application
const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: Inter, system-ui, sans-serif;">
      <div style="text-align: center;">
        <h1 style="font-size: 1.5rem; margin-bottom: 1rem;">Farmers Boot</h1>
        <p style="color: #666;">Root element not found. Please check your HTML configuration.</p>
      </div>
    </div>
  `;
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

export default App;
