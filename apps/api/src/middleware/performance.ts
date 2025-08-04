import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userAgent?: string;
  ip: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000;

  public recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Manter apenas as últimas métricas
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log de performance para endpoints lentos
    if (metric.responseTime > 5000) {
      logger.warn('Endpoint lento detectado:', {
        endpoint: metric.endpoint,
        method: metric.method,
        responseTime: metric.responseTime,
        statusCode: metric.statusCode,
      });
    }
  }

  public getMetrics(limit = 100): PerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  public getAverageResponseTime(endpoint?: string): number {
    let filteredMetrics = this.metrics;

    if (endpoint) {
      filteredMetrics = this.metrics.filter(m => m.endpoint === endpoint);
    }

    if (filteredMetrics.length === 0) return 0;

    const totalTime = filteredMetrics.reduce((sum, metric) => sum + metric.responseTime, 0);
    return Math.round(totalTime / filteredMetrics.length);
  }

  public getEndpointStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;

      if (!stats[key]) {
        stats[key] = {
          count: 0,
          totalTime: 0,
          minTime: metric.responseTime,
          maxTime: metric.responseTime,
          errorCount: 0,
        };
      }

      stats[key].count++;
      stats[key].totalTime += metric.responseTime;
      stats[key].minTime = Math.min(stats[key].minTime, metric.responseTime);
      stats[key].maxTime = Math.max(stats[key].maxTime, metric.responseTime);

      if (metric.statusCode >= 400) {
        stats[key].errorCount++;
      }
    });

    // Calcular médias
    Object.keys(stats).forEach(key => {
      stats[key].avgTime = Math.round(stats[key].totalTime / stats[key].count);
      stats[key].errorRate = (stats[key].errorCount / stats[key].count) * 100;
    });

    return stats;
  }

  public clearMetrics(): void {
    this.metrics = [];
    logger.info('Métricas de performance limpas');
  }
}

const performanceMonitor = new PerformanceMonitor();

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override do método send para capturar quando a resposta é enviada
  res.send = function (body: any) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const metric: PerformanceMetrics = {
      endpoint: req.route?.path || req.path,
      method: req.method,
      responseTime,
      statusCode: res.statusCode,
      timestamp: new Date(startTime),
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress || 'unknown',
    };

    performanceMonitor.recordMetric(metric);

    // Log básico da requisição
    logger.http(`${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      responseTime,
      ip: metric.ip,
      userAgent: metric.userAgent,
    });

    return originalSend.call(this, body);
  };

  next();
};

export const getPerformanceStats = () => {
  return {
    recentMetrics: performanceMonitor.getMetrics(50),
    averageResponseTime: performanceMonitor.getAverageResponseTime(),
    endpointStats: performanceMonitor.getEndpointStats(),
    timestamp: new Date().toISOString(),
  };
};

export const clearPerformanceMetrics = () => {
  performanceMonitor.clearMetrics();
};

export default performanceMonitor;
