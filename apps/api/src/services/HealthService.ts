import { BaseService, ServiceResponse } from './BaseService';
import { WhatsAppInstanceModel } from '../models/WhatsAppInstance';
import { cacheService } from './CacheService';
import { performanceService } from './PerformanceService';
import { performance } from 'perf_hooks';

type HealthStatus = 'healthy' | 'unhealthy' | 'degraded';

interface HealthCheckResult {
  service: string;
  status: HealthStatus;
  responseTime?: number;
  details?: any;
  error?: string;
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
  private startTime = Date.now();
  private dbInitialized = false;

  /**
   * Inicializa a conexão com o banco de dados
   */
  initDatabase(): void {
    this.dbInitialized = true;
  }

  /**
   * Health check rápido - apenas status básico
   */
  async quickHealthCheck(): Promise<ServiceResponse<{ status: string; uptime: number; timestamp: string }>> {
    try {
      return this.createSuccessResponse({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Check database connectivity
   */
  async checkDatabaseConnection(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    
    try {
      // Try to perform a simple database operation
      await WhatsAppInstanceModel.findByUserId(0); // Non-existent user, just to test connection
      
      const responseTime = performance.now() - startTime;
      
      return {
        service: 'database',
        status: 'healthy',
        responseTime,
        details: {
          driver: 'sqlite3',
          responseTime: `${responseTime.toFixed(2)}ms`
        }
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          driver: 'sqlite3'
        }
      };
    }
  }

  /**
   * Check cache service status
   */
  async checkCacheService(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    
    try {
      // Test cache connectivity
      await cacheService.ping();
      const responseTime = performance.now() - startTime;
      
      return {
        service: 'cache',
        status: 'healthy',
        responseTime,
        details: {
          driver: 'memory',
          responseTime: `${responseTime.toFixed(2)}ms`
        }
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      return {
        service: 'cache',
        status: 'unhealthy',
        responseTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          driver: 'memory'
        }
      };
    }
  }

  /**
   * Comprehensive health check
   */
  async comprehensiveHealthCheck(): Promise<ServiceResponse<SystemHealth>> {
    try {
      const checks = await Promise.all([
        this.checkDatabaseConnection(),
        this.checkCacheService()
      ]);

      const unhealthyChecks = checks.filter(check => check.status === 'unhealthy');
      const overallStatus = unhealthyChecks.length === 0 ? 'healthy' : 'degraded';

      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      const healthStatus: SystemHealth = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: this.getUptime(),
        checks,
        system: {
          memory: {
            used: memUsage.heapUsed,
            total: memUsage.heapTotal,
            percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
          },
          cpu: {
            loadAverage: [0, 0, 0] // os.loadavg() não disponível no Windows
          },
          disk: {
            used: 0,
            total: 0,
            percentage: 0
          }
        }
      };

      return this.createSuccessResponse(healthStatus);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get service uptime in milliseconds
   */
  getUptime(): number {
    return Date.now() - this.startTime;
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
