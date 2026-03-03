/**
 * SHARED UI COMPONENT TYPES
 * ==========================
 * Type definitions for the shared UI component library
 */

import type { ReactNode, RefObject } from 'react';

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | Record<string, boolean | undefined | null>
  | ClassValue[];

// ============================================================================
// DESIGN TOKEN TYPES
// ============================================================================

export type ColorVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'default';
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AnimationVariant = 'none' | 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'bounce';
export type ContentDensity = 'compact' | 'comfortable' | 'spacious';

// ============================================================================
// BUTTON TYPES
// ============================================================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ColorVariant | 'outline' | 'ghost' | 'link' | 'gradient' | 'glass';
  size?: SizeVariant;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  ripple?: boolean;
  animation?: 'none' | 'pulse' | 'bounce' | 'glow';
  fullWidth?: boolean;
}

// ============================================================================
// CARD TYPES
// ============================================================================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'gradient';
  interactive?: boolean;
  hover?: 'lift' | 'scale' | 'glow' | 'border' | 'none';
  animate?: AnimationVariant;
  delay?: number;
  padding?: SizeVariant | 'none';
}

export interface StatCardProps extends CardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: ColorVariant;
  loading?: boolean;
  animateValue?: boolean;
  onClick?: () => void;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface FormField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'tel'
    | 'url'
    | 'search'
    | 'textarea'
    | 'select'
    | 'multiselect'
    | 'checkbox'
    | 'radio'
    | 'switch'
    | 'date'
    | 'datetime'
    | 'time'
    | 'file'
    | 'color'
    | 'range';
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number;
  validation?: {
    required?: string;
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
    min?: { value: number; message: string };
    max?: { value: number; message: string };
    validate?: (value: any) => string | undefined;
  };
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  defaultValue?: any;
  floatingLabel?: boolean;
  autoComplete?: string;
}

export interface FormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  onChange?: (data: Record<string, any>, isValid: boolean) => void;
  initialData?: Record<string, any>;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isLoading?: boolean;
  layout?: 'vertical' | 'horizontal' | 'inline';
  spacing?: SizeVariant;
  validateOn?: 'change' | 'blur' | 'submit';
}

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  floatingLabel?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: 'default' | 'filled' | 'outlined' | 'underlined';
  inputSize?: SizeVariant;
  isLoading?: boolean;
}

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface TableColumn<T = any> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: T, index: number) => ReactNode;
  filterOptions?: Array<{ label: string; value: any }>;
  sticky?: boolean;
  hideOnMobile?: boolean;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyState?: ReactNode;
  rowKey?: keyof T | ((record: T) => string);
  onRowClick?: (record: T, index: number) => void;
  onRowSelect?: (selectedRows: T[]) => void;
  selectedRows?: T[];
  selectable?: boolean;
  stickyHeader?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  expandable?: {
    expandedRowRender: (record: T) => ReactNode;
    rowExpandable?: (record: T) => boolean;
  };
  rowActions?: Array<{
    key: string;
    icon?: ReactNode;
    label: string;
    onClick: (record: T) => void;
    disabled?: (record: T) => boolean;
    danger?: boolean;
  }>;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
    pageSizeOptions?: number[];
    showSizeChanger?: boolean;
    showTotal?: boolean;
  };
  sorting?: {
    field?: string;
    direction?: 'asc' | 'desc';
    onChange: (field: string, direction: 'asc' | 'desc') => void;
  };
  filtering?: {
    filters: Record<string, any>;
    onChange: (filters: Record<string, any>) => void;
  };
  density?: ContentDensity;
}

// ============================================================================
// MODAL TYPES
// ============================================================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: string;
  children: ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  footer?: ReactNode;
  isLoading?: boolean;
  animate?: boolean;
  className?: string;
}

// ============================================================================
// BOTTOM SHEET TYPES
// ============================================================================

export interface BottomSheetProps extends Omit<ModalProps, 'position' | 'size'> {
  snapPoints?: number[];
  initialSnap?: number;
  onSnapChange?: (snapIndex: number) => void;
  expandable?: boolean;
  showDragHandle?: boolean;
  preventScroll?: boolean;
}

// ============================================================================
// COMMAND PALETTE TYPES
// ============================================================================

export interface CommandPaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  shortcut?: string;
  keywords?: string[];
  section?: string;
  disabled?: boolean;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: CommandPaletteItem[];
  placeholder?: string;
  emptyText?: string;
  shortcut?: string;
  onSearch?: (query: string) => void;
  loading?: boolean;
}

// ============================================================================
// NOTIFICATION CENTER TYPES
// ============================================================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  icon?: ReactNode;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  timestamp: Date;
  read?: boolean;
}

export interface NotificationCenterProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onAction?: (id: string, actionKey: string) => void;
  maxVisible?: number;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
}

// ============================================================================
// VIRTUALIZED LIST TYPES
// ============================================================================

export interface VirtualizedListProps<T = any> {
  items: T[];
  renderItem: (item: T, index: number, style: React.CSSProperties) => ReactNode;
  itemHeight: number | ((item: T, index: number) => number);
  height: number | string;
  width?: number | string;
  overscan?: number;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  onScroll?: (scrollTop: number) => void;
  emptyState?: ReactNode;
  loading?: boolean;
  loadingMore?: boolean;
  keyExtractor: (item: T, index: number) => string;
}

// ============================================================================
// BREADCRUMB TYPES
// ============================================================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
  active?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  maxItems?: number;
  onItemClick?: (item: BreadcrumbItem, index: number) => void;
  className?: string;
}

// ============================================================================
// PAGE HEADER TYPES
// ============================================================================

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  backButton?: boolean;
  onBack?: () => void;
  sticky?: boolean;
  className?: string;
}

// ============================================================================
// CONTENT DENSITY TYPES
// ============================================================================

export interface ContentDensityContextType {
  density: ContentDensity;
  setDensity: (density: ContentDensity) => void;
}

// ============================================================================
// EMPTY STATE TYPES
// ============================================================================

export type EmptyStateVariant =
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

export interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  description?: string;
  icon?: ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
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
// TOAST TYPES
// ============================================================================

export interface ToastProps {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss: (id: string) => void;
  position?: NotificationCenterProps['position'];
}

// ============================================================================
// SKELETON TYPES
// ============================================================================

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
  className?: string;
}

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface UseFocusTrapOptions {
  enabled?: boolean;
  initialFocus?: boolean;
  returnFocus?: boolean;
  escapeDeactivates?: boolean;
  clickOutsideDeactivates?: boolean;
}

export interface UseFocusTrapResult {
  ref: RefObject<HTMLElement>;
  active: boolean;
  activate: () => void;
  deactivate: () => void;
}

export interface UseSwipeOptions {
  threshold?: number;
  timeout?: number;
  preventDefault?: boolean;
}

export interface UseSwipeResult {
  ref: RefObject<HTMLElement>;
  swipeDirection: 'left' | 'right' | 'up' | 'down' | null;
  swipeProgress: number;
}

export interface ScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
}

export interface ScrollAnimationResult {
  ref: RefObject<HTMLElement>;
  isInView: boolean;
  hasAnimated: boolean;
}
