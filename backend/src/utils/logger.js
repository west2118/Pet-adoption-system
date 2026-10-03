import { env } from '../config/env.js';

const levels = ['debug', 'info', 'warn', 'error'];

const shouldLog = (level) => {
  if (env.NODE_ENV === 'test' && level !== 'error') return false;
  return levels.includes(level);
};

const format = (level, args) => {
  const ts = new Date().toISOString();
  return [`[${ts}] [${level.toUpperCase()}]`, ...args];
};

export const logger = {
  debug: (...args) => {
    if (shouldLog('debug') && env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(...format('debug', args));
    }
  },
  info: (...args) => {
    if (shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.info(...format('info', args));
    }
  },
  warn: (...args) => {
    if (shouldLog('warn')) {
      // eslint-disable-next-line no-console
      console.warn(...format('warn', args));
    }
  },
  error: (...args) => {
    if (shouldLog('error')) {
      // eslint-disable-next-line no-console
      console.error(...format('error', args));
    }
  },
};
