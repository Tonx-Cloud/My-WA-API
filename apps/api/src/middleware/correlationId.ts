import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

// Global async local storage for correlation ID
export const correlationIdStore = new AsyncLocalStorage<string>();

// Extend Express Request interface to include correlationId
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

/**
 * Middleware to generate and attach correlation ID to requests
 * Correlation IDs help trace requests across microservices and logs
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Check if correlation ID already exists in headers
  let correlationId = req.headers['x-correlation-id'] as string;

  // If no correlation ID provided, generate a new one
  if (!correlationId) {
    correlationId = uuidv4();
  }

  // Attach to request object
  req.correlationId = correlationId;

  // Add to response headers for client tracking
  res.setHeader('X-Correlation-ID', correlationId);

  // Store in async local storage for access in other parts of the application
  correlationIdStore.run(correlationId, () => {
    next();
  });
}

/**
 * Get current correlation ID from async local storage
 * Can be used anywhere in the request lifecycle
 */
export function getCurrentCorrelationId(): string | undefined {
  return correlationIdStore.getStore();
}

/**
 * Enhanced logger with correlation ID
 */
export class CorrelatedLogger {
  private static formatMessage(level: string, message: string, meta?: any): string {
    const correlationId = getCurrentCorrelationId();
    const timestamp = new Date().toISOString();

    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      correlationId: correlationId || 'unknown',
      message,
      ...(meta && { meta }),
    };

    return JSON.stringify(logEntry);
  }

  static info(message: string, meta?: any): void {
    console.log(this.formatMessage('info', message, meta));
  }

  static error(message: string, meta?: any): void {
    console.error(this.formatMessage('error', message, meta));
  }

  static warn(message: string, meta?: any): void {
    console.warn(this.formatMessage('warn', message, meta));
  }

  static debug(message: string, meta?: any): void {
    console.debug(this.formatMessage('debug', message, meta));
  }

  static http(req: Request, res: Response, responseTime?: number): void {
    const meta = {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      statusCode: res.statusCode,
      ...(responseTime && { responseTime: `${responseTime}ms` }),
    };

    this.info(`${req.method} ${req.url} - ${res.statusCode}`, meta);
  }
}

/**
 * Request logging middleware with correlation ID
 */
export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Log request start
  CorrelatedLogger.info(`Incoming request: ${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    correlationId: req.correlationId,
  });

  // Capture response finish
  const originalSend = res.send;
  res.send = function (body: any) {
    const responseTime = Date.now() - startTime;

    // Log response
    CorrelatedLogger.http(req, res, responseTime);

    return originalSend.call(this, body);
  };

  next();
}

export default correlationIdMiddleware;
