import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @swagger
 * /api/webhooks/whatsapp:
 *   post:
 *     summary: Webhook para receber eventos do WhatsApp
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *               instanceId:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Webhook processado com sucesso
 */
router.post('/whatsapp', (req: Request, res: Response) => {
  try {
    const { event, instanceId, data } = req.body;

    console.log('Webhook recebido:', {
      event,
      instanceId,
      data,
      timestamp: new Date().toISOString()
    });

    // Aqui você pode processar diferentes tipos de eventos:
    // - message_received
    // - message_sent
    // - instance_connected
    // - instance_disconnected
    // - qr_updated

    switch (event) {
      case 'message_received':
        console.log('Nova mensagem recebida:', data);
        break;
      case 'message_sent':
        console.log('Mensagem enviada:', data);
        break;
      case 'instance_connected':
        console.log('Instância conectada:', instanceId);
        break;
      case 'instance_disconnected':
        console.log('Instância desconectada:', instanceId);
        break;
      case 'qr_updated':
        console.log('QR Code atualizado:', instanceId);
        break;
      default:
        console.log('Evento desconhecido:', event);
    }

    res.json({
      success: true,
      message: 'Webhook processado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar webhook'
    });
  }
});

/**
 * @swagger
 * /api/webhooks/status:
 *   get:
 *     summary: Verificar status dos webhooks
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status dos webhooks
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      status: 'active',
      endpoints: [
        {
          url: '/api/webhooks/whatsapp',
          method: 'POST',
          description: 'Webhook principal para eventos do WhatsApp'
        }
      ],
      lastEvent: {
        timestamp: new Date().toISOString(),
        event: 'message_received',
        instanceId: 'example-instance'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao obter status dos webhooks'
    });
  }
});

export default router;
