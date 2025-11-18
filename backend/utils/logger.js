/**
 * Shared logger utility for consistent logging across the application
 */
export function log(level, ...args) {
    const ts = new Date().toISOString();
    if (level === 'error') {
        console.error(`[${ts}]`, ...args);
    }
    else if (level === 'warn') {
        console.warn(`[${ts}]`, ...args);
    }
    else {
        console.log(`[${ts}]`, ...args);
    }
}
