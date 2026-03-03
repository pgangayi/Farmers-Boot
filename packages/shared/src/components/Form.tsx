/**
 * FORM COMPONENT
 * ==============
 * Comprehensive form system with validation and floating labels
 */

import React, {
  forwardRef,
  useState,
  useCallback,
  useEffect,
  createContext,
  useContext,
} from 'react';
import { cn } from './utils/classNames';
import { useLiveRegion } from './hooks/useLiveRegion';
import type { FormProps, FormField, InputProps } from './types';

// ============================================================================
// FORM CONTEXT
// ============================================================================

interface FormContextType {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setValue: (name: string, value: any) => void;
  setError: (name: string, error: string) => void;
  setTouched: (name: string, touched: boolean) => void;
  validateField: (name: string, value?: any) => boolean;
}

const FormContext = createContext<FormContextType | null>(null);

function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('Form components must be used within a Form');
  }
  return context;
}

// ============================================================================
// FORM COMPONENT
// ============================================================================

export function Form({
  fields,
  onSubmit,
  onChange,
  initialData = {},
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  isLoading = false,
  layout = 'vertical',
  spacing = 'md',
  validateOn = 'change',
}: FormProps) {
  const [values, setValues] = useState<Record<string, any>>(() => {
    const defaults: Record<string, any> = {};
    fields.forEach((field) => {
      defaults[field.name] = initialData[field.name] ?? field.defaultValue ?? '';
    });
    return defaults;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { announceError } = useLiveRegion();

  const validateField = useCallback(
    (name: string, value: any): boolean => {
      const field = fields.find((f) => f.name === name);
      if (!field || !field.validation) return true;

      const { validation } = field;

      if (validation.required && (!value || (typeof value === 'string' && !value.trim()))) {
        setErrors((prev) => ({ ...prev, [name]: validation.required ?? 'This field is required' }));
        return false;
      }

      if (
        validation.minLength &&
        typeof value === 'string' &&
        value.length < validation.minLength.value
      ) {
        setErrors((prev) => ({ ...prev, [name]: validation.minLength!.message }));
        return false;
      }

      if (
        validation.maxLength &&
        typeof value === 'string' &&
        value.length > validation.maxLength.value
      ) {
        setErrors((prev) => ({ ...prev, [name]: validation.maxLength!.message }));
        return false;
      }

      if (
        validation.pattern &&
        typeof value === 'string' &&
        !validation.pattern.value.test(value)
      ) {
        setErrors((prev) => ({ ...prev, [name]: validation.pattern!.message }));
        return false;
      }

      if (validation.min && typeof value === 'number' && value < validation.min.value) {
        setErrors((prev) => ({ ...prev, [name]: validation.min!.message }));
        return false;
      }

      if (validation.max && typeof value === 'number' && value > validation.max.value) {
        setErrors((prev) => ({ ...prev, [name]: validation.max!.message }));
        return false;
      }

      if (validation.validate) {
        const error = validation.validate(value);
        if (error) {
          setErrors((prev) => ({ ...prev, [name]: error }));
          return false;
        }
      }

      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
      return true;
    },
    [fields]
  );

  const setValue = useCallback(
    (name: string, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      if (validateOn === 'change') {
        validateField(name, value);
      }
    },
    [validateOn, validateField]
  );

  const setError = useCallback((name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const setTouchedField = useCallback(
    (name: string, isTouched: boolean) => {
      setTouched((prev) => ({ ...prev, [name]: isTouched }));
      if (validateOn === 'blur' && isTouched) {
        validateField(name, values[name]);
      }
    },
    [validateOn, validateField, values]
  );

  const isValid = Object.keys(errors).length === 0;

  useEffect(() => {
    onChange?.(values, isValid);
  }, [values, isValid, onChange]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate all fields
      let formIsValid = true;
      fields.forEach((field) => {
        const fieldIsValid = validateField(field.name, values[field.name]);
        if (!fieldIsValid) formIsValid = false;
      });

      if (!formIsValid) {
        announceError('Please fix the errors in the form');
        return;
      }

      await onSubmit(values);
    },
    [fields, values, validateField, onSubmit, announceError]
  );

  const contextValue: FormContextType = {
    values,
    errors,
    touched,
    setValue,
    setError,
    setTouched: setTouchedField,
    validateField,
  };

  const spacingClasses = {
    xs: 'space-y-2',
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  };

  const layoutClasses = {
    vertical: 'flex flex-col',
    horizontal: 'grid grid-cols-1 md:grid-cols-2 gap-4',
    inline: 'flex flex-wrap items-end gap-4',
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form onSubmit={handleSubmit} className={cn(layoutClasses[layout], spacingClasses[spacing])}>
        {fields.map((field) => (
          <FormFieldComponent key={field.name} field={field} layout={layout} />
        ))}

        <div className={cn('flex gap-3 pt-2', layout === 'inline' && 'w-full md:w-auto')}>
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'inline-flex items-center justify-center px-4 py-2 rounded-[0.625rem]',
              'bg-[hsl(142,76%,36%)] text-white font-medium',
              'hover:bg-[hsl(142,76%,30%)] transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              layout === 'inline' && 'flex-1 md:flex-none'
            )}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              submitLabel
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={cn(
                'inline-flex items-center justify-center px-4 py-2 rounded-[0.625rem]',
                'border border-[hsl(214.3,31.8%,91.4%)] text-[hsl(222.2,84%,4.9%)] font-medium',
                'hover:bg-[hsl(210,40%,96%)] transition-colors'
              )}
            >
              {cancelLabel}
            </button>
          )}
        </div>
      </form>
    </FormContext.Provider>
  );
}

