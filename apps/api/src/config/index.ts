/**
 * Configuração principal da aplicação
 * Centraliza todas as configurações baseadas em variáveis de ambiente
 */

export const config = {
  // Configurações do servidor
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  },

  // Configurações de log
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.NODE_ENV !== 'production',
    enableFile: true,
    maxFileSize: '20m',
    maxFiles: '14d',
  },

  // Configurações de segurança
  security: {
    jwtSecret: process.env.JWT_SECRET || 'development-secret-change-in-production',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    sessionSecret: process.env.SESSION_SECRET || 'development-session-secret',
  },

  // Configurações de rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutos
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // Configurações do WhatsApp
  whatsapp: {
    sessionPath: process.env.WHATSAPP_SESSION_PATH || './sessions',
    maxInstances: parseInt(process.env.WHATSAPP_MAX_INSTANCES || '5', 10),
    puppeteerOptions: {
      headless: process.env.WHATSAPP_HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions', '--disable-gpu'],
    },
  },

  // Configurações de banco de dados
  database: {
    type: process.env.DB_TYPE || 'sqlite',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'my_wa_api',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
  },

  // Configurações de cache/Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'my-wa-api:',
  },

  // Configurações de monitoramento
  monitoring: {
    enableHealthCheck: true,
    enableMetrics: true,
    metricsPath: '/metrics',
    healthCheckPath: '/health',
  },
};

// Configurações específicas por ambiente
export const getEnvConfig = () => {
  if (config.server.isProduction) {
    return {
      ...config,
      logging: {
        ...config.logging,
        level: 'info',
        enableConsole: false,
      },
    };
  }

  if (config.server.isTest) {
    return {
      ...config,
      logging: {
        ...config.logging,
        level: 'error',
        enableConsole: false,
        enableFile: false,
      },
      whatsapp: {
        ...config.whatsapp,
        maxInstances: 1,
      },
    };
  }

  return config;
};

export default config;
