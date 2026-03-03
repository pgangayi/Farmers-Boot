import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Input, InputProps } from './input';
import { Label } from './label';
import { Textarea, TextareaProps } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  error?: string;
  required?: boolean;
  description?: string;
}

export interface FormInputProps extends InputProps {
  label?: string;
  error?: string;
  required?: boolean;
  description?: string;
}

export interface FormTextareaProps extends TextareaProps {
  label?: string;
  error?: string;
  required?: boolean;
  description?: string;
}

export interface FormSelectProps {
  label?: string;
  error?: string;
  required?: boolean;
  description?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
  name?: string;
}

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, error, required, description, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {label && (
          <Label
            className={cn(
              'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        {children}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
      </div>
    );
  }
);

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, label, error, required, description, ...props }, ref) => {
    return (
      <FormField label={label} error={error} required={required} description={description}>
        <Input
          ref={ref}
          className={cn(error && 'border-red-500 focus-visible:ring-red-500', className)}
          aria-invalid={!!error}
          {...props}
        />
      </FormField>
    );
  }
);

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, label, error, required, description, ...props }, ref) => {
    return (
      <FormField label={label} error={error} required={required} description={description}>
        <Textarea
          ref={ref}
          className={cn(error && 'border-red-500 focus-visible:ring-red-500', className)}
          aria-invalid={!!error}
          {...props}
        />
      </FormField>
    );
  }
);

const FormSelect = forwardRef<HTMLButtonElement, FormSelectProps>(
  (
    {
      className,
      label,
      error,
      required,
      description,
      options,
      placeholder,
      value,
      onValueChange,
      disabled,
      name,
    },
    ref
  ) => {
    return (
      <FormField label={label} error={error} required={required} description={description}>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger
            ref={ref}
            className={cn(error && 'border-red-500 focus-visible:ring-red-500', className)}
            aria-invalid={!!error}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    );
  }
);

FormField.displayName = 'FormField';
FormInput.displayName = 'FormInput';
FormTextarea.displayName = 'FormTextarea';
FormSelect.displayName = 'FormSelect';

export { FormField, FormInput, FormTextarea, FormSelect };
