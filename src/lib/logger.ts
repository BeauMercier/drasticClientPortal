/**
 * Logger utility for standardized logging with different severity levels
 * 
 * This module provides a logger that handles log levels appropriately based on
 * the environment and allows for structured logging.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  context?: string;
  module?: string;
  data?: Record<string, unknown>;
}

// Determine if we're in production environment
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Central logger function that handles different log levels
 */
const log = (level: LogLevel, message: string, options: LogOptions = {}) => {
  // In production, we only show warn and error logs
  if (isProduction && (level === 'debug' || level === 'info')) {
    return;
  }

  const { context, module, data } = options;
  
  // Create contextual prefix
  let prefix = '';
  if (module) prefix += `[${module}] `;
  if (context) prefix += `(${context}) `;
  
  // Format the message
  const formattedMessage = `${prefix}${message}`;
  
  // Log based on level
  switch (level) {
    case 'debug':
      console.debug(formattedMessage, data ? data : '');
      break;
    case 'info':
      console.info(formattedMessage, data ? data : '');
      break;
    case 'warn':
      console.warn(formattedMessage, data ? data : '');
      break;
    case 'error':
      console.error(formattedMessage, data ? data : '');
      break;
  }
};

/**
 * Logger instance with methods for different severity levels
 */
const logger = {
  /**
   * Debug level logging - only shown in development
   */
  debug: (message: string, options?: LogOptions) => log('debug', message, options),
  
  /**
   * Info level logging - only shown in development
   */
  info: (message: string, options?: LogOptions) => log('info', message, options),
  
  /**
   * Warning level logging - shown in all environments
   */
  warn: (message: string, options?: LogOptions) => log('warn', message, options),
  
  /**
   * Error level logging - shown in all environments
   */
  error: (message: string, options?: LogOptions) => log('error', message, options),
  
  /**
   * Create a scoped logger for a specific module
   */
  forModule: (moduleName: string) => ({
    debug: (message: string, options?: Omit<LogOptions, 'module'>) => 
      log('debug', message, { ...options, module: moduleName }),
    info: (message: string, options?: Omit<LogOptions, 'module'>) => 
      log('info', message, { ...options, module: moduleName }),
    warn: (message: string, options?: Omit<LogOptions, 'module'>) => 
      log('warn', message, { ...options, module: moduleName }),
    error: (message: string, options?: Omit<LogOptions, 'module'>) => 
      log('error', message, { ...options, module: moduleName })
  })
};

export default logger; 