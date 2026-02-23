import React, { useState, useEffect } from 'react';

export interface ModalField {
  name: string;
  label: string;
  type: string;
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
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fields?: ModalField[];
  initialData?: Record<string, unknown> | any;
  onSubmit?: (data: Record<string, unknown>) => void;
  submitLabel?: string;
  isLoading?: boolean;
}

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
}: UnifiedModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({ ...initialData });
    } else if (isOpen) {
      const defaults: Record<string, unknown> = {};
      fields?.forEach(f => {
        if (f.defaultValue !== undefined) {
          defaults[f.name] = f.defaultValue;
        } else {
          defaults[f.name] = '';
        }
      });
      setFormData(defaults);
    }
  }, [isOpen, initialData, fields]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const handleChange = (name: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  const renderField = (field: ModalField) => {
    const value = (formData[field.name] as string) ?? '';

    switch (field.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={e => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required={field.required}
          >
            <option value="">{field.placeholder || `Select ${field.label}`}</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={e => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder={field.placeholder}
            required={field.required}
            rows={field.rows || 3}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={e => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder={field.placeholder}
            required={field.required}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={e => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required={field.required}
          />
        );
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={!!formData[field.name]}
            onChange={e => handleChange(field.name, e.target.checked)}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
        );
      default:
        return (
          <input
            type={field.type || 'text'}
            value={value}
            onChange={e => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder={field.placeholder}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        role="presentation"
        tabIndex={-1}
        onKeyDown={e => e.key === 'Escape' && onClose()}
      />
      <div
        className={`relative bg-white rounded-lg shadow-lg ${sizeClasses[size]} w-full m-4 p-6 max-h-[90vh] overflow-y-auto`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h2 id="modal-title" className="text-xl font-semibold">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {fields && onSubmit ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {fields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : submitLabel}
              </button>
            </div>
          </form>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
