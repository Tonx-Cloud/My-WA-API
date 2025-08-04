import { BaseService } from './BaseService';
import { metricsService } from './MetricsService';
import { EventEmitter } from 'events';

interface Alert {
  id: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  metric: string;
  threshold: number;
  currentValue: number;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  tags?: Record<string, string>;
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  severity: Alert['type'];
  description: string;
  enabled: boolean;
  cooldown: number; // ms entre alertas do mesmo tipo
  tags?: Record<string, string>;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  score: number; // 0-100
  components: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      message?: string;
      responseTime?: number;
      lastCheck: number;
    };
  };
  lastUpdate: number;
}

export class MonitoringService extends BaseService {
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private healthStatus: HealthStatus;
  private eventEmitter = new EventEmitter();
  private monitoringInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;

  private readonly maxAlertHistory = 1000;
  private readonly defaultCooldown = 5 * 60 * 1000; // 5 minutos

  constructor() {
    super();
    this.healthStatus = this.initializeHealthStatus();
    this.setupDefaultAlertRules();
    this.startMonitoring();
    this.startHealthChecks();
  }

  /**
   * Inicializar status de saÃºde
   */
  private initializeHealthStatus(): HealthStatus {
    return {
      status: 'healthy',
      score: 100,
      components: {
        api: { status: 'healthy', lastCheck: Date.now() },
        database: { status: 'healthy', lastCheck: Date.now() },
        whatsapp: { status: 'healthy', lastCheck: Date.now() },
        memory: { status: 'healthy', lastCheck: Date.now() },
        cpu: { status: 'healthy', lastCheck: Date.now() },
        disk: { status: 'healthy', lastCheck: Date.now() },
      },
      lastUpdate: Date.now(),
    };
  }

  /**
   * Configurar regras de alerta padrÃ£o
   */
  private setupDefaultAlertRules(): void {
    const defaultRules: Omit<AlertRule, 'id'>[] = [
      {
        name: 'Alto uso de CPU',
        metric: 'system.cpu.usage',
        condition: 'greater_than',
        threshold: 80,
        severity: 'WARNING',
        description: 'Uso de CPU acima de 80%',
        enabled: true,
        cooldown: this.defaultCooldown,
      },
      {
        name: 'Uso crÃ­tico de CPU',
        metric: 'system.cpu.usage',
        condition: 'greater_than',
        threshold: 95,
        severity: 'CRITICAL',
        description: 'Uso de CPU crÃ­tico acima de 95%',
        enabled: true,
        cooldown: this.defaultCooldown,
      },
      {
        name: 'Alto uso de memÃ³ria',
        metric: 'system.memory.usage',
        condition: 'greater_than',
        threshold: 85,
        severity: 'WARNING',
        description: 'Uso de memÃ³ria acima de 85%',
        enabled: true,
        cooldown: this.defaultCooldown,
      },
      {
        name: 'Uso crÃ­tico de memÃ³ria',
        metric: 'system.memory.usage',
        condition: 'greater_than',
        threshold: 95,
        severity: 'CRITICAL',
        description: 'Uso de memÃ³ria crÃ­tico acima de 95%',
        enabled: true,
        cooldown: this.defaultCooldown,
      },
      {
        name: 'Alto tempo de resposta da API',
        metric: 'business.api.avg_response_time',
        condition: 'greater_than',
        threshold: 2000,
        severity: 'WARNING',
        description: 'Tempo mÃ©dio de resposta da API acima de 2 segundos',
        enabled: true,
        cooldown: this.defaultCooldown,
      },
      {
        name: 'Alta taxa de erro da API',
        metric: 'business.api.error_rate',
        condition: 'greater_than',
        threshold: 10,
        severity: 'WARNING',
        description: 'Taxa de erro da API acima de 10%',
        enabled: true,
        cooldown: this.defaultCooldown,
      },
      {
        name: 'Muitas instÃ¢ncias com erro',
        metric: 'business.instances.error',
        condition: 'greater_than',
        threshold: 5,
        severity: 'WARNING',
        description: 'Mais de 5 instÃ¢ncias com erro',
        enabled: true,
        cooldown: this.defaultCooldown,
      },
    ];

    defaultRules.forEach(rule => {
      this.addAlertRule(rule);
    });
  }

  /**
   * Adicionar regra de alerta
   */
  addAlertRule(rule: Omit<AlertRule, 'id'>): string {
    const id = this.generateAlertRuleId();
    const fullRule: AlertRule = { ...rule, id };

    this.alertRules.set(id, fullRule);
    this.logger.info(`Regra de alerta adicionada: ${rule.name}`, { ruleId: id });

    return id;
  }

