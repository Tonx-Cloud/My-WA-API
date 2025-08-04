import { logger } from './LoggerService';
import { healthService } from './HealthService';

export interface AlertRule {
  id: string;
  name: string;
  condition: (data: any) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldownMinutes: number;
  lastTriggered?: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: any;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface AlertChannel {
  type: 'email' | 'webhook' | 'slack' | 'discord';
  config: any;
  enabled: boolean;
}

class AlertingService {
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertChannels: AlertChannel[] = [];
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupDefaultRules();
    this.startMonitoring();
  }

  private setupDefaultRules(): void {
    // Rule para alta utilização de CPU
    this.addRule({
      id: 'high-cpu',
      name: 'Alta Utilização de CPU',
      condition: data => data.cpu > 80,
      severity: 'high',
      enabled: true,
      cooldownMinutes: 5,
    });

    // Rule para alta utilização de memória
    this.addRule({
      id: 'high-memory',
      name: 'Alta Utilização de Memória',
      condition: data => data.memory > 85,
      severity: 'high',
      enabled: true,
      cooldownMinutes: 5,
    });

    // Rule para instância desconectada
    this.addRule({
      id: 'instance-disconnected',
      name: 'Instância Desconectada',
      condition: data => data.status === 'disconnected',
      severity: 'critical',
      enabled: true,
      cooldownMinutes: 1,
    });

    // Rule para muitos erros
    this.addRule({
      id: 'high-error-rate',
      name: 'Alta Taxa de Erros',
      condition: data => data.errorRate > 10,
      severity: 'medium',
      enabled: true,
      cooldownMinutes: 10,
    });

    // Rule para resposta lenta
    this.addRule({
      id: 'slow-response',
      name: 'Resposta Lenta',
      condition: data => data.responseTime > 5000,
      severity: 'medium',
      enabled: true,
      cooldownMinutes: 15,
    });
  }

  addRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    logger.info('Alert rule added', {
      operation: 'alert-rule-add',
      metadata: { ruleId: rule.id, ruleName: rule.name },
    });
  }

  removeRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
    logger.info('Alert rule removed', {
      operation: 'alert-rule-remove',
      metadata: { ruleId },
    });
  }

  addChannel(channel: AlertChannel): void {
    this.alertChannels.push(channel);
    logger.info('Alert channel added', {
      operation: 'alert-channel-add',
      metadata: { channelType: channel.type },
    });
  }

  private startMonitoring(): void {
    // Verificar alertas a cada 30 segundos
    this.checkInterval = setInterval(() => {
      this.checkAlerts();
    }, 30000);

    logger.info('Alert monitoring started', {
      operation: 'alert-monitoring-start',
      metadata: { intervalMs: 30000 },
    });
  }

  private async checkAlerts(): Promise<void> {
    try {
      // Coletar métricas do sistema
      const systemMetrics = await this.collectSystemMetrics();

      // Verificar cada regra
      for (const [, rule] of this.alertRules) {
        if (!rule.enabled) continue;

        // Verificar cooldown
        if (rule.lastTriggered && this.isInCooldown(rule)) {
          continue;
        }

        // Avaliar condição
        if (rule.condition(systemMetrics)) {
          await this.triggerAlert(rule, systemMetrics);
        }
      }

      // Verificar se alertas existentes foram resolvidos
      await this.checkAlertResolution();
    } catch (error) {
      logger.error('Error checking alerts', error instanceof Error ? error : undefined, {
        operation: 'alert-check-error',
      });
    }
  }

  private async collectSystemMetrics(): Promise<any> {
    const healthResult = await healthService.performHealthCheck();

    // Usar dados de performance básicos
    const memUsage = process.memoryUsage();

    return {
      cpu: Math.min(50, Math.random() * 100), // Simulação básica - implementar coleta real depois
      memory: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      uptime: process.uptime(),
      responseTime: Math.random() * 1000, // Simulação - implementar coleta real depois
      errorRate: Math.random() * 5, // Simulação - implementar coleta real depois
      requestCount: Math.floor(Math.random() * 1000), // Simulação
      health: healthResult.success ? 'healthy' : 'unhealthy',
      timestamp: new Date(),
    };
  }

  private isInCooldown(rule: AlertRule): boolean {
    if (!rule.lastTriggered) return false;

    const cooldownMs = rule.cooldownMinutes * 60 * 1000;
    const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();

    return timeSinceLastTrigger < cooldownMs;
  }

  private async triggerAlert(rule: AlertRule, data: any): Promise<void> {
    const alertId = `${rule.id}-${Date.now()}`;

    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      severity: rule.severity,
      message: `${rule.name}: ${this.generateAlertMessage(rule, data)}`,
      data,
      timestamp: new Date(),
      resolved: false,
    };

    this.activeAlerts.set(alertId, alert);
    rule.lastTriggered = new Date();

    // Log do alerta
    logger.warn(`🚨 ALERT: ${alert.message}`, {
      operation: 'alert-triggered',
      metadata: {
        alertId,
        ruleId: rule.id,
        severity: rule.severity,
        data,
      },
    });

    // Enviar para canais configurados
    await this.sendAlertToChannels(alert);
  }

  private generateAlertMessage(rule: AlertRule, data: any): string {
    switch (rule.id) {
      case 'high-cpu':
        return `CPU usage is ${data.cpu.toFixed(1)}%`;
      case 'high-memory':
        return `Memory usage is ${data.memory.toFixed(1)}%`;
      case 'instance-disconnected':
        return `WhatsApp instance is disconnected`;
      case 'high-error-rate':
        return `Error rate is ${data.errorRate}%`;
      case 'slow-response':
        return `Average response time is ${data.responseTime}ms`;
      default:
        return `Alert condition met`;
    }
  }

  private async sendAlertToChannels(alert: Alert): Promise<void> {
    for (const channel of this.alertChannels) {
      if (!channel.enabled) continue;

      try {
        await this.sendToChannel(channel, alert);
      } catch (error) {
        logger.error(
          'Failed to send alert to channel',
          error instanceof Error ? error : undefined,
          {
            operation: 'alert-channel-error',
            metadata: {
              channelType: channel.type,
              alertId: alert.id,
            },
          }
        );
      }
    }
  }

  private async sendToChannel(channel: AlertChannel, alert: Alert): Promise<void> {
    switch (channel.type) {
      case 'webhook':
        await this.sendWebhook(channel.config, alert);
        break;
      case 'slack':
        await this.sendSlack(channel.config, alert);
        break;
      case 'discord':
        await this.sendDiscord(channel.config, alert);
        break;
      case 'email':
        await this.sendEmail(channel.config, alert);
        break;
      default:
        logger.warn(`Unknown alert channel type: ${channel.type}`);
    }
  }

  private async sendWebhook(config: any, alert: Alert): Promise<void> {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify({
        alert,
        timestamp: new Date().toISOString(),
        service: 'my-wa-api',
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  private async sendSlack(config: any, alert: Alert): Promise<void> {
    const color = this.getSeverityColor(alert.severity);

    const message = {
      attachments: [
        {
          color,
          title: `🚨 ${alert.severity.toUpperCase()} Alert`,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity,
              short: true,
            },
            {
              title: 'Timestamp',
              value: alert.timestamp.toISOString(),
              short: true,
            },
          ],
        },
      ],
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status}`);
    }
  }

  private async sendDiscord(config: any, alert: Alert): Promise<void> {
    const color = this.getSeverityColorCode(alert.severity);

    const message = {
      embeds: [
        {
          title: `🚨 ${alert.severity.toUpperCase()} Alert`,
          description: alert.message,
          color,
          timestamp: alert.timestamp.toISOString(),
          fields: [
            {
              name: 'Service',
              value: 'My WhatsApp API',
              inline: true,
            },
            {
              name: 'Rule ID',
              value: alert.ruleId,
              inline: true,
            },
          ],
        },
      ],
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`);
    }
  }

  private async sendEmail(config: any, alert: Alert): Promise<void> {
    // Implementação básica - seria necessário configurar um provedor de email
    logger.info('Email alert would be sent', {
      operation: 'alert-email',
      metadata: {
        to: config.to,
        subject: `🚨 ${alert.severity.toUpperCase()} Alert: ${alert.message}`,
        alertId: alert.id,
      },
    });
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return '#ffaa00';
      case 'low':
        return 'good';
      default:
        return '#cccccc';
    }
  }

  private getSeverityColorCode(severity: string): number {
    switch (severity) {
      case 'critical':
        return 0xff0000; // Red
      case 'high':
        return 0xff6600; // Orange
      case 'medium':
        return 0xffaa00; // Yellow
      case 'low':
        return 0x00ff00; // Green
      default:
        return 0xcccccc; // Gray
    }
  }

  private async checkAlertResolution(): Promise<void> {
    for (const [alertId, alert] of this.activeAlerts) {
      if (alert.resolved) continue;

      const rule = this.alertRules.get(alert.ruleId);
      if (!rule) continue;

      // Coletar métricas atuais
      const currentMetrics = await this.collectSystemMetrics();

      // Verificar se a condição foi resolvida
      if (!rule.condition(currentMetrics)) {
        alert.resolved = true;
        alert.resolvedAt = new Date();

        logger.info(`✅ Alert resolved: ${alert.message}`, {
          operation: 'alert-resolved',
          metadata: {
            alertId,
            duration: alert.resolvedAt.getTime() - alert.timestamp.getTime(),
          },
        });

        // Remover da lista de alertas ativos depois de um tempo
        setTimeout(() => {
          this.activeAlerts.delete(alertId);
        }, 60000); // 1 minuto
      }
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  getAlertHistory(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  getRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  getChannels(): AlertChannel[] {
    return this.alertChannels;
  }

  updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return false;

    Object.assign(rule, updates);

    logger.info('Alert rule updated', {
      operation: 'alert-rule-update',
      metadata: { ruleId, updates },
    });

    return true;
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;

      logger.info('Alert monitoring stopped', {
        operation: 'alert-monitoring-stop',
      });
    }
  }
}

export const alertingService = new AlertingService();
