// ============================================================================
// SHARED LOGGER UTILITIES
// ============================================================================
// This module provides common logger utilities for the Farmers-Boot
// monorepo. Following Turbo monorepo principles, shared code is placed in
// packages/shared to be used by both apps/api and apps/web.
//
// Date: 2026-02-10
// ============================================================================

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SECURITY = 'security',
}

/**
 * Log entry interface
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level?: LogLevel;
  enableConsole?: boolean;
  enableFile?: boolean;
  context?: Record<string, any>;
}

/**
 * Base Logger class
 */
export class Logger {
  protected config: LoggerConfig;
  protected context: Record<string, any>;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      ...config,
    };
    this.context = this.config.context || {};
  }

  /**
   * Format log entry
   */
  protected formatLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.context, ...context },
    };
  }

  /**
   * Check if level should be logged
   */
  protected shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.SECURITY,
    ];
    const configLevelIndex = levels.indexOf(this.config.level || LogLevel.INFO);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex >= configLevelIndex;
  }

  /**
   * Log to console
   */
  protected logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
    const message = `${prefix} - ${entry.message}`;
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, contextStr);
        break;
      case LogLevel.INFO:
        console.info(message, contextStr);
        break;
      case LogLevel.WARN:
        console.warn(message, contextStr);
        break;
      case LogLevel.ERROR:
        console.error(message, contextStr);
        break;
      case LogLevel.SECURITY:
        console.error(`[SECURITY] ${message}`, contextStr);
        break;
    }
  }

  /**
   * Debug level log
   */
  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const entry = this.formatLogEntry(LogLevel.DEBUG, message, context);
    this.logToConsole(entry);
  }

  /**
   * Info level log
   */
  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const entry = this.formatLogEntry(LogLevel.INFO, message, context);
    this.logToConsole(entry);
  }

  /**
   * Warn level log
   */
  warn(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const entry = this.formatLogEntry(LogLevel.WARN, message, context);
    this.logToConsole(entry);
  }

  /**
   * Error level log
   */
  error(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const entry = this.formatLogEntry(LogLevel.ERROR, message, context);
    this.logToConsole(entry);
  }

  /**
   * Security level log
   */
  security(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.SECURITY)) return;
    const entry = this.formatLogEntry(LogLevel.SECURITY, message, context);
    this.logToConsole(entry);
  }

  /**
   * Set context
   */
  setContext(context: Record<string, any>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {};
  }
}

/**
 * Audit Logger - Specialized logger for audit events
 */
export class AuditLogger extends Logger {
  constructor(config: LoggerConfig = {}) {
    super({
      level: LogLevel.INFO,
      ...config,
    });
  }

  /**
   * Log an audit event
   */
  log(action: string, userId: string, details: Record<string, any> = {}): void {
    this.info(`Audit: ${action}`, {
      userId,
      action,
      ...details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log database operation
   */
  logDatabase(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    context?: Record<string, any>
  ): void {
    const level = success ? LogLevel.DEBUG : LogLevel.ERROR;
    const message = `Database ${operation} on ${table} (${duration}ms)`;

    if (level === LogLevel.DEBUG) {
      this.debug(message, { table, operation, duration, success, ...context });
    } else {
      this.error(message, { table, operation, duration, success, ...context });
    }
  }

  /**
   * Log authentication event
   */
  logAuth(event: string, userId: string, success: boolean, context?: Record<string, any>): void {
    const level = success ? LogLevel.INFO : LogLevel.SECURITY;
    const message = `Auth ${event}: ${success ? 'Success' : 'Failed'}`;

    if (level === LogLevel.INFO) {
      this.info(message, { userId, event, success, ...context });
    } else {
      this.security(message, { userId, event, success, ...context });
    }
  }

  /**
   * Log authorization event
   */
  logAuthz(
    resource: string,
    userId: string,
    action: string,
    allowed: boolean,
    context?: Record<string, any>
  ): void {
    const level = allowed ? LogLevel.DEBUG : LogLevel.SECURITY;
    const message = `Authz ${action} on ${resource}: ${allowed ? 'Allowed' : 'Denied'}`;

    if (level === LogLevel.DEBUG) {
      this.debug(message, { userId, resource, action, allowed, ...context });
    } else {
      this.security(message, { userId, resource, action, allowed, ...context });
    }
  }
}

/**
 * Create a logger instance
 */
export function createLogger(config?: LoggerConfig): Logger {
  return new Logger(config);
}

/**
 * Create an audit logger instance
 */
export function createAuditLogger(config?: LoggerConfig): AuditLogger {
  return new AuditLogger(config);
}

// Export all utilities
export default {
  Logger,
  AuditLogger,
  createLogger,
  createAuditLogger,
  LogLevel,
};
