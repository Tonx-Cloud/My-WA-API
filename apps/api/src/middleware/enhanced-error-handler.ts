import { Request, Response, NextFunction } from 'express';
import { logError, logSecurityEvent, logger } from '../config/enhanced-logger';
import * as Sentry from '@sentry/node';

// Interface para erros personalizados
export interface IAppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  details?: Record<string, any>;
}

// Classe base para erros personalizados
export class AppError extends Error implements IAppError {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Tipos de erro personalizados
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, true, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, true, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends AppError {
  service: string;

  constructor(service: string, message?: string) {
    super(
      message || `External service ${service} is unavailable`,
      502,
      true,
      'EXTERNAL_SERVICE_ERROR'
    );
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

export class WhatsAppServiceError extends ExternalServiceError {
  constructor(message?: string) {
    super('WhatsApp', message);
    this.name = 'WhatsAppServiceError';
  }
}

// Classe para tratamento centralizado de erros
class ErrorHandler {
  private readonly trustedErrors = [
    'ValidationError',
    'AuthenticationError',
    'AuthorizationError',
    'NotFoundError',
    'ConflictError',
    'RateLimitError',
    'ExternalServiceError',
    'WhatsAppServiceError',
  ];

  // Verificar se é um erro operacional confiável
  isTrustedError(error: Error): boolean {
    if (error instanceof AppError && error.isOperational) {
      return true;
    }

    return this.trustedErrors.includes(error.name);
  }

  // Tratar erro e enviar resposta apropriada
  handleError(error: AppError | Error, req: Request, res: Response): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const errorId = this.generateErrorId();

    // Log do erro
    logError(error, {
      errorId,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
      body: req.body,
      params: req.params,
      query: req.query,
    });

    // Enviar para Sentry se configurado
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        tags: {
          errorId,
          component: 'error-handler',
        },
        extra: {
          url: req.url,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });
    }

    // Determinar código de status
    let statusCode = 500;
    if (error instanceof AppError && error.statusCode) {
      statusCode = error.statusCode;
    } else if ((error as any).statusCode) {
      statusCode = (error as any).statusCode;
    }

    // Preparar resposta de erro
    const errorResponse: any = {
      success: false,
      error: {
        id: errorId,
        message: this.getErrorMessage(error, isProduction),
        code: (error as AppError).code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      },
    };

    // Adicionar detalhes em desenvolvimento
    if (!isProduction) {
      errorResponse.error.stack = error.stack;
      errorResponse.error.details = (error as AppError).details;
    }

    // Log de evento de segurança para erros relacionados à autenticação/autorização
    if (statusCode === 401 || statusCode === 403) {
      logSecurityEvent('Authentication/Authorization Error', {
        errorId,
        statusCode,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        message: error.message,
      });
    }

    // Enviar resposta
    res.status(statusCode).json(errorResponse);
  }

  // Obter mensagem de erro apropriada
  private getErrorMessage(error: Error, isProduction: boolean): string {
    if (this.isTrustedError(error)) {
      return error.message;
    }

    // Em produção, não expor detalhes de erros internos
    if (isProduction) {
      return 'Internal server error occurred';
    }

    return error.message;
  }

  // Gerar ID único para o erro
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  // Tratar erros assíncronos não capturados
  handleAsyncError(error: Error): void {
    logger.error(error, {
      context: 'Unhandled Async Error',
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
    });

    // Enviar para Sentry
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        tags: {
          component: 'async-error-handler',
        },
      });
    }

    // Em produção, encerrar o processo para evitar estado inconsistente
    if (process.env.NODE_ENV === 'production') {
      const shutdownError = new Error('Shutting down due to unhandled error');
      logger.error(shutdownError);
      process.exit(1);
    }
  }
}

// Instância global do manipulador de erros
const errorHandler = new ErrorHandler();

// Middleware principal de tratamento de erros
export const errorMiddleware = (
  error: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Se a resposta já foi enviada, passar para o próximo middleware
  if (res.headersSent) {
    return next(error);
  }

  errorHandler.handleError(error, req, res);
};

// Middleware para capturar 404
export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  next(error);
};

// Wrapper para funções assíncronas
export const asyncWrapper = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Função para validar entrada com Joi
export const validateInput = (schema: any, data: any): void => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.reduce((acc: any, detail: any) => {
      acc[detail.path.join('.')] = detail.message;
      return acc;
    }, {});

    throw new ValidationError('Validation failed', details);
  }

  return value;
};

// Configurar handlers globais para erros não capturados
process.on('uncaughtException', (error: Error) => {
  logger.error(error, {
    context: 'Uncaught Exception - Shutting down...',
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });

  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: { component: 'uncaught-exception' },
    });
  }

  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  const rejectionError = new Error('Unhandled Rejection - Shutting down...');
  logger.error(rejectionError, {
    context: 'Unhandled Rejection',
    reason: reason,
    promise: promise,
    timestamp: new Date().toISOString(),
  });

  if (process.env.SENTRY_DSN) {
    Sentry.captureException(reason, {
      tags: { component: 'unhandled-rejection' },
    });
  }

  process.exit(1);
});

// Configurar handler de sinal para shutdown graceful
const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
signals.forEach(signal => {
  process.on(signal, () => {
    logger.info(`Received ${signal}, shutting down gracefully`);

    // Dar tempo para requisições pendentes terminarem
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  });
});

export { errorHandler };
