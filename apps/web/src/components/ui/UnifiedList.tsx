import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Checkbox } from './checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

export interface Column<T = any> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, record: T) => React.ReactNode;
  filterable?: boolean;
  filterOptions?: Array<{ label: string; value: any }>;
}

export interface UnifiedListProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  selection?: {
    selectedRows: T[];
    onSelectAll: (selected: boolean, rows: T[]) => void;
    onSelect: (record: T, selected: boolean) => void;
  };
  sorting?: {
    field?: keyof T;
    direction?: 'asc' | 'desc';
    onChange: (field: keyof T, direction: 'asc' | 'desc') => void;
  };
  filtering?: {
    filters: Record<keyof T, any>;
    onChange: (filters: Record<keyof T, any>) => void;
  };
  className?: string;
  emptyText?: string;
  rowKey?: keyof T;
  onRowClick?: (record: T) => void;
}

function UnifiedList<T extends Record<string, any>>({
  data = [],
  columns = [],
  loading = false,
  pagination,
  selection,
  sorting,
  filtering,
  className,
  emptyText = 'No data available',
  rowKey = 'id' as keyof T,
  onRowClick,
}: UnifiedListProps<T>) {
  const [localFilters, setLocalFilters] = useState<Record<keyof T, any>>(
    {} as Record<keyof T, any>
  );

  // Handle sorting
  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !sorting) return;

    const newDirection =
      sorting.field === column.key && sorting.direction === 'asc' ? 'desc' : 'asc';
    sorting.onChange(column.key, newDirection);
  };

  // Handle filtering
  const handleFilter = (column: Column<T>, value: any) => {
    if (!column.filterable || !filtering) return;

    const newFilters = {
      ...localFilters,
      [column.key]: value,
    };
    setLocalFilters(newFilters);
    filtering.onChange(newFilters);
  };

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (!selection) return;
    selection.onSelectAll(checked, data);
  };

  const handleSelectRow = (record: T, checked: boolean) => {
    if (!selection) return;
    selection.onSelect(record, checked);
  };

  const isAllSelected =
    selection && data.length > 0
      ? data.every(row => selection.selectedRows.some(selected => selected[rowKey] === row[rowKey]))
      : false;

  const isRowSelected = (record: T) =>
    selection
      ? selection.selectedRows.some(selected => selected[rowKey] === record[rowKey])
      : false;

  // Render cell content
  const renderCell = (column: Column<T>, record: T) => {
    const value = record[column.key];

    if (column.render) {
      return column.render(value, record);
    }

    // Default rendering based on type
    if (typeof value === 'boolean') {
      return <Checkbox checked={value} disabled readOnly />;
    }

    if (typeof value === 'number' && column.key.toString().toLowerCase().includes('amount')) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    }

    if (
      (value as any) instanceof Date ||
      (value && typeof value === 'object' && (value as any).constructor?.name === 'Date')
    ) {
      return (value as Date).toLocaleDateString();
    }

    if (value && typeof value === 'object' && 'toString' in value) {
      return String(value.toString());
    }

    return String(value || '');
  };

  // Render filter input for column
  const renderFilter = (column: Column<T>) => {
    if (!column.filterable) return null;

    if (column.filterOptions) {
      return (
        <Select
          value={localFilters[column.key] || ''}
          onValueChange={value => handleFilter(column, value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Filter ${column.title}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            {column.filterOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        placeholder={`Filter ${column.title}`}
        value={localFilters[column.key] || ''}
        onChange={e => handleFilter(column, e.target.value)}
        className="h-8"
      />
    );
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Filters */}
      {filtering && columns.some(col => col.filterable) && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {columns
              .filter(column => column.filterable)
              .map(column => (
                <div key={String(column.key)} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {column.title}
                  </label>
                  {renderFilter(column)}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            {/* Header */}
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {selection && (
                  <th className="px-6 py-3 text-left">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
                      aria-label="Select all"
                    />
                  </th>
                )}
                {columns.map(column => (
                  <th
                    key={String(column.key)}
                    className={cn(
                      'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                      column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700',
                      column.width && `w-${column.width}`
                    )}
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.title}</span>
                      {sorting && sorting.field === column.key && (
                        <span className="text-gray-400">
                          {sorting.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + (selection ? 1 : 0)}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-500">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selection ? 1 : 0)}
                    className="px-6 py-12 text-center"
                  >
                    <div className="text-gray-500 dark:text-gray-400">
                      <div className="text-lg mb-2">📋</div>
                      <p>{emptyText}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((record, index) => (
                  <tr
                    key={String(record[rowKey])}
                    className={cn(
                      'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(record)}
                  >
                    {selection && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Checkbox
                          checked={isRowSelected(record)}
                          onCheckedChange={(checked: boolean) => handleSelectRow(record, checked)}
                        />
                      </td>
                    )}
                    {columns.map(column => (
                      <td
                        key={String(column.key)}
                        className={cn(
                          'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100',
                          column.width && `w-${column.width}`
                        )}
                      >
                        {renderCell(column, record)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
              disabled={pagination.current <= 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing{' '}
                <span className="font-medium">
                  {(pagination.current - 1) * pagination.pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.current * pagination.pageSize, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <Button
                  onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
                  disabled={pagination.current <= 1}
                  variant="outline"
                  size="sm"
                  className="rounded-l-md"
                >
                  Previous
                </Button>
                <div className="hidden md:flex">
                  {Array.from(
                    { length: Math.ceil(pagination.total / pagination.pageSize) },
                    (_, i) => i + 1
                  ).map(page => (
                    <Button
                      key={page}
                      onClick={() => pagination.onChange(page, pagination.pageSize)}
                      variant={page === pagination.current ? 'default' : 'outline'}
                      size="sm"
                      className="relative inline-flex items-center px-4 py-2 border text-sm font-medium focus:z-10"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
                  disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                  variant="outline"
                  size="sm"
                  className="rounded-r-md"
                >
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { UnifiedList };
