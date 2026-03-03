/**
 * TASK CARD COMPONENT
 * ===================
 * Reusable card component for displaying task information.
 * Used across dashboard, tasks page, and other views.
 */

import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Task } from '../../api';

// ============================================================================
// TYPES
// ============================================================================

interface TaskCardProps {
  task: Task;
  onViewDetails?: (task: Task) => void;
  onAction?: (task: Task) => void;
  className?: string;
  variant?: 'default' | 'compact';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'No date';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleDateString();
}

function isOverdue(dueDate: string | null | undefined, status: string): boolean {
  if (!dueDate || status === 'completed') return false;
  const date = new Date(dueDate);
  return date < new Date();
}

function getStatusBadgeClasses(status: string): string {
  const classes: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}

function getPriorityBadgeClasses(priority: string): string {
  const classes: Record<string, string> = {
    urgent: 'text-red-600',
    high: 'text-orange-600',
    normal: 'text-blue-600',
    low: 'text-gray-600',
  };
  return classes[priority] || 'text-gray-600';
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TaskCard({
  task,
  onViewDetails,
  onAction,
  className,
  variant = 'default',
}: TaskCardProps) {
  const overdue = isOverdue(task.due_date, task.status);

  const priorityConfig = {
    urgent: { bg: 'bg-red-50', icon: 'text-red-600' },
    high: { bg: 'bg-orange-50', icon: 'text-orange-600' },
    normal: { bg: 'bg-blue-50', icon: 'text-blue-600' },
    low: { bg: 'bg-gray-50', icon: 'text-gray-600' },
  };

  const priority =
    priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.normal;

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100',
          'hover:shadow-md transition-shadow cursor-pointer',
          className
        )}
        onClick={() => onViewDetails?.(task)}
      >
        <div className={cn('p-2 rounded-lg', priority.bg)}>
          <Calendar className={cn('h-4 w-4', priority.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate">{task.title}</p>
          <p className={cn('text-xs', overdue ? 'text-red-600' : 'text-gray-500')}>
            {overdue ? 'Overdue: ' : 'Due: '}
            {formatDate(task.due_date)}
          </p>
        </div>
        <span
          className={cn(
            'px-2 py-0.5 text-xs font-medium rounded-full',
            getStatusBadgeClasses(task.status)
          )}
        >
          {formatStatus(task.status)}
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
          <div className={cn('p-2 rounded-lg', priority.bg)}>
            <Calendar className={cn('h-4 w-4', priority.icon)} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{task.title}</h4>
            <p className="text-xs text-gray-600">{task.task_type}</p>
          </div>
        </div>
        <span
          className={cn(
            'px-2 py-1 text-xs font-medium rounded-full',
            getStatusBadgeClasses(task.status)
          )}
        >
          {formatStatus(task.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
        <div>
          <span className="text-gray-500">Due:</span>
          <p className={cn('font-medium', overdue ? 'text-red-600' : 'text-gray-900')}>
            {formatDate(task.due_date)}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Priority:</span>
          <p className={cn('font-medium', getPriorityBadgeClasses(task.priority))}>
            {formatStatus(task.priority)}
          </p>
        </div>
      </div>

      {(onViewDetails || onAction) && (
        <div className="flex gap-2 mt-4">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(task)}
              className="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              View Details
            </button>
          )}
          {onAction && (
            <button
              onClick={() => onAction(task)}
              className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Clock className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TASK LIST COMPONENT
// ============================================================================

interface TaskListProps {
  tasks: Task[];
  onViewDetails?: (task: Task) => void;
  onAction?: (task: Task) => void;
  emptyState?: React.ReactNode;
  className?: string;
  itemClassName?: string;
}

export function TaskList({
  tasks,
  onViewDetails,
  onAction,
  emptyState,
  className,
  itemClassName,
}: TaskListProps) {
  if (tasks.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onViewDetails={onViewDetails}
          onAction={onAction}
          className={itemClassName}
        />
      ))}
    </div>
  );
}

export default TaskCard;