  /**
   * Remover regra de alerta
   */
  removeAlertRule(id: string): boolean {
    const removed = this.alertRules.delete(id);
    if (removed) {
      this.logger.info(`Regra de alerta removida: ${id}`);
    }
    return removed;
  }

  /**
   * Atualizar regra de alerta
   */
  updateAlertRule(id: string, updates: Partial<Omit<AlertRule, 'id'>>): boolean {
    const rule = this.alertRules.get(id);
    if (!rule) {
      return false;
    }

    const updatedRule = { ...rule, ...updates };
    this.alertRules.set(id, updatedRule);
    this.logger.info(`Regra de alerta atualizada: ${id}`, { updates });

    return true;
  }

  /**
   * Verificar regras de alerta
   */
  private async checkAlertRules(): Promise<void> {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      try {
        // Obter mÃ©tricas recentes para a regra
        const metrics = metricsService.getMetrics(fiveMinutesAgo, now, rule.metric);

        if (metrics.length === 0) continue;

        // Usar a mÃ©trica mais recente
        const latestMetric = metrics[0];
        if (!latestMetric) continue;

        const currentValue = latestMetric.value;

        // Verificar se a condiÃ§Ã£o Ã© atendida
        const conditionMet = this.evaluateCondition(currentValue, rule.condition, rule.threshold);

        if (conditionMet) {
          // Verificar cooldown
          const existingAlert = Array.from(this.activeAlerts.values()).find(
            alert => alert.metric === rule.metric && !alert.resolved
          );

          if (existingAlert) {
            const timeSinceLastAlert = now - existingAlert.timestamp;
            if (timeSinceLastAlert < rule.cooldown) {
              continue; // Ainda em cooldown
            }
          }

          // Criar novo alerta
          this.createAlert(rule, currentValue);
        } else {
          // Verificar se precisamos resolver alertas existentes
          this.resolveAlertsForMetric(rule.metric);
        }
      } catch (error) {
        this.logger.error(`Erro ao verificar regra de alerta ${rule.id}:`, error);
      }
    }
  }

  /**
   * Avaliar condiÃ§Ã£o de alerta
   */
  private evaluateCondition(
    value: number,
    condition: AlertRule['condition'],
    threshold: number
  ): boolean {
    switch (condition) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return value === threshold;
      case 'not_equals':
        return value !== threshold;
      default:
        return false;
    }
  }

  /**
   * Criar novo alerta
   */
  private createAlert(rule: AlertRule, currentValue: number): void {
    const alert: Alert = {
      id: this.generateAlertId(),
      type: rule.severity,
      title: rule.name,
      description: `${rule.description}. Valor atual: ${currentValue}`,
      metric: rule.metric,
      threshold: rule.threshold,
      currentValue,
      timestamp: Date.now(),
      resolved: false,
      ...(rule.tags && { tags: rule.tags }),
    };

    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);

    // Manter histÃ³rico limitado
    if (this.alertHistory.length > this.maxAlertHistory) {
      this.alertHistory = this.alertHistory.slice(-this.maxAlertHistory);
    }

    // Emitir evento
    this.eventEmitter.emit('alert', alert);

    // Log baseado na severidade
    const logMethod =
      alert.type === 'CRITICAL' ? 'error' : alert.type === 'WARNING' ? 'warn' : 'info';

    this.logger[logMethod](`ALERTA [${alert.type}]: ${alert.title}`, {
      alertId: alert.id,
      metric: alert.metric,
      currentValue: alert.currentValue,
      threshold: alert.threshold,
    });
  }

  /**
   * Resolver alertas para uma mÃ©trica especÃ­fica
   */
  private resolveAlertsForMetric(metric: string): void {
    const now = Date.now();

    for (const alert of this.activeAlerts.values()) {
      if (alert.metric === metric && !alert.resolved) {
        alert.resolved = true;
        alert.resolvedAt = now;

        this.eventEmitter.emit('alert-resolved', alert);
        this.logger.info(`Alerta resolvido: ${alert.title}`, { alertId: alert.id });
      }
    }
  }

  /**
   * Realizar health checks
   */
  private async performHealthChecks(): Promise<void> {
    const now = Date.now();
    let totalScore = 0;
    let componentCount = 0;

    // Check API Health
    try {
      const apiStart = performance.now();
      // Simular verificaÃ§Ã£o de API
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      const apiTime = performance.now() - apiStart;

      this.healthStatus.components.api = {
        status: apiTime < 100 ? 'healthy' : apiTime < 500 ? 'degraded' : 'unhealthy',
        responseTime: apiTime,
        lastCheck: now,
      };
    } catch (error) {
      this.healthStatus.components.api = {
        status: 'unhealthy',
        message: 'API nÃ£o responsiva',
        lastCheck: now,
      };
    }

    // Check Database Health
    try {
      const dbStart = performance.now();
      // Simular verificaÃ§Ã£o de banco
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
      const dbTime = performance.now() - dbStart;

      this.healthStatus.components.database = {
        status: dbTime < 50 ? 'healthy' : dbTime < 200 ? 'degraded' : 'unhealthy',
        responseTime: dbTime,
        lastCheck: now,
      };
    } catch (error) {
      this.healthStatus.components.database = {
        status: 'unhealthy',
        message: 'Banco de dados inacessÃ­vel',
        lastCheck: now,
      };
    }

    // Check WhatsApp Health
    const instanceMetrics = metricsService.getMetrics(now - 60000, now, 'business.instances');
    const errorInstances =
      instanceMetrics.find(m => m.name === 'business.instances.error')?.value || 0;
    const totalInstances =
      instanceMetrics.find(m => m.name === 'business.instances.total')?.value || 1;
    const errorRate = (errorInstances / totalInstances) * 100;

    this.healthStatus.components.whatsapp = {
      status: errorRate < 5 ? 'healthy' : errorRate < 15 ? 'degraded' : 'unhealthy',
      message: `${errorRate.toFixed(1)}% de instÃ¢ncias com erro`,
      lastCheck: now,
    };

    // Check System Resources
    const memoryMetrics = metricsService.getMetrics(now - 60000, now, 'system.memory.usage');
    const cpuMetrics = metricsService.getMetrics(now - 60000, now, 'system.cpu.usage');

    const memoryUsage = memoryMetrics[0]?.value || 0;
    const cpuUsage = cpuMetrics[0]?.value || 0;

    this.healthStatus.components.memory = {
      status: memoryUsage < 80 ? 'healthy' : memoryUsage < 95 ? 'degraded' : 'unhealthy',
      message: `${memoryUsage.toFixed(1)}% de uso`,
      lastCheck: now,
    };

    this.healthStatus.components.cpu = {
      status: cpuUsage < 80 ? 'healthy' : cpuUsage < 95 ? 'degraded' : 'unhealthy',
      message: `${cpuUsage.toFixed(1)}% de uso`,
      lastCheck: now,
    };

    // Calcular score geral
    for (const component of Object.values(this.healthStatus.components)) {
      componentCount++;
      switch (component.status) {
        case 'healthy':
          totalScore += 100;
          break;
        case 'degraded':
          totalScore += 60;
          break;
        case 'unhealthy':
          totalScore += 0;
          break;
      }
    }

    this.healthStatus.score = componentCount > 0 ? Math.round(totalScore / componentCount) : 100;
    this.healthStatus.status =
      this.healthStatus.score >= 80
        ? 'healthy'
        : this.healthStatus.score >= 50
          ? 'degraded'
          : 'unhealthy';
    this.healthStatus.lastUpdate = now;

    // Registrar score como mÃ©trica
    metricsService.recordGauge('system.health.score', this.healthStatus.score, 'percent');
  }

  /**
   * Iniciar monitoramento
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkAlertRules();
      } catch (error) {
        this.logger.error('Erro no monitoramento de alertas:', error);
      }
    }, 30000); // A cada 30 segundos
  }

  /**
   * Iniciar health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error) {
        this.logger.error('Erro no health check:', error);
      }
    }, 60000); // A cada 1 minuto
  }

  /**
   * Gerar ID Ãºnico para regra de alerta
   */
  private generateAlertRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gerar ID Ãºnico para alerta
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obter status de saÃºde atual
   */
  getHealthStatus(): HealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Obter alertas ativos
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Obter histÃ³rico de alertas
   */
  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  /**
   * Obter regras de alerta
   */
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Resolver alerta manualmente
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert || alert.resolved) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = Date.now();

    this.eventEmitter.emit('alert-resolved', alert);
    this.logger.info(`Alerta resolvido manualmente: ${alert.title}`, { alertId });

    return true;
  }

  /**
   * Registrar listener para eventos de alerta
   */
  onAlert(callback: (alert: Alert) => void): void {
    this.eventEmitter.on('alert', callback);
  }

  /**
   * Registrar listener para resoluÃ§Ã£o de alertas
   */
  onAlertResolved(callback: (alert: Alert) => void): void {
    this.eventEmitter.on('alert-resolved', callback);
  }

  /**
   * Parar monitoramento
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.eventEmitter.removeAllListeners();
    this.logger.info('Monitoramento parado');
  }
}

// Exportar instÃ¢ncia singleton
export const monitoringService = new MonitoringService();
