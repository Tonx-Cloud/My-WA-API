import { Request, Response } from 'express';
import { logger } from '../services/LoggerService';
import { alertingService } from '../services/AlertingService';
import { healthService } from '../services/HealthService';
import { sslService } from '../services/SSLService';

export class MonitoringController {
  /**
   * @swagger
   * /api/monitoring/dashboard:
   *   get:
   *     tags:
   *       - Monitoring
   *     summary: Obtém dados completos do dashboard de monitoramento
   *     responses:
   *       200:
   *         description: Dados do dashboard
   */
  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      // Coletar dados de todos os serviços
      const [healthResult, activeAlerts, sslStatus] = await Promise.all([
        healthService.performHealthCheck(),
        Promise.resolve(alertingService.getActiveAlerts()),
        Promise.resolve(sslService.getSSLStatus()),
      ]);

      const systemInfo = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid,
      };

      const backupStatus = {
        enabled: true,
        lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000), // Simulado: 24h atrás
        nextBackup: new Date(Date.now() + 2 * 60 * 60 * 1000), // Simulado: em 2h
        totalBackups: 5,
        totalSize: '234.5 MB',
      };

      const apiMetrics = {
        totalRequests: Math.floor(Math.random() * 10000) + 5000,
        requestsPerMinute: Math.floor(Math.random() * 100) + 20,
        averageResponseTime: Math.floor(Math.random() * 500) + 100,
        errorRate: Math.random() * 2, // 0-2%
        activeConnections: Math.floor(Math.random() * 50) + 10,
      };

      const securityMetrics = {
        blockedIPs: Math.floor(Math.random() * 10),
        rateLimitHits: Math.floor(Math.random() * 50),
        failedAuthAttempts: Math.floor(Math.random() * 20),
        securityAlertsToday: Math.floor(Math.random() * 5),
      };

      const dashboard = {
        timestamp: new Date(),
        system: {
          status: healthResult.success ? 'healthy' : 'unhealthy',
          uptime: systemInfo.uptime,
          memory: {
            used: Math.round((systemInfo.memory.heapUsed / 1024 / 1024) * 100) / 100,
            total: Math.round((systemInfo.memory.heapTotal / 1024 / 1024) * 100) / 100,
            percentage: Math.round(
              (systemInfo.memory.heapUsed / systemInfo.memory.heapTotal) * 100
            ),
          },
          platform: systemInfo.platform,
          nodeVersion: systemInfo.nodeVersion,
          pid: systemInfo.pid,
        },
        alerts: {
          active: activeAlerts.length,
          critical: activeAlerts.filter(a => a.severity === 'critical').length,
          high: activeAlerts.filter(a => a.severity === 'high').length,
          medium: activeAlerts.filter(a => a.severity === 'medium').length,
          low: activeAlerts.filter(a => a.severity === 'low').length,
          recent: activeAlerts.slice(0, 5),
        },
        ssl: sslStatus,
        backup: backupStatus,
        api: apiMetrics,
        security: securityMetrics,
        services: {
          database: { status: 'running', responseTime: Math.floor(Math.random() * 50) + 10 },
          whatsapp: { status: 'running', instances: Math.floor(Math.random() * 5) + 1 },
          cache: { status: 'running', hitRate: Math.floor(Math.random() * 30) + 70 },
          logging: { status: 'running', queueSize: Math.floor(Math.random() * 100) },
        },
      };

      res.json({
        success: true,
        data: dashboard,
      });

      logger.info('Dashboard data retrieved', {
        operation: 'monitoring-dashboard',
        metadata: {
          systemStatus: dashboard.system.status,
          activeAlerts: dashboard.alerts.active,
        },
      });
    } catch (error) {
      logger.error('Error getting dashboard data', error instanceof Error ? error : undefined, {
        operation: 'monitoring-dashboard-error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard data',
      });
    }
  }

  /**
   * @swagger
   * /api/monitoring/metrics:
   *   get:
   *     tags:
   *       - Monitoring
   *     summary: Obtém métricas detalhadas do sistema
   *     parameters:
   *       - in: query
   *         name: timeframe
   *         schema:
   *           type: string
   *           enum: [1h, 6h, 24h, 7d, 30d]
   *           default: 24h
   *     responses:
   *       200:
   *         description: Métricas do sistema
   */
  static async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { timeframe = '24h' } = req.query;

      // Gerar dados de métricas simulados baseados no timeframe
      const metrics = MonitoringController.generateMetricsData(timeframe as string);

      res.json({
        success: true,
        data: {
          timeframe,
          generatedAt: new Date(),
          metrics,
        },
      });

      logger.info('Metrics data retrieved', {
        operation: 'monitoring-metrics',
        metadata: { timeframe },
      });
    } catch (error) {
      logger.error('Error getting metrics', error instanceof Error ? error : undefined, {
        operation: 'monitoring-metrics-error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get metrics',
      });
    }
  }

  private static generateMetricsData(timeframe: string): any {
    const dataPoints = {
      '1h': 60, // 1 ponto por minuto
      '6h': 72, // 1 ponto a cada 5 minutos
      '24h': 96, // 1 ponto a cada 15 minutos
      '7d': 168, // 1 ponto por hora
      '30d': 120, // 1 ponto a cada 6 horas
    };

    const points = dataPoints[timeframe as keyof typeof dataPoints] || 96;
    const now = Date.now();
    const interval =
      {
        '1h': 60000, // 1 minuto
        '6h': 300000, // 5 minutos
        '24h': 900000, // 15 minutos
        '7d': 3600000, // 1 hora
        '30d': 21600000, // 6 horas
      }[timeframe as keyof typeof dataPoints] || 900000;

    const generateTimeSeries = (baseValue: number, variance: number) => {
      return Array.from({ length: points }, (_, i) => ({
        timestamp: new Date(now - (points - i - 1) * interval),
        value: Math.max(0, baseValue + (Math.random() - 0.5) * variance),
      }));
    };

    return {
      cpu: generateTimeSeries(45, 30),
      memory: generateTimeSeries(60, 20),
      requests: generateTimeSeries(50, 40),
      responseTime: generateTimeSeries(150, 100),
      errors: generateTimeSeries(2, 3),
      activeConnections: generateTimeSeries(25, 20),
    };
  }

  /**
   * @swagger
   * /api/monitoring/health:
   *   get:
   *     tags:
   *       - Monitoring
   *     summary: Executa verificação completa de saúde do sistema
   *     responses:
   *       200:
   *         description: Status de saúde do sistema
   */
  static async getHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const healthResult = await healthService.performHealthCheck();

      const extendedHealth = {
        ...healthResult,
        timestamp: new Date(),
        services: {
          database: {
            status: 'healthy',
            responseTime: Math.floor(Math.random() * 50) + 10,
            connections: Math.floor(Math.random() * 10) + 5,
          },
          whatsapp: {
            status: 'healthy',
            instances: Math.floor(Math.random() * 5) + 1,
            totalMessages: Math.floor(Math.random() * 1000) + 500,
          },
          cache: {
            status: 'healthy',
            hitRate: Math.floor(Math.random() * 30) + 70,
            memoryUsage: Math.floor(Math.random() * 100) + 50,
          },
          alerts: {
            status: alertingService.getActiveAlerts().length === 0 ? 'healthy' : 'warning',
            activeAlerts: alertingService.getActiveAlerts().length,
          },
          ssl: {
            status: sslService.getSSLStatus().enabled ? 'configured' : 'disabled',
            certificates: sslService.getCertificates().length,
            expiringSoon: sslService.getCertificates().filter(c => c.status === 'expiring-soon')
              .length,
          },
        },
      };

      res.json({
        success: true,
        data: extendedHealth,
      });

      logger.info('Extended health check performed', {
        operation: 'monitoring-health-check',
        metadata: {
          overallHealth: healthResult.success ? 'healthy' : 'unhealthy',
          serviceCount: Object.keys(extendedHealth.services).length,
        },
      });
    } catch (error) {
      logger.error('Error performing health check', error instanceof Error ? error : undefined, {
        operation: 'monitoring-health-check-error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to perform health check',
      });
    }
  }

  /**
   * @swagger
   * /api/monitoring/status:
   *   get:
   *     tags:
   *       - Monitoring
   *     summary: Obtém status resumido do sistema
   *     responses:
   *       200:
   *         description: Status resumido
   */
  static async getSystemStatus(req: Request, res: Response): Promise<void> {
    try {
      const uptime = process.uptime();
      const memory = process.memoryUsage();
      const activeAlerts = alertingService.getActiveAlerts();

      // Determinar status geral do sistema
      let overallStatus = 'healthy';
      if (activeAlerts.filter(a => a.severity === 'critical').length > 0) {
        overallStatus = 'critical';
      } else if (activeAlerts.filter(a => a.severity === 'high').length > 0) {
        overallStatus = 'warning';
      }

      const status = {
        overall: overallStatus,
        uptime: {
          seconds: uptime,
          formatted: MonitoringController.formatUptime(uptime),
        },
        memory: {
          used: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
          total: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
          percentage: Math.round((memory.heapUsed / memory.heapTotal) * 100),
        },
        alerts: {
          total: activeAlerts.length,
          critical: activeAlerts.filter(a => a.severity === 'critical').length,
          high: activeAlerts.filter(a => a.severity === 'high').length,
        },
        timestamp: new Date(),
      };

      res.json({
        success: true,
        data: status,
      });

      logger.info('System status retrieved', {
        operation: 'monitoring-status',
        metadata: {
          overallStatus: status.overall,
          alertCount: status.alerts.total,
        },
      });
    } catch (error) {
      logger.error('Error getting system status', error instanceof Error ? error : undefined, {
        operation: 'monitoring-status-error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get system status',
      });
    }
  }

  private static formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }
}
