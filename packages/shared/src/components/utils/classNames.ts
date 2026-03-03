/**
 * CLASSNAME UTILITIES
 * ===================
 * Utility functions for conditional class name joining
 */

import type { ClassValue } from '../types';

/**
 * Conditionally joins class names together
 */
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat()
    .filter(Boolean)
    .map((input) => {
      if (typeof input === 'string') return input;
      if (typeof input === 'object' && input !== null) {
        return Object.entries(input)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key)
          .join(' ');
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

/**
 * Creates a BEM-style class name generator
 */
export function createBem(block: string) {
  return {
    block: block,
    element: (element: string) => `${block}__${element}`,
    modifier: (modifier: string) => `${block}--${modifier}`,
    em: (element: string, modifier: string) => `${block}__${element}--${modifier}`,
  };
}

/**
 * Merges Tailwind classes, handling conflicts
 */
export function twMerge(...classes: string[]): string {
  // Simple implementation - in production, use tailwind-merge library
  const classMap = new Map<string, string>();

  for (const cls of classes.join(' ').split(' ')) {
    if (!cls) continue;

    // Extract the prefix (e.g., 'px-', 'text-', 'bg-')
    const prefix = cls.split('-').slice(0, 2).join('-');

    // Handle conflicting classes
    if (prefix) {
      classMap.set(prefix, cls);
    } else {
      classMap.set(cls, cls);
    }
  }

  return Array.from(classMap.values()).join(' ');
}

/**
 * Combines cn and twMerge for optimal class handling
 */
export function cx(...inputs: ClassValue[]): string {
  return twMerge(cn(...inputs));
}

/**
 * Conditionally applies a class based on a condition
 */
export function when(condition: boolean, className: string, elseClassName = ''): string {
  return condition ? className : elseClassName;
}

/**
 * Creates a variant-based class name generator
 */
export function createVariants<T extends Record<string, Record<string, string>>>(
  base: string,
  variants: T
) {
  type VariantKey = keyof T;
  type VariantValue<K extends VariantKey> = keyof T[K];

  return <K extends VariantKey>(
    selectedVariants: { [P in K]?: VariantValue<P> },
    additionalClasses?: string
  ): string => {
    const classes = [base];

    for (const [variantKey, variantValue] of Object.entries(selectedVariants)) {
      if (variantValue && variants[variantKey]?.[variantValue as string]) {
        classes.push(variants[variantKey][variantValue as string]);
      }
    }

    if (additionalClasses) {
      classes.push(additionalClasses);
    }

    return classes.join(' ');
  };
}
