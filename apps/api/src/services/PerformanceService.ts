import { BaseService } from './BaseService';
import { performance } from 'perf_hooks';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
}

export class PerformanceService extends BaseService {
  private metrics: PerformanceMetric[] = [];
  private requestCounts = new Map<string, number>();
  private responseTimes = new Map<string, number[]>();
  private readonly maxMetricsHistory = 1000;

  /**
   * Start timing a performance metric
   */
  startTimer(name: string, metadata?: Record<string, any>): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        ...(metadata && { metadata }),
      });
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Maintain max history size
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift();
    }

    // Update request counts
    const currentCount = this.requestCounts.get(metric.name) || 0;
    this.requestCounts.set(metric.name, currentCount + 1);

    // Update response times
    const times = this.responseTimes.get(metric.name) || [];
    times.push(metric.duration);

    // Keep only recent times for accurate averages
    if (times.length > 100) {
      times.shift();
    }
    this.responseTimes.set(metric.name, times);

    this.logger.debug(
      `Performance metric recorded: ${metric.name} - ${metric.duration.toFixed(2)}ms`
    );
  }

  /**
   * Get metrics for a specific operation
   */
  getMetricsFor(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get API metrics summary
   */
  getApiMetrics(): ApiMetrics {
    const apiMetrics = this.metrics.filter(m => m.name.startsWith('api.'));

    if (apiMetrics.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        requestsPerSecond: 0,
      };
    }

    const durations = apiMetrics.map(m => m.duration);
    const successfulRequests = apiMetrics.filter(
      m => !m.metadata?.error && (m.metadata?.statusCode < 400 || !m.metadata?.statusCode)
    ).length;

    // Calculate requests per second based on the last minute
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = apiMetrics.filter(m => m.timestamp > oneMinuteAgo);

    return {
      totalRequests: apiMetrics.length,
      successfulRequests,
      failedRequests: apiMetrics.length - successfulRequests,
      averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      minResponseTime: Math.min(...durations),
      maxResponseTime: Math.max(...durations),
      requestsPerSecond: recentRequests.length / 60,
    };
  }

  /**
   * Get all metrics grouped by name
   */
  getAllMetrics(): Record<string, PerformanceMetric[]> {
    const grouped: Record<string, PerformanceMetric[]> = {};

    for (const metric of this.metrics) {
      if (!grouped[metric.name]) {
        grouped[metric.name] = [];
      }
      grouped[metric.name]!.push(metric);
    }

    return grouped;
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<
    string,
    {
      count: number;
      averageDuration: number;
      minDuration: number;
      maxDuration: number;
    }
  > {
    const summary: Record<string, any> = {};

    for (const [name, times] of this.responseTimes.entries()) {
      if (times.length > 0) {
        summary[name] = {
          count: this.requestCounts.get(name) || 0,
          averageDuration: times.reduce((a, b) => a + b, 0) / times.length,
          minDuration: Math.min(...times),
          maxDuration: Math.max(...times),
        };
      }
    }

    return summary;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.length = 0;
    this.requestCounts.clear();
    this.responseTimes.clear();
    this.logger.info('Performance metrics cleared');
  }

  /**
   * Express middleware for automatic API performance tracking
   */
  expressMiddleware() {
    return (req: any, res: any, next: any) => {
      const startTime = performance.now();
      const route = `${req.method} ${req.route?.path || req.path}`;

      // Capture response end
      const originalEnd = res.end;
      res.end = (...args: any[]) => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.recordMetric({
          name: `api.${route}`,
          duration,
          timestamp: Date.now(),
          metadata: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            userAgent: req.headers['user-agent'],
            ip: req.ip,
            error: res.statusCode >= 400,
          },
        });

        // Call original end method
        originalEnd.apply(res, args);
      };

      next();
    };
  }

  /**
   * Decorator for automatic method performance tracking
   */
  measurePerformance(name?: string) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value;
      const metricName = name || `${target.constructor.name}.${propertyName}`;

      descriptor.value = async function (...args: any[]) {
        const stopTimer = performanceService.startTimer(metricName, {
          className: target.constructor.name,
          methodName: propertyName,
          args: args.length,
        });

        try {
          const result = await method.apply(this, args);
          stopTimer();
          return result;
        } catch (error) {
          stopTimer();
          throw error;
        }
      };

      return descriptor;
    };
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();
