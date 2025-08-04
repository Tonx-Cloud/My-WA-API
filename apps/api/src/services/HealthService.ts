import { BaseService, ServiceResponse } from './BaseService';
import { WhatsAppInstanceModel } from '../models/WhatsAppInstance';
import { cacheService } from './CacheService';
import { performance } from 'perf_hooks';
import { setTimeout as setTimeoutPromise } from 'timers/promises';

type HealthStatus = 'healthy' | 'unhealthy' | 'degraded';

interface HealthCheckResult {
  service: string;
  status: HealthStatus;
  responseTime?: number;
  details?: Record<string, unknown>;
  error?: string;
  timestamp?: string;
  retryCount?: number;
}

interface SystemHealth {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  system: {
    memory: {
      total: number;
      used: number;
      percentage: number;
    };
    cpu: {
      loadAverage: number[];
    };
    disk: {
      total: number;
      used: number;
      percentage: number;
    };
  };
  checks: HealthCheckResult[];
}

export class HealthService extends BaseService {
  private readonly startTime = Date.now();
  private dbInitialized = false;
  private readonly circuitBreaker = {
    failures: 0,
    lastFailureTime: 0,
    threshold: 5,
    timeout: 30000, // 30 seconds
  };

  /**
   * Inicializa a conexÃ£o com o banco de dados
   */
  initDatabase(): void {
    this.dbInitialized = true;
  }

  /**
   * Circuit breaker pattern implementation (Azure best practice)
   */
  private isCircuitBreakerOpen(): boolean {
    const now = Date.now();
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      if (now - this.circuitBreaker.lastFailureTime < this.circuitBreaker.timeout) {
        return true;
      } else {
        // Reset circuit breaker after timeout
        this.circuitBreaker.failures = 0;
      }
    }
    return false;
  }

  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();
  }

  private recordSuccess(): void {
    this.circuitBreaker.failures = 0;
  }

  /**
   * Health check rÃ¡pido - apenas status bÃ¡sico
   */
  async quickHealthCheck(): Promise<
    ServiceResponse<{ status: string; uptime: number; timestamp: string }>
  > {
    try {
      return this.createSuccessResponse({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return this.handleError(error, 'basicHealthCheck');
    }
  }

  /**
   * Check database connectivity with retry logic (Azure best practice)
   */
  async checkDatabaseConnection(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    const timestamp = new Date().toISOString();
    let retryCount = 0;
    const maxRetries = 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Try to perform a simple database operation
        await WhatsAppInstanceModel.findByUserId(0); // Non-existent user, just to test connection

        const responseTime = performance.now() - startTime;

        return {
          service: 'database',
          status: 'healthy',
          responseTime,
          timestamp,
          retryCount,
          details: {
            driver: 'sqlite3',
            responseTime: `${responseTime.toFixed(2)}ms`,
            attemptsUsed: attempt + 1,
          },
        };
      } catch (error) {
        retryCount = attempt;

        if (attempt === maxRetries) {
          const responseTime = performance.now() - startTime;
          return {
            service: 'database',
            status: 'unhealthy',
            responseTime,
            timestamp,
            retryCount,
            details: {
              error: error instanceof Error ? error.message : 'Unknown error',
              driver: 'sqlite3',
              attemptsUsed: maxRetries + 1,
            },
          };
        }

        // Exponential backoff delay (Azure best practice)
        await setTimeoutPromise(Math.pow(2, attempt) * 100);
      }
    }

    // This should never be reached, but TypeScript requires it
    const responseTime = performance.now() - startTime;
    return {
      service: 'database',
      status: 'unhealthy',
      responseTime,
      timestamp,
      retryCount: maxRetries,
      details: {
        error: 'Max retries exceeded',
        driver: 'sqlite3',
      },
    };
  }

  /**
   * Check cache service status with enhanced monitoring (Azure best practice)
   */
  async checkCacheService(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    const timestamp = new Date().toISOString();

    try {
      // Test cache connectivity by setting and getting a test value
      const testKey = `health-check-${Date.now()}`;
      const testValue = 'health-test-value';

      cacheService.set(testKey, testValue, 1000);
      const retrievedValue = cacheService.get(testKey);
      const responseTime = performance.now() - startTime;

      // Clean up test key
      cacheService.delete && cacheService.delete(testKey);

      const isHealthy = retrievedValue === testValue;

      return {
        service: 'cache',
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        timestamp,
        details: {
          driver: 'memory',
          responseTime: `${responseTime.toFixed(2)}ms`,
          testKeyUsed: testKey,
          testPassed: isHealthy,
          cacheMetrics: 'available',
        },
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;

      return {
        service: 'cache',
        status: 'unhealthy',
        responseTime,
        timestamp,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          driver: 'memory',
          responseTime: `${responseTime.toFixed(2)}ms`,
        },
      };
    }
  }

  /**
   * Comprehensive health check
   */
  async comprehensiveHealthCheck(): Promise<ServiceResponse<SystemHealth>> {
    try {
      const checks = await Promise.all([this.checkDatabaseConnection(), this.checkCacheService()]);

      const unhealthyChecks = checks.filter(check => check.status === 'unhealthy');
      const overallStatus = unhealthyChecks.length === 0 ? 'healthy' : 'degraded';

      const memUsage = process.memoryUsage();

      const healthStatus: SystemHealth = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: this.getUptime(),
        checks,
        system: {
          memory: {
            used: memUsage.heapUsed,
            total: memUsage.heapTotal,
            percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
          },
          cpu: {
            loadAverage: [0, 0, 0], // os.loadavg() nÃ£o disponÃ­vel no Windows
          },
          disk: {
            used: 0,
            total: 0,
            percentage: 0,
          },
        },
      };

      return this.createSuccessResponse(healthStatus);
    } catch (error) {
      return this.handleError(error, 'detailedHealthCheck');
    }
  }

  /**
   * Get service uptime in milliseconds
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Perform a comprehensive health check (alias for comprehensiveHealthCheck)
   */
  async performHealthCheck(): Promise<ServiceResponse<SystemHealth>> {
    return this.comprehensiveHealthCheck();
  }

  /**
   * Check if the service is ready to receive traffic
   */
  async readinessCheck(): Promise<
    ServiceResponse<{ ready: boolean; uptime: number; timestamp: string }>
  > {
    try {
      const uptime = this.getUptime();
      const isReady = uptime > 1000; // Ready after 1 second

      return this.createSuccessResponse({
        ready: isReady,
        uptime,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return this.handleError(error, 'readinessCheck');
    }
  }

  /**
   * Get formatted uptime string
   */
  getFormattedUptime(): string {
    const uptimeMs = this.getUptime();
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Export singleton instance
export const healthService = new HealthService();
