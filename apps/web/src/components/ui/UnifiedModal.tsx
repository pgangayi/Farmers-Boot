import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Label } from './label';
import { Checkbox } from './checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

export interface ModalField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'date' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  creatable?: boolean;
  onAdd?: () => void;
  min?: number;
  max?: number;
  step?: string | number;
  rows?: number;
  defaultValue?: unknown;
}

export interface UnifiedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  fields?: ModalField[];
  initialData?: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
  preventCloseOnOutsideClick?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
} as const;

export function UnifiedModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  fields,
  initialData,
  onSubmit,
  submitLabel = 'Save',
  isLoading = false,
  preventCloseOnOutsideClick = false,
}: UnifiedModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isPending, startTransition] = useTransition();
  const [optimisticState, setOptimisticState] = useState<{
    isSubmitting: boolean;
    error: string | null;
  }>({ isSubmitting: false, error: null });

  useEffect(() => {
    if (isOpen) {
      const defaults: Record<string, unknown> = {};
      fields?.forEach(f => {
        defaults[f.name] = f.defaultValue ?? (f.type === 'checkbox' ? false : '');
      });
      setFormData(prev => (initialData ? { ...defaults, ...initialData } : defaults));
      setOptimisticState({ isSubmitting: false, error: null });
    }
  }, [isOpen, initialData, fields]);

  const handleClose = useCallback(() => {
    if (!isLoading && !optimisticState.isSubmitting) {
      onClose();
    }
  }, [isLoading, optimisticState.isSubmitting, onClose]);

  const handleChange = useCallback((name: string, value: unknown) => {
    startTransition(() => {
      setFormData(prev => ({ ...prev, [name]: value }));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmit || isLoading) return;

    setOptimisticState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      setOptimisticState(prev => ({
        ...prev,
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !preventCloseOnOutsideClick) {
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading && !optimisticState.isSubmitting) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const isDisabled = isLoading || optimisticState.isSubmitting;

  const renderField = (field: ModalField) => {
    const value = formData[field.name];

    switch (field.type) {
      case 'select':
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={val => handleChange(field.name, val)}
            disabled={isDisabled}
          >
            <SelectTrigger
              className={cn(optimisticState.error && 'border-red-500')}
              aria-invalid={!!optimisticState.error}
            >
              <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'textarea':
        return (
          <Textarea
            value={(value as string) || ''}
            onChange={e => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={field.rows || 3}
            disabled={isDisabled}
            className={cn(optimisticState.error && 'border-red-500')}
            aria-invalid={!!optimisticState.error}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={(value as string) || ''}
            onChange={e => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            min={field.min}
            max={field.max}
            step={field.step}
            disabled={isDisabled}
            className={cn(optimisticState.error && 'border-red-500')}
            aria-invalid={!!optimisticState.error}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={(value as string) || ''}
            onChange={e => handleChange(field.name, e.target.value)}
            required={field.required}
            disabled={isDisabled}
            className={cn(optimisticState.error && 'border-red-500')}
            aria-invalid={!!optimisticState.error}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={!!value}
              onCheckedChange={checked => handleChange(field.name, checked)}
              disabled={isDisabled}
            />
            <span className="text-sm text-muted-foreground">{field.placeholder}</span>
          </div>
        );

      default:
        return (
          <Input
            type={field.type}
            value={(value as string) || ''}
            onChange={e => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={isDisabled}
            className={cn(optimisticState.error && 'border-red-500')}
            aria-invalid={!!optimisticState.error}
          />
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      <div
        className={cn(
          'relative bg-background rounded-lg shadow-lg w-full max-h-[90vh] overflow-y-auto',
          'animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200',
          sizeClasses[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <div className="flex items-center justify-between p-6 pb-4">
          {title && (
            <h2 id="modal-title" className="text-lg font-semibold leading-none tracking-tight">
              {title}
            </h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={isDisabled}
            className="absolute right-4 top-4 h-8 w-8 rounded-full"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {optimisticState.error && (
          <div className="mx-6 mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
            {optimisticState.error}
          </div>
        )}

        {fields && onSubmit ? (
          <form onSubmit={handleSubmit} className="p-6 pt-0">
            <div className="space-y-4">
              {fields.map(field => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {renderField(field)}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isDisabled}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isDisabled}>
                {isDisabled ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {submitLabel}
                  </span>
                ) : (
                  submitLabel
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="p-6 pt-0">{children}</div>
        )}
      </div>
    </div>
  );
}

export default UnifiedModal;
