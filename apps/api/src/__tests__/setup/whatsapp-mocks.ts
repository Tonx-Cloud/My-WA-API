/**
 * Mock completo para whatsapp-web.js
 * @fileoverview Este arquivo contém apenas mocks - não executa testes
 */
export const mockWhatsAppClient = {
  initialize: jest.fn().mockResolvedValue(undefined),
  getState: jest.fn().mockResolvedValue('CONNECTED'),
  sendMessage: jest.fn().mockImplementation((chatId: string, message: string) => ({
    id: `msg_${Date.now()}`,
    body: message,
    to: chatId,
    from: 'test@c.us',
    timestamp: Date.now(),
    ack: 1,
  })),
  destroy: jest.fn().mockResolvedValue(undefined),
  logout: jest.fn().mockResolvedValue(undefined),
  getContacts: jest.fn().mockResolvedValue([
    {
      id: { user: 'contact1', server: 'c.us' },
      name: 'Test Contact 1',
      pushname: 'Test Contact 1',
    },
  ]),
  getChatById: jest.fn().mockImplementation((chatId: string) => ({
    id: { user: chatId.split('@')[0], server: 'c.us' },
    name: 'Test Chat',
    isGroup: false,
    participants: [],
  })),
  on: jest.fn(),
  removeAllListeners: jest.fn(),
  pupPage: {
    evaluate: jest.fn().mockResolvedValue('mock-qr-code'),
  },
};

export const mockLocalAuth = jest.fn().mockImplementation(() => ({
  clientId: 'test-client',
}));

// Mock para whatsapp-web.js
jest.mock('whatsapp-web.js', () => ({
  Client: jest.fn().mockImplementation(() => mockWhatsAppClient),
  LocalAuth: mockLocalAuth,
  MessageMedia: {
    fromFilePath: jest.fn().mockImplementation((path: string) => ({
      mimetype: 'image/jpeg',
      data: 'base64-mock-data',
      filename: path.split('/').pop(),
    })),
  },
}));

// Mock para QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
}));

// Mock para logger service
export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  startOperation: jest.fn().mockReturnValue('op-id'),
  endOperation: jest.fn(),
  logPerformance: jest.fn(),
};

jest.mock('../../config/logger', () => mockLogger);
jest.mock('../../config/enhanced-logger', () => mockLogger);

// Mock para file system operations
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('mock file content'),
  writeFile: jest.fn().mockResolvedValue(undefined),
  copy: jest.fn().mockResolvedValue(undefined),
  pathExists: jest.fn().mockResolvedValue(true),
  readdir: jest.fn().mockResolvedValue([]),
}));

// Mock para path operations
jest.mock('path', () => ({
  join: jest.fn().mockImplementation((...args: string[]) => args.join('/')),
  resolve: jest.fn().mockImplementation((...args: string[]) => args.join('/')),
}));

export { mockWhatsAppClient as default };
