import { Router } from 'express';
import { metricsService } from '../services/MetricsService';
import { monitoringService } from '../services/MonitoringService';
import { healthService } from '../services/HealthService';
import { securityMiddleware, authMiddleware, apiRateLimit } from '../middleware/securityMiddleware';
import { tracingMiddleware } from '../middleware/tracingMiddleware';

const router = Router();

// Aplicar middlewares
router.use(securityMiddleware);
router.use(apiRateLimit);
router.use(authMiddleware);
router.use(tracingMiddleware('monitoring-api'));

/**
 * GET /monitoring/health - Status de saúde do sistema
 */
router.get('/health', async (req, res) => {
  try {
    const healthStatus = monitoringService.getHealthStatus();
    const basicHealthResponse = await healthService.performHealthCheck();

    res.json({
      success: true,
      data: {
        overall: healthStatus,
        detailed: basicHealthResponse.success ? basicHealthResponse.data : null,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('Erro ao obter status de saúde:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * GET /monitoring/metrics - Métricas do sistema
 */
router.get('/metrics', async (req, res) => {
  try {
    const { startTime, endTime, filter, limit } = req.query;

    const start = startTime ? parseInt(startTime as string, 10) : Date.now() - 3600000; // 1 hora atrás
    const end = endTime ? parseInt(endTime as string, 10) : Date.now();
    const nameFilter = filter as string;
    const maxResults = limit ? parseInt(limit as string, 10) : 1000;

    const metrics = metricsService.getMetrics(start, end, nameFilter).slice(0, maxResults);
    const summary = metricsService.getMetricsSummary();

    res.json({
      success: true,
      data: {
        metrics,
        summary,
        period: {
          startTime: start,
          endTime: end,
          duration: end - start,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao obter métricas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * GET /monitoring/performance - Métricas de performance
 */
router.get('/performance', async (req, res) => {
  try {
    const { operation, startTime, endTime, limit } = req.query;

    const start = startTime ? parseInt(startTime as string, 10) : Date.now() - 3600000;
    const end = endTime ? parseInt(endTime as string, 10) : Date.now();
    const maxResults = limit ? parseInt(limit as string, 10) : 500;

    const performanceMetrics = metricsService
      .getPerformanceMetrics(operation as string, start, end)
      .slice(0, maxResults);

    // Calcular estatísticas
    const durations = performanceMetrics.map(m => m.duration);
    const stats =
      durations.length > 0
        ? {
            count: durations.length,
            average: durations.reduce((a, b) => a + b, 0) / durations.length,
            min: Math.min(...durations),
            max: Math.max(...durations),
            median: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)],
            p95: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)],
            p99: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.99)],
          }
        : null;

    res.json({
      success: true,
      data: {
        metrics: performanceMetrics,
        statistics: stats,
        period: {
          startTime: start,
          endTime: end,
          duration: end - start,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao obter métricas de performance:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * GET /monitoring/alerts - Alertas do sistema
 */
router.get('/alerts', async (req, res) => {
  try {
    const { active, limit } = req.query;
    const maxResults = limit ? parseInt(limit as string, 10) : 100;

    let alerts;
    if (active === 'true') {
      alerts = monitoringService.getActiveAlerts().slice(0, maxResults);
    } else {
      alerts = monitoringService.getAlertHistory(maxResults);
    }

    const alertRules = monitoringService.getAlertRules();

    res.json({
      success: true,
      data: {
        alerts,
        rules: alertRules,
        summary: {
          total: alerts.length,
          critical: alerts.filter(a => a.type === 'CRITICAL').length,
          warning: alerts.filter(a => a.type === 'WARNING').length,
          info: alerts.filter(a => a.type === 'INFO').length,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao obter alertas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * POST /monitoring/alerts/:id/resolve - Resolver alerta
 */
router.post('/alerts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;

    const resolved = monitoringService.resolveAlert(id);

    if (resolved) {
      res.json({
        success: true,
        message: 'Alerta resolvido com sucesso',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Alerta não encontrado ou já resolvido',
      });
    }
  } catch (error) {
    console.error('Erro ao resolver alerta:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * GET /monitoring/dashboard - Dados para dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;

    // Métricas em tempo real
    const realtimeMetrics = {
      system: {
        cpu:
          metricsService.getMetrics(oneHourAgo, now, 'system.cpu.usage').slice(0, 1)[0]?.value || 0,
        memory:
          metricsService.getMetrics(oneHourAgo, now, 'system.memory.usage').slice(0, 1)[0]?.value ||
          0,
        disk:
          metricsService.getMetrics(oneHourAgo, now, 'system.disk.usage').slice(0, 1)[0]?.value ||
          0,
      },
      business: {
        instances: {
          total:
            metricsService.getMetrics(oneHourAgo, now, 'business.instances.total').slice(0, 1)[0]
              ?.value || 0,
          connected:
            metricsService
              .getMetrics(oneHourAgo, now, 'business.instances.connected')
              .slice(0, 1)[0]?.value || 0,
          error:
            metricsService.getMetrics(oneHourAgo, now, 'business.instances.error').slice(0, 1)[0]
              ?.value || 0,
        },
        api: {
          requestsPerMinute:
            metricsService
              .getMetrics(oneHourAgo, now, 'business.api.requests_per_minute')
              .slice(0, 1)[0]?.value || 0,
          avgResponseTime:
            metricsService
              .getMetrics(oneHourAgo, now, 'business.api.avg_response_time')
              .slice(0, 1)[0]?.value || 0,
          errorRate:
            metricsService.getMetrics(oneHourAgo, now, 'business.api.error_rate').slice(0, 1)[0]
              ?.value || 0,
        },
      },
    };

    // Tendências (últimas 24h)
    const trends = {
      cpu: metricsService.getMetrics(oneDayAgo, now, 'system.cpu.usage').slice(0, 24),
      memory: metricsService.getMetrics(oneDayAgo, now, 'system.memory.usage').slice(0, 24),
      responseTime: metricsService
        .getMetrics(oneDayAgo, now, 'business.api.avg_response_time')
        .slice(0, 24),
      errorRate: metricsService.getMetrics(oneDayAgo, now, 'business.api.error_rate').slice(0, 24),
    };

    // Status de saúde
    const healthStatus = monitoringService.getHealthStatus();

    // Alertas ativos
    const activeAlerts = monitoringService.getActiveAlerts();

    // Top operações (última hora)
    const summary = metricsService.getMetricsSummary();

    res.json({
      success: true,
      data: {
        realtime: realtimeMetrics,
        trends,
        health: healthStatus,
        alerts: {
          active: activeAlerts,
          count: {
            total: activeAlerts.length,
            critical: activeAlerts.filter(a => a.type === 'CRITICAL').length,
            warning: activeAlerts.filter(a => a.type === 'WARNING').length,
          },
        },
        topOperations: summary.topOperations,
        timestamp: now,
      },
    });
  } catch (error) {
    console.error('Erro ao obter dados do dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * GET /monitoring/reports/daily - Relatório diário
 */
router.get('/reports/daily', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();

    // Calcular período do dia
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const start = startOfDay.getTime();
    const end = endOfDay.getTime();

    // Coletar métricas do dia
    const dailyMetrics = metricsService.getMetrics(start, end);
    const performanceMetrics = metricsService.getPerformanceMetrics(undefined, start, end);

    // Gerar estatísticas
    const report = {
      date: targetDate.toISOString().split('T')[0],
      period: { start, end },
      summary: {
        totalRequests: performanceMetrics.length,
        avgResponseTime:
          performanceMetrics.length > 0
            ? performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / performanceMetrics.length
            : 0,
        successRate:
          performanceMetrics.length > 0
            ? (performanceMetrics.filter(m => m.success).length / performanceMetrics.length) * 100
            : 100,
        totalMetrics: dailyMetrics.length,
      },
      hourlyBreakdown: [], // TODO: Implementar breakdown por hora
      topOperations: performanceMetrics.reduce(
        (acc, metric) => {
          if (!acc[metric.operation]) {
            acc[metric.operation] = { count: 0, totalDuration: 0 };
          }
          // Remove a verificação redundante já que acabamos de criar o objeto
          acc[metric.operation]!.count++;
          acc[metric.operation]!.totalDuration += metric.duration;
          return acc;
        },
        {} as Record<string, { count: number; totalDuration: number }>
      ),
      errors: performanceMetrics.filter(m => !m.success),
    };

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório diário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

export default router;
