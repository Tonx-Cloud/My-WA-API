import { jest } from '@jest/globals';
import path from 'path';
import fs from 'fs';

// Configurar timeout global para testes assÃ­ncronos longos
jest.setTimeout(30000);

// Garantir que o diretÃ³rio de logs existe
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Mock para Winston Logger - resolver problema com exceptions/rejections
jest.mock('winston', () => {
  const mockTransport = {
    format: jest.fn(),
    level: 'info',
    silent: false,
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
    security: jest.fn(),
    audit: jest.fn(),
    performance: jest.fn(),
    http: jest.fn(),
    business: jest.fn(),
    level: 'info',
    transports: [mockTransport],
    format: jest.fn(),
    exceptions: {
      handle: jest.fn(),
    },
    rejections: {
      handle: jest.fn(),
    },
    add: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    close: jest.fn(),
  };

  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      timestamp: jest.fn(() => jest.fn()),
      errors: jest.fn(() => jest.fn()),
      printf: jest.fn(() => jest.fn()),
      json: jest.fn(() => jest.fn()),
      colorize: jest.fn(() => jest.fn()),
      combine: jest.fn((...args) => args),
      simple: jest.fn(() => jest.fn()),
      label: jest.fn(() => jest.fn()),
      splat: jest.fn(() => jest.fn()),
    },
    transports: {
      Console: jest.fn(() => mockTransport),
      File: jest.fn(() => mockTransport),
    },
    config: {
      npm: {
        levels: {
          error: 0,
          warn: 1,
          info: 2,
          verbose: 3,
          debug: 4,
          silly: 5,
        },
      },
    },
  };
});

// Mock para winston-daily-rotate-file
jest.mock('winston-daily-rotate-file', () => {
  return jest.fn(() => ({
    format: jest.fn(),
    level: 'info',
    silent: false,
  }));
});

// Mock para loggers especÃ­ficos do projeto
jest.mock('../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  security: jest.fn(),
  audit: jest.fn(),
  performance: jest.fn(),
  http: jest.fn(),
  business: jest.fn(),
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  security: jest.fn(),
  audit: jest.fn(),
  performance: jest.fn(),
  http: jest.fn(),
  business: jest.fn(),
}));

// Mock para enhanced-logger
jest.mock('../config/enhanced-logger', () => ({
  enhancedLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    security: jest.fn(),
    audit: jest.fn(),
    performance: jest.fn(),
    http: jest.fn(),
    business: jest.fn(),
  },
}));

// Mock para mÃ³dulos Socket.IO problemÃ¡ticos
jest.mock('socket.io', () => ({
  Server: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
    use: jest.fn(),
    close: jest.fn(),
  })),
}));

// Mock para WhatsApp Web.js
jest.mock('whatsapp-web.js', () => ({
  Client: jest.fn(() => ({
    on: jest.fn(),
    initialize: jest.fn(),
    destroy: jest.fn(),
    sendMessage: jest.fn(),
    getState: jest.fn(),
    getContacts: jest.fn(),
    getChats: jest.fn(),
    getChatById: jest.fn(),
    getContactById: jest.fn(),
    logout: jest.fn(),
  })),
  LocalAuth: jest.fn(),
  MessageMedia: {
    fromFilePath: jest.fn(),
    fromUrl: jest.fn(),
  },
  MessageTypes: {
    TEXT: 'chat',
    AUDIO: 'audio',
    VOICE: 'ptt',
    IMAGE: 'image',
    VIDEO: 'video',
    DOCUMENT: 'document',
  },
}));

// Mock para mÃ³dulos de sistema que podem nÃ£o estar disponÃ­veis
jest.mock('ws', () => ({
  Server: jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn(),
    clients: new Set(),
  })),
}));

// Mock para SQLite (se usado)
jest.mock('sqlite3', () => ({
  Database: jest.fn(() => ({
    run: jest.fn((sql, params, callback) => callback?.(null)),
    get: jest.fn((sql, params, callback) => callback?.(null, {})),
    all: jest.fn((sql, params, callback) => callback?.(null, [])),
    close: jest.fn(callback => callback?.()),
  })),
}));

// Configurar variÃ¡veis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.LOG_LEVEL = 'error'; // Reduzir logs durante testes

// Silenciar console.log durante testes (opcional)
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Cleanup apÃ³s cada teste
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handlers para testes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});

export {};
