/**
 * Mock completo para serviços de validação e middleware
 * @fileoverview Este arquivo contém apenas mocks - não executa testes
 */

// Mock para validator
export const mockValidator = {
  isEmail: jest.fn().mockReturnValue(true),
  isPhoneNumber: jest.fn().mockReturnValue(true),
  isURL: jest.fn().mockReturnValue(true),
  isEmpty: jest.fn().mockReturnValue(false),
  isLength: jest.fn().mockReturnValue(true),
  escape: jest.fn().mockImplementation((str: string) => str),
  trim: jest.fn().mockImplementation((str: string) => str.trim()),
  normalizeEmail: jest
    .fn()
    .mockImplementation((email: string) => email.toLowerCase()),
};

// Mock para middleware de validação
export const mockValidationMiddleware = {
  validateInstanceCreation: jest
    .fn()
    .mockImplementation((req: any, res: any, next: any) => next()),
  validateMessageData: jest
    .fn()
    .mockImplementation((req: any, res: any, next: any) => next()),
  validateWebhookData: jest
    .fn()
    .mockImplementation((req: any, res: any, next: any) => next()),
  validatePhoneNumber: jest
    .fn()
    .mockImplementation((req: any, res: any, next: any) => next()),
  sanitizeInput: jest
    .fn()
    .mockImplementation((req: any, res: any, next: any) => {
      // Basic sanitization mock
      if (req.body) {
        Object.keys(req.body).forEach((key) => {
          if (typeof req.body[key] === "string") {
            req.body[key] = req.body[key].replace(/[<>'"&]/g, "");
          }
        });
      }
      next();
    }),
};

// Mock para middleware de segurança
export const mockSecurityMiddleware = {
  authenticateToken: jest
    .fn()
    .mockImplementation((req: any, res: any, next: any) => {
      req.user = { id: "mock-user-id", role: "admin" };
      next();
    }),

  checkPermissions: jest.fn().mockImplementation((permissions: string[]) => {
    return (req: any, res: any, next: any) => {
      req.permissions = permissions;
      next();
    };
  }),

  rateLimitMiddleware: jest
    .fn()
    .mockImplementation((req: any, res: any, next: any) => next()),

  corsMiddleware: jest
    .fn()
    .mockImplementation((req: any, res: any, next: any) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization",
      );
      next();
    }),

  helmetMiddleware: jest
    .fn()
    .mockImplementation((req: any, res: any, next: any) => {
      res.header("X-Frame-Options", "DENY");
      res.header("X-Content-Type-Options", "nosniff");
      res.header("X-XSS-Protection", "1; mode=block");
      next();
    }),
};

// Mock para serviços de criptografia
export const mockCryptoService = {
  encrypt: jest.fn().mockImplementation((text: string) => `encrypted_${text}`),
  decrypt: jest
    .fn()
    .mockImplementation((encryptedText: string) =>
      encryptedText.replace("encrypted_", ""),
    ),

  hash: jest.fn().mockImplementation((text: string) => `hash_${text}`),
  compareHash: jest.fn().mockReturnValue(true),

  generateToken: jest.fn().mockReturnValue("mock-jwt-token"),
  verifyToken: jest
    .fn()
    .mockReturnValue({ id: "user-id", exp: Date.now() + 3600000 }),

  generateApiKey: jest.fn().mockReturnValue("mock-api-key-12345"),
  validateApiKey: jest.fn().mockReturnValue(true),
};

// Mock para serviços de notificação
export const mockNotificationService = {
  sendEmail: jest.fn().mockResolvedValue({
    success: true,
    messageId: "mock-email-id",
  }),

  sendSMS: jest.fn().mockResolvedValue({
    success: true,
    messageId: "mock-sms-id",
  }),

  sendWebhook: jest.fn().mockResolvedValue({
    success: true,
    statusCode: 200,
    response: "OK",
  }),

  sendSlackNotification: jest.fn().mockResolvedValue({
    success: true,
    channel: "mock-channel",
  }),

  sendDiscordNotification: jest.fn().mockResolvedValue({
    success: true,
    channelId: "mock-discord-channel",
  }),
};

// Mock para métricas e analytics
export const mockAnalyticsService = {
  trackEvent: jest.fn().mockResolvedValue(undefined),

  recordMetric: jest.fn().mockImplementation((name: string, value: number) => ({
    name,
    value,
    timestamp: Date.now(),
  })),

  getMetrics: jest.fn().mockReturnValue({
    totalRequests: 1000,
    averageResponseTime: 150,
    errorRate: 0.02,
    uptime: 99.99,
  }),

  generateReport: jest.fn().mockResolvedValue({
    period: "daily",
    metrics: {
      requests: 1000,
      errors: 20,
      responseTime: 150,
    },
    generatedAt: new Date().toISOString(),
  }),
};

// Export principal para uso nos testes
export const mockMiddlewareServices = {
  validator: mockValidator,
  validation: mockValidationMiddleware,
  security: mockSecurityMiddleware,
  crypto: mockCryptoService,
  notification: mockNotificationService,
  analytics: mockAnalyticsService,

  // Reset function para limpar todos os mocks
  __resetAll: jest.fn().mockImplementation(() => {
    Object.values(mockValidator).forEach((mock) => {
      if (typeof mock === "function" && mock.mockClear) {
        mock.mockClear();
      }
    });

    Object.values(mockValidationMiddleware).forEach((mock) => {
      if (typeof mock === "function" && mock.mockClear) {
        mock.mockClear();
      }
    });

    Object.values(mockSecurityMiddleware).forEach((mock) => {
      if (typeof mock === "function" && mock.mockClear) {
        mock.mockClear();
      }
    });

    Object.values(mockCryptoService).forEach((mock) => {
      if (typeof mock === "function" && mock.mockClear) {
        mock.mockClear();
      }
    });

    Object.values(mockNotificationService).forEach((mock) => {
      if (typeof mock === "function" && mock.mockClear) {
        mock.mockClear();
      }
    });

    Object.values(mockAnalyticsService).forEach((mock) => {
      if (typeof mock === "function" && mock.mockClear) {
        mock.mockClear();
      }
    });
  }),
};

export default mockMiddlewareServices;

// Prevent Jest from running this file as a test
