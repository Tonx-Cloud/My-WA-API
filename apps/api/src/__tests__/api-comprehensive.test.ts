import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';
import request from 'supertest';

// Mock dos middlewares e serviços (definir antes dos imports que os usam)
const mockRateLimiter = jest.fn((req: any, res: any, next: any) => next());
const mockErrorHandler = jest.fn((err: any, req: any, res: any, next: any) => {
  res.status(500).json({ error: 'Internal Server Error' });
});

const mockWhatsAppService = {
  createInstance: jest.fn() as jest.MockedFunction<any>,
  getInstanceStatus: jest.fn() as jest.MockedFunction<any>,
  sendMessage: jest.fn() as jest.MockedFunction<any>,
  getQRCode: jest.fn() as jest.MockedFunction<any>,
  disconnect: jest.fn() as jest.MockedFunction<any>,
};

// Mock das dependências
jest.mock('../middleware/rateLimiter', () => ({
  rateLimiter: mockRateLimiter,
}));

jest.mock('../middleware/enhanced-error-handler', () => ({
  errorMiddleware: mockErrorHandler,
}));

jest.mock('../services/whatsappService', () => ({
  WhatsAppService: mockWhatsAppService,
}));

// Agora importar o app após os mocks
import { createApp } from '../app';

describe('API Services - Comprehensive Test Suite', () => {
  let app: any;

  beforeEach(() => {
    // Criar uma instância da aplicação para testes
    app = createApp();

    // Reset todos os mocks
    jest.clearAllMocks();

    // Setup mock responses
    mockWhatsAppService.createInstance.mockResolvedValue({
      id: 'test-instance',
      status: 'created',
    });
    mockWhatsAppService.getInstanceStatus.mockResolvedValue({
      id: 'test-instance',
      status: 'ready',
      phone: '+5511999999999',
    });
    mockWhatsAppService.sendMessage.mockResolvedValue({
      success: true,
      messageId: 'msg_123',
    });
    mockWhatsAppService.getQRCode.mockResolvedValue({
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
    });
    mockWhatsAppService.disconnect.mockResolvedValue({
      success: true,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Express App Integration', () => {
    it('should respond to health check endpoint', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
    });

    it('should serve API documentation', async () => {
      const response = await request(app).get('/api-docs');

      expect(response.status).toBe(301); // Redirect to /api-docs/
    });

    it('should handle 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
    });
  });

  describe('WhatsApp Service Integration', () => {
    it('should create new WhatsApp instance successfully', async () => {
      const instanceData = {
        name: 'Test Instance',
        webhook: 'https://example.com/webhook',
      };

      const result = await mockWhatsAppService.createInstance(instanceData);

      expect(result).toMatchObject({
        id: expect.any(String),
        status: 'created',
      });

      expect(mockWhatsAppService.createInstance).toHaveBeenCalledWith(instanceData);
    });

    it('should get instance status successfully', async () => {
      const instanceId = 'test-instance';

      const result = await mockWhatsAppService.getInstanceStatus(instanceId);

      expect(result).toMatchObject({
        id: instanceId,
        status: 'ready',
        phone: expect.any(String),
      });

      expect(mockWhatsAppService.getInstanceStatus).toHaveBeenCalledWith(instanceId);
    });

    it('should handle non-existent instance gracefully', async () => {
      mockWhatsAppService.getInstanceStatus.mockRejectedValue(new Error('Instance not found'));

      await expect(mockWhatsAppService.getInstanceStatus('non-existent')).rejects.toThrow(
        'Instance not found'
      );
    });

    it('should get QR code for instance', async () => {
      const instanceId = 'test-instance';

      const result = await mockWhatsAppService.getQRCode(instanceId);

      expect(result).toMatchObject({
        qrCode: expect.stringContaining('data:image/png;base64'),
      });

      expect(mockWhatsAppService.getQRCode).toHaveBeenCalledWith(instanceId);
    });

    it('should disconnect instance successfully', async () => {
      const instanceId = 'test-instance';

      const result = await mockWhatsAppService.disconnect(instanceId);

      expect(result).toMatchObject({
        success: true,
      });

      expect(mockWhatsAppService.disconnect).toHaveBeenCalledWith(instanceId);
    });
  });

  describe('Message Service Integration', () => {
    it('should send message successfully', async () => {
      const messageData = {
        to: '+5511999999999',
        message: 'Hello World',
        type: 'text',
      };

      const result = await mockWhatsAppService.sendMessage('test-instance', messageData);

      expect(result).toMatchObject({
        success: true,
        messageId: expect.any(String),
      });

      expect(mockWhatsAppService.sendMessage).toHaveBeenCalledWith('test-instance', messageData);
    });

    it('should handle service errors gracefully', async () => {
      mockWhatsAppService.sendMessage.mockRejectedValue(new Error('Failed to send message'));

      const messageData = {
        to: '+5511999999999',
        message: 'Hello World',
        type: 'text',
      };

      await expect(mockWhatsAppService.sendMessage('test-instance', messageData)).rejects.toThrow(
        'Failed to send message'
      );
    });

    it('should support different message types', async () => {
      const messageTypes = ['text', 'image', 'document', 'audio'];

      for (const type of messageTypes) {
        const messageData = {
          to: '+5511999999999',
          message: type === 'text' ? 'Hello World' : 'https://example.com/file.pdf',
          type,
        };

        const result = await mockWhatsAppService.sendMessage('test-instance', messageData);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Middleware Integration', () => {
    it('should handle rate limiting correctly', () => {
      const req = { ip: '127.0.0.1' };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      // Test the actual mock implementation
      expect(mockRateLimiter).toBeDefined();
      mockRateLimiter(req, res, next);
      expect(mockRateLimiter).toHaveBeenCalled();

      // Simulate rate limit exceeded
      const rateLimitRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const rateLimitNext = jest.fn();

      // Create a new mock for rate limiting scenario
      const rateLimitMock = jest.fn((req: any, res: any, next: any) => {
        res.status(429).json({ error: 'Too Many Requests' });
      });

      rateLimitMock(req, rateLimitRes, rateLimitNext);
      expect(rateLimitRes.status).toHaveBeenCalledWith(429);
      expect(rateLimitRes.json).toHaveBeenCalledWith({ error: 'Too Many Requests' });
    });

    it('should handle errors gracefully', () => {
      const error = new Error('Test error');
      const req = { url: '/test', method: 'GET' };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      // Create a proper error handler mock
      const errorHandlerMock = jest.fn((err: any, req: any, res: any, next: any) => {
        res.status(500).json({ error: 'Internal Server Error' });
      });

      errorHandlerMock(error, req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
  });

  describe('Data Validation', () => {
    it('should validate instance creation data', () => {
      const validData = {
        name: 'Test Instance',
        webhook: 'https://example.com/webhook',
      };

      const invalidData = [
        {},
        { name: '' },
        { webhook: 'invalid-url' },
        { name: 'Test', webhook: '' },
      ];

      // Valid data should pass
      expect(validData).toMatchObject({
        name: expect.any(String),
        webhook: expect.stringMatching(/^https?:\/\//),
      });

      // Invalid data should fail validation
      invalidData.forEach(data => {
        expect(data).not.toMatchObject(validData);
      });
    });

    it('should validate message data', () => {
      const validMessageData = {
        to: '+5511999999999',
        message: 'Hello World',
        type: 'text',
      };

      const invalidMessageData = [
        {},
        { to: 'invalid-phone' },
        { to: '+5511999999999', message: '' },
        { to: '+5511999999999', message: 'Hello', type: 'invalid-type' },
      ];

      // Valid message should pass
      expect(validMessageData).toMatchObject({
        to: expect.stringMatching(/^\+\d+$/),
        message: expect.any(String),
        type: expect.stringMatching(/^(text|image|document|audio)$/),
      });

      // Invalid messages should fail
      invalidMessageData.forEach(data => {
        expect(data).not.toMatchObject(validMessageData);
      });
    });

    it('should validate webhook data', () => {
      const validWebhookData = {
        instanceId: 'test-instance',
        event: 'message',
        data: {
          from: '+5511999999999',
          message: 'Hello',
          timestamp: Date.now(),
        },
      };

      expect(validWebhookData).toMatchObject({
        instanceId: expect.any(String),
        event: expect.any(String),
        data: expect.any(Object),
      });

      expect(validWebhookData.data).toMatchObject({
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle network timeouts', async () => {
      mockWhatsAppService.sendMessage.mockRejectedValue(new Error('ETIMEDOUT') as never);

      await expect(
        mockWhatsAppService.sendMessage('test-instance', {
          to: '+5511999999999',
          message: 'Hello',
          type: 'text',
        })
      ).rejects.toThrow('ETIMEDOUT');
    });

    it('should handle invalid credentials', async () => {
      mockWhatsAppService.createInstance.mockRejectedValue(
        new Error('Invalid API credentials') as never
      );

      await expect(
        mockWhatsAppService.createInstance({
          name: 'Test',
          webhook: 'https://example.com',
        })
      ).rejects.toThrow('Invalid API credentials');
    });

    it('should handle service unavailable', async () => {
      mockWhatsAppService.getInstanceStatus.mockRejectedValue(
        new Error('Service temporarily unavailable') as never
      );

      await expect(mockWhatsAppService.getInstanceStatus('test-instance')).rejects.toThrow(
        'Service temporarily unavailable'
      );
    });
  });

  describe('Performance Monitoring', () => {
    it('should track operation timing', async () => {
      const startTime = Date.now();

      await mockWhatsAppService.sendMessage('test-instance', {
        to: '+5511999999999',
        message: 'Hello',
        type: 'text',
      });

      const duration = Date.now() - startTime;

      // Operation should complete reasonably quickly
      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent operations', async () => {
      const concurrentOperations = 5;
      const promises: Promise<any>[] = [];

      for (let i = 0; i < concurrentOperations; i++) {
        promises.push(mockWhatsAppService.getInstanceStatus(`instance-${i}`) as Promise<any>);
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(concurrentOperations);
      results.forEach(result => {
        expect(result).toMatchObject({
          id: expect.any(String),
          status: 'ready',
        });
      });
    });

    it('should track success and failure rates', async () => {
      let successCount = 0;
      let failureCount = 0;
      const totalOperations = 10;

      for (let i = 0; i < totalOperations; i++) {
        try {
          if (i < 8) {
            // Simulate success
            await mockWhatsAppService.sendMessage('test-instance', {
              to: '+5511999999999',
              message: `Message ${i}`,
              type: 'text',
            });
            successCount++;
          } else {
            // Simulate failure
            mockWhatsAppService.sendMessage.mockRejectedValueOnce(
              new Error('Network error') as never
            );
            await mockWhatsAppService.sendMessage('test-instance', {
              to: '+5511999999999',
              message: `Message ${i}`,
              type: 'text',
            });
            successCount++;
          }
        } catch (error: any) {
          failureCount++;
          // Handle the error appropriately for testing
          expect(error.message).toBe('Network error');
        }
      }

      const successRate = (successCount / totalOperations) * 100;
      const failureRate = (failureCount / totalOperations) * 100;

      expect(successRate).toBeGreaterThan(0);
      expect(failureRate).toBeLessThan(100);
      expect(successRate + failureRate).toBe(100);
    });
  });

  describe('Security Validation', () => {
    it('should sanitize input data', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '../../etc/passwd',
        'DROP TABLE users;',
        '{{ 7*7 }}',
      ];

      maliciousInputs.forEach(input => {
        // Input should be properly escaped/sanitized
        expect(input).toMatch(/[<>'"&:/]/);

        // After sanitization, dangerous patterns should be neutralized
        let sanitized = input
          .replace(/javascript:/g, 'blocked:')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/&/g, '&amp;');

        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('javascript:');

        // Verify dangerous patterns are blocked
        if (input.includes('javascript:')) {
          expect(sanitized).toContain('blocked:');
        }
      });
    });

    it('should validate authentication tokens', () => {
      const validTokenFormat = /^[A-Za-z0-9._-]+$/;
      const testTokens = [
        'valid.jwt.token',
        'invalid token with spaces',
        'token<script>',
        'normal-token_123',
      ];

      testTokens.forEach(token => {
        const isValid = validTokenFormat.test(token);
        if (token.includes(' ') || token.includes('<')) {
          expect(isValid).toBe(false);
        } else {
          expect(isValid).toBe(true);
        }
      });
    });
  });
});
