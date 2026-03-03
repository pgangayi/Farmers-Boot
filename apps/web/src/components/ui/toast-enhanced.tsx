/**
 * ENHANCED TOAST NOTIFICATION SYSTEM
 * ==================================
 * Toast notifications with smooth animations, improved styling,
 * and better user feedback.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
}

// ============================================================================
// TOAST CONTEXT
// ============================================================================

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const updateToast = React.useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev => prev.map(toast => (toast.id === id ? { ...toast, ...updates } : toast)));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, updateToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ============================================================================
// TOAST STYLES
// ============================================================================

const toastVariants = cva(
  [
    'relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4',
    'shadow-lg shadow-black/5',
    'transition-all duration-300',
    'data-[state=open]:animate-toast-in',
    'data-[state=closed]:animate-toast-out',
    'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
    'data-[swipe=cancel]:translate-x-0',
    'data-[swipe=end]:animate-toast-out',
  ],
  {
    variants: {
      variant: {
        success: ['bg-success/10 border-success/20', 'text-success-foreground'],
        error: ['bg-destructive/10 border-destructive/20', 'text-destructive-foreground'],
        info: ['bg-info/10 border-info/20', 'text-info-foreground'],
        warning: ['bg-warning/10 border-warning/20', 'text-warning-foreground'],
        loading: ['bg-muted border-border', 'text-foreground'],
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

// ============================================================================
// TOAST ICONS
// ============================================================================

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
  loading: Loader2,
};

const toastIconColors = {
  success: 'text-success',
  error: 'text-destructive',
  info: 'text-info',
  warning: 'text-warning',
  loading: 'text-primary',
};

// ============================================================================
// TOAST ITEM COMPONENT
// ============================================================================

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isPaused, setIsPaused] = React.useState(false);
  const [progress, setProgress] = React.useState(100);
  const duration = toast.duration || 5000;
  const Icon = toastIcons[toast.type];

  React.useEffect(() => {
    if (toast.type === 'loading' || isPaused) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setProgress((remaining / duration) * 100);

      if (remaining === 0) {
        clearInterval(interval);
        onRemove(toast.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.id, toast.type, duration, isPaused, onRemove]);

  return (
    <div
      className={cn(toastVariants({ variant: toast.type }), 'group pointer-events-auto')}
      data-state="open"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="alert"
    >
      {/* Progress Bar */}
      {toast.type !== 'loading' && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-20 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      )}

      {/* Icon */}
      <div className={cn('flex-shrink-0 mt-0.5', toastIconColors[toast.type])}>
        <Icon className={cn('h-5 w-5', toast.type === 'loading' && 'animate-spin')} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm">{toast.title}</h4>
        {toast.message && <p className="text-sm opacity-90 mt-1">{toast.message}</p>}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-2 text-sm font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 -mr-1 -mt-1 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/5"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ============================================================================
// TOAST CONTAINER
// ============================================================================

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
}

function ToastContainer({ toasts, onRemove, position = 'bottom-right' }: ToastContainerProps) {
  const positionClasses = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'top-center': 'top-0 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2',
  };

  return (
    <div
      className={cn(
        'fixed z-[100] flex flex-col gap-2 p-4 max-w-[420px] w-full',
        'pointer-events-none',
        positionClasses[position]
      )}
      role="region"
      aria-label="Notifications"
    >
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// CONVENIENCE HOOK
// ============================================================================

export function useToastHelpers() {
  const { addToast, removeToast, updateToast } = useToast();

  return {
    success: (title: string, message?: string, duration?: number) =>
      addToast({ title, message, type: 'success', duration }),
    error: (title: string, message?: string, duration?: number) =>
      addToast({ title, message, type: 'error', duration: duration || 6000 }),
    info: (title: string, message?: string, duration?: number) =>
      addToast({ title, message, type: 'info', duration }),
    warning: (title: string, message?: string, duration?: number) =>
      addToast({ title, message, type: 'warning', duration }),
    loading: (title: string, message?: string) =>
      addToast({ title, message, type: 'loading', duration: Infinity }),
    promise: async <T,>(
      promise: Promise<T>,
      {
        loading,
        success,
        error,
      }: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: Error) => string);
      }
    ) => {
      const id = addToast({
        title: loading,
        type: 'loading',
        duration: Infinity,
      });

      try {
        const data = await promise;
        const successMessage = typeof success === 'function' ? success(data) : success;
        updateToast(id, {
          title: successMessage,
          type: 'success',
          duration: 5000,
        });
        return data;
      } catch (err) {
        const errorMessage = typeof error === 'function' ? error(err as Error) : error;
        updateToast(id, {
          title: errorMessage,
          type: 'error',
          duration: 6000,
        });
        throw err;
      }
    },
    remove: removeToast,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { ToastItem, ToastContainer };
export type { Toast, ToastType };
