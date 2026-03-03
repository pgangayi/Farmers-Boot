/**
 * ANIMAL CARD COMPONENT
 * =====================
 * Reusable card component for displaying livestock/animal information.
 * Used across dashboard, livestock page, and other views.
 */

import React from 'react';
import { Activity, DollarSign, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Animal } from '../../api';

// ============================================================================
// TYPES
// ============================================================================

interface AnimalCardProps {
  animal: Animal;
  onViewDetails?: (animal: Animal) => void;
  onAction?: (animal: Animal) => void;
  className?: string;
  variant?: 'default' | 'compact';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Not specified';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleDateString();
}

function getStatusBadgeClasses(status: string): string {
  const classes: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    sold: 'bg-blue-100 text-blue-800',
    deceased: 'bg-red-100 text-red-800',
    quarantine: 'bg-yellow-100 text-yellow-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AnimalCard({
  animal,
  onViewDetails,
  onAction,
  className,
  variant = 'default',
}: AnimalCardProps) {
  const displayName = animal.name || animal.identification_tag || 'Unknown';
  const displayId = animal.identification_tag || animal.id.slice(0, 8);

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100',
          'hover:shadow-md transition-shadow cursor-pointer',
          className
        )}
        onClick={() => onViewDetails?.(animal)}
      >
        <div className="p-2 bg-blue-50 rounded-lg">
          <Activity className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate">{displayName}</p>
          <p className="text-xs text-gray-500">
            {animal.species} • {displayId}
          </p>
        </div>
        <span
          className={cn(
            'px-2 py-0.5 text-xs font-medium rounded-full',
            getStatusBadgeClasses(animal.status)
          )}
        >
          {formatStatus(animal.status)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100',
        'hover:shadow-md transition-shadow',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{displayName}</h4>
            <p className="text-xs sm:text-sm text-gray-600">{animal.species}</p>
          </div>
        </div>
        <span
          className={cn(
            'px-2 py-1 text-xs font-medium rounded-full',
            getStatusBadgeClasses(animal.status)
          )}
        >
          {formatStatus(animal.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
        <div>
          <span className="text-gray-500">Breed:</span>
          <p className="font-medium text-gray-900">{animal.breed || 'Not specified'}</p>
        </div>
        <div>
          <span className="text-gray-500">Acquired:</span>
          <p className="font-medium text-gray-900">{formatDate(animal.acquisition_date)}</p>
        </div>
      </div>

      {(onViewDetails || onAction) && (
        <div className="flex gap-2 mt-4">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(animal)}
              className="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              View Details
            </button>
          )}
          {onAction && (
            <button
              onClick={() => onAction(animal)}
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Activity className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ANIMAL LIST COMPONENT
// ============================================================================

interface AnimalListProps {
  animals: Animal[];
  onViewDetails?: (animal: Animal) => void;
  onAction?: (animal: Animal) => void;
  emptyState?: React.ReactNode;
  className?: string;
  itemClassName?: string;
}

export function AnimalList({
  animals,
  onViewDetails,
  onAction,
  emptyState,
  className,
  itemClassName,
}: AnimalListProps) {
  if (animals.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {animals.map(animal => (
        <AnimalCard
          key={animal.id}
          animal={animal}
          onViewDetails={onViewDetails}
          onAction={onAction}
          className={itemClassName}
        />
      ))}
    </div>
  );
}

export default AnimalCard;
