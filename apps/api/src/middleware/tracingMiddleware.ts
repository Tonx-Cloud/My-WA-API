import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/MetricsService';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';

export interface TracedRequest extends Request {
  traceId?: string;
  startTime?: number;
  operationName?: string;
}

/**
 * Middleware para rastreamento de performance e distributed tracing
 */
export const tracingMiddleware = (operationName?: string) => {
  return (req: TracedRequest, res: Response, next: NextFunction): void => {
    // Gerar ID Ãºnico para esta requisiÃ§Ã£o
    const traceId = uuidv4();
    const startTime = performance.now();

    // Adicionar informaÃ§Ãµes de trace Ã  requisiÃ§Ã£o
    req.traceId = traceId;
    req.startTime = startTime;
    req.operationName = operationName || `${req.method} ${req.path}`;

    // Adicionar headers de trace na resposta
    res.setHeader('X-Trace-Id', traceId);
    res.setHeader('X-Request-Start', startTime.toString());

    // Registrar inÃ­cio da operaÃ§Ã£o
    metricsService.incrementCounter('http.requests.started', 1, {
      method: req.method,
      path: req.path,
      traceId,
    });

    // Interceptar o final da requisiÃ§Ã£o
    const originalSend = res.send;
    res.send = function (body: any) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      const statusCode = res.statusCode;
      const success = statusCode < 400;

      // Registrar mÃ©tricas de performance
      metricsService.recordPerformance(req.operationName!, startTime, success, {
        method: req.method,
        path: req.path,
        statusCode: statusCode.toString(),
        traceId,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });

      // Registrar mÃ©tricas especÃ­ficas
      metricsService.incrementCounter('http.requests.completed', 1, {
        method: req.method,
        path: req.path,
        status: statusCode.toString(),
        success: success.toString(),
      });

      metricsService.recordHistogram('http.request.duration', duration, {
        method: req.method,
        path: req.path,
        status: statusCode.toString(),
      });

      // Registrar cÃ³digos de status especÃ­ficos
      if (statusCode >= 400) {
        metricsService.incrementCounter('http.errors', 1, {
          method: req.method,
          path: req.path,
          status: statusCode.toString(),
        });
      }

      // Log para requisiÃ§Ãµes lentas
      if (duration > 1000) {
        console.warn(
          `RequisiÃ§Ã£o lenta detectada: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`,
          {
            traceId,
            duration,
            statusCode,
            userAgent: req.get('User-Agent'),
          }
        );
      }

      return originalSend.call(this, body);
    };

    next();
  };
};

/**
 * Middleware especÃ­fico para operaÃ§Ãµes de instÃ¢ncia
 */
export const instanceTracingMiddleware = tracingMiddleware('instance-operation');

/**
 * Middleware especÃ­fico para operaÃ§Ãµes de mensagem
 */
export const messageTracingMiddleware = tracingMiddleware('message-operation');

/**
 * Middleware especÃ­fico para autenticaÃ§Ã£o
 */
export const authTracingMiddleware = tracingMiddleware('auth-operation');

/**
 * FunÃ§Ã£o helper para rastrear operaÃ§Ãµes customizadas
 */
export function traceOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = performance.now();
  const traceId = uuidv4();

  // Registrar inÃ­cio da operaÃ§Ã£o
  metricsService.incrementCounter(`operations.${operationName}.started`, 1, {
    traceId,
    ...metadata,
  });

  return operation()
    .then(result => {
      // OperaÃ§Ã£o bem-sucedida
      metricsService.recordPerformance(operationName, startTime, true, { traceId, ...metadata });

      metricsService.incrementCounter(`operations.${operationName}.success`, 1, {
        traceId,
        ...metadata,
      });

      return result;
    })
    .catch(error => {
      // OperaÃ§Ã£o falhou
      metricsService.recordPerformance(operationName, startTime, false, {
        traceId,
        error: error.message || 'Unknown error',
        ...metadata,
      });

      metricsService.incrementCounter(`operations.${operationName}.error`, 1, {
        traceId,
        errorType: error.name || 'Error',
        ...metadata,
      });

      throw error;
    });
}

/**
 * Decorator para mÃ©todos de classe (experimental)
 */
export function Traced(operationName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const operation = operationName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return traceOperation(operation, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}
