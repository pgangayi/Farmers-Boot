import { useState, useCallback, useTransition, useDeferredValue, useRef } from 'react';

/**
 * Optimistic Data Hook
 * ====================
 * Polyfill for React 18.3+ useOptimistic hook with concurrent features:
 * - Optimistic updates: Show updated UI before server confirms
 * - useTransition: Mark updates as non-urgent
 * - useDeferredValue: Defer expensive re-renders
 */

export interface UseOptimisticDataOptions<T> {
  onUpdate: (data: T) => Promise<T>;
  rollbackOnError?: boolean;
}

// Custom useOptimistic polyfill for React < 18.3
function useOptimisticPolyfill<T, A = T>(
  passthrough: T,
  reducer?: (currentState: T, action: A) => T
): [T, (action: A) => void] {
  const [optimisticState, setOptimisticState] = useState<T>(passthrough);
  const passthroughRef = useRef(passthrough);
  
  // Sync with passthrough when not in optimistic mode
  if (passthroughRef.current !== passthrough && optimisticState === passthroughRef.current) {
    setOptimisticState(passthrough);
  }
  passthroughRef.current = passthrough;
  
  const addOptimistic = useCallback((action: A) => {
    if (reducer) {
      setOptimisticState(prev => reducer(prev, action));
    } else {
      setOptimisticState(action as unknown as T);
    }
  }, [reducer]);
  
  return [optimisticState, addOptimistic];
}

export function useOptimisticData<T>(
  initialData: T,
  options: UseOptimisticDataOptions<T>
) {
  const [data, setData] = useState<T>(initialData);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, startTransition] = useTransition();
  
  // Optimistic state - shows immediately while server processes
  const [optimisticData, setOptimisticData] = useOptimisticPolyfill<T, T>(
    data,
    (currentState: T, newValue: T) => newValue
  );

  // Deferred value for expensive computations
  const deferredData = useDeferredValue(optimisticData);

  const updateData = useCallback(
    async (updater: (current: T) => T) => {
      const previousData = data;
      const newData = updater(data);
      
      // Show optimistic update immediately
      setOptimisticData(newData);
      
      // Execute async update
      try {
        setError(null);
        const confirmedData = await options.onUpdate(newData);
        
        // Use transition for state update
        startTransition(() => {
          setData(confirmedData);
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Update failed'));
        if (options.rollbackOnError !== false) {
          setOptimisticData(previousData);
        }
        throw err;
      }
    },
    [data, options, setOptimisticData, startTransition]
  );

  const reset = useCallback(() => {
    setData(initialData);
    setOptimisticData(initialData);
    setError(null);
  }, [initialData, setOptimisticData]);

  return {
    // Current data (optimistic during transition)
    data: optimisticData,
    // Deferred for expensive renders
    deferredData,
    // Original confirmed data
    confirmedData: data,
    // Status
    isPending,
    isStale: deferredData !== optimisticData,
    error,
    // Actions
    updateData,
    reset,
  };
}

/**
 * Hook for list operations with optimistic updates
 */
interface ListItem {
  id: string;
}

export function useOptimisticList<T extends ListItem>(
  initialItems: T[],
  options: {
    onAdd?: (item: Omit<T, 'id'>) => Promise<T>;
    onUpdate?: (item: T) => Promise<T>;
    onDelete?: (id: string) => Promise<void>;
  }
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  type ListAction = { type: 'add' | 'update' | 'delete'; item?: T; id?: string; tempId?: string };
  
  const [optimisticItems, setOptimisticItems] = useOptimisticPolyfill<T[], ListAction>(
    items,
    (current: T[], action: ListAction) => {
      switch (action.type) {
        case 'add':
          if (action.item) return [...current, action.item];
          return current;
        case 'update':
          if (action.item) {
            return current.map(item => (item.id === action.item!.id ? action.item! : item));
          }
          return current;
        case 'delete':
          if (action.id) return current.filter(item => item.id !== action.id);
          return current;
        default:
          return current;
      }
    }
  );

  const addItem = useCallback(
    async (newItem: Omit<T, 'id'>) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticItem = { ...newItem, id: tempId } as T;
      
      setOptimisticItems({ type: 'add', item: optimisticItem, tempId });
      
      if (!options.onAdd) return;
      
      try {
        const confirmedItem = await options.onAdd(newItem);
        startTransition(() => {
          setItems(prev => prev.map(item => 
            item.id === tempId ? confirmedItem : item
          ));
        });
      } catch (error) {
        // Rollback on error
        startTransition(() => {
          setItems(prev => prev.filter(item => item.id !== tempId));
        });
        throw error;
      }
    },
    [options, setOptimisticItems, startTransition]
  );

  const updateItem = useCallback(
    async (updatedItem: T) => {
      const previousItem = items.find(i => i.id === updatedItem.id);
      
      setOptimisticItems({ type: 'update', item: updatedItem });
      
      if (!options.onUpdate) return;
      
      try {
        const confirmedItem = await options.onUpdate(updatedItem);
        startTransition(() => {
          setItems(prev => prev.map(item => 
            item.id === confirmedItem.id ? confirmedItem : item
          ));
        });
      } catch (error) {
        // Rollback on error
        if (previousItem) {
          setOptimisticItems({ type: 'update', item: previousItem });
        }
        throw error;
      }
    },
    [items, options, setOptimisticItems, startTransition]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const itemToDelete = items.find(i => i.id === id);
      
      setOptimisticItems({ type: 'delete', id });
      
      if (!options.onDelete) return;
      
      try {
        await options.onDelete(id);
        startTransition(() => {
          setItems(prev => prev.filter(item => item.id !== id));
        });
      } catch (error) {
        // Rollback on error
        if (itemToDelete) {
          setOptimisticItems({ type: 'add', item: itemToDelete });
        }
        throw error;
      }
    },
    [items, options, setOptimisticItems, startTransition]
  );

  return {
    items: optimisticItems,
    confirmedItems: items,
    isPending,
    addItem,
    updateItem,
    deleteItem,
  };
}

export default useOptimisticData;
