import * as winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import * as path from 'path'

// Configuração de níveis de log personalizados
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'gray'
  }
}

// Adicionar cores aos níveis
winston.addColors(customLevels.colors)

// Formatter personalizado para logs estruturados
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
)

// Formatter para console com cores
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`
    
    // Adicionar stack trace se existir
    if (stack) {
      log += `\n${stack}`
    }
    
    // Adicionar metadados se existirem
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`
    }
    
    return log
  })
)

// Configuração de transports para diferentes ambientes
const createTransports = () => {
  const transports: winston.transport[] = []
  
  // Console transport (sempre ativo)
  transports.push(
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'info',
      format: consoleFormat,
      handleExceptions: true,
      handleRejections: true
    })
  )
  
  // File transports para produção
  if (process.env.NODE_ENV === 'production') {
    // Log combinado de todos os níveis
    transports.push(
      new DailyRotateFile({
        filename: path.join(process.cwd(), 'logs', 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: logFormat,
        level: 'info'
      })
    )
    
    // Log específico para erros
    transports.push(
      new DailyRotateFile({
        filename: path.join(process.cwd(), 'logs', 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        format: logFormat,
        level: 'error',
        handleExceptions: true,
        handleRejections: true
      })
    )
    
    // Log específico para HTTP requests
    transports.push(
      new DailyRotateFile({
        filename: path.join(process.cwd(), 'logs', 'http-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '7d',
        format: logFormat,
        level: 'http'
      })
    )
  }
  
  // Logs de desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    transports.push(
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'development.log'),
        format: logFormat,
        level: 'debug',
        maxsize: 10485760, // 10MB
        maxFiles: 3,
        tailable: true
      })
    )
  }
  
  return transports
}

// Criar logger principal
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: createTransports(),
  exitOnError: false,
  silent: process.env.NODE_ENV === 'test'
})

// Middleware para logging de requisições HTTP
export const httpLogger = (req: any, res: any, next: any) => {
  const start = Date.now()
  
  // Log da requisição
  logger.http('Incoming Request', {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    requestId: req.id || generateRequestId()
  })
  
  // Capturar resposta
  const originalSend = res.send
  res.send = function(data: any) {
    const duration = Date.now() - start
    
    logger.http('Outgoing Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: Buffer.byteLength(data),
      timestamp: new Date().toISOString(),
      requestId: req.id || generateRequestId()
    })
    
    return originalSend.call(this, data)
  }
  
  next()
}

// Função para gerar ID único da requisição
const generateRequestId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

// Logger especializado para WhatsApp Service
export const whatsappLogger = logger.child({
  service: 'whatsapp',
  component: 'whatsapp-service'
})

// Logger para autenticação
export const authLogger = logger.child({
  service: 'auth',
  component: 'authentication'
})

// Logger para webhook events
export const webhookLogger = logger.child({
  service: 'webhook',
  component: 'webhook-handler'
})

// Logger para performance monitoring
export const performanceLogger = logger.child({
  service: 'performance',
  component: 'monitoring'
})

// Função para log de métricas de performance
export const logPerformanceMetric = (
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) => {
  performanceLogger.info('Performance Metric', {
    operation,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
    ...metadata
  })
  
  // Log warning se operação demorar muito
  if (duration > 5000) {
    performanceLogger.warn('Slow Operation Detected', {
      operation,
      duration: `${duration}ms`,
      threshold: '5000ms',
      ...metadata
    })
  }
}

// Função para log de erros estruturados
export const logError = (
  error: Error,
  context?: Record<string, any>
) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
    ...context
  })
}

// Função para log de eventos de segurança
export const logSecurityEvent = (
  event: string,
  details: Record<string, any>
) => {
  logger.warn('Security Event', {
    event,
    timestamp: new Date().toISOString(),
    ...details
  })
}

// Função para log de métricas de uso
export const logUsageMetric = (
  metric: string,
  value: number,
  metadata?: Record<string, any>
) => {
  logger.info('Usage Metric', {
    metric,
    value,
    timestamp: new Date().toISOString(),
    ...metadata
  })
}

// Health check logger
export const healthLogger = logger.child({
  service: 'health',
  component: 'health-check'
})

// Configuração de graceful shutdown para logs
process.on('SIGINT', () => {
  logger.info('Application shutting down gracefully')
  process.exit(0)
})

process.on('SIGTERM', () => {
  logger.info('Application received SIGTERM, shutting down gracefully')
  process.exit(0)
})

// Capturar exceções não tratadas
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  })
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise,
    timestamp: new Date().toISOString()
  })
})

export {
  logger,
  logFormat,
  customLevels
}

export default logger
