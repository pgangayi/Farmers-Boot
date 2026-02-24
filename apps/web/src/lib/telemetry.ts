/**
 * ============================================================================
 * OPEN TELEMETRY CONFIGURATION
 * ============================================================================
 * Provides observability for the Farmers-Boot application.
 * Configures tracing, metrics, and logging for production monitoring.
 *
 * Supported Exporters:
 * - Jaeger (development)
 * - OTLP (production - Grafana Tempo, Honeycomb, etc.)
 * - Console (debugging)
 * ============================================================================
 */

import { context, trace, Span, SpanStatusCode, Tracer } from '@opentelemetry/api';
import {
  WebTracerProvider,
  BatchSpanProcessor,
  ConsoleSpanExporter,
} from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { B3Propagator } from '@opentelemetry/propagator-b3';

// ============================================================================
// TYPES
// ============================================================================

export interface TelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  otlpEndpoint?: string;
  enableConsoleExporter?: boolean;
  samplingRate?: number;
}

export interface SpanAttributes {
  [key: string]: string | number | boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const defaultConfig: TelemetryConfig = {
  serviceName: 'farmers-boot-web',
  serviceVersion: import.meta.env.VITE_APP_VERSION || '0.1.0',
  environment: import.meta.env.MODE || 'development',
  otlpEndpoint: import.meta.env.VITE_OTLP_ENDPOINT,
  enableConsoleExporter: import.meta.env.DEV,
  samplingRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
};

// ============================================================================
// TRACER PROVIDER
// ============================================================================

let tracerProvider: WebTracerProvider | null = null;
let tracer: Tracer | null = null;
let isInitialized = false;

/**
 * Initialize OpenTelemetry
 */
export function initTelemetry(config: Partial<TelemetryConfig> = {}): void {
  if (isInitialized) {
    console.warn('[Telemetry] Already initialized');
    return;
  }

  const finalConfig = { ...defaultConfig, ...config };

  // Create resource with service information
  const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: finalConfig.serviceName,
    [SEMRESATTRS_SERVICE_VERSION]: finalConfig.serviceVersion,
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: finalConfig.environment,
  });

  // Create tracer provider
  tracerProvider = new WebTracerProvider({ resource });

  // Add OTLP exporter for production
  if (finalConfig.otlpEndpoint) {
    const otlpExporter = new OTLPTraceExporter({
      url: `${finalConfig.otlpEndpoint}/v1/traces`,
      headers: {
        'api-key': import.meta.env.VITE_OTLP_API_KEY || '',
      },
    });
    tracerProvider.addSpanProcessor(new BatchSpanProcessor(otlpExporter));
  }

  // Add console exporter for development
  if (finalConfig.enableConsoleExporter) {
    const consoleExporter = new ConsoleSpanExporter();
    tracerProvider.addSpanProcessor(new BatchSpanProcessor(consoleExporter));
  }

  // Set context manager
  tracerProvider.register({
    contextManager: new ZoneContextManager(),
    propagator: new B3Propagator(),
  });

  // Get tracer
  tracer = trace.getTracer(finalConfig.serviceName, finalConfig.serviceVersion);

  isInitialized = true;
  console.log('[Telemetry] Initialized', {
    service: finalConfig.serviceName,
    environment: finalConfig.environment,
  });
}

/**
 * Get the tracer instance
 */
export function getTracer(): Tracer {
  if (!tracer) {
    // Return a no-op tracer if not initialized
    return trace.getTracer('noop');
  }
  return tracer;
}

// ============================================================================
// SPAN HELPERS
// ============================================================================

/**
 * Start a new span
 */
export function startSpan(name: string, attributes?: SpanAttributes): Span {
  const tracer = getTracer();
  return tracer.startSpan(name, { attributes });
}

/**
 * Execute a function within a span
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: SpanAttributes
): Promise<T> {
  const span = startSpan(name, attributes);

  try {
    const result = await fn(span);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    span.recordException(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Execute a synchronous function within a span
 */
export function withSpanSync<T>(
  name: string,
  fn: (span: Span) => T,
  attributes?: SpanAttributes
): T {
  const span = startSpan(name, attributes);

  try {
    const result = fn(span);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    span.recordException(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    span.end();
  }
}

// ============================================================================
// API TRACING
// ============================================================================

/**
 * Trace an API request
 */
export async function traceApiRequest<T>(
  method: string,
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> {
  return withSpan(`HTTP ${method} ${endpoint}`, async span => {
    span.setAttributes({
      'http.method': method,
      'http.url': endpoint,
      'http.scheme': 'https',
    });

    try {
      const result = await fn();
      span.setAttribute('http.status_code', 200);
      return result;
    } catch (error) {
      span.setAttribute('http.status_code', 500);
      throw error;
    }
  });
}

// ============================================================================
// DATABASE TRACING
// ============================================================================

/**
 * Trace a database operation
 */
export async function traceDbOperation<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> {
  return withSpan(`DB ${operation} ${table}`, async span => {
    span.setAttributes({
      'db.operation': operation,
      'db.table': table,
      'db.system': 'postgresql',
    });

    return fn();
  });
}

// ============================================================================
// USER TRACING
// ============================================================================

/**
 * Set user context for current trace
 */
export function setUserContext(userId: string, userEmail?: string): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes({
      'user.id': userId,
      ...(userEmail && { 'user.email': userEmail }),
    });
  }
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes({
      'user.id': '',
      'user.email': '',
    });
  }
}

// ============================================================================
// PERFORMANCE TRACING
// ============================================================================

/**
 * Trace a React component render
 */
export function traceComponentRender(componentName: string): Span {
  return startSpan(`React.render ${componentName}`, {
    'react.component': componentName,
  });
}

/**
 * Trace a custom event
 */
export function traceEvent(eventName: string, attributes?: SpanAttributes): void {
  const span = startSpan(`event.${eventName}`, attributes);
  span.end();
}

// ============================================================================
// ERROR TRACKING
// ============================================================================

/**
 * Record an error in the current span
 */
export function recordError(error: Error, attributes?: SpanAttributes): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    if (attributes) {
      span.setAttributes(attributes);
    }
  }
}

// ============================================================================
// SHUTDOWN
// ============================================================================

/**
 * Shutdown telemetry (call on app unload)
 */
export async function shutdownTelemetry(): Promise<void> {
  if (tracerProvider) {
    await tracerProvider.shutdown();
    isInitialized = false;
    tracer = null;
    tracerProvider = null;
    console.log('[Telemetry] Shutdown complete');
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Auto-initialize in production
if (import.meta.env.PROD && !isInitialized) {
  initTelemetry();
}

// Export for use in other modules
export default {
  init: initTelemetry,
  shutdown: shutdownTelemetry,
  startSpan,
  withSpan,
  withSpanSync,
  traceApiRequest,
  traceDbOperation,
  setUserContext,
  clearUserContext,
  traceComponentRender,
  traceEvent,
  recordError,
  getTracer,
};
