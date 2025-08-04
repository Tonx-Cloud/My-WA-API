import { Router } from 'express';
import {
  securityMiddleware,
  authMiddleware,
  validateInput,
  sanitizeInputs,
  securityHeaders,
  instanceRateLimit,
} from '../middleware/securityMiddleware';
import { InstanceServiceImpl } from '../services/InstanceServiceSecure';
import { AuthenticatedRequest } from '../middleware/securityMiddleware';

const router = Router();
const instanceService = new InstanceServiceImpl();

// Aplicar middlewares de seguranÃ§a para todas as rotas
router.use(securityHeaders);
router.use(securityMiddleware);
router.use(instanceRateLimit);
router.use(sanitizeInputs);
router.use(authMiddleware);

/**
 * POST /instances - Criar nova instÃ¢ncia
 */
router.post('/', validateInput('createInstance'), async (req: AuthenticatedRequest, res) => {
  try {
    const { name, webhookUrl } = req.body;
    const userId = req.userId!;

    const result = await instanceService.createInstance(userId, name, webhookUrl);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('Erro na rota de criaÃ§Ã£o de instÃ¢ncia:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * GET /instances - Listar instÃ¢ncias do usuÃ¡rio
 */
router.get('/', validateInput('pagination'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const result = await instanceService.getUserInstances(userId, { page, limit });

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('Erro na rota de listagem de instÃ¢ncias:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * GET /instances/:id - Buscar instÃ¢ncia especÃ­fica
 */
router.get('/:id', validateInput('instanceId'), async (req: AuthenticatedRequest, res) => {
  try {
    const instanceId = req.params.id;
    const userId = req.userId!;

    if (!instanceId || instanceId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ID da instÃ¢ncia Ã© obrigatÃ³rio',
      });
    }

    const result = await instanceService.getInstanceById(instanceId, userId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      const statusCode =
        result.error === 'INSTANCE_NOT_FOUND' ? 404 : result.error === 'ACCESS_DENIED' ? 403 : 400;

      res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('Erro na rota de busca de instÃ¢ncia:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * PUT /instances/:id - Atualizar instÃ¢ncia
 */
router.put(
  '/:id',
  validateInput('instanceId'),
  validateInput('updateInstance'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const instanceId = req.params.id;
      const userId = req.userId!;
      const updates = req.body;

      if (!instanceId || instanceId.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'ID da instÃ¢ncia Ã© obrigatÃ³rio',
        });
      }

      const result = await instanceService.updateInstance(instanceId, userId, updates);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result.data,
        });
      } else {
        const statusCode =
          result.error === 'INSTANCE_NOT_FOUND'
            ? 404
            : result.error === 'ACCESS_DENIED'
              ? 403
              : 400;

        res.status(statusCode).json({
          success: false,
          error: result.error,
          message: result.message,
        });
      }
    } catch (error) {
      console.error('Erro na rota de atualizaÃ§Ã£o de instÃ¢ncia:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }
);

/**
 * DELETE /instances/:id - Deletar instÃ¢ncia
 */
router.delete('/:id', validateInput('instanceId'), async (req: AuthenticatedRequest, res) => {
  try {
    const instanceId = req.params.id;
    const userId = req.userId!;

    if (!instanceId || instanceId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ID da instÃ¢ncia Ã© obrigatÃ³rio',
      });
    }

    const result = await instanceService.deleteInstance(instanceId, userId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      const statusCode =
        result.error === 'INSTANCE_NOT_FOUND' ? 404 : result.error === 'ACCESS_DENIED' ? 403 : 400;

      res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('Erro na rota de deleÃ§Ã£o de instÃ¢ncia:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * POST /instances/:id/connect - Conectar instÃ¢ncia
 */
router.post('/:id/connect', validateInput('instanceId'), async (req: AuthenticatedRequest, res) => {
  try {
    const instanceId = req.params.id;
    const userId = req.userId!;

    if (!instanceId || instanceId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ID da instÃ¢ncia Ã© obrigatÃ³rio',
      });
    }

    const result = await instanceService.connectInstance(instanceId, userId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: { qrCode: result.data },
      });
    } else {
      const statusCode =
        result.error === 'INSTANCE_NOT_FOUND' ? 404 : result.error === 'ACCESS_DENIED' ? 403 : 400;

      res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('Erro na rota de conexÃ£o de instÃ¢ncia:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * POST /instances/:id/disconnect - Desconectar instÃ¢ncia
 */
router.post(
  '/:id/disconnect',
  validateInput('instanceId'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const instanceId = req.params.id;
      const userId = req.userId!;

      if (!instanceId || instanceId.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'ID da instÃ¢ncia Ã© obrigatÃ³rio',
        });
      }

      const result = await instanceService.disconnectInstance(instanceId, userId);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result.data,
        });
      } else {
        const statusCode =
          result.error === 'INSTANCE_NOT_FOUND'
            ? 404
            : result.error === 'ACCESS_DENIED'
              ? 403
              : 400;

        res.status(statusCode).json({
          success: false,
          error: result.error,
          message: result.message,
        });
      }
    } catch (error) {
      console.error('Erro na rota de desconexÃ£o de instÃ¢ncia:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }
);

/**
 * GET /instances/:id/status - Obter status da instÃ¢ncia
 */
router.get('/:id/status', validateInput('instanceId'), async (req: AuthenticatedRequest, res) => {
  try {
    const instanceId = req.params.id;
    const userId = req.userId!;

    if (!instanceId || instanceId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ID da instÃ¢ncia Ã© obrigatÃ³rio',
      });
    }

    const result = await instanceService.getInstanceStatus(instanceId, userId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      const statusCode =
        result.error === 'INSTANCE_NOT_FOUND' ? 404 : result.error === 'ACCESS_DENIED' ? 403 : 400;

      res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('Erro na rota de status de instÃ¢ncia:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * GET /instances/:id/qr - Obter QR Code para reconexÃ£o
 */
router.get('/:id/qr', validateInput('instanceId'), async (req: AuthenticatedRequest, res) => {
  try {
    const instanceId = req.params.id;
    const userId = req.userId!;

    if (!instanceId || instanceId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ID da instÃ¢ncia Ã© obrigatÃ³rio',
      });
    }

    // Usar o mesmo mÃ©todo de connect mas apenas retornar o QR
    const result = await instanceService.connectInstance(instanceId, userId);

    if (result.success) {
      res.json({
        success: true,
        message: 'QR Code gerado com sucesso',
        data: { qrCode: result.data },
      });
    } else {
      const statusCode =
        result.error === 'INSTANCE_NOT_FOUND' ? 404 : result.error === 'ACCESS_DENIED' ? 403 : 400;

      res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('Erro na rota de QR Code:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

export default router;
