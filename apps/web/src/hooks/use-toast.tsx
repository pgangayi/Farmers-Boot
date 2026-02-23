import { useCallback } from 'react';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  duration?: number;
}

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  title?: string;
  description?: string;
  action?: ToastAction;
  duration?: number;
  variant?: 'default' | 'destructive' | 'success';
}

interface UseToastReturn {
  toast: (props: ToastProps) => void;
  toasts: Toast[];
  dismiss: (id: string) => void;
}

export function useToast(): UseToastReturn {
  const toasts: Toast[] = [];

  const toast = useCallback((props: ToastProps) => {
    console.log('Toast:', props.title, props.description);
  }, []);

  const dismiss = useCallback((id: string) => {
    console.log('Dismiss toast:', id);
  }, []);

  return {
    toast,
    toasts,
    dismiss,
  };
}
