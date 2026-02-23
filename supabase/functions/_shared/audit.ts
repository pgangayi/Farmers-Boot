/**
 * ============================================================================
 * AUDIT LOGGING
 * ============================================================================
 * Audit logging utilities for tracking user actions
 * ============================================================================
 */

import { supabase } from './supabase-client.ts';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

// Log an audit event
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      user_id: entry.userId,
      action: entry.action,
      table_name: entry.tableName,
      record_id: entry.recordId,
      old_values: entry.oldValues,
      new_values: entry.newValues,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      metadata: entry.metadata,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging failures shouldn't break the main flow
  }
}

// Get audit logs for a record
export async function getAuditLogs(tableName: string, recordId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('table_name', tableName)
    .eq('record_id', recordId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get audit logs: ${error.message}`);
  }

  return data;
}

// Get audit logs for a user
export async function getUserAuditLogs(userId: string, limit: number = 50, offset: number = 0) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to get user audit logs: ${error.message}`);
  }

  return data;
}

// Create audit log helper for CRUD operations
export class AuditLogger {
  constructor(
    private userId?: string,
    private ipAddress?: string,
    private userAgent?: string
  ) {}

  async logCreate(
    tableName: string,
    recordId: string,
    newValues: Record<string, any>,
    metadata?: Record<string, any>
  ) {
    await logAuditEvent({
      userId: this.userId,
      action: 'CREATE',
      tableName,
      recordId,
      newValues,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      metadata,
    });
  }

  async logUpdate(
    tableName: string,
    recordId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    metadata?: Record<string, any>
  ) {
    await logAuditEvent({
      userId: this.userId,
      action: 'UPDATE',
      tableName,
      recordId,
      oldValues,
      newValues,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      metadata,
    });
  }

  async logDelete(
    tableName: string,
    recordId: string,
    oldValues: Record<string, any>,
    metadata?: Record<string, any>
  ) {
    await logAuditEvent({
      userId: this.userId,
      action: 'DELETE',
      tableName,
      recordId,
      oldValues,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      metadata,
    });
  }

  async logRead(tableName: string, recordId: string, metadata?: Record<string, any>) {
    await logAuditEvent({
      userId: this.userId,
      action: 'READ',
      tableName,
      recordId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      metadata,
    });
  }

  async logCustom(
    action: string,
    tableName: string,
    recordId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    metadata?: Record<string, any>
  ) {
    await logAuditEvent({
      userId: this.userId,
      action,
      tableName,
      recordId,
      oldValues,
      newValues,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      metadata,
    });
  }
}

// Create audit logger from request
export function createAuditLoggerFromRequest(req: Request, userId?: string): AuditLogger {
  return new AuditLogger(
    userId,
    req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      undefined,
    req.headers.get('user-agent') || undefined
  );
}

// Get changes between two objects
export function getChanges(
  oldValues: Record<string, any>,
  newValues: Record<string, any>
): { old: Record<string, any>; newValues: Record<string, any> } {
  const old: Record<string, any> = {};
  const newVals: Record<string, any> = {};

  for (const key in newValues) {
    if (oldValues[key] !== newValues[key]) {
      old[key] = oldValues[key];
      newVals[key] = newValues[key];
    }
  }

  return { old, newValues: newVals };
}
