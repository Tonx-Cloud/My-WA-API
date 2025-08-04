import { Router } from 'express';
import { whatsappServiceNew } from '../services/WhatsAppServiceNew';
import logger from '../config/logger';

const router = Router();

// Criar uma nova instância
router.post('/create/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;

    if (!instanceId) {
      return res.status(400).json({
        success: false,
        error: 'Instance ID is required',
      });
    }

    const status = await whatsappServiceNew.createInstance(instanceId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Error creating instance:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Obter status de uma instância
router.get('/status/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const status = await whatsappServiceNew.getInstanceStatus(instanceId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found',
      });
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Error getting instance status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Obter QR Code de uma instância
router.get('/qr/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const qr = await whatsappServiceNew.generateQRCode(instanceId);

    if (!qr) {
      return res.status(404).json({
        success: false,
        error: 'QR code not available',
      });
    }

    res.json({
      success: true,
      data: { qr },
    });
  } catch (error) {
    logger.error('Error getting QR code:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Refresh QR Code
router.post('/qr/:instanceId/refresh', async (req, res) => {
  try {
    const { instanceId } = req.params;
    await whatsappServiceNew.refreshQR(instanceId);

    res.json({
      success: true,
      message: 'QR refresh requested',
    });
  } catch (error) {
    logger.error('Error refreshing QR code:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Listar todas as instâncias
router.get('/all', async (req, res) => {
  try {
    const instances = await whatsappServiceNew.getAllInstances();

    res.json({
      success: true,
      data: instances,
    });
  } catch (error) {
    logger.error('Error getting all instances:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Enviar mensagem
router.post('/send/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'To and message are required',
      });
    }

    const result = await whatsappServiceNew.sendMessage(instanceId, to, message);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Obter informações do cliente
router.get('/info/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const clientInfo = await whatsappServiceNew.getClientInfo(instanceId);

    res.json({
      success: true,
      data: clientInfo,
    });
  } catch (error) {
    logger.error('Error getting client info:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Logout da instância
router.post('/logout/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    await whatsappServiceNew.logout(instanceId);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Error logging out:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Destruir instância
router.delete('/destroy/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    await whatsappServiceNew.destroyInstance(instanceId);

    res.json({
      success: true,
      message: 'Instance destroyed successfully',
    });
  } catch (error) {
    logger.error('Error destroying instance:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Obter estado da conexão
router.get('/state/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const state = await whatsappServiceNew.getState(instanceId);

    res.json({
      success: true,
      data: { state },
    });
  } catch (error) {
    logger.error('Error getting connection state:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
