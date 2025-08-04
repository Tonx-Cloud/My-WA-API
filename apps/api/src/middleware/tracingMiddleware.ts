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
    // Gerar ID único para esta requisição
    const traceId = uuidv4();
    const startTime = performance.now();

    // Adicionar informações de trace à requisição
    req.traceId = traceId;
    req.startTime = startTime;
    req.operationName = operationName || `${req.method} ${req.path}`;

    // Adicionar headers de trace na resposta
    res.setHeader('X-Trace-Id', traceId);
    res.setHeader('X-Request-Start', startTime.toString());

    // Registrar início da operação
    metricsService.incrementCounter('http.requests.started', 1, {
      method: req.method,
      path: req.path,
      traceId,
    });

    // Interceptar o final da requisição
    const originalSend = res.send;
    res.send = function (body: any) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      const statusCode = res.statusCode;
      const success = statusCode < 400;

      // Registrar métricas de performance
      metricsService.recordPerformance(req.operationName!, startTime, success, {
        method: req.method,
        path: req.path,
        statusCode: statusCode.toString(),
        traceId,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });

      // Registrar métricas específicas
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

      // Registrar códigos de status específicos
      if (statusCode >= 400) {
        metricsService.incrementCounter('http.errors', 1, {
          method: req.method,
          path: req.path,
          status: statusCode.toString(),
        });
      }

      // Log para requisições lentas
      if (duration > 1000) {
        console.warn(
          `Requisição lenta detectada: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`,
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
 * Middleware específico para operações de instância
 */
export const instanceTracingMiddleware = tracingMiddleware('instance-operation');

/**
 * Middleware específico para operações de mensagem
 */
export const messageTracingMiddleware = tracingMiddleware('message-operation');

/**
 * Middleware específico para autenticação
 */
export const authTracingMiddleware = tracingMiddleware('auth-operation');

/**
 * Função helper para rastrear operações customizadas
 */
export function traceOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = performance.now();
  const traceId = uuidv4();

  // Registrar início da operação
  metricsService.incrementCounter(`operations.${operationName}.started`, 1, {
    traceId,
    ...metadata,
  });

  return operation()
    .then(result => {
      // Operação bem-sucedida
      metricsService.recordPerformance(operationName, startTime, true, { traceId, ...metadata });

      metricsService.incrementCounter(`operations.${operationName}.success`, 1, {
        traceId,
        ...metadata,
      });

      return result;
    })
    .catch(error => {
      // Operação falhou
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
 * Decorator para métodos de classe (experimental)
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
