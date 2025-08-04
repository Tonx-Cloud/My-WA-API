import winston from 'winston';
import { getCurrentCorrelationId } from '../middleware/correlationId';
import path from 'path';
import fs from 'fs';

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
}

// Log context interface
interface LogContext {
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  instanceId?: string;
  operation?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

// Error serialization
function serializeError(error: Error): any {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(error.cause && typeof error.cause === 'object' ? { cause: error.cause } : {}),
  };
}

// Custom log format
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(info => {
    const { timestamp, level, message, correlationId, error, ...meta } = info;

    const logEntry: any = {
      timestamp,
      level: level.toUpperCase(),
      correlationId: correlationId || getCurrentCorrelationId() || 'unknown',
      message,
    };

    if (error && error instanceof Error) {
      logEntry.error = serializeError(error);
    }

    if (Object.keys(meta).length > 0) {
      logEntry.meta = meta;
    }

    return JSON.stringify(logEntry, null, process.env.NODE_ENV === 'development' ? 2 : 0);
  })
);

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class EnhancedLogger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: customFormat,
      defaultMeta: {
        service: 'my-wa-api',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: [
        // Console transport for development
        new winston.transports.Console({
          level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
        }),

        // File transport for all logs
        new winston.transports.File({
          filename: path.join(logsDir, 'combined.log'),
          level: 'info',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
          tailable: true,
        }),

        // Error logs
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
          tailable: true,
        }),

        // HTTP logs
        new winston.transports.File({
          filename: path.join(logsDir, 'http.log'),
          level: 'http',
          maxsize: 10485760, // 10MB
          maxFiles: 3,
          tailable: true,
        }),
      ],

      // Handle uncaught exceptions and rejections
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(logsDir, 'exceptions.log'),
        }),
      ],
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(logsDir, 'rejections.log'),
        }),
      ],
    });
  }

  /**
   * Create log context with correlation ID and other metadata
   */
  private createContext(context?: Partial<LogContext>): LogContext {
    const correlationId = getCurrentCorrelationId();

    return {
      ...(correlationId ? { correlationId } : {}),
      ...context,
    } as LogContext;
  }

  /**
   * Log info message
   */
  info(message: string, context?: Partial<LogContext>): void {
    this.logger.info(message, this.createContext(context));
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: Partial<LogContext>): void {
    this.logger.error(message, {
      ...this.createContext(context),
      ...(error && { error }),
    });
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Partial<LogContext>): void {
    this.logger.warn(message, this.createContext(context));
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Partial<LogContext>): void {
    this.logger.debug(message, this.createContext(context));
  }

  /**
   * Log HTTP request/response
   */
  http(message: string, context?: Partial<LogContext>): void {
    this.logger.http(message, this.createContext(context));
  }

  /**
   * Log application startup
   */
  startup(message: string, context?: Record<string, any>): void {
    this.info(`🚀 ${message}`, {
      operation: 'startup',
      ...(context ? { metadata: context } : {}),
    });
  }

  /**
   * Log application shutdown
   */
  shutdown(message: string, context?: Record<string, any>): void {
    this.info(`🛑 ${message}`, {
      operation: 'shutdown',
      ...(context ? { metadata: context } : {}),
    });
  }

  /**
   * Log database operations
   */
  database(message: string, context?: Partial<LogContext>): void {
    this.debug(`💾 ${message}`, {
      ...context,
      operation: 'database',
    });
  }

  /**
   * Log WhatsApp operations
   */
  whatsapp(message: string, context?: Partial<LogContext>): void {
    this.info(`📱 ${message}`, {
      ...context,
      operation: 'whatsapp',
    });
  }

  /**
   * Log authentication operations
   */
  auth(message: string, context?: Partial<LogContext>): void {
    this.info(`🔐 ${message}`, {
      ...context,
      operation: 'auth',
    });
  }

  /**
   * Log performance metrics
   */
  performance(message: string, duration: number, context?: Partial<LogContext>): void {
    this.info(`⚡ ${message}`, {
      ...context,
      operation: 'performance',
      duration,
    });
  }

  /**
   * Log security events
   */
  security(message: string, context?: Partial<LogContext>): void {
    this.warn(`🔒 SECURITY: ${message}`, {
      ...context,
      operation: 'security',
    });
  }

  /**
   * Create child logger with default context
   */
  child(defaultContext: Partial<LogContext>): EnhancedLogger {
    const childLogger = new EnhancedLogger();

    // Override createContext to include default context
    const originalCreateContext = childLogger.createContext.bind(childLogger);
    childLogger.createContext = (context?: Partial<LogContext>) => {
      return originalCreateContext({ ...defaultContext, ...context });
    };

    return childLogger;
  }

  /**
   * Get underlying winston logger instance
   */
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }

  /**
   * Flush all logs (useful for graceful shutdown)
   */
  async flush(): Promise<void> {
    return new Promise(resolve => {
      this.logger.on('finish', resolve);
      this.logger.end();
    });
  }
}

// Export singleton instance
export const logger = new EnhancedLogger();

// Export class for creating child loggers
export { EnhancedLogger };

// Export types
export type { LogContext };
