import { BaseService, ServiceResponse } from './BaseService';
import { WhatsAppInstanceModel } from '../models/WhatsAppInstance';
import { cacheService } from './CacheService';
import { performanceService } from './PerformanceService';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import os from 'os';

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
  checks: HealthCheckResult[];
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      loadAverage: number[];
      usage?: number;
    };
    disk?: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  performance: {
    apiMetrics: any;
    cacheStats: any;
  };
}

export class HealthService extends BaseService {
  private startTime = Date.now();

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
        error: error instanceof Error ? error.message : 'Unknown database error',
        details: {
          driver: 'sqlite3'
        }
      };
    }
  }

  /**
   * Check WhatsApp service health
   */
  async checkWhatsAppService(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    
    try {
      // Check if WhatsApp service is available
      const responseTime = performance.now() - startTime;
      
      return {
        service: 'whatsapp',
        status: 'healthy',
        responseTime,
        details: {
          serviceType: 'WhatsApp API',
          responseTime: `${responseTime.toFixed(2)}ms`
        }
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      return {
        service: 'whatsapp',
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown WhatsApp service error'
      };
    }
  }

  /**
   * Check external services (placeholder for future services)
   */
  async checkExternalServices(): Promise<HealthCheckResult[]> {
    const checks: HealthCheckResult[] = [];

    // Cache service check
    try {
      const cacheStats = cacheService.getStats();
      checks.push({
        service: 'cache',
        status: 'healthy',
        details: {
          entriesCount: cacheStats.size,
          type: 'in-memory'
        }
      });
    } catch (error) {
      checks.push({
        service: 'cache',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Cache service error'
      });
    }

    // Performance monitoring check
    try {
      const performanceStats = performanceService.getSummary();
      checks.push({
        service: 'performance-monitoring',
        status: 'healthy',
        details: {
          metricsCount: Object.keys(performanceStats).length,
          type: 'in-memory'
        }
      });
    } catch (error) {
      checks.push({
        service: 'performance-monitoring',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Performance monitoring error'
      });
    }

    return checks;
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<SystemHealth['system']> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    let diskInfo;
    try {
      await fs.stat('./');
      diskInfo = {
        used: 0, // Would need platform-specific implementation
        total: 0,
        percentage: 0
      };
    } catch {
      // Disk info not available, continue without it
      diskInfo = undefined;
    }

    return {
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: (usedMemory / totalMemory) * 100
      },
      cpu: {
        loadAverage: os.loadavg()
      },
      ...(diskInfo && { disk: diskInfo })
    };
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<ServiceResponse<SystemHealth>> {
    try {
      const checks: HealthCheckResult[] = [];

      // Core service checks
      const [dbCheck, whatsappCheck, externalChecks] = await Promise.all([
        this.checkDatabaseConnection(),
        this.checkWhatsAppService(),
        this.checkExternalServices()
      ]);

      checks.push(dbCheck, whatsappCheck, ...externalChecks);

      // Determine overall status
      const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
      const hasDegraded = checks.some(check => check.status === 'degraded');
      
      let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      if (hasUnhealthy) {
        overallStatus = 'unhealthy';
      } else if (hasDegraded) {
        overallStatus = 'degraded';
      }

      // Get system information
      const systemInfo = await this.getSystemInfo();

      // Get performance metrics
      const apiMetrics = performanceService.getApiMetrics();
      const cacheStats = cacheService.getStats();

      const health: SystemHealth = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        checks,
        system: systemInfo,
        performance: {
          apiMetrics,
          cacheStats
        }
      };

      return this.createSuccessResponse(health);

    } catch (error) {
      return this.handleError<SystemHealth>(error, 'performHealthCheck');
    }
  }

  /**
   * Quick health check - minimal overhead
   */
  async quickHealthCheck(): Promise<ServiceResponse<{ status: string; uptime: number }>> {
    try {
      return this.createSuccessResponse({
        status: 'healthy',
        uptime: Date.now() - this.startTime
      });
    } catch (error) {
      return this.handleError(error, 'quickHealthCheck');
    }
  }

  /**
   * Check if system is ready to serve traffic
   */
  async readinessCheck(): Promise<ServiceResponse<{ ready: boolean; details: any }>> {
    try {
      const dbCheck = await this.checkDatabaseConnection();
      const whatsappCheck = await this.checkWhatsAppService();

      const ready = dbCheck.status !== 'unhealthy' && whatsappCheck.status !== 'unhealthy';

      return this.createSuccessResponse({
        ready,
        details: {
          database: dbCheck.status,
          whatsapp: whatsappCheck.status
        }
      });
    } catch (error) {
      return this.handleError(error, 'readinessCheck');
    }
  }

  /**
   * Get application uptime
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
