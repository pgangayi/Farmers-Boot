/**
 * CONTENT DENSITY
 * ===============
 * Context for managing content density preferences
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { cn } from './utils/classNames';
import type { ContentDensity, ContentDensityContextType } from './types';

const ContentDensityContext = createContext<ContentDensityContextType | null>(null);

const STORAGE_KEY = 'fb-content-density';

export function ContentDensityProvider({
  children,
  defaultDensity = 'comfortable',
}: {
  children: React.ReactNode;
  defaultDensity?: ContentDensity;
}) {
  const [density, setDensityState] = useState<ContentDensity>(() => {
    if (typeof window === 'undefined') return defaultDensity;
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as ContentDensity) || defaultDensity;
  });

  const setDensity = useCallback((newDensity: ContentDensity) => {
    setDensityState(newDensity);
    localStorage.setItem(STORAGE_KEY, newDensity);
  }, []);

  return (
    <ContentDensityContext.Provider value={{ density, setDensity }}>
      <div data-density={density} className="contents">
        {children}
      </div>
    </ContentDensityContext.Provider>
  );
}

export function useContentDensity(): ContentDensityContextType {
  const context = useContext(ContentDensityContext);
  if (!context) {
    throw new Error('useContentDensity must be used within ContentDensityProvider');
  }
  return context;
}

// Density toggle component
export function DensityToggle({ className }: { className?: string }) {
  const { density, setDensity } = useContentDensity();

  const densities: { value: ContentDensity; label: string; icon: string }[] = [
    { value: 'compact', label: 'Compact', icon: '⊡' },
    { value: 'comfortable', label: 'Comfortable', icon: '⊞' },
    { value: 'spacious', label: 'Spacious', icon: '⊟' },
  ];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 p-1 bg-[hsl(210,40%,96%)] rounded-lg',
        className
      )}
    >
      {densities.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => setDensity(value)}
          title={label}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            density === value
              ? 'bg-white text-[hsl(142,76%,36%)] shadow-sm'
              : 'text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(222.2,84%,4.9%)]'
          )}
          aria-pressed={density === value}
        >
          <span className="mr-1.5" aria-hidden="true">
            {icon}
          </span>
          {label}
        </button>
      ))}
    </div>
  );
}

// CSS utility to apply density-based styles
export function getDensityClasses(density: ContentDensity): string {
  const classes = {
    compact: 'space-y-2 p-2 text-sm',
    comfortable: 'space-y-4 p-4 text-sm',
    spacious: 'space-y-6 p-6 text-base',
  };
  return classes[density];
}

export { cn };
