/**
 * ENHANCED EMPTY STATE COMPONENT
 * ==============================
 * Beautiful empty state illustrations with animations,
 * clear messaging, and actionable CTAs.
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button-enhanced';

// ============================================================================
// TYPES
// ============================================================================

type EmptyStateVariant =
  | 'default'
  | 'search'
  | 'data'
  | 'error'
  | 'success'
  | 'notification'
  | 'farm'
  | 'crop'
  | 'livestock'
  | 'finance'
  | 'task'
  | 'weather'
  | 'offline';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
  className?: string;
  animate?: boolean;
}

// ============================================================================
// ILLUSTRATION COMPONENTS
// ============================================================================

function FarmIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Sun */}
      <circle cx="160" cy="30" r="15" fill="#FCD34D" className="animate-pulse-subtle" />
      {/* Clouds */}
      <g className="animate-float" style={{ animationDelay: '0.5s' }}>
        <ellipse cx="50" cy="25" rx="20" ry="12" fill="#E5E7EB" />
        <ellipse cx="65" cy="28" rx="15" ry="10" fill="#E5E7EB" />
      </g>
      {/* Barn */}
      <path d="M60 80 L100 40 L140 80 L140 140 L60 140 Z" fill="#EF4444" />
      <path d="M60 80 L100 40 L140 80" stroke="#DC2626" strokeWidth="2" fill="none" />
      <rect x="85" y="100" width="30" height="40" fill="#7C2D12" />
      {/* Hills */}
      <path
        d="M0 140 Q50 100 100 140 T200 140 V160 H0 Z"
        fill="#22C55E"
        className="text-green-500"
      />
      <path
        d="M0 150 Q50 120 100 150 T200 150 V160 H0 Z"
        fill="#16A34A"
        className="text-green-600"
      />
      {/* Fence */}
      <g stroke="#92400E" strokeWidth="3">
        <line x1="150" y1="100" x2="150" y2="140" />
        <line x1="165" y1="100" x2="165" y2="140" />
        <line x1="180" y1="100" x2="180" y2="140" />
        <line x1="145" y1="115" x2="185" y2="115" />
        <line x1="145" y1="130" x2="185" y2="130" />
      </g>
    </svg>
  );
}

function SearchIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Magnifying Glass */}
      <g className="animate-bounce-subtle">
        <circle cx="90" cy="70" r="45" stroke="#3B82F6" strokeWidth="8" fill="none" />
        <line
          x1="122"
          y1="102"
          x2="160"
          y2="140"
          stroke="#3B82F6"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </g>
      {/* Floating Elements */}
      <circle cx="30" cy="40" r="6" fill="#E5E7EB" className="animate-float" />
      <circle
        cx="170"
        cy="50"
        r="4"
        fill="#E5E7EB"
        className="animate-float"
        style={{ animationDelay: '1s' }}
      />
      <rect
        x="150"
        y="110"
        width="8"
        height="8"
        fill="#E5E7EB"
        className="animate-float"
        style={{ animationDelay: '0.5s' }}
      />
    </svg>
  );
}

function DataIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Chart Bars */}
      <g className="stagger-children">
        <rect x="40" y="100" width="25" height="40" rx="4" fill="#E5E7EB" />
        <rect
          x="75"
          y="70"
          width="25"
          height="70"
          rx="4"
          fill="#22C55E"
          className="animate-fade-in-up delay-100"
        />
        <rect
          x="110"
          y="50"
          width="25"
          height="90"
          rx="4"
          fill="#3B82F6"
          className="animate-fade-in-up delay-200"
        />
        <rect x="145" y="80" width="25" height="60" rx="4" fill="#E5E7EB" />
      </g>
      {/* Base Line */}
      <line x1="30" y1="140" x2="180" y2="140" stroke="#9CA3AF" strokeWidth="2" />
      {/* Floating Plus Icons */}
      <g className="animate-float">
        <text x="160" y="40" fill="#22C55E" fontSize="24" fontWeight="bold">
          +
        </text>
      </g>
    </svg>
  );
}

function ErrorIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Warning Triangle */}
      <g className="animate-fade-in">
        <path d="M100 30 L170 140 H30 L100 30 Z" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="4" />
        <text x="100" y="110" textAnchor="middle" fill="#B45309" fontSize="48" fontWeight="bold">
          !
        </text>
      </g>
      {/* Decorative Elements */}
      <circle cx="40" cy="50" r="8" fill="#FEE2E2" className="animate-pulse-subtle" />
      <circle
        cx="170"
        cy="60"
        r="6"
        fill="#FEE2E2"
        className="animate-pulse-subtle"
        style={{ animationDelay: '0.5s' }}
      />
    </svg>
  );
}

function OfflineIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Cloud */}
      <ellipse cx="100" cy="60" rx="50" ry="30" fill="#E5E7EB" />
      <ellipse cx="70" cy="70" rx="35" ry="25" fill="#E5E7EB" />
      <ellipse cx="130" cy="70" rx="35" ry="25" fill="#E5E7EB" />
      {/* WiFi Symbol with X */}
      <g className="animate-fade-in">
        <path d="M65 95 Q100 70 135 95" stroke="#9CA3AF" strokeWidth="4" fill="none" />
        <path d="M75 105 Q100 90 125 105" stroke="#9CA3AF" strokeWidth="4" fill="none" />
        <line
          x1="85"
          y1="85"
          x2="115"
          y2="115"
          stroke="#EF4444"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1="115"
          y1="85"
          x2="85"
          y2="115"
          stroke="#EF4444"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

function SuccessIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Checkmark Circle */}
      <g className="animate-scale-in">
        <circle cx="100" cy="80" r="50" fill="#DCFCE7" stroke="#22C55E" strokeWidth="4" />
        <path
          d="M75 80 L92 97 L125 63"
          stroke="#22C55E"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-fade-in delay-200"
        />
      </g>
      {/* Stars */}
      <text x="40" y="50" fill="#FCD34D" fontSize="20" className="animate-float">
        ★
      </text>
      <text
        x="160"
        y="50"
        fill="#FCD34D"
        fontSize="16"
        className="animate-float"
        style={{ animationDelay: '0.5s' }}
      >
        ★
      </text>
    </svg>
  );
}

function CropIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Sprout */}
      <g className="animate-fade-in-up">
        <path
          d="M100 140 C100 100 70 80 60 60"
          stroke="#22C55E"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M100 140 C100 100 130 80 140 60"
          stroke="#22C55E"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M60 60 Q40 40 80 40 Q60 20 60 60" fill="#4ADE80" />
        <path d="M140 60 Q160 40 120 40 Q140 20 140 60" fill="#4ADE80" />
        <line x1="100" y1="140" x2="100" y2="100" stroke="#16A34A" strokeWidth="4" />
      </g>
      {/* Ground */}
      <ellipse cx="100" cy="145" rx="60" ry="10" fill="#D6D3D1" />
    </svg>
  );
}

function LivestockIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Simple Cow Shape */}
      <g className="animate-bounce-subtle">
        <ellipse cx="100" cy="90" rx="45" ry="35" fill="#E5E7EB" />
        <circle cx="75" cy="75" r="20" fill="#E5E7EB" />
        {/* Ears */}
        <ellipse cx="60" cy="70" rx="8" ry="12" fill="#D1D5DB" transform="rotate(-20 60 70)" />
        <ellipse cx="90" cy="70" rx="8" ry="12" fill="#D1D5DB" transform="rotate(20 90 70)" />
        {/* Spots */}
        <circle cx="110" cy="85" r="12" fill="#D1D5DB" />
        <circle cx="85" cy="100" r="8" fill="#D1D5DB" />
      </g>
      {/* Legs */}
      <rect x="75" y="120" width="10" height="25" rx="2" fill="#9CA3AF" />
      <rect x="115" y="120" width="10" height="25" rx="2" fill="#9CA3AF" />
    </svg>
  );
}

// ============================================================================
// MAIN EMPTY STATE COMPONENT
// ============================================================================

