/**
 * ============================================================================
 * LOGGER
 * ============================================================================
 * Logging utilities for Supabase Edge Functions
 * ============================================================================
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private requestId?: string;
  private userId?: string;

  setRequestId(requestId: string) {
    this.requestId = requestId;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      userId: this.userId,
      context,
      error,
    };

    // Log to console with appropriate level
    const logMessage = `[${entry.timestamp}] [${entry.level}] [${entry.requestId || 'no-req-id'}] ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, context || '', error || '');
        break;
      case LogLevel.INFO:
        console.info(logMessage, context || '', error || '');
        break;
      case LogLevel.WARN:
        console.warn(logMessage, context || '', error || '');
        break;
      case LogLevel.ERROR:
        console.error(logMessage, context || '', error || '');
        break;
    }

    // Store in database for audit trail (async, don't await)
    this.storeLogEntry(entry).catch((err) => {
      console.error('Failed to store log entry:', err);
    });
  }

  private async storeLogEntry(entry: LogEntry) {
    try {
      // Import here to avoid circular dependency
      const { supabase } = await import('./supabase-client.ts');

      await supabase.from('logs').insert({
        level: entry.level,
        message: entry.message,
        request_id: entry.requestId,
        user_id: entry.userId,
        context: entry.context,
        error: entry.error
          ? {
              name: entry.error.name,
              message: entry.error.message,
              stack: entry.error.stack,
            }
          : null,
        created_at: entry.timestamp,
      });
    } catch (error) {
      // Silently fail to avoid infinite loops
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context, error);
  }
}

// Singleton instance
export const logger = new Logger();

// Request-scoped logger factory
export function createRequestLogger(requestId: string, userId?: string): Logger {
  const requestLogger = new Logger();
  requestLogger.setRequestId(requestId);
  if (userId) {
    requestLogger.setUserId(userId);
  }
  return requestLogger;
}

// Log request/response middleware
export function logRequest(req: Request, requestId: string) {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  });
}

export function logResponse(req: Request, requestId: string, status: number, duration: number) {
  logger.info('Request completed', {
    method: req.method,
    url: req.url,
    status,
    duration: `${duration}ms`,
  });
}
