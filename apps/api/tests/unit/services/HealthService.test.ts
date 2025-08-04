import { HealthService } from '../../../src/services/HealthService';

describe('HealthService', () => {
  let healthService: HealthService;

  beforeEach(() => {
    healthService = new HealthService();
  });

  describe('quickHealthCheck', () => {
    it('should return healthy status and uptime', async () => {
      const result = await healthService.quickHealthCheck();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        status: expect.any(String),
        uptime: expect.any(Number),
      });
      expect(result.data?.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('performHealthCheck', () => {
    it('should return comprehensive health information', async () => {
      const result = await healthService.performHealthCheck();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        status: expect.any(String),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        checks: expect.any(Array),
        system: expect.objectContaining({
          memory: expect.objectContaining({
            used: expect.any(Number),
            total: expect.any(Number),
            percentage: expect.any(Number),
          }),
          cpu: expect.objectContaining({
            loadAverage: expect.any(Array),
          }),
        }),
        performance: expect.any(Object),
      });
    });

    it('should include valid health checks', async () => {
      const result = await healthService.performHealthCheck();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data?.checks)).toBe(true);

      if (result.data?.checks && result.data.checks.length > 0) {
        result.data.checks.forEach(check => {
          expect(check).toEqual({
            service: expect.any(String),
            status: expect.stringMatching(/^(healthy|unhealthy|degraded)$/),
            responseTime: expect.any(Number),
            details: expect.anything(),
          });
        });
      }
    });

    it('should include valid system information', async () => {
      const result = await healthService.performHealthCheck();

      expect(result.success).toBe(true);
      expect(result.data?.system.memory.used).toBeGreaterThan(0);
      expect(result.data?.system.memory.total).toBeGreaterThan(0);
      expect(result.data?.system.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(result.data?.system.memory.percentage).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.data?.system.cpu.loadAverage)).toBe(true);
      expect(result.data?.system.cpu.loadAverage).toHaveLength(3);
    });
  });

  describe('readinessCheck', () => {
    it('should return readiness status', async () => {
      const result = await healthService.readinessCheck();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        ready: expect.any(Boolean),
        details: expect.any(Object),
      });
    });

    it('should include readiness details', async () => {
      const result = await healthService.readinessCheck();

      expect(result.success).toBe(true);
      expect(typeof result.data?.details).toBe('object');
      expect(result.data?.details).toBeDefined();
    });
  });

  describe('checkDatabaseConnection', () => {
    it('should return database health check result', async () => {
      const result = await healthService.checkDatabaseConnection();

      expect(result).toEqual({
        service: 'database',
        status: expect.stringMatching(/^(healthy|unhealthy|degraded)$/),
        responseTime: expect.any(Number),
        details: expect.anything(),
      });
    });

    it('should measure response time', async () => {
      const result = await healthService.checkDatabaseConnection();

      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.responseTime).toBeLessThan(10000); // Should be less than 10 seconds
    });
  });

  describe('checkWhatsAppService', () => {
    it('should return WhatsApp service health check result', async () => {
      const result = await healthService.checkWhatsAppService();

      expect(result).toEqual({
        service: 'whatsapp',
        status: expect.stringMatching(/^(healthy|unhealthy|degraded)$/),
        responseTime: expect.any(Number),
        details: expect.anything(),
      });
    });
  });

  describe('getSystemInfo', () => {
    it('should return system information', async () => {
      const result = await healthService.getSystemInfo();

      expect(result).toEqual({
        memory: expect.objectContaining({
          used: expect.any(Number),
          total: expect.any(Number),
          percentage: expect.any(Number),
        }),
        cpu: expect.objectContaining({
          loadAverage: expect.any(Array),
        }),
      });
    });

    it('should return valid memory information', async () => {
      const result = await healthService.getSystemInfo();

      expect(result.memory.used).toBeGreaterThan(0);
      expect(result.memory.total).toBeGreaterThan(0);
      expect(result.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(result.memory.percentage).toBeLessThanOrEqual(100);
    });

    it('should return valid CPU information', async () => {
      const result = await healthService.getSystemInfo();

      expect(Array.isArray(result.cpu.loadAverage)).toBe(true);
      expect(result.cpu.loadAverage).toHaveLength(3);
      result.cpu.loadAverage.forEach(load => {
        expect(typeof load).toBe('number');
        expect(load).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This will naturally test error handling since we don't have a real database
      const result = await healthService.checkDatabaseConnection();

      expect(result.service).toBe('database');
      expect(['healthy', 'unhealthy', 'degraded']).toContain(result.status);
      expect(typeof result.responseTime).toBe('number');
    });

    it('should handle WhatsApp service errors gracefully', async () => {
      const result = await healthService.checkWhatsAppService();

      expect(result.service).toBe('whatsapp');
      expect(['healthy', 'unhealthy', 'degraded']).toContain(result.status);
      expect(typeof result.responseTime).toBe('number');
    });
  });
});