const variantIllustrations: Record<EmptyStateVariant, React.FC<{ className?: string }>> = {
  default: FarmIllustration,
  search: SearchIllustration,
  data: DataIllustration,
  error: ErrorIllustration,
  success: SuccessIllustration,
  notification: SearchIllustration,
  farm: FarmIllustration,
  crop: CropIllustration,
  livestock: LivestockIllustration,
  finance: DataIllustration,
  task: SearchIllustration,
  weather: SearchIllustration,
  offline: OfflineIllustration,
};

const variantColors: Record<EmptyStateVariant, string> = {
  default: 'text-green-600',
  search: 'text-blue-600',
  data: 'text-blue-600',
  error: 'text-amber-600',
  success: 'text-green-600',
  notification: 'text-purple-600',
  farm: 'text-green-600',
  crop: 'text-green-600',
  livestock: 'text-amber-600',
  finance: 'text-emerald-600',
  task: 'text-orange-600',
  weather: 'text-cyan-600',
  offline: 'text-gray-600',
};

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      variant = 'default',
      title,
      description,
      icon: customIcon,
      primaryAction,
      secondaryAction,
      compact = false,
      className,
      animate = true,
    },
    ref
  ) => {
    const Illustration = variantIllustrations[variant];
    const colorClass = variantColors[variant];

    if (compact) {
      return (
        <div
          ref={ref}
          className={cn(
            'flex flex-col items-center justify-center p-6 text-center',
            animate && 'animate-fade-in',
            className
          )}
        >
          {customIcon || <Illustration className={cn('w-20 h-20 mb-3', colorClass)} />}
          <h4 className="font-medium text-foreground">{title}</h4>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          {primaryAction && (
            <Button
              size="sm"
              className="mt-3"
              leftIcon={primaryAction.icon}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center p-8 text-center',
          'min-h-[400px]',
          animate && 'animate-fade-in-up',
          className
        )}
      >
        <div className="relative">
          {customIcon || <Illustration className={cn('w-48 h-48 mb-6', colorClass)} />}
          {/* Decorative Elements */}
          <div className="absolute -top-4 -right-4 w-3 h-3 bg-primary/20 rounded-full animate-pulse-subtle" />
          <div
            className="absolute -bottom-2 -left-4 w-2 h-2 bg-accent/30 rounded-full animate-pulse-subtle"
            style={{ animationDelay: '0.5s' }}
          />
        </div>

        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
        {description && <p className="text-muted-foreground max-w-md mb-6">{description}</p>}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {primaryAction && (
            <Button
              leftIcon={primaryAction.icon}
              onClick={primaryAction.onClick}
              className="btn-press"
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick} className="btn-press">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

// ============================================================================
// SPECIALIZED EMPTY STATE COMPONENTS
// ============================================================================

export function EmptySearchState({
  query,
  onClear,
  className,
}: {
  query: string;
  onClear: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      variant="search"
      title="No results found"
      description={`We couldn't find any results for "${query}". Try adjusting your search terms.`}
      primaryAction={{
        label: 'Clear Search',
        onClick: onClear,
      }}
      className={className}
    />
  );
}

export function NoDataState({
  title = 'No data yet',
  description = 'Get started by adding your first item.',
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}) {
  return (
    <EmptyState
      variant="data"
      title={title}
      description={description}
      primaryAction={action}
      className={className}
    />
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading the data. Please try again.',
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      variant="error"
      title={title}
      description={description}
      primaryAction={{
        label: 'Try Again',
        onClick: onRetry,
      }}
      className={className}
    />
  );
}

export function OfflineState({ onRetry, className }: { onRetry: () => void; className?: string }) {
  return (
    <EmptyState
      variant="offline"
      title="You're offline"
      description="Please check your internet connection and try again."
      primaryAction={{
        label: 'Retry Connection',
        onClick: onRetry,
      }}
      className={className}
    />
  );
}

export function SuccessState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}) {
  return (
    <EmptyState
      variant="success"
      title={title}
      description={description}
      primaryAction={action}
      className={className}
    />
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { EmptyState };
export type { EmptyStateProps, EmptyStateVariant };