// ============================================================================
// FORM FIELD COMPONENT
// ============================================================================

function FormFieldComponent({ field, layout }: { field: FormField; layout: string }) {
  const { values, errors, touched, setValue, setTouched } = useFormContext();
  const value = values[field.name];
  const error = errors[field.name];
  const isTouched = touched[field.name];
  const showError = isTouched && error;

  const handleChange = (newValue: any) => {
    setValue(field.name, newValue);
  };

  const handleBlur = () => {
    setTouched(field.name, true);
  };

  const labelClasses = cn(
    'text-sm font-medium',
    showError ? 'text-[hsl(0,84.2%,60.2%)]' : 'text-[hsl(222.2,84%,4.9%)]'
  );

  const inputClasses = cn(
    'w-full px-3 py-2 rounded-[0.625rem] border bg-white transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-[hsl(142,76%,36%)] focus:border-transparent',
    showError
      ? 'border-[hsl(0,84.2%,60.2%)] focus:ring-[hsl(0,84.2%,60.2%)]'
      : 'border-[hsl(214.3,31.8%,91.4%)]',
    field.disabled && 'bg-[hsl(210,40%,96%)] cursor-not-allowed'
  );

  const renderInput = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.name}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={field.placeholder}
            disabled={field.disabled}
            readOnly={field.readOnly}
            required={field.required}
            rows={field.rows || 3}
            className={cn(inputClasses, 'resize-y min-h-[80px]')}
          />
        );

      case 'select':
        return (
          <select
            id={field.name}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            disabled={field.disabled}
            required={field.required}
            className={inputClasses}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <input
            id={field.name}
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleChange(e.target.checked)}
            onBlur={handleBlur}
            disabled={field.disabled}
            className="h-4 w-4 rounded border-[hsl(214.3,31.8%,91.4%)] text-[hsl(142,76%,36%)] focus:ring-[hsl(142,76%,36%)]"
          />
        );

      case 'number':
        return (
          <input
            id={field.name}
            type="number"
            value={value}
            onChange={(e) => handleChange(e.target.valueAsNumber || 0)}
            onBlur={handleBlur}
            placeholder={field.placeholder}
            disabled={field.disabled}
            readOnly={field.readOnly}
            required={field.required}
            min={field.validation?.min?.value}
            max={field.validation?.max?.value}
            className={inputClasses}
          />
        );

      case 'date':
        return (
          <input
            id={field.name}
            type="date"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            disabled={field.disabled}
            readOnly={field.readOnly}
            required={field.required}
            className={inputClasses}
          />
        );

      default:
        return (
          <input
            id={field.name}
            type={field.type}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={field.placeholder}
            disabled={field.disabled}
            readOnly={field.readOnly}
            required={field.required}
            autoComplete={field.autoComplete}
            className={inputClasses}
          />
        );
    }
  };

  return (
    <div className={cn('space-y-1.5', layout === 'horizontal' && 'md:col-span-1')}>
      <label htmlFor={field.name} className={labelClasses}>
        {field.label}
        {field.required && <span className="text-[hsl(0,84.2%,60.2%)] ml-1">*</span>}
      </label>
      {renderInput()}
      {field.helperText && !showError && (
        <p className="text-xs text-[hsl(215.4,16.3%,46.9%)]">{field.helperText}</p>
      )}
      {showError && <p className="text-xs text-[hsl(0,84.2%,60.2%)] animate-shake">{error}</p>}
    </div>
  );
}

// ============================================================================
// INPUT COMPONENT
// ============================================================================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      floatingLabel = false,
      leftIcon,
      rightIcon,
      variant = 'default',
      inputSize = 'md',
      isLoading = false,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: 'border-[hsl(214.3,31.8%,91.4%)] bg-white',
      filled: 'border-transparent bg-[hsl(210,40%,96%)]',
      outlined: 'border-2 border-[hsl(214.3,31.8%,91.4%)] bg-transparent',
      underlined:
        'border-0 border-b-2 border-[hsl(214.3,31.8%,91.4%)] bg-transparent rounded-none px-0',
    };

    const sizeClasses = {
      xs: 'h-7 px-2 text-xs',
      sm: 'h-8 px-2.5 text-sm',
      md: 'h-10 px-3 text-sm',
      lg: 'h-12 px-4 text-base',
      xl: 'h-14 px-4 text-base',
    };

    return (
      <div className={cn('space-y-1.5', className)}>
        {label && !floatingLabel && (
          <label className="text-sm font-medium text-[hsl(222.2,84%,4.9%)]">
            {label}
            {props.required && <span className="text-[hsl(0,84.2%,60.2%)] ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(215.4,16.3%,46.9%)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-[0.625rem] transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-[hsl(142,76%,36%)]',
              variantClasses[variant],
              sizeClasses[inputSize],
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-[hsl(0,84.2%,60.2%)] focus:ring-[hsl(0,84.2%,60.2%)]',
              props.disabled && 'bg-[hsl(210,40%,96%)] cursor-not-allowed opacity-60'
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(215.4,16.3%,46.9%)]">
              {rightIcon}
            </div>
          )}
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="animate-spin h-4 w-4 text-[hsl(215.4,16.3%,46.9%)]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          )}
        </div>
        {helperText && !error && (
          <p className="text-xs text-[hsl(215.4,16.3%,46.9%)]">{helperText}</p>
        )}
        {error && <p className="text-xs text-[hsl(0,84.2%,60.2%)] animate-shake">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Form;
