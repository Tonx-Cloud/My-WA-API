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
router.post('/', (req, res) => InstanceController.create(req as any, res));
router.get('/', (req, res) => InstanceController.list(req, res));
router.get('/:id', (req, res) => InstanceController.getById(req as any, res));
router.delete('/:id', (req, res) => InstanceController.delete(req as any, res));

// Ações específicas
router.get('/:id/qr', (req, res) => InstanceController.getQRCode(req as any, res));
router.post('/:id/disconnect', (req, res) => InstanceController.disconnect(req as any, res));
router.post('/:id/restart', (req, res) => InstanceController.restart(req as any, res));

export default router;
