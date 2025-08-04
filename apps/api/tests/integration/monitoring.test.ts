import request from 'supertest';
import express from 'express';
import { metricsService } from '../../src/services/MetricsService';
import { monitoringService } from '../../src/services/MonitoringService';
import monitoringRoutes from '../../src/routes/monitoring';

// Mock dos middlewares de seguranÃ§a
jest.mock('../../src/middleware/securityMiddleware', () => ({
  securityMiddleware: (req: any, res: any, next: any) => next(),
  authMiddleware: (req: any, res: any, next: any) => {
    req.userId = 1;
    next();
  },
  apiRateLimit: (req: any, res: any, next: any) => next(),
}));

// Mock do tracing middleware
jest.mock('../../src/middleware/tracingMiddleware', () => ({
  tracingMiddleware: () => (req: any, res: any, next: any) => next(),
}));

describe('Sistema de Monitoramento', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/monitoring', monitoringRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Limpar serviÃ§os
    metricsService.stop();
    monitoringService.stop();
  });

  describe('MetricsService', () => {
    test('deve registrar mÃ©tricas corretamente', () => {
      // Registrar algumas mÃ©tricas de teste
      metricsService.recordMetric('test.metric', 100, 'count', { test: 'value' });
      metricsService.incrementCounter('test.counter', 5);
      metricsService.recordGauge('test.gauge', 75, 'percent');
      metricsService.recordHistogram('test.histogram', 250);

      const metrics = metricsService.getMetrics();

      expect(metrics).toHaveLength(4);
      expect(metrics.some(m => m.name === 'test.metric')).toBeTruthy();
      expect(metrics.some(m => m.name === 'counter.test.counter')).toBeTruthy();
      expect(metrics.some(m => m.name === 'gauge.test.gauge')).toBeTruthy();
      expect(metrics.some(m => m.name === 'histogram.test.histogram')).toBeTruthy();
    });

    test('deve registrar mÃ©tricas de performance', () => {
      const startTime = performance.now();

      // Simular operaÃ§Ã£o
      setTimeout(() => {
        metricsService.recordPerformance('test.operation', startTime, true, {
          testData: 'value',
        });
      }, 10);

      setTimeout(() => {
        const perfMetrics = metricsService.getPerformanceMetrics('test.operation');
        expect(perfMetrics).toHaveLength(1);
        expect(perfMetrics[0].operation).toBe('test.operation');
        expect(perfMetrics[0].success).toBe(true);
        expect(perfMetrics[0].duration).toBeGreaterThan(0);
      }, 50);
    });

    test('deve filtrar mÃ©tricas por perÃ­odo', () => {
      const now = Date.now();
      const oneHourAgo = now - 3600000;

      // Registrar mÃ©tricas em perÃ­odos diferentes
      metricsService.recordMetric('old.metric', 50, 'count');

      // Usar setTimeout para simular mÃ©trica antiga
      const oldMetric = metricsService.getMetrics().find(m => m.name === 'old.metric');
      if (oldMetric) {
        oldMetric.timestamp = oneHourAgo - 1000; // Tornar antiga
      }

      metricsService.recordMetric('new.metric', 100, 'count');

      const recentMetrics = metricsService.getMetrics(oneHourAgo);
      const newMetrics = recentMetrics.filter(m => m.name === 'new.metric');

      expect(newMetrics).toHaveLength(1);
    });

    test('deve gerar resumo de mÃ©tricas', () => {
      metricsService.recordMetric('summary.test', 123, 'count');

      const summary = metricsService.getMetricsSummary();

      expect(summary).toHaveProperty('totalMetrics');
      expect(summary).toHaveProperty('totalPerformanceMetrics');
      expect(summary).toHaveProperty('topOperations');
      expect(Array.isArray(summary.topOperations)).toBeTruthy();
    });
  });

  describe('MonitoringService', () => {
    test('deve ter regras de alerta padrÃ£o', () => {
      const rules = monitoringService.getAlertRules();

      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some(rule => rule.metric === 'system.cpu.usage')).toBeTruthy();
      expect(rules.some(rule => rule.metric === 'system.memory.usage')).toBeTruthy();
      expect(rules.some(rule => rule.metric === 'business.api.avg_response_time')).toBeTruthy();
    });

    test('deve retornar status de saÃºde', () => {
      const healthStatus = monitoringService.getHealthStatus();

      expect(healthStatus).toHaveProperty('status');
      expect(healthStatus).toHaveProperty('score');
      expect(healthStatus).toHaveProperty('components');
      expect(healthStatus).toHaveProperty('lastUpdate');

      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthStatus.status);
      expect(healthStatus.score).toBeGreaterThanOrEqual(0);
      expect(healthStatus.score).toBeLessThanOrEqual(100);
    });

    test('deve gerenciar alertas', () => {
      // Simular condiÃ§Ã£o de alerta registrando mÃ©trica alta
      metricsService.recordMetric('system.cpu.usage', 95, 'percent');

      // Aguardar processamento
      setTimeout(() => {
        const activeAlerts = monitoringService.getActiveAlerts();
        const history = monitoringService.getAlertHistory(10);

        expect(Array.isArray(activeAlerts)).toBeTruthy();
        expect(Array.isArray(history)).toBeTruthy();
      }, 100);
    });

    test('deve adicionar e remover regras de alerta', () => {
      const initialRulesCount = monitoringService.getAlertRules().length;

      const ruleId = monitoringService.addAlertRule({
        name: 'Teste de regra customizada',
        metric: 'test.custom.metric',
        condition: 'greater_than',
        threshold: 50,
        severity: 'WARNING',
        description: 'Regra de teste',
        enabled: true,
        cooldown: 60000,
      });

      expect(monitoringService.getAlertRules()).toHaveLength(initialRulesCount + 1);

      const removed = monitoringService.removeAlertRule(ruleId);
      expect(removed).toBeTruthy();
      expect(monitoringService.getAlertRules()).toHaveLength(initialRulesCount);
    });
  });

  describe('Endpoints de Monitoramento', () => {
    test('GET /monitoring/health deve retornar status de saÃºde', async () => {
      const response = await request(app).get('/monitoring/health').expect(200);

      expect(response.body.success).toBeTruthy();
      expect(response.body.data).toHaveProperty('overall');
      expect(response.body.data).toHaveProperty('detailed');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    test('GET /monitoring/metrics deve retornar mÃ©tricas', async () => {
      // Registrar algumas mÃ©tricas primeiro
      metricsService.recordMetric('api.test.metric', 42, 'count');

      const response = await request(app).get('/monitoring/metrics').expect(200);

      expect(response.body.success).toBeTruthy();
      expect(response.body.data).toHaveProperty('metrics');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('period');
      expect(Array.isArray(response.body.data.metrics)).toBeTruthy();
    });

    test('GET /monitoring/metrics deve aceitar filtros', async () => {
      const startTime = Date.now() - 60000;
      const endTime = Date.now();

      const response = await request(app)
        .get('/monitoring/metrics')
        .query({
          startTime: startTime.toString(),
          endTime: endTime.toString(),
          filter: 'system',
          limit: '50',
        })
        .expect(200);

      expect(response.body.success).toBeTruthy();
      expect(response.body.data.period.startTime).toBe(startTime);
      expect(response.body.data.period.endTime).toBe(endTime);
    });

    test('GET /monitoring/performance deve retornar mÃ©tricas de performance', async () => {
      // Registrar mÃ©trica de performance
      metricsService.recordPerformance('test.endpoint', performance.now() - 100, true);

      const response = await request(app).get('/monitoring/performance').expect(200);

      expect(response.body.success).toBeTruthy();
      expect(response.body.data).toHaveProperty('metrics');
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data).toHaveProperty('period');
    });

    test('GET /monitoring/alerts deve retornar alertas', async () => {
      const response = await request(app).get('/monitoring/alerts').expect(200);

      expect(response.body.success).toBeTruthy();
      expect(response.body.data).toHaveProperty('alerts');
      expect(response.body.data).toHaveProperty('rules');
      expect(response.body.data).toHaveProperty('summary');
      expect(Array.isArray(response.body.data.alerts)).toBeTruthy();
      expect(Array.isArray(response.body.data.rules)).toBeTruthy();
    });

    test('GET /monitoring/dashboard deve retornar dados completos', async () => {
      const response = await request(app).get('/monitoring/dashboard').expect(200);

      expect(response.body.success).toBeTruthy();
      expect(response.body.data).toHaveProperty('realtime');
      expect(response.body.data).toHaveProperty('trends');
      expect(response.body.data).toHaveProperty('health');
      expect(response.body.data).toHaveProperty('alerts');
      expect(response.body.data).toHaveProperty('topOperations');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    test('GET /monitoring/reports/daily deve gerar relatÃ³rio diÃ¡rio', async () => {
      const today = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get('/monitoring/reports/daily')
        .query({ date: today })
        .expect(200);

      expect(response.body.success).toBeTruthy();
      expect(response.body.data).toHaveProperty('date');
      expect(response.body.data).toHaveProperty('period');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data.date).toBe(today);
    });
  });

  describe('Performance e Escalabilidade', () => {
    test('deve processar mÃºltiplas mÃ©tricas rapidamente', () => {
      const startTime = performance.now();

      // Registrar 1000 mÃ©tricas
      for (let i = 0; i < 1000; i++) {
        metricsService.recordMetric(`bulk.metric.${i}`, i, 'count');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Deve processar 1000 mÃ©tricas em menos de 100ms
      expect(duration).toBeLessThan(100);

      const metrics = metricsService.getMetrics();
      expect(metrics.length).toBeGreaterThanOrEqual(1000);
    });

    test('deve limitar o tamanho das mÃ©tricas em memÃ³ria', () => {
      const initialCount = metricsService.getMetrics().length;

      // Registrar muitas mÃ©tricas para testar o limite
      for (let i = 0; i < 15000; i++) {
        metricsService.recordMetric(`overflow.metric.${i}`, i, 'count');
      }

      const finalCount = metricsService.getMetrics().length;

      // Deve manter apenas as mais recentes (maxMetrics = 10000)
      expect(finalCount).toBeLessThanOrEqual(10000);
      expect(finalCount).toBeGreaterThan(initialCount);
    });

    test('limpeza de mÃ©tricas deve funcionar corretamente', () => {
      // Registrar mÃ©trica e forÃ§ar timestamp antigo
      metricsService.recordMetric('cleanup.test', 123, 'count');
      const metrics = metricsService.getMetrics();
      const oldMetric = metrics.find(m => m.name === 'cleanup.test');

      if (oldMetric) {
        oldMetric.timestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 horas atrÃ¡s
      }

      // Executar limpeza
      metricsService.cleanup();

      // Verificar se mÃ©trica antiga foi removida
      const remainingMetrics = metricsService.getMetrics();
      const cleanedMetric = remainingMetrics.find(m => m.name === 'cleanup.test');

      expect(cleanedMetric).toBeUndefined();
    });
  });
});

console.log('âœ… Testes do Sistema de Monitoramento configurados');
