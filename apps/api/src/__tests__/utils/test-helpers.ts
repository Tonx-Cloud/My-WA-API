import { jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';

// Mock para o logger
export const createMockLogger = () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  security: jest.fn(),
  audit: jest.fn(),
  performance: jest.fn(),
  http: jest.fn(),
  business: jest.fn()
});

// Mock para Request do Express
export const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  body: {},
  query: {},
  params: {},
  headers: {},
  method: 'GET',
  url: '/',
  originalUrl: '/',
  baseUrl: '',
  path: '/',
  hostname: 'localhost',
  ip: '127.0.0.1',
  protocol: 'http',
  secure: false,
  ...overrides
});

// Mock para Response do Express
export const createMockResponse = (): Partial<Response> => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.render = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.header = jest.fn().mockReturnValue(res);
  res.type = jest.fn().mockReturnValue(res);
  res.sendFile = jest.fn().mockReturnValue(res);
  res.download = jest.fn().mockReturnValue(res);
  res.locals = {};
  res.headersSent = false;
  return res;
};

// Mock para NextFunction
export const createMockNext = (): NextFunction => jest.fn();

// Função de delay para testes assíncronos
export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Mock para WhatsApp Client
export const createMockWhatsAppClient = () => ({
  on: jest.fn(),
  initialize: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn().mockResolvedValue(undefined),
  sendMessage: jest.fn().mockResolvedValue({ 
    id: { id: 'mock-message-id' },
    ack: 1,
    from: 'mock@c.us',
    to: 'target@c.us',
    body: 'test message'
  }),
  getState: jest.fn().mockResolvedValue('CONNECTED'),
  getContacts: jest.fn().mockResolvedValue([]),
  getChats: jest.fn().mockResolvedValue([]),
  getChatById: jest.fn().mockResolvedValue(null),
  getContactById: jest.fn().mockResolvedValue(null),
  logout: jest.fn().mockResolvedValue(undefined),
  pupPage: {
    evaluate: jest.fn().mockResolvedValue({}),
    close: jest.fn().mockResolvedValue(undefined)
  }
});

// Mock para Socket.IO Server
export const createMockSocketServer = () => ({
  on: jest.fn(),
  emit: jest.fn(),
  to: jest.fn().mockReturnValue({
    emit: jest.fn()
  }),
  use: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
  sockets: {
    emit: jest.fn()
  }
});

// Mock para Socket.IO Client
export const createMockSocket = () => ({
  id: 'mock-socket-id',
  on: jest.fn(),
  emit: jest.fn(),
  join: jest.fn(),
  leave: jest.fn(),
  disconnect: jest.fn(),
  handshake: {
    query: {},
    headers: {},
    address: '127.0.0.1',
    time: new Date().toISOString()
  },
  rooms: new Set(),
  data: {}
});

// Utilitário para criar dados de teste
export const createTestData = {
  whatsappMessage: (overrides = {}) => ({
    id: { id: 'test-message-id' },
    body: 'Test message',
    from: 'test@c.us',
    to: 'receiver@c.us',
    timestamp: Math.floor(Date.now() / 1000),
    type: 'chat',
    ack: 1,
    ...overrides
  }),

  contact: (overrides = {}) => ({
    id: { user: 'test', server: 'c.us', _serialized: 'test@c.us' },
    name: 'Test Contact',
    pushname: 'Test',
    number: '+1234567890',
    isMyContact: false,
    isUser: true,
    isGroup: false,
    isBusiness: false,
    ...overrides
  }),

  chat: (overrides = {}) => ({
    id: { user: 'test', server: 'c.us', _serialized: 'test@c.us' },
    name: 'Test Chat',
    isGroup: false,
    isReadOnly: false,
    unreadCount: 0,
    timestamp: Math.floor(Date.now() / 1000),
    ...overrides
  }),

  healthCheck: (overrides = {}) => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    system: {
      memory: {
        total: 8589934592,
        used: 4294967296,
        percentage: 50
      },
      cpu: {
        loadAverage: [1.5, 1.2, 1.0]
      },
      disk: {
        total: 1000000000000,
        used: 500000000000,
        percentage: 50
      }
    },
    checks: [],
    ...overrides
  })
};

// Utilitário para aguardar condições em testes
export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await delay(interval);
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};

// Utilitário para capturar console.logs durante testes
export const captureConsole = () => {
  const logs: string[] = [];
  const originalLog = console.log;
  
  console.log = (...args: any[]) => {
    logs.push(args.map(arg => String(arg)).join(' '));
  };
  
  return {
    getLogs: () => [...logs],
    restore: () => {
      console.log = originalLog;
    }
  };
};

// Mock para Performance Service
export const createMockPerformanceService = () => ({
  recordMetric: jest.fn(),
  getSummary: jest.fn().mockReturnValue({
    count: 1,
    averageDuration: 100,
    minDuration: 100,
    maxDuration: 100,
    totalDuration: 100
  }),
  startTimer: jest.fn().mockReturnValue('timer-id'),
  endTimer: jest.fn(),
  getMetrics: jest.fn().mockReturnValue([]),
  clearMetrics: jest.fn()
});

// Mock para Backup Service
export const createMockBackupService = () => ({
  createBackup: jest.fn().mockResolvedValue({
    id: 'backup-id',
    timestamp: new Date(),
    type: 'full',
    size: 1024,
    path: '/mock/backup/path',
    status: 'completed'
  }),
  restoreBackup: jest.fn().mockResolvedValue(true),
  listBackups: jest.fn().mockResolvedValue([]),
  deleteBackup: jest.fn().mockResolvedValue(true)
});

export default {
  createMockLogger,
  createMockRequest,
  createMockResponse,
  createMockNext,
  delay,
  createMockWhatsAppClient,
  createMockSocketServer,
  createMockSocket,
  createTestData,
  waitFor,
  captureConsole,
  createMockPerformanceService,
  createMockBackupService
};
