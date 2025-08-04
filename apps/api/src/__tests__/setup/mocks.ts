// ConfiguraÃ§Ã£o de mocks para testes
export const mockDatabase = {
  initDatabase: jest.fn().mockResolvedValue(undefined),
};

export const mockPassport = {
  initializePassport: jest.fn(),
};

export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

export const mockHealthRoutes = {
  get: jest.fn(),
  use: jest.fn(),
};

export const mockInstanceRoutes = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

export const mockMessageRoutes = {
  get: jest.fn(),
  post: jest.fn(),
};

export const mockAuthRoutes = {
  get: jest.fn(),
  post: jest.fn(),
};

export const mockWebhookRoutes = {
  get: jest.fn(),
  post: jest.fn(),
};

// Mock das rotas para retornar objetos Express Router-like
jest.mock('../routes/health', () => mockHealthRoutes);
jest.mock('../routes/instances', () => mockInstanceRoutes);
jest.mock('../routes/messages', () => mockMessageRoutes);
jest.mock('../routes/auth', () => mockAuthRoutes);
jest.mock('../routes/webhooks', () => mockWebhookRoutes);

// Mock dos serviÃ§os
jest.mock('../config/database', () => mockDatabase);
jest.mock('../config/passport', () => mockPassport);
jest.mock('../config/logger', () => mockLogger);
jest.mock('../config/enhanced-logger', () => ({
  httpLogger: jest.fn((req: any, res: any, next: any) => next()),
  healthLogger: mockLogger,
  performanceLogger: mockLogger,
  securityLogger: mockLogger,
  logger: mockLogger,
}));
