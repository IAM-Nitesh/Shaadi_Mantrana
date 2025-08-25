// Lightweight client-side logger controlled by NEXT_PUBLIC_ENABLE_CLIENT_LOGS
// Usage: import logger from '../utils/logger'; logger.debug('msg')
const ENABLE_CLIENT_LOGS = (typeof process !== 'undefined' && (
  process.env.NEXT_PUBLIC_ENABLE_CLIENT_LOGS === 'true' || process.env.NODE_ENV !== 'production'
)) || false;

function safeConsole(method: 'debug' | 'info' | 'warn' | 'error', args: any[]) {
  try {
    // Always allow error logs, but gate others behind the env flag
    if (method === 'error' || ENABLE_CLIENT_LOGS) {
      // @ts-ignore
      console[method](...args);
    }
  } catch (_) {
    // no-op
  }
}

export default {
  debug: (...args: any[]) => safeConsole('debug', args),
  info: (...args: any[]) => safeConsole('info', args),
  warn: (...args: any[]) => safeConsole('warn', args),
  error: (...args: any[]) => safeConsole('error', args),
};
