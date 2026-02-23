/**
 * Finance Entry Modal Component
 * ============================
 * Form for creating and editing finance entries
 */

import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign } from 'lucide-react';
import { FinanceRecord, FinanceFormData, TransactionType } from './types';
import { Button } from '../ui/button';

// Constants for border color class names to avoid duplication
const BORDER_RED_500 = 'border-red-500';
const BORDER_GRAY_300 = 'border-gray-300';

// Category options
const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'seeds', label: 'Seeds' },
  { value: 'fertilizer', label: 'Fertilizer' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'labor', label: 'Labor' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'pesticides', label: 'Pesticides' },
  { value: 'transport', label: 'Transport' },
  { value: 'storage', label: 'Storage' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'crop_sales', label: 'Crop Sales' },
  { value: 'livestock_sales', label: 'Livestock Sales' },
  { value: 'subsidies', label: 'Subsidies' },
  { value: 'other_income', label: 'Other Income' },
  { value: 'other_expense', label: 'Other Expense' },
];

// Status options
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'draft', label: 'Draft' },
];

interface FinanceEntryModalProps {
  entry: FinanceRecord | null;
  farms: { id: string; name: string }[];
  onSave: (data: FinanceFormData) => void;
  onClose: () => void;
  isLoading: boolean;
}

export function FinanceEntryModal({
  entry,
  farms,
  onSave,
  onClose,
  isLoading,
}: FinanceEntryModalProps) {
  const isEditing = entry !== null;

  // Form state
  const [formData, setFormData] = useState<FinanceFormData>({
    transaction_type: 'expense',
    amount: 0,
    category: 'other_expense',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0] || '',
    reference_number: '',
    status: 'completed',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with entry data when editing
  useEffect(() => {
    if (entry) {
      setFormData({
        transaction_type: entry.type || entry.entry_type || 'expense',
        amount: entry.amount,
        category: entry.category,
        description: entry.description || '',
        transaction_date:
          entry.transaction_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        reference_number: '',
        status: entry.status || 'completed',
      });
    }
  }, [entry]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.transaction_date?.trim()) {
      newErrors.transaction_date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onSave(formData);
  };

  // Filter categories based on transaction type
  const getFilteredCategories = () => {
    if (formData.transaction_type === 'income') {
      return CATEGORY_OPTIONS.filter(cat =>
        ['crop_sales', 'livestock_sales', 'subsidies', 'other_income'].includes(cat.value)
      );
    }
    return CATEGORY_OPTIONS.filter(
      cat => !['crop_sales', 'livestock_sales', 'subsidies', 'other_income'].includes(cat.value)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Transaction Type */}
          <div>
            <label
              htmlFor="transaction-type"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Transaction Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="transaction-type-income"
                onClick={() => setFormData(prev => ({ ...prev, transaction_type: 'income' }))}
                className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                  formData.transaction_type === 'income'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, transaction_type: 'expense' }))}
                className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                  formData.transaction_type === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Expense
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amount ? BORDER_RED_500 : BORDER_GRAY_300
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.category ? BORDER_RED_500 : BORDER_GRAY_300
              }`}
            >
              {getFilteredCategories().map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? BORDER_RED_500 : BORDER_GRAY_300
              }`}
              placeholder="Enter transaction description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label
              htmlFor="transaction_date"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Date *
            </label>
            <input
              type="date"
              id="transaction_date"
              name="transaction_date"
              value={formData.transaction_date}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.transaction_date ? BORDER_RED_500 : BORDER_GRAY_300
              }`}
            />
            {errors.transaction_date && (
              <p className="mt-1 text-sm text-red-500">{errors.transaction_date}</p>
            )}
          </div>

          {/* Reference Number */}
          <div>
            <label
              htmlFor="reference_number"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Reference Number
            </label>
            <input
              type="text"
              id="reference_number"
              name="reference_number"
              value={formData.reference_number}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.reference_number ? BORDER_RED_500 : BORDER_GRAY_300
              }`}
              placeholder="Invoice #, Receipt #, etc."
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditing ? 'Update' : 'Create'} Transaction
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
