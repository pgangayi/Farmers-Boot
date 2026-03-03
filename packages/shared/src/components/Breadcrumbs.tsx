/**
 * BREADCRUMBS COMPONENT
 * =====================
 * Navigation breadcrumbs with overflow handling
 */

import { forwardRef } from 'react';
import { cn } from './utils/classNames';
import type { BreadcrumbsProps, BreadcrumbItem } from './types';

export const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ items, separator = '/', maxItems = 4, onItemClick, className }, ref) => {
    const renderItem = (item: BreadcrumbItem, index: number, isLast: boolean) => {
      const isClickable = !!item.href || !!onItemClick;

      const content = (
        <>
          {item.icon && <span className="mr-1.5 flex-shrink-0">{item.icon}</span>}
          <span className={cn('truncate', isLast && 'font-medium')}>{item.label}</span>
        </>
      );

      if (isLast || !isClickable) {
        return (
          <span
            className={cn(
              'flex items-center',
              isLast ? 'text-[hsl(222.2,84%,4.9%)] cursor-default' : 'text-[hsl(215.4,16.3%,46.9%)]'
            )}
            aria-current={isLast ? 'page' : undefined}
          >
            {content}
          </span>
        );
      }

      if (item.href) {
        return (
          <a
            href={item.href}
            onClick={(e) => {
              if (onItemClick) {
                e.preventDefault();
                onItemClick(item, index);
              }
            }}
            className="flex items-center text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(142,76%,36%)] transition-colors"
          >
            {content}
          </a>
        );
      }

      return (
        <button
          onClick={() => onItemClick?.(item, index)}
          className="flex items-center text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(142,76%,36%)] transition-colors"
        >
          {content}
        </button>
      );
    };

    const renderSeparator = (key: string) => (
      <span
        key={key}
        className="mx-2 text-[hsl(215.4,16.3%,46.9%)] flex-shrink-0"
        aria-hidden="true"
      >
        {separator}
      </span>
    );

    const renderCollapsed = () => (
      <span className="text-[hsl(215.4,16.3%,46.9%)] px-1" key="collapsed">
        ...
      </span>
    );

    // Handle overflow
    let displayItems = items;

    if (items.length > maxItems) {
      const firstItems = items.slice(0, 1);
      const lastItems = items.slice(-(maxItems - 2));
      displayItems = [
        ...firstItems,
        { label: '...', active: false } as BreadcrumbItem,
        ...lastItems,
      ];
    }

    return (
      <nav ref={ref} aria-label="Breadcrumb" className={cn('flex items-center text-sm', className)}>
        <ol className="flex items-center flex-wrap">
          {displayItems.map((item, index) => {
            const isLast = index === displayItems.length - 1;

            if (item.label === '...') {
              return (
                <li key="collapsed" className="flex items-center">
                  {renderCollapsed()}
                  {renderSeparator('sep-collapsed')}
                </li>
              );
            }

            return (
              <li key={index} className="flex items-center">
                {renderItem(item, index, isLast)}
                {!isLast && renderSeparator(`sep-${index}`)}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
);

Breadcrumbs.displayName = 'Breadcrumbs';

export default Breadcrumbs;
