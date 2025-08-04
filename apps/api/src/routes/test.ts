import { Router } from 'express';
import WhatsAppService from '../services/WhatsAppService';
import { WhatsAppInstanceModel } from '../models/WhatsAppInstance';

const router = Router();

// Endpoint de teste para criar instÃ¢ncia sem autenticaÃ§Ã£o
router.post('/test-create/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a instÃ¢ncia jÃ¡ existe
    const existingInstance = await WhatsAppInstanceModel.findById(id);

    if (!existingInstance) {
      // Criar registro no banco de dados primeiro
      await WhatsAppInstanceModel.create({
        id,
        user_id: 1, // userId fake para teste
        name: `InstÃ¢ncia de Teste ${id}`,
        webhook_url: undefined,
      });
    }

    // Criar instÃ¢ncia de teste
    const success = await WhatsAppService.createInstance(id, 1); // userId fake

    if (success) {
      res.json({
        success: true,
        message: `InstÃ¢ncia ${id} criada com sucesso`,
        instanceId: id,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erro ao criar instÃ¢ncia',
      });
    }
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno',
    });
  }
});

// Endpoint de teste para obter QR code sem autenticaÃ§Ã£o
router.get('/test-qr/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const qrCode = await WhatsAppService.generateQRCode(id);

    if (qrCode) {
      res.json({
        success: true,
        qr_code: qrCode,
        status: 'CONNECTING',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'QR code nÃ£o disponÃ­vel',
      });
    }
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno',
    });
  }
});

export default router;
