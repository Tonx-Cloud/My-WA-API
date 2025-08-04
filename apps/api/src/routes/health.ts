import { Router, Request, Response } from 'express';
import { healthService } from '../services/HealthService';
import { logger } from '../services/LoggerService';
import { performanceService } from '../services/PerformanceService';
import { cacheService } from '../services/CacheService';

const router = Router();

/**
 * GET /health - Comprehensive health check
 * Returns detailed health information about all services
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const healthResult = await healthService.performHealthCheck();
    const responseTime = Date.now() - startTime;

    logger.http('Health check performed', {
      operation: 'health-check',
      duration: responseTime,
      metadata: { status: healthResult.success ? 'success' : 'failure' },
    });

    if (healthResult.success) {
      const health = healthResult.data!;

      // Set appropriate HTTP status based on overall health
      let statusCode = 200;
      if (health.status === 'unhealthy') {
        statusCode = 503;
      }

      res.status(statusCode).json({
        success: true,
        data: health,
        meta: {
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      logger.error('Health check failed', undefined, {
        operation: 'health-check',
        metadata: { error: healthResult.error },
      });

      res.status(503).json({
        success: false,
        error: 'Health check failed',
        message: healthResult.error,
        meta: {
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    logger.error('Health check endpoint error', error instanceof Error ? error : undefined);

    res.status(500).json({
      success: false,
      error: 'Internal server error during health check',
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /health/live - Liveness probe
 * Simple check to verify the application is running
 */
router.get('/live', async (req: Request, res: Response) => {
  try {
    const quickResult = await healthService.quickHealthCheck();

    if (quickResult.success) {
      res.status(200).json({
        success: true,
        status: 'alive',
        data: quickResult.data,
        meta: {
          timestamp: new Date().toISOString(),
          uptime: healthService.getFormattedUptime(),
        },
      });
    } else {
      res.status(503).json({
        success: false,
        status: 'dead',
        error: quickResult.error,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    logger.error('Liveness check error', error instanceof Error ? error : undefined);

    res.status(500).json({
      success: false,
      status: 'error',
      error: 'Liveness check failed',
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /health/ready - Readiness probe
 * Check if the application is ready to serve traffic
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const readinessResult = await healthService.readinessCheck();

    if (readinessResult.success) {
      const { ready, details } = readinessResult.data!;
      const statusCode = ready ? 200 : 503;

      res.status(statusCode).json({
        success: true,
        ready,
        details,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      res.status(503).json({
        success: false,
        ready: false,
        error: readinessResult.error,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    logger.error('Readiness check error', error instanceof Error ? error : undefined);

    res.status(500).json({
      success: false,
      ready: false,
      error: 'Readiness check failed',
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /health/metrics - Performance metrics
 * Returns current performance metrics and statistics
 */
router.get('/metrics', (req: Request, res: Response) => {
  try {
    const metrics = {
      performance: {
        summary: performanceService.getSummary(),
        apiMetrics: performanceService.getApiMetrics(),
      },
      cache: {
        stats: cacheService.getStats(),
      },
      uptime: {
        formatted: healthService.getFormattedUptime(),
        milliseconds: healthService.getUptime(),
      },
      memory: process.memoryUsage(),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        env: process.env.NODE_ENV || 'development',
      },
    };

    logger.debug('Metrics requested', {
      operation: 'metrics',
      metadata: { metricsCount: Object.keys(metrics.performance.summary).length },
    });

    res.status(200).json({
      success: true,
      data: metrics,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Metrics endpoint error', error instanceof Error ? error : undefined);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics',
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /health/ping - Simple ping endpoint
 * Minimal response for basic connectivity checks
 */
router.get('/ping', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/version - Application version information
 */
router.get('/version', (req: Request, res: Response) => {
  try {
    const packageJson = require('../../../../package.json');

    res.status(200).json({
      success: true,
      data: {
        name: packageJson.name || 'my-wa-api',
        version: packageJson.version || '1.0.0',
        description: packageJson.description || 'WhatsApp API Service',
        nodeVersion: process.version,
        uptime: healthService.getFormattedUptime(),
        environment: process.env.NODE_ENV || 'development',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    logger.debug('Package.json not found, using default values', {
      operation: 'version-check',
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
    });

    res.status(200).json({
      success: true,
      data: {
        name: 'my-wa-api',
        version: '1.0.0',
        description: 'WhatsApp API Service',
        nodeVersion: process.version,
        uptime: healthService.getFormattedUptime(),
        environment: process.env.NODE_ENV || 'development',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
