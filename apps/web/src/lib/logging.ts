/**
 * ============================================================================
 * LOGGING INFRASTRUCTURE
 * ============================================================================
 * Centralized logging system for Farmers-Boot application
 * ============================================================================
 */

import { useEffect } from 'react';

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  stack?: string;
  source: string;
  tags?: string[];
}

// Logger configuration
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxBufferSize: number;
  flushInterval: number;
  enablePerformanceLogging: boolean;
  enableErrorTracking: boolean;
}

// Logger class
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;
  private sessionId: string;
  private isBrowser: boolean;

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableRemote: false,
      maxBufferSize: 100,
      flushInterval: 5000,
      enablePerformanceLogging: true,
      enableErrorTracking: true,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.isBrowser = typeof window !== 'undefined';

    if (this.config.enableRemote && this.config.flushInterval > 0) {
      this.startFlushTimer();
    }

    // Set up global error handlers
    if (this.config.enableErrorTracking && this.isBrowser) {
      this.setupGlobalErrorHandlers();
    }
  }

  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Setup global error handlers
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise,
      });
    });

    // Handle uncaught errors
    window.addEventListener('error', event => {
      this.error('Uncaught Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });
  }

  // Start flush timer for remote logging
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  // Create log entry
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    source?: string,
    tags?: string[]
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      requestId: this.getRequestId(),
      source: source || this.getSource(),
      tags,
    };
  }

  // Get current user ID
  private getCurrentUserId(): string | undefined {
    if (this.isBrowser) {
      // Try to get user ID from various sources
      return (
        (window as any).currentUser?.id ||
        localStorage.getItem('userId') ||
        sessionStorage.getItem('userId')
      );
    }
    return undefined;
  }

  // Get request ID
  private getRequestId(): string | undefined {
    if (this.isBrowser) {
      return (window as any).requestId;
    }
    return undefined;
  }

  // Get source information
  private getSource(): string {
    if (this.isBrowser) {
      return `${window.location.pathname}:${window.location.search}`;
    }
    return 'server';
  }

  // Log methods
  debug(message: string, context?: Record<string, unknown>, tags?: string[]): void {
    this.log(LogLevel.DEBUG, message, context, tags);
  }

  info(message: string, context?: Record<string, unknown>, tags?: string[]): void {
    this.log(LogLevel.INFO, message, context, tags);
  }

  warn(message: string, context?: Record<string, unknown>, tags?: string[]): void {
    this.log(LogLevel.WARN, message, context, tags);
  }

  error(message: string, context?: Record<string, unknown>, tags?: string[]): void {
    this.log(LogLevel.ERROR, message, context, tags);
  }

  fatal(message: string, context?: Record<string, unknown>, tags?: string[]): void {
    this.log(LogLevel.FATAL, message, context, tags);
  }

  // Core logging method
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    tags?: string[]
  ): void {
    if (level < this.config.level) return;

    const entry = this.createLogEntry(level, message, context, undefined, tags);

    // Add stack trace for errors
    if (level >= LogLevel.ERROR && this.isBrowser) {
      entry.stack = new Error().stack;
    }

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Remote logging
    if (this.config.enableRemote) {
      this.buffer.push(entry);

      if (this.buffer.length >= this.config.maxBufferSize) {
        this.flush();
      }
    }
  }

  // Log to console
  private logToConsole(entry: LogEntry): void {
    const { level, message, timestamp, context, source } = entry;
    const logMessage = `[${timestamp}] [${LogLevel[level]}] [${source}] ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, context);
        break;
      case LogLevel.INFO:
        console.info(logMessage, context);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, context);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logMessage, context);
        break;
    }
  }

  // Flush buffer to remote endpoint
  private async flush(): Promise<void> {
    if (this.buffer.length === 0 || !this.config.remoteEndpoint) return;

    const logsToSend = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: logsToSend,
          metadata: {
            userAgent: this.isBrowser ? navigator.userAgent : 'server',
            url: this.isBrowser ? window.location.href : 'server',
            timestamp: new Date().toISOString(),
          },
        }),
      });
    } catch (error) {
      // Re-add logs to buffer if flush fails
      this.buffer.unshift(...logsToSend);
      console.warn('Failed to flush logs to remote endpoint:', error);
    }
  }

  // Performance logging
  performance(name: string, duration: number, context?: Record<string, unknown>): void {
    if (!this.config.enablePerformanceLogging) return;

    this.info(
      `Performance: ${name}`,
      {
        duration,
        performance: true,
        ...context,
      },
      ['performance']
    );
  }

  // User action logging
  userAction(action: string, context?: Record<string, unknown>): void {
    this.info(
      `User Action: ${action}`,
      {
        userAction: true,
        ...context,
      },
      ['user-action']
    );
  }

  // API call logging
  apiCall(
    method: string,
    url: string,
    duration: number,
    status: number,
    context?: Record<string, unknown>
  ): void {
    this.info(
      `API Call: ${method} ${url}`,
      {
        apiCall: true,
        method,
        url,
        duration,
        status,
        ...context,
      },
      ['api-call']
    );
  }

  // Business event logging
  businessEvent(event: string, context?: Record<string, unknown>): void {
    this.info(
      `Business Event: ${event}`,
      {
        businessEvent: true,
        ...context,
      },
      ['business-event']
    );
  }

  // Security event logging
  securityEvent(event: string, context?: Record<string, unknown>): void {
    this.warn(
      `Security Event: ${event}`,
      {
        securityEvent: true,
        ...context,
      },
      ['security-event']
    );
  }

  // Get logs by level
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.buffer.filter(entry => entry.level === level);
  }

  // Get logs by tag
  getLogsByTag(tag: string): LogEntry[] {
    return this.buffer.filter(entry => entry.tags?.includes(tag));
  }

  // Clear buffer
  clearBuffer(): void {
    this.buffer = [];
  }

  // Update configuration
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart flush timer if interval changed
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    if (this.config.enableRemote && this.config.flushInterval > 0) {
      this.startFlushTimer();
    }
  }

  // Force flush
  async forceFlush(): Promise<void> {
    await this.flush();
  }

  // Get logger statistics
  getStats(): {
    totalLogs: number;
    logsByLevel: Record<string, number>;
    bufferSize: number;
    sessionId: string;
  } {
    const logsByLevel = this.buffer.reduce(
      (acc, entry) => {
        const levelName = LogLevel[entry.level];
        acc[levelName] = (acc[levelName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalLogs: this.buffer.length,
      logsByLevel,
      bufferSize: this.buffer.length,
      sessionId: this.sessionId,
    };
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.forceFlush();
    this.clearBuffer();
  }
}

// Logger factory for different contexts
export class LoggerFactory {
  static createLogger(
    context: string,
    config?: Partial<LoggerConfig>
  ): {
    debug: (message: string, context?: Record<string, unknown>, tags?: string[]) => void;
    info: (message: string, context?: Record<string, unknown>, tags?: string[]) => void;
    warn: (message: string, context?: Record<string, unknown>, tags?: string[]) => void;
    error: (message: string, context?: Record<string, unknown>, tags?: string[]) => void;
    fatal: (message: string, context?: Record<string, unknown>, tags?: string[]) => void;
    performance: (name: string, duration: number, context?: Record<string, unknown>) => void;
    userAction: (action: string, context?: Record<string, unknown>) => void;
    apiCall: (
      method: string,
      url: string,
      duration: number,
      status: number,
      context?: Record<string, unknown>
    ) => void;
    businessEvent: (event: string, context?: Record<string, unknown>) => void;
    securityEvent: (event: string, context?: Record<string, unknown>) => void;
  } {
    const logger = Logger.getInstance(config);

    return {
      debug: (message: string, context?: Record<string, unknown>, tags?: string[]) =>
        logger.debug(message, { ...context, source: context }, tags),
      info: (message: string, context?: Record<string, unknown>, tags?: string[]) =>
        logger.info(message, { ...context, source: context }, tags),
      warn: (message: string, context?: Record<string, unknown>, tags?: string[]) =>
        logger.warn(message, { ...context, source: context }, tags),
      error: (message: string, context?: Record<string, unknown>, tags?: string[]) =>
        logger.error(message, { ...context, source: context }, tags),
      fatal: (message: string, context?: Record<string, unknown>, tags?: string[]) =>
        logger.fatal(message, { ...context, source: context }, tags),
      performance: (name: string, duration: number, context?: Record<string, unknown>) =>
        logger.performance(name, duration, { ...context, source: context }),
      userAction: (action: string, context?: Record<string, unknown>) =>
        logger.userAction(action, { ...context, source: context }),
      apiCall: (
        method: string,
        url: string,
        duration: number,
        status: number,
        context?: Record<string, unknown>
      ) => logger.apiCall(method, url, duration, status, { ...context, source: context }),
      businessEvent: (event: string, context?: Record<string, unknown>) =>
        logger.businessEvent(event, { ...context, source: context }),
      securityEvent: (event: string, context?: Record<string, unknown>) =>
        logger.securityEvent(event, { ...context, source: context }),
    };
  }
}

// Performance monitoring decorator
export function logPerformance(
  target: any,
  propertyName: string,
  descriptor: PropertyDescriptor
): void {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const logger = Logger.getInstance();
    const startTime = performance.now();

    try {
      const result = await method.apply(this, args);
      const duration = performance.now() - startTime;

      logger.performance(`${target.constructor.name}.${propertyName}`, duration, {
        args: args.length,
        success: true,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      logger.performance(`${target.constructor.name}.${propertyName}`, duration, {
        args: args.length,
        success: false,
        error: (error as Error).message,
      });

      throw error;
    }
  };
}

// React hook for logging
export const useLogger = (context: string, config?: Partial<LoggerConfig>) => {
  const logger = LoggerFactory.createLogger(context, config);

  useEffect(() => {
    // Log component mount
    logger.info(`Component mounted: ${context}`, {}, ['lifecycle']);

    return () => {
      // Log component unmount
      logger.info(`Component unmounted: ${context}`, {}, ['lifecycle']);
    };
  }, [context]);

  return logger;
};

// Default logger instance
export const logger = Logger.getInstance();

export default Logger;
