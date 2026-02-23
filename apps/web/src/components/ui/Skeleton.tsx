/**
 * LOADING SKELETONS
 * =================
 * Comprehensive skeleton components for better loading UX
 * Reduces perceived loading time and provides visual consistency
 */

import React from 'react';
import { cn } from '../../lib/utils';

// ============================================================================
// BASE SKELETON
// ============================================================================

interface SkeletonProps {
  className?: string;
  animate?: boolean;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  animate = true,
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={cn('bg-gray-200', animate && 'animate-pulse', variantClasses[variant], className)}
      style={style}
    />
  );
}

// ============================================================================
// TEXT SKELETONS
// ============================================================================

interface TextSkeletonProps {
  lines?: number;
  className?: string;
  lineHeight?: number;
  lastLineWidth?: string;
}

export function TextSkeleton({
  lines = 3,
  className,
  lineHeight = 16,
  lastLineWidth = '60%',
}: TextSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={lineHeight}
          width={i === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}

export function HeadingSkeleton({ className }: { className?: string }) {
  return <Skeleton variant="text" height={28} width="40%" className={className} />;
}

export function ParagraphSkeleton({ className }: { className?: string }) {
  return <TextSkeleton lines={2} className={className} />;
}

// ============================================================================
// AVATAR SKELETONS
// ============================================================================

interface AvatarSkeletonProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AvatarSkeleton({ size = 'md', className }: AvatarSkeletonProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return <Skeleton variant="circular" className={cn(sizeClasses[size], className)} />;
}

export function AvatarWithTextSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <AvatarSkeleton />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" height={16} width="60%" />
        <Skeleton variant="text" height={12} width="40%" />
      </div>
    </div>
  );
}

// ============================================================================
// CARD SKELETONS
// ============================================================================

interface CardSkeletonProps {
  hasImage?: boolean;
  hasHeader?: boolean;
  hasActions?: boolean;
  lines?: number;
  className?: string;
}

export function CardSkeleton({
  hasImage = false,
  hasHeader = true,
  hasActions = false,
  lines = 3,
  className,
}: CardSkeletonProps) {
  return (
    <div className={cn('border rounded-lg p-4 space-y-4', className)}>
      {hasImage && <Skeleton variant="rounded" height={160} className="w-full" />}
      {hasHeader && (
        <div className="space-y-2">
          <Skeleton variant="text" height={20} width="70%" />
          <Skeleton variant="text" height={14} width="50%" />
        </div>
      )}
      <TextSkeleton lines={lines} />
      {hasActions && (
        <div className="flex gap-2 pt-2">
          <Skeleton variant="rounded" height={36} width={80} />
          <Skeleton variant="rounded" height={36} width={80} />
        </div>
      )}
    </div>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('border rounded-lg p-4', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" height={12} width="40%" />
          <Skeleton variant="text" height={24} width="60%" />
        </div>
        <Skeleton variant="rounded" height={40} width={40} />
      </div>
      <div className="mt-3">
        <Skeleton variant="text" height={12} width="50%" />
      </div>
    </div>
  );
}

// ============================================================================
// TABLE SKELETONS
// ============================================================================

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
  showHeader?: boolean;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {showHeader && (
        <div className="bg-gray-50 border-b p-4 flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant="text" height={16} className="flex-1" />
          ))}
        </div>
      )}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} variant="text" height={16} className="flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton variant="text" height={16} />
        </td>
      ))}
    </tr>
  );
}

// ============================================================================
// LIST SKELETONS
// ============================================================================

interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
  showAction?: boolean;
  className?: string;
}

