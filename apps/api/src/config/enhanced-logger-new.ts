import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

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
    silly: 9,
  },
};

// Criar o logger base
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss.SSS",
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: {
    service: "my-wa-api",
    pid: process.pid,
    hostname: process.env.HOSTNAME || "localhost",
  },
  transports: [],
});

// Configurar transports baseado no ambiente
const isDevelopment = process.env.NODE_ENV !== "production";
const isTest = process.env.NODE_ENV === "test";

if (!isTest) {
  // Console transport para desenvolvimento
  if (isDevelopment) {
    logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
        ),
      }),
    );
  }

  // File transport para logs de erro
  logger.add(
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  );

  // File transport para todos os logs
  logger.add(
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  );

  // Rotate file transport para logs diários
  logger.add(
    new DailyRotateFile({
      filename: path.join(process.cwd(), "logs", "api-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
  );

  // Transport separado para logs de segurança
  logger.add(
    new DailyRotateFile({
      filename: path.join(process.cwd(), "logs", "security-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "security",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
    }),
  );

  // Transport separado para logs de auditoria
  logger.add(
    new DailyRotateFile({
      filename: path.join(process.cwd(), "logs", "audit-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "audit",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
    }),
  );

  // Transport separado para logs de performance
  logger.add(
    new DailyRotateFile({
      filename: path.join(process.cwd(), "logs", "performance-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "performance",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "7d",
    }),
  );
}

// Interceptar erros não tratados
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(process.cwd(), "logs", "exceptions.log"),
  }),
);

logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(process.cwd(), "logs", "rejections.log"),
  }),
);

// Métodos de conveniência para diferentes tipos de log
export const enhancedLogger = {
  ...logger,

  // Log de segurança
  security: (message: string, meta?: any) => {
    logger.log("security", message, {
      type: "security",
      timestamp: new Date().toISOString(),
      ...meta,
    });
  },

  // Log de auditoria
  audit: (action: string, userId?: string, meta?: any) => {
    logger.log("audit", `User action: ${action}`, {
      type: "audit",
      action,
      userId,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  },

  // Log de performance
  performance: (operation: string, duration: number, meta?: any) => {
    logger.log("performance", `Performance: ${operation}`, {
      type: "performance",
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  },

  // Log HTTP
  http: (
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    meta?: any,
  ) => {
    logger.log("http", `${method} ${url} ${statusCode} - ${duration}ms`, {
      type: "http",
      method,
      url,
      statusCode,
      duration,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  },

  // Log de erro estruturado
  errorStructured: (error: Error, context?: any) => {
    logger.error(error.message, {
      type: "error",
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      timestamp: new Date().toISOString(),
    });
  },

  // Log de evento de negócio
  business: (event: string, data?: any) => {
    logger.info(`Business Event: ${event}`, {
      type: "business",
      event,
      data,
      timestamp: new Date().toISOString(),
    });
  },

  // Log de métrica
  metric: (
    name: string,
    value: number,
    unit?: string,
    tags?: Record<string, string>,
  ) => {
    logger.info(`Metric: ${name}`, {
      type: "metric",
      metric: {
        name,
        value,
        unit,
        tags,
      },
      timestamp: new Date().toISOString(),
    });
  },
};

export default enhancedLogger;
