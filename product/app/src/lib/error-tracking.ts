/**
 * Lightweight error tracking module.
 * In prototype: logs to console with structured format.
 * In production: replace with Sentry SDK (drop-in swap).
 *
 * Usage:
 *   import { captureError, captureMessage } from '@/lib/error-tracking';
 *   captureError(error, { traceId, route: '/api/validate' });
 */

interface ErrorContext {
  traceId?: string;
  route?: string;
  userId?: string;
  extra?: Record<string, unknown>;
}

/**
 * Capture and log an error with structured context.
 * Replace this body with Sentry.captureException() in production.
 */
export function captureError(error: unknown, context: ErrorContext = {}): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(JSON.stringify({
    level: 'error',
    message: errorMessage,
    stack: errorStack,
    ...context,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Capture a warning or info message with context.
 * Replace this body with Sentry.captureMessage() in production.
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' = 'info',
  context: ErrorContext = {}
): void {
  const logFn = level === 'warning' ? console.warn : console.info;
  logFn(JSON.stringify({
    level,
    message,
    ...context,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Initialize error tracking. Call once in app entry point.
 * In production: Sentry.init({ dsn: process.env.SENTRY_DSN });
 */
export function initErrorTracking(): void {
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      captureError(event.reason, { extra: { type: 'unhandledrejection' } });
    });

    window.addEventListener('error', (event) => {
      captureError(event.error, { extra: { type: 'uncaughtException', filename: event.filename } });
    });
  }
}
