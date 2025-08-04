import { Router } from 'express';
import { InstanceController } from '../controllers/InstanceController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Instances
 *   description: Gerenciamento de instÃ¢ncias do WhatsApp
 */

// Endpoints pÃºblicos (sem autenticaÃ§Ã£o)
router.get('/:id/qr-public', InstanceController.getPublicQRCode);
router.get('/public', (req, res) => InstanceController.listPublic(req, res));

// Aplicar autenticaÃ§Ã£o para todas as rotas seguintes
router.use(authenticateToken);

// CRUD de instÃ¢ncias
router.post('/', (req, res) => InstanceController.create(req as any, res));
router.get('/', (req, res) => InstanceController.list(req, res));
router.get('/:id', (req, res) => InstanceController.getById(req as any, res));
router.delete('/:id', (req, res) => InstanceController.delete(req as any, res));

// AÃ§Ãµes especÃ­ficas
router.get('/:id/qr', (req, res) => InstanceController.getQRCode(req as any, res));
router.post('/:id/disconnect', (req, res) => InstanceController.disconnect(req as any, res));
router.post('/:id/restart', (req, res) => InstanceController.restart(req as any, res));

export default router;
