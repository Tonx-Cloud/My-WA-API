import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'

// Definir níveis customizados
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
    silly: 9
  }
}

// Criar o logger base
const baseLogger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'my-wa-api',
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'localhost'
  },
  transports: []
})

// Configurar transports baseado no ambiente
const isDevelopment = process.env.NODE_ENV !== 'production'
const isTest = process.env.NODE_ENV === 'test'

if (!isTest) {
  // Console transport para desenvolvimento
  if (isDevelopment) {
    baseLogger.add(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }))
  }

  // Transports de arquivo
  baseLogger.add(new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }))

  baseLogger.add(new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }))

  // Rotação diária para logs de segurança
  baseLogger.add(new DailyRotateFile({
    filename: path.join(process.cwd(), 'logs', 'security-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'security',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '90d'
  }))

  // Transport separado para logs de auditoria
  baseLogger.add(new DailyRotateFile({
    filename: path.join(process.cwd(), 'logs', 'audit-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'audit',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d'
  }))

  // Transport separado para logs de performance
  baseLogger.add(new DailyRotateFile({
    filename: path.join(process.cwd(), 'logs', 'performance-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'performance',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '7d'
  }))
}

// Interceptar erros não tratados
baseLogger.exceptions.handle(
  new winston.transports.File({ 
    filename: path.join(process.cwd(), 'logs', 'exceptions.log') 
  })
)

baseLogger.rejections.handle(
  new winston.transports.File({ 
    filename: path.join(process.cwd(), 'logs', 'rejections.log') 
  })
)

export const enhancedLogger = {
  ...baseLogger,

  // Log de evento de segurança
  security: (message: string, context?: any) => {
    baseLogger.log('security', message, { 
      type: 'security',
      context,
      timestamp: new Date().toISOString()
    })
  },

  // Log de auditoria de usuário
  audit: (action: string, userId?: string, context?: any) => {
    baseLogger.log('audit', `User action: ${action}`, {
      type: 'audit',
      action,
      userId,
      context,
      timestamp: new Date().toISOString()
    })
  },

  // Log de performance
  performance: (operation: string, duration: number, context?: any) => {
    baseLogger.log('performance', `Performance: ${operation}`, {
      type: 'performance',
      operation,
      duration,
      context,
      timestamp: new Date().toISOString()
    })
  },

  // Log de requisições HTTP
  http: (method: string, url: string, statusCode: number, duration: number, context?: any) => {
    baseLogger.log('http', `${method} ${url} ${statusCode} - ${duration}ms`, {
      type: 'http',
      method,
      url,
      statusCode,
      duration,
      context,
      timestamp: new Date().toISOString()
    })
  },

  // Log de erro estruturado
  error: (error: Error, context?: any) => {
    baseLogger.error(error.message, {
      type: 'error',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      timestamp: new Date().toISOString()
    })
  },

  // Log de evento de negócio
  business: (event: string, data?: any) => {
    baseLogger.info(`Business Event: ${event}`, {
      type: 'business',
      event,
      data,
      timestamp: new Date().toISOString()
    })
  },

  // Log de métrica
  metric: (name: string, value: number, unit?: string, tags?: Record<string, string>) => {
    baseLogger.info(`Metric: ${name}`, {
      type: 'metric',
      metric: {
        name,
        value,
        unit,
        tags
      },
      timestamp: new Date().toISOString()
    })
  }
}

// Middleware HTTP para Express
export const httpMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    enhancedLogger.http(req.method, req.url, res.statusCode, duration, {
      userAgent: req.get('User-Agent'),
      ip: req.ip
    })
  })
  
  next()
}

// Exports nomeados para compatibilidade
export const logger = enhancedLogger
export const logError = enhancedLogger.error
export const logSecurityEvent = enhancedLogger.security
export const logAuditEvent = enhancedLogger.audit
export const logPerformance = enhancedLogger.performance
export const logHttp = enhancedLogger.http
export const logBusiness = enhancedLogger.business
export const logMetric = enhancedLogger.metric

// Export adicional para middleware HTTP
export const httpLogger = httpMiddleware

// Export adicional para performance monitor
export const performanceLogger = {
  debug: enhancedLogger.debug,
  info: enhancedLogger.info,
  warn: enhancedLogger.warn,
  error: enhancedLogger.error,
  performance: enhancedLogger.performance
}
export const logPerformanceMetric = enhancedLogger.performance

export default enhancedLogger
