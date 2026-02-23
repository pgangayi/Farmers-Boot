/**
 * ============================================================================
 * SUPABASE REALTIME HOOKS
 * ============================================================================
 * React hooks for Supabase Realtime subscriptions
 * ============================================================================
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface UseRealtimeSubscriptionOptions {
  table: string;
  filter?: string;
  schema?: string;
  enabled?: boolean;
}

export interface RealtimeSubscriptionState<T = any> {
  data: T[];
  error: string | null;
  isConnected: boolean;
  isLoading: boolean;
}

export function useRealtimeSubscription<T extends { id?: string | number } = any>(
  options: UseRealtimeSubscriptionOptions
): RealtimeSubscriptionState<T> & {
  unsubscribe: () => void;
  subscribe: () => void;
} {
  const [state, setState] = useState<RealtimeSubscriptionState<T>>({
    data: [],
    error: null,
    isConnected: false,
    isLoading: true,
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const { table, filter, schema = 'public', enabled = true } = options;

  const subscribe = () => {
    if (!enabled || channelRef.current) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const channelName = `realtime-${table}-${filter || 'all'}`;

    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema,
          table,
          filter,
        },
        (payload: RealtimePostgresChangesPayload<T>) => {
          setState(prev => {
            const newData = [...prev.data];

            switch (payload.eventType) {
              case 'INSERT':
                newData.push(payload.new as T);
                break;
              case 'UPDATE':
                const index = newData.findIndex(
                  item => (item as any).id === (payload.new as any).id
                );
                if (index >= 0) {
                  newData[index] = payload.new as T;
                }
                break;
              case 'DELETE':
                const deleteIndex = newData.findIndex(
                  item => (item as any).id === (payload.old as any).id
                );
                if (deleteIndex >= 0) {
                  newData.splice(deleteIndex, 1);
                }
                break;
            }

            return {
              ...prev,
              data: newData,
              isLoading: false,
              isConnected: true,
            };
          });
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          setState(prev => ({
            ...prev,
            isConnected: true,
            isLoading: false,
          }));
        } else if (status === 'CHANNEL_ERROR') {
          setState(prev => ({
            ...prev,
            error: 'Failed to connect to realtime',
            isConnected: false,
            isLoading: false,
          }));
        }
      });
  };

  const unsubscribe = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setState(prev => ({
        ...prev,
        isConnected: false,
        data: [],
      }));
    }
  };

  useEffect(() => {
    if (enabled) {
      subscribe();
    }

    return () => {
      unsubscribe();
    };
  }, [enabled, table, filter, schema]);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}

// Specific hooks for common tables
export function useTasksRealtime(farmId?: string) {
  const filter = farmId ? `farm_id=eq.${farmId}` : undefined;
  return useRealtimeSubscription({
    table: 'tasks',
    filter,
    enabled: !!farmId,
  });
}

export function useNotificationsRealtime(userId?: string) {
  const filter = userId ? `user_id=eq.${userId}` : undefined;
  return useRealtimeSubscription({
    table: 'notifications',
    filter,
    enabled: !!userId,
  });
}

export function useWeatherRealtime(locationId?: string) {
  const filter = locationId ? `location_id=eq.${locationId}` : undefined;
  return useRealtimeSubscription({
    table: 'weather_data',
    filter,
    enabled: !!locationId,
  });
}

export function useLivestockRealtime(farmId?: string) {
  const filter = farmId ? `farm_id=eq.${farmId}` : undefined;
  return useRealtimeSubscription({
    table: 'livestock',
    filter,
    enabled: !!farmId,
  });
}

// Broadcast channel hooks
export function useBroadcastChannel(channel: string, event: string) {
  const [message, setMessage] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const subscription = supabase
      .channel(channel)
      .on('broadcast', { event }, payload => {
        setMessage(payload.payload);
      })
      .subscribe(status => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channel, event]);

  const broadcast = async (payload: any) => {
    const response = await supabase.channel(channel).send({
      type: 'broadcast',
      event,
      payload,
    });

    if (response !== 'ok') {
      throw new Error(`Failed to broadcast: ${JSON.stringify(response)}`);
    }
  };

  return { message, isConnected, broadcast };
}

// Presence channel hooks
export function usePresenceChannel(channel: string, userState?: any) {
  const [presence, setPresence] = useState<Record<string, any>>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channelInstance = supabase.channel(channel, {
      config: {
        presence: {
          key: userState?.id || crypto.randomUUID(),
        },
      },
    });

    channelInstance.on('presence', { event: 'sync' }, () => {
      setPresence(channelInstance.presenceState());
      setIsConnected(true);
    });

    channelInstance.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      setPresence(prev => ({
        ...prev,
        [key]: newPresences,
      }));
    });

    channelInstance.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      setPresence(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    });

    channelInstance.subscribe(status => {
      setIsConnected(status === 'SUBSCRIBED');
    });

    if (userState) {
      channelInstance.track(userState);
    }

    return () => {
      supabase.removeChannel(channelInstance);
    };
  }, [channel, userState]);

  const track = async (state: any) => {
    const channelInstance = supabase.channel(channel);
    const result = await channelInstance.track(state);
    if (result !== 'ok') {
      throw new Error(`Failed to track presence: ${JSON.stringify(result)}`);
    }
  };

  return { presence, isConnected, track };
}
