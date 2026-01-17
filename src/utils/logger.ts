/**
 * Safe logging utility that sanitizes error output in production
 * to prevent sensitive information leakage.
 */

const isDev = import.meta.env.DEV;

/**
 * Safely log an error without exposing sensitive details in production.
 * In development, logs full error objects for debugging.
 * In production, logs only safe error messages.
 */
export function logError(context: string, error: unknown): void {
  if (isDev) {
    console.error(`[${context}]`, error);
  } else {
    const safeMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${context}] ${safeMessage}`);
  }
}

/**
 * Safely log a warning without exposing sensitive details in production.
 */
export function logWarn(context: string, message: string, details?: unknown): void {
  if (isDev) {
    console.warn(`[${context}]`, message, details);
  } else {
    console.warn(`[${context}] ${message}`);
  }
}

/**
 * Log info - safe for both dev and production
 */
export function logInfo(context: string, message: string): void {
  console.log(`[${context}] ${message}`);
}
