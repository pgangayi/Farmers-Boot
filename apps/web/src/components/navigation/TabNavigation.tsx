/**
 * TAB NAVIGATION COMPONENT
 * =========================
 * Reusable tab navigation for page sections.
 * Used across dashboard, livestock, crops, and other pages.
 */

import React from 'react';
import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
  badge?: string;
  disabled?: boolean;
}

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline' | 'mobile';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TabNavigation({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  className,
  size = 'md',
}: TabNavigationProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const variants = {
    default: {
      container: 'flex gap-1 p-1 bg-gray-100/80 rounded-lg',
      tab: (isActive: boolean) =>
        cn(
          'flex items-center gap-2 rounded-md font-medium transition-all',
          sizeClasses[size],
          isActive
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
        ),
    },
    pills: {
      container: 'flex gap-2',
      tab: (isActive: boolean) =>
        cn(
          'flex items-center gap-2 rounded-full font-medium transition-all border',
          sizeClasses[size],
          isActive
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent'
        ),
    },
    underline: {
      container: 'flex gap-1 border-b border-gray-200',
      tab: (isActive: boolean) =>
        cn(
          'flex items-center gap-2 font-medium transition-all border-b-2 -mb-px',
          sizeClasses[size],
          isActive
            ? 'border-green-500 text-green-600'
            : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
        ),
    },
    mobile: {
      container: 'flex flex-col gap-1',
      tab: (isActive: boolean) =>
        cn(
          'flex items-center justify-between w-full px-4 py-3 rounded-lg font-medium transition-all',
          isActive ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'
        ),
    },
  };

  const currentVariant = variants[variant];

  return (
    <div className={cn(currentVariant.container, className)} role="tablist">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-disabled={tab.disabled}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              currentVariant.tab(isActive),
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4" />}
              <span>{tab.label}</span>
            </span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  'px-2 py-0.5 text-xs rounded-full',
                  isActive ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-600'
                )}
              >
                {tab.count > 99 ? '99+' : tab.count}
              </span>
            )}
            {tab.badge && (
              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// MOBILE BOTTOM NAVIGATION
// ============================================================================

interface MobileBottomNavProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function MobileBottomNav({ tabs, activeTab, onChange, className }: MobileBottomNavProps) {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50',
        className
      )}
    >
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        {tabs.slice(0, 5).map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all',
                isActive ? 'bg-green-50 text-green-600' : 'text-gray-600'
              )}
            >
              <div className="relative">
                {Icon && <Icon className="h-5 w-5" />}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {tab.count > 9 ? '9+' : tab.count}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium mt-1 truncate max-w-[60px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ============================================================================
// SECTION TABS (Content Switcher)
// ============================================================================

interface SectionTabsProps<T extends string> {
  tabs: { id: T; label: string; content: React.ReactNode }[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
}

export function SectionTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className,
}: SectionTabsProps<T>) {
  const activeContent = tabs.find(t => t.id === activeTab)?.content;

  return (
    <div className={className}>
      <TabNavigation
        tabs={tabs.map(t => ({ id: t.id, label: t.label }))}
        activeTab={activeTab}
        onChange={id => onChange(id as T)}
        variant="underline"
        className="mb-6"
      />
      <div className="animate-fade-in">{activeContent}</div>
    </div>
  );
}

export default TabNavigation;
