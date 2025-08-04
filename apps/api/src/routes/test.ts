import { Router } from 'express';
import WhatsAppService from '../services/WhatsAppService';
import { WhatsAppInstanceModel } from '../models/WhatsAppInstance';

const router = Router();

// Endpoint de teste para criar instância sem autenticação
router.post('/test-create/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a instância já existe
    const existingInstance = await WhatsAppInstanceModel.findById(id);

    if (!existingInstance) {
      // Criar registro no banco de dados primeiro
      await WhatsAppInstanceModel.create({
        id,
        user_id: 1, // userId fake para teste
        name: `Instância de Teste ${id}`,
        webhook_url: undefined,
      });
    }

    // Criar instância de teste
    const success = await WhatsAppService.createInstance(id, 1); // userId fake

    if (success) {
      res.json({
        success: true,
        message: `Instância ${id} criada com sucesso`,
        instanceId: id,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erro ao criar instância',
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

// Endpoint de teste para obter QR code sem autenticação
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
        error: 'QR code não disponível',
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
