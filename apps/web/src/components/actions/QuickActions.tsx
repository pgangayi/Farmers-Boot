/**
 * QUICK ACTIONS COMPONENT
 * =======================
 * Grid of quick action buttons for dashboard and pages.
 * Used for common actions like "Add New", "Export", etc.
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface QuickAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  color?: 'green' | 'blue' | 'orange' | 'purple' | 'red' | 'emerald' | 'gray';
  disabled?: boolean;
}

interface QuickActionsProps {
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
  className?: string;
  variant?: 'default' | 'compact';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuickActions({
  actions,
  columns = 4,
  className,
  variant = 'default',
}: QuickActionsProps) {
  const colorClasses = {
    green: { bg: 'bg-green-100', icon: 'text-green-600' },
    blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
    orange: { bg: 'bg-orange-100', icon: 'text-orange-600' },
    purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
    red: { bg: 'bg-red-100', icon: 'text-red-600' },
    emerald: { bg: 'bg-emerald-100', icon: 'text-emerald-600' },
    gray: { bg: 'bg-gray-100', icon: 'text-gray-600' },
  };

  const columnClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex gap-2 overflow-x-auto pb-1', className)}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          const colors = colorClasses[action.color || 'gray'];

          return (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border',
                'bg-white hover:bg-gray-50 transition-colors whitespace-nowrap',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <div className={cn('p-1.5 rounded', colors.bg)}>
                <Icon className={cn('h-3.5 w-3.5', colors.icon)} />
              </div>
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-3', columnClasses[columns], className)}>
      {actions.map((action, index) => {
        const Icon = action.icon;
        const colors = colorClasses[action.color || 'gray'];

        return (
          <button
            key={index}
            onClick={action.onClick}
            disabled={action.disabled}
            className={cn(
              'bg-white rounded-xl p-4 shadow-sm border border-gray-100',
              'hover:shadow-md transition-all active:scale-95',
              'flex flex-col items-center space-y-2',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
            )}
          >
            <div className={cn('p-3 rounded-full', colors.bg)}>
              <Icon className={cn('h-5 w-5', colors.icon)} />
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// ADD BUTTON
// ============================================================================

interface AddButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function AddButton({
  onClick,
  label = 'Add New',
  className,
  variant = 'default',
  size = 'md',
}: AddButtonProps) {
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-11 px-6 text-base',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring focus-visible:ring-offset-2',
        variants[variant],
        sizes[size],
        className
      )}
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}

export default QuickActions;
