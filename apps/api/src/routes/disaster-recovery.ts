import { Router } from 'express';
import {
  DisasterRecoveryService,
  DisasterRecoveryConfig,
} from '../services/DisasterRecoveryService';
import { BackupService, BackupConfig } from '../services/BackupService';
import { authMiddleware } from '../middleware/securityMiddleware';
import { enhancedLogger } from '../config/enhanced-logger';
import path from 'path';

const router = Router();

// Configuração padrão do disaster recovery
const defaultDRConfig: DisasterRecoveryConfig = {
  enabled: true,
  autoRecovery: false,
  recoveryThresholds: {
    maxDowntime: 300,
    maxErrorRate: 5,
    maxMemoryUsage: 90,
    maxCpuUsage: 80,
  },
  recoveryActions: {
    restartService: false,
    restoreBackup: false,
    notifyAdmins: true,
    escalationTime: 1800,
  },
  healthChecks: {
    interval: 60,
    timeout: 30,
    retries: 3,
  },
  notifications: {
    email: {
      enabled: false,
      recipients: [],
    },
    webhook: {
      enabled: false,
      url: '',
    },
  },
};

// Configuração padrão do backup para DR
const defaultBackupConfig: BackupConfig = {
  enabled: true,
  schedule: '0 */6 * * *',
  retention: {
    daily: 7,
    weekly: 4,
    monthly: 12,
  },
  compression: true,
  storage: {
    local: {
      enabled: true,
      path: path.join(process.cwd(), 'backups', 'disaster-recovery'),
    },
  },
};

// Inicializar serviços
const backupService = new BackupService(defaultBackupConfig);
const drService = new DisasterRecoveryService(defaultDRConfig, backupService);

// Aplicar middleware de autenticação
router.use(authMiddleware);

// Status do sistema de DR
router.get('/status', async (req, res) => {
  try {
    const status = await drService.getRecoveryStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    const statusError = error instanceof Error ? error : new Error('Erro ao obter status de DR');
    enhancedLogger.error(statusError, { context: 'Erro ao obter status de DR', error });
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

// Último health check
router.get('/health', async (req, res) => {
  try {
    const healthCheck = await drService.getLastHealthCheck();

    if (!healthCheck) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum health check disponível',
      });
    }

    res.json({
      success: true,
      data: healthCheck,
    });
  } catch (error) {
    const healthError = error instanceof Error ? error : new Error('Erro ao obter health check');
    enhancedLogger.error(healthError, { context: 'Erro ao obter health check', error });
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

// Listar eventos de desastre
router.get('/events', async (req, res) => {
  try {
    const events = await drService.getEvents();
    res.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    const listError = error instanceof Error ? error : new Error('Erro ao listar eventos de DR');
    enhancedLogger.error(listError, { context: 'Erro ao listar eventos de DR', error });
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

// Resolver evento de desastre
router.post('/events/:eventId/resolve', async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'ID do evento é obrigatório',
      });
    }

    await drService.resolveEvent(eventId);

    enhancedLogger.audit('disaster_event_resolved', 'system', { eventId });

    res.json({
      success: true,
      message: 'Evento resolvido com sucesso',
    });
  } catch (error) {
    const resolveError =
      error instanceof Error ? error : new Error('Erro ao resolver evento de DR');
    enhancedLogger.error(resolveError, { context: 'Erro ao resolver evento de DR', error });

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    if (errorMessage.includes('não encontrado')) {
      return res.status(404).json({
        success: false,
        message: errorMessage,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

// Iniciar monitoramento
router.post('/monitoring/start', async (req, res) => {
  try {
    await drService.startMonitoring();
    enhancedLogger.audit('dr_monitoring_started', 'system');
    res.json({
      success: true,
      message: 'Monitoramento de DR iniciado com sucesso',
    });
  } catch (error) {
    const startError =
      error instanceof Error ? error : new Error('Erro ao iniciar monitoramento de DR');
    enhancedLogger.error(startError, { context: 'Erro ao iniciar monitoramento de DR', error });
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

// Parar monitoramento
router.post('/monitoring/stop', async (req, res) => {
  try {
    await drService.stopMonitoring();
    enhancedLogger.audit('dr_monitoring_stopped', 'system');
    res.json({
      success: true,
      message: 'Monitoramento de DR parado com sucesso',
    });
  } catch (error) {
    const stopError =
      error instanceof Error ? error : new Error('Erro ao parar monitoramento de DR');
    enhancedLogger.error(stopError, { context: 'Erro ao parar monitoramento de DR', error });
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

// Dashboard consolidado
router.get('/dashboard', async (req, res) => {
  try {
    const [status, healthCheck, recentEvents] = await Promise.all([
      drService.getRecoveryStatus(),
      drService.getLastHealthCheck(),
      drService.getEvents({ dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000) }),
    ]);

    const dashboard = {
      status,
      healthCheck,
      recentEvents: recentEvents.slice(0, 10),
      summary: {
        criticalEvents: recentEvents.filter(e => e.severity === 'critical').length,
        warningEvents: recentEvents.filter(e => e.severity === 'high' || e.severity === 'medium')
          .length,
        resolvedEvents: recentEvents.filter(e => e.resolved).length,
        systemHealth: healthCheck?.status || 'unknown',
      },
    };

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    const dashboardError =
      error instanceof Error ? error : new Error('Erro ao obter dashboard de DR');
    enhancedLogger.error(dashboardError, { context: 'Erro ao obter dashboard de DR', error });
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

export default router;
