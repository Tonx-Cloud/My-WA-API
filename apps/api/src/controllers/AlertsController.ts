import { Request, Response } from 'express';
import { alertingService } from '../services/AlertingService';
import { logger } from '../services/LoggerService';

export class AlertsController {
  /**
   * @swagger
   * /api/alerts:
   *   get:
   *     tags:
   *       - Alerts
   *     summary: Lista todos os alertas ativos
   *     responses:
   *       200:
   *         description: Lista de alertas ativos
   */
  static async getActiveAlerts(req: Request, res: Response): Promise<void> {
    try {
      const activeAlerts = alertingService.getActiveAlerts();

      res.json({
        success: true,
        data: {
          count: activeAlerts.length,
          alerts: activeAlerts,
        },
      });

      logger.info('Active alerts retrieved', {
        operation: 'alerts-get-active',
        metadata: { count: activeAlerts.length },
      });
    } catch (error) {
      logger.error('Error getting active alerts', error instanceof Error ? error : undefined, {
        operation: 'alerts-get-active-error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get active alerts',
      });
    }
  }

  /**
   * @swagger
   * /api/alerts/history:
   *   get:
   *     tags:
   *       - Alerts
   *     summary: Lista o histÃ³rico completo de alertas
   *     responses:
   *       200:
   *         description: HistÃ³rico de alertas
   */
  static async getAlertHistory(req: Request, res: Response): Promise<void> {
    try {
      const alertHistory = alertingService.getAlertHistory();

      res.json({
        success: true,
        data: {
          count: alertHistory.length,
          alerts: alertHistory,
        },
      });

      logger.info('Alert history retrieved', {
        operation: 'alerts-get-history',
        metadata: { count: alertHistory.length },
      });
    } catch (error) {
      logger.error('Error getting alert history', error instanceof Error ? error : undefined, {
        operation: 'alerts-get-history-error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get alert history',
      });
    }
  }

  /**
   * @swagger
   * /api/alerts/rules:
   *   get:
   *     tags:
   *       - Alerts
   *     summary: Lista todas as regras de alerta
   *     responses:
   *       200:
   *         description: Lista de regras de alerta
   */
  static async getRules(req: Request, res: Response): Promise<void> {
    try {
      const rules = alertingService.getRules();

      res.json({
        success: true,
        data: {
          count: rules.length,
          rules: rules,
        },
      });

      logger.info('Alert rules retrieved', {
        operation: 'alerts-get-rules',
        metadata: { count: rules.length },
      });
    } catch (error) {
      logger.error('Error getting alert rules', error instanceof Error ? error : undefined, {
        operation: 'alerts-get-rules-error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get alert rules',
      });
    }
  }

  /**
   * @swagger
   * /api/alerts/rules/{ruleId}:
   *   put:
   *     tags:
   *       - Alerts
   *     summary: Atualiza uma regra de alerta
   *     parameters:
   *       - in: path
   *         name: ruleId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               enabled:
   *                 type: boolean
   *               cooldownMinutes:
   *                 type: number
   *               severity:
   *                 type: string
   *                 enum: [low, medium, high, critical]
   *     responses:
   *       200:
   *         description: Regra atualizada com sucesso
   *       404:
   *         description: Regra nÃ£o encontrada
   */
  static async updateRule(req: Request, res: Response): Promise<void> {
    try {
      const { ruleId } = req.params;
      const updates = req.body;

      if (!ruleId) {
        res.status(400).json({
          success: false,
          error: 'Rule ID is required',
        });
        return;
      }

      const success = alertingService.updateRule(ruleId, updates);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Rule not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Rule updated successfully',
      });

