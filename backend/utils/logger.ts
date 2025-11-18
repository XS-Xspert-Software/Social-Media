/**
 * Shared logger utility for consistent logging across the application
 */

export type LogLevel = 'info' | 'warn' | 'error';

export function log(level: LogLevel, ...args: any[]): void {
  const ts = new Date().toISOString();
  if (level === 'error') {
    console.error(`[${ts}]`, ...args);
  } else if (level === 'warn') {
    console.warn(`[${ts}]`, ...args);
  } else {
    console.log(`[${ts}]`, ...args);
  }
}
