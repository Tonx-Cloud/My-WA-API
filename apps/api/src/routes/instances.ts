import { Router } from 'express';
import { InstanceController } from '../controllers/InstanceController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Instances
 *   description: Gerenciamento de instâncias do WhatsApp
 */

// Endpoint público para QR code (sem autenticação)
router.get('/:id/qr-public', InstanceController.getPublicQRCode);

// Todas as outras rotas de instâncias requerem autenticação
router.use(authenticateToken);

// CRUD de instâncias
router.post('/', InstanceController.create);
router.get('/', InstanceController.list);
router.get('/:id', InstanceController.getById);
router.delete('/:id', InstanceController.delete);

// Ações específicas
router.get('/:id/qr', InstanceController.getQRCode);
router.post('/:id/disconnect', InstanceController.disconnect);
router.post('/:id/restart', InstanceController.restart);

export default router;
