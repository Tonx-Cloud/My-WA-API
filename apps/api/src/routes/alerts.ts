import { Router } from 'express';
import { AlertsController } from '../controllers/AlertsController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Alerts
 *   description: Sistema de alertas e monitoramento
 */

// Rotas para alertas
router.get('/', AlertsController.getActiveAlerts);
router.get('/history', AlertsController.getAlertHistory);
router.get('/rules', AlertsController.getRules);
router.put('/rules/:ruleId', AlertsController.updateRule);
router.get('/channels', AlertsController.getChannels);
router.post('/channels', AlertsController.addChannel);
router.post('/test', AlertsController.sendTestAlert);

export default router;