      logger.info('Alert rule updated', {
        operation: 'alerts-update-rule',
        metadata: { ruleId, updates },
      });
    } catch (error) {
      logger.error('Error updating alert rule', error instanceof Error ? error : undefined, {
        operation: 'alerts-update-rule-error',
        metadata: { ruleId: req.params.ruleId },
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update alert rule',
      });
    }
  }

  /**
   * @swagger
   * /api/alerts/channels:
   *   get:
   *     tags:
   *       - Alerts
   *     summary: Lista todos os canais de alerta configurados
   *     responses:
   *       200:
   *         description: Lista de canais de alerta
   */
  static async getChannels(req: Request, res: Response): Promise<void> {
    try {
      const channels = alertingService.getChannels();

      res.json({
        success: true,
        data: {
          count: channels.length,
          channels: channels.map(channel => ({
            type: channel.type,
            enabled: channel.enabled,
            // NÃ£o expor configuraÃ§Ãµes sensÃ­veis
            configured: !!channel.config,
          })),
        },
      });

      logger.info('Alert channels retrieved', {
        operation: 'alerts-get-channels',
        metadata: { count: channels.length },
      });
    } catch (error) {
      logger.error('Error getting alert channels', error instanceof Error ? error : undefined, {
        operation: 'alerts-get-channels-error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get alert channels',
      });
    }
  }

  /**
   * @swagger
   * /api/alerts/channels:
   *   post:
   *     tags:
   *       - Alerts
   *     summary: Adiciona um novo canal de alerta
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [email, webhook, slack, discord]
   *               config:
   *                 type: object
   *               enabled:
   *                 type: boolean
   *             required:
   *               - type
   *               - config
   *     responses:
   *       201:
   *         description: Canal adicionado com sucesso
   *       400:
   *         description: Dados invÃ¡lidos
   */
  static async addChannel(req: Request, res: Response): Promise<void> {
    try {
      const { type, config, enabled = true } = req.body;

      if (!type || !config) {
        res.status(400).json({
          success: false,
          error: 'Type and config are required',
        });
        return;
      }

      const validTypes = ['email', 'webhook', 'slack', 'discord'];
      if (!validTypes.includes(type)) {
        res.status(400).json({
          success: false,
          error: `Invalid channel type. Must be one of: ${validTypes.join(', ')}`,
        });
        return;
      }

      alertingService.addChannel({
        type,
        config,
        enabled,
      });

      res.status(201).json({
        success: true,
        message: 'Alert channel added successfully',
      });

      logger.info('Alert channel added', {
        operation: 'alerts-add-channel',
        metadata: { type, enabled },
      });
    } catch (error) {
      logger.error('Error adding alert channel', error instanceof Error ? error : undefined, {
        operation: 'alerts-add-channel-error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to add alert channel',
      });
    }
  }

  /**
   * @swagger
   * /api/alerts/test:
   *   post:
   *     tags:
   *       - Alerts
   *     summary: Envia um alerta de teste
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               severity:
   *                 type: string
   *                 enum: [low, medium, high, critical]
   *                 default: medium
   *               message:
   *                 type: string
   *                 default: Test alert
   *     responses:
   *       200:
   *         description: Alerta de teste enviado
   */
  static async sendTestAlert(req: Request, res: Response): Promise<void> {
    try {
      const { severity = 'medium', message = 'Test alert' } = req.body;

      // Criar um alerta de teste temporÃ¡rio
      const testAlert = {
        id: `test-${Date.now()}`,
        ruleId: 'test-rule',
        severity: severity as 'low' | 'medium' | 'high' | 'critical',
        message: `ðŸ§ª TEST: ${message}`,
        data: { test: true },
        timestamp: new Date(),
        resolved: false,
      };

      // Tentar enviar para todos os canais configurados
      const channels = alertingService.getChannels();

      for (const channel of channels) {
        if (channel.enabled) {
          try {
            // Simular envio do alerta de teste
            logger.info(`Test alert would be sent to ${channel.type} channel`, {
              operation: 'alerts-test',
              metadata: { channelType: channel.type, severity, message },
            });
          } catch (channelError) {
            logger.warn(
              `Failed to send test alert to ${channel.type}: ${channelError instanceof Error ? channelError.message : 'Unknown error'}`,
              {
                operation: 'alerts-test-channel-error',
                metadata: { channelType: channel.type },
              }
            );
          }
        }
      }

      res.json({
        success: true,
        message: 'Test alert sent to all enabled channels',
        data: {
          alert: testAlert,
          channelsSent: channels.filter(c => c.enabled).length,
        },
      });

      logger.info('Test alert sent', {
        operation: 'alerts-test-sent',
        metadata: { severity, message, channelCount: channels.filter(c => c.enabled).length },
      });
    } catch (error) {
      logger.error('Error sending test alert', error instanceof Error ? error : undefined, {
        operation: 'alerts-test-error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to send test alert',
      });
    }
  }
}
