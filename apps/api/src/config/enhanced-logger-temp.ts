import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import crypto from 'crypto';
import { existsSync, mkdirSync } from 'fs';

// Garantir que o diretório de logs existe
const logsDir = path.join(process.cwd(), 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Definir níveis customizados com cores
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    security: 2,
    audit: 3,
    info: 4,
    performance: 5,
    http: 6,
    verbose: 7,
    debug: 8,
    silly: 9,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    security: 'magenta',
    audit: 'cyan',
    info: 'green',
    performance: 'blue',
    http: 'white',
    verbose: 'gray',
    debug: 'gray',
    silly: 'gray',
  },
};

// Adicionar cores ao winston
winston.addColors(customLevels.colors);

// Criar formatador customizado para produção
const productionFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, service, pid, hostname, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level.toUpperCase()}] [${service}:${pid}@${hostname}] ${message} ${metaString}`;
  })
);

// Criar formatador para desenvolvimento
const developmentFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} ${level}: ${message} ${metaString}`;
  })
);

// Criar o logger base
const baseLogger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'my-wa-api',
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'localhost',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: [],
  exitOnError: false,
});

// Configurar transports baseado no ambiente
const isDevelopment = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

if (!isTest) {
  // Console transport para desenvolvimento
  if (isDevelopment) {
    baseLogger.add(
      new winston.transports.Console({
        format: developmentFormat,
        level: 'debug',
      })
    );
  } else {
    // Console em produção com formato limpo
    baseLogger.add(
      new winston.transports.Console({
        format: productionFormat,
        level: 'info',
      })
    );
  }

  // Transports de arquivo com rotação e compressão
  baseLogger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  baseLogger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    })
  );

  // Rotação diária para logs de segurança
  baseLogger.add(
    new DailyRotateFile({
      filename: path.join(logsDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'security',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '90d',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    })
  );

  // Transport separado para logs de auditoria
  baseLogger.add(
    new DailyRotateFile({
      filename: path.join(logsDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'audit',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    })
  );

  // Transport separado para logs de performance
  baseLogger.add(
    new DailyRotateFile({
      filename: path.join(logsDir, 'performance-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'performance',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    })
  );
}

// Interceptar erros não tratados com paths seguros
if (!isTest) {
  try {
    baseLogger.exceptions.handle(
      new winston.transports.File({
        filename: path.join(logsDir, 'exceptions.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );

    baseLogger.rejections.handle(
      new winston.transports.File({
        filename: path.join(logsDir, 'rejections.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  } catch (error) {
    console.warn('Failed to setup exception/rejection handlers:', error);
  }
}

// Interface para contexto de log estruturado
interface LogContext {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

// Interface para métricas
interface MetricData {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
}

// Enhanced Logger com tipagem forte e métodos seguros
export const enhancedLogger = {
  // Métodos winston padrão com segurança
  error: (message: string | Error, context?: LogContext) => {
    try {
      if (message instanceof Error) {
        baseLogger.error(message.message, {
          type: 'error',
          error: {
            name: message.name,
            message: message.message,
            stack: message.stack,
          },
          context,
          timestamp: new Date().toISOString(),
        });
      } else {
        baseLogger.error(message, {
          type: 'error',
          context,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Logger error:', err, 'Original message:', message);
    }
  },

  warn: (message: string, context?: LogContext) => {
    try {
      baseLogger.warn(message, {
        type: 'warning',
        context,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Logger warn error:', err);
    }
  },

  info: (message: string, context?: LogContext) => {
    try {
      baseLogger.info(message, {
        type: 'info',
        context,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.info('Logger info error:', err);
    }
  },

  debug: (message: string, context?: LogContext) => {
    try {
      if (isDevelopment || process.env.LOG_LEVEL === 'debug') {
        baseLogger.debug(message, {
          type: 'debug',
          context,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.debug('Logger debug error:', err);
    }
  },

  // Log de evento de segurança
  security: (message: string, context?: LogContext) => {
    try {
      baseLogger.log('security', message, {
        type: 'security',
        context,
        timestamp: new Date().toISOString(),
        severity: 'high',
      });
    } catch (err) {
      console.error('Security log error:', err);
    }
  },

  // Log de auditoria de usuário
  audit: (action: string, userId?: string, context?: LogContext) => {
    try {
      baseLogger.log('audit', `User action: ${action}`, {
        type: 'audit',
        action,
        userId,
        context,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Audit log error:', err);
    }
  },

  // Log de performance
  performance: (operation: string, duration: number, context?: LogContext) => {
    try {
      baseLogger.log('performance', `Performance: ${operation}`, {
        type: 'performance',
        operation,
        duration: Math.round(duration * 100) / 100, // Arredondar para 2 casas decimais
        context,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Performance log error:', err);
    }
  },

  // Log de requisições HTTP
  http: (
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ) => {
    try {
      const logLevel = statusCode >= 400 ? 'warn' : 'http';
      baseLogger.log(logLevel, `${method} ${url} ${statusCode} - ${duration}ms`, {
        type: 'http',
        method: method.toUpperCase(),
        url,
        statusCode,
        duration: Math.round(duration * 100) / 100,
        context,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('HTTP log error:', err);
    }
  },

  // Log de evento de negócio
  business: (event: string, data?: any) => {
    try {
      baseLogger.info(`Business Event: ${event}`, {
        type: 'business',
        event,
        data: typeof data === 'object' ? JSON.stringify(data) : data,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Business log error:', err);
    }
  },

  // Log de métrica
  metric: (name: string, value: number, unit?: string, tags?: Record<string, string>) => {
    try {
      const metricData: MetricData = {
        name,
        value: Math.round(value * 100) / 100,
        unit,
        tags,
      };

      baseLogger.info(`Metric: ${name}`, {
        type: 'metric',
        metric: metricData,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Metric log error:', err);
    }
  },

  // Método para log estruturado genérico
  log: (level: string, message: string, meta?: any) => {
    try {
      baseLogger.log(level, message, {
        ...meta,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Generic log error:', err);
    }
  },

  // Método para criar child logger com contexto fixo
  child: (defaultContext: LogContext) => {
    return {
      error: (message: string | Error, context?: LogContext) =>
        enhancedLogger.error(message, { ...defaultContext, ...context }),
      warn: (message: string, context?: LogContext) =>
        enhancedLogger.warn(message, { ...defaultContext, ...context }),
      info: (message: string, context?: LogContext) =>
        enhancedLogger.info(message, { ...defaultContext, ...context }),
      debug: (message: string, context?: LogContext) =>
        enhancedLogger.debug(message, { ...defaultContext, ...context }),
      security: (message: string, context?: LogContext) =>
        enhancedLogger.security(message, { ...defaultContext, ...context }),
      audit: (action: string, userId?: string, context?: LogContext) =>
        enhancedLogger.audit(action, userId, { ...defaultContext, ...context }),
      performance: (operation: string, duration: number, context?: LogContext) =>
        enhancedLogger.performance(operation, duration, {
          ...defaultContext,
          ...context,
        }),
      http: (
        method: string,
        url: string,
        statusCode: number,
        duration: number,
        context?: LogContext
      ) =>
        enhancedLogger.http(method, url, statusCode, duration, {
          ...defaultContext,
          ...context,
        }),
    };
  },
};

// Middleware para rastreamento de request
export const loggerMiddleware = (req: any, res: any, next: any) => {
  const startTime = process.hrtime.bigint();
  const requestId =
    crypto.randomUUID?.() || `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  // Criar child logger com contexto da requisição
  const requestLogger = enhancedLogger.child({
    requestId,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent'),
    method: req.method,
    url: req.originalUrl || req.url,
  });

  // Adicionar logger ao request
  req.logger = requestLogger;
  req.requestId = requestId;

  // Log do início da requisição
  requestLogger.info(`${req.method} ${req.originalUrl || req.url} - Request started`);

  const originalSend = res.send;
  res.send = function (data: any) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e6; // Converter para ms

    // Log da conclusão da requisição
    requestLogger.http(req.method, req.originalUrl || req.url, res.statusCode, duration);

    // Log adicional para erros
    if (res.statusCode >= 400) {
      requestLogger.error(`Request failed with status ${res.statusCode}`, {
        statusCode: res.statusCode,
        duration,
        responseSize: data ? Buffer.byteLength(data, 'utf8') : 0,
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

// Utilitários de log para casos específicos
export const logUtils = {
  // Log de início e fim de operação com timer automático
  timeOperation: async <T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> => {
    const startTime = process.hrtime.bigint();
    enhancedLogger.debug(`Starting operation: ${operation}`, context);

    try {
      const result = await fn();
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e6;

      enhancedLogger.performance(operation, duration, {
        ...context,
        success: true,
      });
      return result;
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e6;

      enhancedLogger.performance(operation, duration, {
        ...context,
        success: false,
      });
      enhancedLogger.error(error instanceof Error ? error : new Error(String(error)), context);
      throw error;
    }
  },

  // Log de evento crítico que requer atenção imediata
  critical: (message: string, context?: LogContext) => {
    enhancedLogger.error(new Error(`CRITICAL: ${message}`), {
      ...context,
      severity: 'critical',
      requiresImmediateAttention: true,
    });
  },

  // Log de depuração condicional
  debugIf: (condition: boolean, message: string, context?: LogContext) => {
    if (condition) {
      enhancedLogger.debug(message, context);
    }
  },

  // Log de rate limiting
  rateLimited: (identifier: string, limit: number, current: number, context?: LogContext) => {
    enhancedLogger.warn(`Rate limit exceeded for ${identifier}`, {
      ...context,
      type: 'rate_limit',
      identifier,
      limit,
      current,
      exceeded: current > limit,
    });
  },

  // Log de cache hit/miss
  cache: (operation: string, hit: boolean, key?: string, context?: LogContext) => {
    enhancedLogger.debug(`Cache ${hit ? 'HIT' : 'MISS'}: ${operation}`, {
      ...context,
      type: 'cache',
      operation,
      hit,
      key,
    });
  },

  // Log de database query
  query: (query: string, duration: number, rows?: number, context?: LogContext) => {
    const isSlowQuery = duration > 1000; // queries > 1s são consideradas lentas
    const logLevel = isSlowQuery ? 'warn' : 'debug';

    enhancedLogger.log(logLevel, `Database query executed`, {
      ...context,
      type: 'database',
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''), // Truncar queries longas
      duration,
      rows,
      slowQuery: isSlowQuery,
    });
  },

  // Log para debugging React errors
  reactError: (
    error: Error,
    componentStack?: string,
    errorBoundary?: string,
    context?: LogContext
  ) => {
    enhancedLogger.error(new Error(`React Error: ${error.message}`), {
      ...context,
      type: 'react_error',
      originalError: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack,
      errorBoundary,
      userAgent:
        typeof globalThis !== 'undefined' && 'navigator' in globalThis
          ? (globalThis as any).navigator?.userAgent
          : undefined,
      url:
        typeof globalThis !== 'undefined' && 'location' in globalThis
          ? (globalThis as any).location?.href
          : undefined,
      timestamp: new Date().toISOString(),
    });
  },

  // Log para debugging Next.js SSR/SSG errors
  nextjsError: (error: Error, page?: string, isServerSide?: boolean, context?: LogContext) => {
    enhancedLogger.error(new Error(`Next.js Error: ${error.message}`), {
      ...context,
      type: 'nextjs_error',
      originalError: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      page,
      isServerSide,
      renderContext: isServerSide ? 'server' : 'client',
      timestamp: new Date().toISOString(),
    });
  },

  // Log para debugging authentication errors
  authError: (
    type: 'login' | 'token' | 'permission' | 'session',
    error: Error,
    userId?: string,
    context?: LogContext
  ) => {
    enhancedLogger.security(`Authentication Error [${type}]: ${error.message}`, {
      ...context,
      authErrorType: type,
      userId,
      originalError: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      requiresInvestigation: true,
      timestamp: new Date().toISOString(),
    });
  },
};
// Exports nomeados para compatibilidade
export const logger = enhancedLogger;
export const logError = enhancedLogger.error;
export const logSecurityEvent = enhancedLogger.security;
export const logAuditEvent = enhancedLogger.audit;
export const logPerformance = enhancedLogger.performance;
export const logHttp = enhancedLogger.http;
export const logBusiness = enhancedLogger.business;
export const logMetric = enhancedLogger.metric;

// Export do logger base para casos que precisam do winston diretamente
export const baseWinstonLogger = baseLogger;

// Export default para facilitar importação
export default enhancedLogger;
