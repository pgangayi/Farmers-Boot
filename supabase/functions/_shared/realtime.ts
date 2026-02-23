/**
 * ============================================================================
 * REALTIME UTILITIES
 * ============================================================================
 * Realtime utilities for Supabase Realtime
 * ============================================================================
 */

import { supabase } from './supabase-client.ts';

export interface RealtimeChannelConfig {
  table: string;
  filter?: string;
  schema?: string;
}

export interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  oldRecord?: any;
}

// Subscribe to table changes
export function subscribeToTable(
  config: RealtimeChannelConfig,
  callback: (event: RealtimeEvent) => void
) {
  const channel = supabase
    .channel(`table-changes-${config.table}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: config.schema || 'public',
        table: config.table,
        filter: config.filter,
      },
      (payload) => {
        callback({
          type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          table: config.table,
          record: payload.new,
          oldRecord: payload.old,
        });
      }
    )
    .subscribe();

  return channel;
}

// Broadcast a message to all clients
export async function broadcastMessage(
  channel: string,
  event: string,
  payload: any
): Promise<void> {
  const { error } = await supabase.channel(channel).send({
    type: 'broadcast',
    event,
    payload,
  });

  if (error) {
    throw new Error(`Failed to broadcast message: ${error.message}`);
  }
}

// Listen for broadcast messages
export function listenToBroadcast(
  channel: string,
  event: string,
  callback: (payload: any) => void
) {
  const subscription = supabase.channel(channel).on('broadcast', { event }, callback).subscribe();

  return subscription;
}

// Unsubscribe from a channel
export function unsubscribe(channel: any): void {
  supabase.removeChannel(channel);
}

// Create a presence channel
export function createPresenceChannel(channelName: string) {
  return supabase.channel(channelName, {
    config: {
      presence: {
        key: crypto.randomUUID(),
      },
    },
  });
}

// Track presence
export async function trackPresence(channel: any, state: Record<string, any>): Promise<void> {
  const { error } = await channel.track(state);

  if (error) {
    throw new Error(`Failed to track presence: ${error.message}`);
  }
}

// Get presence state
export function getPresenceState(channel: any): Record<string, any> {
  return channel.presenceState();
}

// Listen to presence events
export function listenToPresence(
  channel: any,
  event: 'join' | 'leave' | 'sync',
  callback: (state: any) => void
) {
  channel.on('presence', { event }, callback);
}

// Common realtime channels
export const REALTIME_CHANNELS = {
  TASKS: 'tasks',
  NOTIFICATIONS: 'notifications',
  WEATHER: 'weather',
  CHAT: 'chat',
  COLLABORATION: 'collaboration',
} as const;

// Common realtime events
export const REALTIME_EVENTS = {
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_DELETED: 'task.deleted',
  NOTIFICATION_SENT: 'notification.sent',
  WEATHER_UPDATED: 'weather.updated',
  USER_JOINED: 'user.joined',
  USER_LEFT: 'user.left',
} as const;

// Notify users of task changes
export async function notifyTaskChange(farmId: string, event: string, task: any): Promise<void> {
  await broadcastMessage(`${REALTIME_CHANNELS.TASKS}:${farmId}`, event, {
    task,
    timestamp: new Date().toISOString(),
  });
}

// Send notification to user
export async function sendNotification(userId: string, notification: any): Promise<void> {
  await broadcastMessage(
    `${REALTIME_CHANNELS.NOTIFICATIONS}:${userId}`,
    REALTIME_EVENTS.NOTIFICATION_SENT,
    { notification, timestamp: new Date().toISOString() }
  );
}

// Broadcast weather update
export async function broadcastWeatherUpdate(locationId: string, weatherData: any): Promise<void> {
  await broadcastMessage(
    `${REALTIME_CHANNELS.WEATHER}:${locationId}`,
    REALTIME_EVENTS.WEATHER_UPDATED,
    { weather: weatherData, timestamp: new Date().toISOString() }
  );
}
