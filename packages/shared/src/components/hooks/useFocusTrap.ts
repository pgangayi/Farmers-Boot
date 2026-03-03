/**
 * FOCUS TRAP HOOK
 * ===============
 * Traps focus within a container for accessibility (modals, dialogs, etc.)
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { UseFocusTrapOptions, UseFocusTrapResult } from '../types';

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  'details>summary:first-of-type',
].join(', ');

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  options: UseFocusTrapOptions = {}
): UseFocusTrapResult & { ref: React.RefObject<T> } {
  const {
    enabled = true,
    initialFocus = true,
    returnFocus = true,
    escapeDeactivates = true,
    clickOutsideDeactivates = false,
  } = options;

  const ref = useRef<T>(null);
  const previousActiveElement = useRef<Element | null>(null);
  const [active, setActive] = useState(false);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    const container = ref.current;
    if (!container) return [];

    return Array.from(container.querySelectorAll(FOCUSABLE_ELEMENTS)).filter(
      (el): el is HTMLElement => {
        return (
          el instanceof HTMLElement &&
          el.tabIndex >= 0 &&
          !el.hasAttribute('disabled') &&
          !el.hasAttribute('aria-hidden') &&
          !el.hidden &&
          getComputedStyle(el).display !== 'none' &&
          getComputedStyle(el).visibility !== 'hidden'
        );
      }
    );
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !active) return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Handle Tab key
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }

      // Handle Escape key
      if (event.key === 'Escape' && escapeDeactivates) {
        deactivate();
      }
    },
    [enabled, active, getFocusableElements, escapeDeactivates]
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (!enabled || !active || !clickOutsideDeactivates) return;

      const container = ref.current;
      if (container && !container.contains(event.target as Node)) {
        deactivate();
      }
    },
    [enabled, active, clickOutsideDeactivates]
  );

  const activate = useCallback(() => {
    if (!enabled) return;

    previousActiveElement.current = document.activeElement;
    setActive(true);

    // Focus the first focusable element
    if (initialFocus) {
      setTimeout(() => {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }, 0);
    }
  }, [enabled, initialFocus, getFocusableElements]);

  const deactivate = useCallback(() => {
    setActive(false);

    // Return focus to the previously focused element
    if (returnFocus && previousActiveElement.current instanceof HTMLElement) {
      previousActiveElement.current.focus();
    }
  }, [returnFocus]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [enabled, handleKeyDown, handleClickOutside]);

  // Auto-activate when enabled changes to true
  useEffect(() => {
    if (enabled) {
      activate();
    } else {
      deactivate();
    }
  }, [enabled, activate, deactivate]);

  return { ref, active, activate, deactivate };
}
