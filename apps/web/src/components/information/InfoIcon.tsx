/**
 * INFO ICON COMPONENT
 * ==================
 * Contextual information icon that triggers help content
 */

import React, { useState, useEffect } from 'react';
import { Info, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { InfoIconProps, InfoIconState } from '../../types/information';

export function InfoIcon({
  contextKey,
  pagePath,
  componentName,
  position = { x: 'right', y: 'top' },
  size = 'md',
  className = '',
  tooltip = 'Learn more',
}: InfoIconProps) {
  const [state, setState] = useState<InfoIconState>({
    isAvailable: false,
    isLoading: true,
    hasViewed: false,
    tooltip,
  });

  // Size configurations
  const sizeConfig = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-sm',
    lg: 'w-6 h-6 text-base',
  };

  // Position classes
  const getPositionClasses = () => {
    const { x, y } = position;
    const xClass =
      x === 'left' ? '-left-6' : x === 'right' ? '-right-6' : '-left-1/2 translate-x-1/2';
    const yClass =
      y === 'top' ? '-top-6' : y === 'bottom' ? '-bottom-6' : '-top-1/2 -translate-y-1/2';
    return `${xClass} ${yClass}`;
  };

  // Check if information is available for this context
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        // This will be connected to the information hook
        // For now, simulate availability check
        setState(prev => ({
          ...prev,
          isLoading: false,
          isAvailable: true, // Will be determined by API call
        }));
      } catch (error) {
        console.error('Error checking info availability:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          isAvailable: false,
        }));
      }
    };

    checkAvailability();
  }, [contextKey, pagePath, componentName]);

  const handleClick = () => {
    if (!state.isAvailable || state.isLoading) return;

    // Trigger the info modal
    const event = new CustomEvent('openInfoModal', {
      detail: {
        contextKey,
        pagePath,
        componentName,
        position,
      },
    });
    window.dispatchEvent(event);

    // Mark as viewed
    setState(prev => ({ ...prev, hasViewed: true }));
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  if (state.isLoading) {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-gray-100 animate-pulse',
          sizeConfig[size],
          className
        )}
      >
        <Loader2 className="w-3 h-3 animate-spin" />
      </div>
    );
  }

  if (!state.isAvailable) {
    return null; // Don't show icon if no info available
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-full',
          'transition-all duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',

          // Color based on state
          state.hasViewed
            ? 'bg-gray-200 text-gray-500 hover:bg-gray-300'
            : 'bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700',

          // Size
          sizeConfig[size],

          // Custom classes
          className
        )}
        aria-label={tooltip}
        title={tooltip}
        data-context-key={contextKey}
        data-page-path={pagePath}
        data-component={componentName}
      >
        {state.hasViewed ? (
          <CheckCircle className="w-full h-full" />
        ) : (
          <Info className="w-full h-full" />
        )}
      </button>

      {/* Tooltip */}
      <div
        className={cn(
          'absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg',
          'opacity-0 pointer-events-none transition-opacity duration-200',
          'whitespace-nowrap',
          getPositionClasses()
        )}
        role="tooltip"
      >
        {tooltip}
        {/* Arrow */}
        <div
          className={cn(
            'absolute w-2 h-2 bg-gray-900 transform rotate-45',
            position.y === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2' : '',
            position.y === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2' : '',
            position.x === 'left' ? '-right-1 top-1/2 -translate-y-1/2' : '',
            position.x === 'right' ? '-left-1 top-1/2 -translate-y-1/2' : ''
          )}
        />
      </div>

      {/* Hover effect for tooltip */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        button:hover + div[role='tooltip'] {
          opacity: 1;
          pointer-events: auto;
        }
      `,
        }}
      />
    </div>
  );
}

// Default export for easier importing
export default InfoIcon;