export function ListSkeleton({
  items = 5,
  showAvatar = false,
  showAction = false,
  className,
}: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
          {showAvatar && <AvatarSkeleton size="sm" />}
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" height={16} width="70%" />
            <Skeleton variant="text" height={12} width="50%" />
          </div>
          {showAction && <Skeleton variant="rounded" height={32} width={60} />}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// FORM SKELETONS
// ============================================================================

interface FormSkeletonProps {
  fields?: number;
  showSubmit?: boolean;
  className?: string;
}

export function FormSkeleton({ fields = 4, showSubmit = true, className }: FormSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" height={14} width="25%" />
          <Skeleton variant="rounded" height={40} className="w-full" />
        </div>
      ))}
      {showSubmit && (
        <div className="pt-4">
          <Skeleton variant="rounded" height={44} width={120} />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PAGE SKELETONS
// ============================================================================

export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 mb-6', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" height={32} width={200} />
          <Skeleton variant="text" height={16} width={300} />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rounded" height={40} width={100} />
          <Skeleton variant="rounded" height={40} width={100} />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 space-y-4 h-64">
          <div className="space-y-2">
            <Skeleton variant="text" height={20} width="70%" />
            <Skeleton variant="text" height={14} width="50%" />
          </div>
          <Skeleton variant="rounded" height={180} className="w-full" />
        </div>
        <div className="border rounded-lg p-4 space-y-4 h-64">
          <div className="space-y-2">
            <Skeleton variant="text" height={20} width="70%" />
            <Skeleton variant="text" height={14} width="50%" />
          </div>
          <Skeleton variant="rounded" height={180} className="w-full" />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg p-4">
        <TableSkeleton rows={5} columns={4} />
      </div>
    </div>
  );
}

export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Profile Header */}
      <div className="flex items-center gap-4 p-6 border rounded-lg">
        <AvatarSkeleton size="xl" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" height={24} width="30%" />
          <Skeleton variant="text" height={16} width="40%" />
          <Skeleton variant="text" height={14} width="25%" />
        </div>
      </div>

      {/* Profile Form */}
      <div className="border rounded-lg p-6">
        <FormSkeleton fields={6} />
      </div>
    </div>
  );
}

// ============================================================================
// SPECIALIZED SKELETONS FOR FARM DATA
// ============================================================================

export function FarmCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      <Skeleton variant="rounded" height={120} className="w-full" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" height={20} width="70%" />
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" height={16} width={16} />
          <Skeleton variant="text" height={14} width="50%" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rounded" height={24} width={60} />
          <Skeleton variant="rounded" height={24} width={80} />
        </div>
      </div>
    </div>
  );
}

export function FarmGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <FarmCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function LivestockCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('border rounded-lg p-4', className)}>
      <div className="flex items-start gap-3">
        <Skeleton variant="rounded" height={60} width={60} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" height={18} width="60%" />
          <Skeleton variant="text" height={14} width="40%" />
          <div className="flex gap-2">
            <Skeleton variant="rounded" height={20} width={50} />
            <Skeleton variant="rounded" height={20} width={70} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CropRowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 p-4 border rounded-lg', className)}>
      <Skeleton variant="rounded" height={48} width={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" height={16} width="50%" />
        <Skeleton variant="text" height={12} width="30%" />
      </div>
      <div className="text-right space-y-2">
        <Skeleton variant="text" height={14} width={60} />
        <Skeleton variant="rounded" height={20} width={80} />
      </div>
    </div>
  );
}

export function TaskCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('border rounded-lg p-4 space-y-3', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" height={18} width="70%" />
          <Skeleton variant="text" height={14} width="50%" />
        </div>
        <Skeleton variant="rounded" height={24} width={60} />
      </div>
      <div className="flex items-center gap-2">
        <AvatarSkeleton size="sm" />
        <Skeleton variant="text" height={12} width="30%" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton variant="text" height={12} width="25%" />
        <div className="flex gap-1">
          <Skeleton variant="rounded" height={28} width={28} />
          <Skeleton variant="rounded" height={28} width={28} />
        </div>
      </div>
    </div>
  );
}

export function InventoryItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 p-4 border rounded-lg', className)}>
      <Skeleton variant="rounded" height={40} width={40} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" height={16} width="60%" />
        <Skeleton variant="text" height={12} width="40%" />
      </div>
      <div className="text-right space-y-2">
        <Skeleton variant="text" height={16} width={50} />
        <Skeleton variant="text" height={12} width={70} />
      </div>
    </div>
  );
}

export function FinanceRowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 p-4 border-b', className)}>
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" height={16} width="50%" />
        <Skeleton variant="text" height={12} width="30%" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton variant="text" height={18} width={80} />
        <Skeleton variant="rounded" height={28} width={28} />
      </div>
    </div>
  );
}

// ============================================================================
// LOADING WRAPPER COMPONENT
// ============================================================================

interface LoadingWrapperProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  error?: Error | null;
  fallback?: React.ReactNode;
}

export function LoadingWrapper({
  isLoading,
  skeleton,
  children,
  error,
  fallback,
}: LoadingWrapperProps) {
  if (error) {
    return <>{fallback}</>;
  }

  if (isLoading) {
    return <>{skeleton}</>;
  }

  return <>{children}</>;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default Skeleton;
