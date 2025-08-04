import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { WhatsAppInstanceModel, CreateInstanceData } from '../models/WhatsAppInstance';
import WhatsAppService from '../services/WhatsAppService';
import logger from '../config/logger';
import {
  AuthenticatedRequest,
  CreateInstanceBody,
  ApiError,
  ApiSuccess,
} from '../types/controllers';

export class InstanceController {
  // Helper para validar ID de instÃ¢ncia
  private static validateInstanceId(id: string | undefined): id is string {
    return typeof id === 'string' && id.trim().length > 0;
  }

  /**
   * @swagger
   * /api/instances:
   *   post:
   *     summary: Criar nova instÃ¢ncia do WhatsApp
   *     tags: [Instances]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *               webhook_url:
   *                 type: string
   *     responses:
   *       201:
   *         description: InstÃ¢ncia criada com sucesso
   *       400:
   *         description: Dados invÃ¡lidos
   *       401:
   *         description: Token invÃ¡lido
   */
  static async create(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<Response<ApiSuccess | ApiError>> {
    try {
      const userId = req.user?.userId;
      const { name, webhook_url } = req.body as CreateInstanceBody;

      if (!userId) {
        return res.status(401).json({
          error: 'UsuÃ¡rio nÃ£o autenticado',
        });
      }

      if (!name) {
        return res.status(400).json({
          error: 'Nome da instÃ¢ncia Ã© obrigatÃ³rio',
        });
      }

      // Gerar ID Ãºnico para a instÃ¢ncia
      const instanceId = uuidv4();

      // Criar instÃ¢ncia no banco de dados
      const instanceData: CreateInstanceData = {
        id: instanceId,
        user_id: userId,
        name,
        webhook_url,
      };

      const instance = await WhatsAppInstanceModel.create(instanceData);

      // Inicializar instÃ¢ncia do WhatsApp
      const success = await WhatsAppService.createInstance(instanceId, userId);

      if (!success) {
        // Se falhou ao criar no WhatsApp, remover do banco
        await WhatsAppInstanceModel.delete(instanceId);
        return res.status(500).json({
          error: 'Erro ao inicializar instÃ¢ncia do WhatsApp',
        });
      }

      logger.info(`InstÃ¢ncia criada: ${instanceId} pelo usuÃ¡rio ${userId}`);

      return res.status(201).json({
        message: 'InstÃ¢ncia criada com sucesso',
        instance: {
          id: instance.id,
          name: instance.name,
          status: instance.status,
          created_at: instance.created_at,
        },
      });
    } catch (error) {
      logger.error('Erro ao criar instÃ¢ncia:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * @swagger
   * /api/instances:
   *   get:
   *     summary: Listar instÃ¢ncias do usuÃ¡rio
   *     tags: [Instances]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de instÃ¢ncias
   *       401:
   *         description: Token invÃ¡lido
   */
  static async list(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      const instances = await WhatsAppInstanceModel.findByUserId(userId);

      // Adicionar informaÃ§Ãµes de status do WhatsApp Service
      const instancesWithStatus = await Promise.all(
        instances.map(async instance => {
          const info = await WhatsAppService.getInstanceInfo(instance.id);
          return {
            ...instance,
            whatsapp_status: info?.status || instance.status,
            is_ready: info?.isReady || false,
          };
        })
      );

      res.json({
        instances: instancesWithStatus,
      });
    } catch (error) {
      logger.error('Erro ao listar instÃ¢ncias:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * MÃ©todo pÃºblico temporÃ¡rio para desenvolvimento - listar todas as instÃ¢ncias
   * TODO: Remover em produÃ§Ã£o
   */
  static async listPublic(req: Request, res: Response) {
    try {
      // Para desenvolvimento, retornar algumas instÃ¢ncias exemplo
      const mockInstances = [
        {
          id: 'instance_1',
          name: 'InstÃ¢ncia Principal',
          status: 'disconnected',
          created_at: new Date().toISOString(),
          whatsapp_status: 'disconnected',
          is_ready: false,
        },
        {
          id: 'instance_2',
          name: 'InstÃ¢ncia Teste',
          status: 'ready',
          created_at: new Date().toISOString(),
          whatsapp_status: 'ready',
          is_ready: true,
        },
      ];

      res.json({
        success: true,
        data: mockInstances,
      });
    } catch (error) {
      logger.error('Erro ao listar instÃ¢ncias pÃºblicas:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * @swagger
   * /api/instances/{id}:
   *   get:
   *     summary: Obter detalhes de uma instÃ¢ncia
   *     tags: [Instances]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Detalhes da instÃ¢ncia
   *       404:
   *         description: InstÃ¢ncia nÃ£o encontrada
   */
  static async getById(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<Response<ApiSuccess | ApiError>> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          error: 'UsuÃ¡rio nÃ£o autenticado',
        });
      }

      if (!id) {
        return res.status(400).json({
          error: 'ID da instÃ¢ncia Ã© obrigatÃ³rio',
        });
      }

      const instance = await WhatsAppInstanceModel.findById(id);

      if (!instance) {
        return res.status(404).json({
          error: 'InstÃ¢ncia nÃ£o encontrada',
        });
      }

      // Verificar se o usuÃ¡rio tem acesso Ã  instÃ¢ncia
      if (instance.user_id !== userId) {
        return res.status(403).json({
          error: 'Acesso negado',
        });
      }

      // Obter informaÃ§Ãµes do WhatsApp Service
      const info = await WhatsAppService.getInstanceInfo(id);

      return res.json({
        instance: {
          ...instance,
          whatsapp_status: info?.status || instance.status,
          is_ready: info?.isReady || false,
          qr_code: info?.qrCode,
        },
      });
    } catch (error) {
      logger.error('Erro ao buscar instÃ¢ncia:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Obter QR code pÃºblico (sem autenticaÃ§Ã£o)
   */
  static async getPublicQRCode(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'ID da instÃ¢ncia Ã© obrigatÃ³rio',
        });
      }

      const instance = await WhatsAppInstanceModel.findById(id);

      if (!instance) {
        return res.status(404).json({
          error: 'InstÃ¢ncia nÃ£o encontrada',
        });
      }

      const info = await WhatsAppService.getInstanceInfo(id);

      if (!info?.qrCode) {
        return res.status(404).json({
          error:
            'QR code nÃ£o disponÃ­vel. A instÃ¢ncia pode jÃ¡ estar conectada ou aguardando conexÃ£o.',
        });
      }

      res.json({
        qr_code: info.qrCode,
        status: info.status,
      });
    } catch (error) {
      logger.error('Erro ao obter QR code pÃºblico:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * @swagger
   * /api/instances/{id}/qr:
   *   get:
   *     summary: Obter QR code da instÃ¢ncia
   *     tags: [Instances]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: QR code da instÃ¢ncia
   *       404:
   *         description: InstÃ¢ncia nÃ£o encontrada ou QR nÃ£o disponÃ­vel
   */
  static async getQRCode(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      if (!InstanceController.validateInstanceId(id)) {
        return res.status(400).json({
          error: 'ID da instÃ¢ncia Ã© obrigatÃ³rio',
        });
      }

      const instance = await WhatsAppInstanceModel.findById(id);

      if (!instance) {
        return res.status(404).json({
          error: 'InstÃ¢ncia nÃ£o encontrada',
        });
      }

      // Verificar se o usuÃ¡rio tem acesso Ã  instÃ¢ncia
      if (instance.user_id !== userId) {
        return res.status(403).json({
          error: 'Acesso negado',
        });
      }

      const info = await WhatsAppService.getInstanceInfo(id);

      if (!info?.qrCode) {
        return res.status(404).json({
          error:
            'QR code nÃ£o disponÃ­vel. A instÃ¢ncia pode jÃ¡ estar conectada ou aguardando conexÃ£o.',
        });
      }

      res.json({
        qr_code: info.qrCode,
        status: info.status,
      });
    } catch (error) {
      logger.error('Erro ao obter QR code:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * @swagger
   * /api/instances/{id}/disconnect:
   *   post:
   *     summary: Desconectar instÃ¢ncia
   *     tags: [Instances]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: InstÃ¢ncia desconectada
   *       404:
   *         description: InstÃ¢ncia nÃ£o encontrada
   */
  static async disconnect(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      if (!InstanceController.validateInstanceId(id)) {
        return res.status(400).json({
          error: 'ID da instÃ¢ncia Ã© obrigatÃ³rio',
        });
      }

      const instance = await WhatsAppInstanceModel.findById(id);

      if (!instance) {
        return res.status(404).json({
          error: 'InstÃ¢ncia nÃ£o encontrada',
        });
      }

      // Verificar se o usuÃ¡rio tem acesso Ã  instÃ¢ncia
      if (instance.user_id !== userId) {
        return res.status(403).json({
          error: 'Acesso negado',
        });
      }

      const success = await WhatsAppService.disconnectInstance(id);

      if (!success) {
        return res.status(500).json({
          error: 'Erro ao desconectar instÃ¢ncia',
        });
      }

      logger.info(`InstÃ¢ncia ${id} desconectada pelo usuÃ¡rio ${userId}`);

      res.json({
        message: 'InstÃ¢ncia desconectada com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao desconectar instÃ¢ncia:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * @swagger
   * /api/instances/{id}/restart:
   *   post:
   *     summary: Reiniciar instÃ¢ncia
   *     tags: [Instances]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: InstÃ¢ncia reiniciada
   *       404:
   *         description: InstÃ¢ncia nÃ£o encontrada
   */
  static async restart(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      if (!InstanceController.validateInstanceId(id)) {
        return res.status(400).json({
          error: 'ID da instÃ¢ncia Ã© obrigatÃ³rio',
        });
      }

      const instance = await WhatsAppInstanceModel.findById(id);

      if (!instance) {
        return res.status(404).json({
          error: 'InstÃ¢ncia nÃ£o encontrada',
        });
      }

      // Verificar se o usuÃ¡rio tem acesso Ã  instÃ¢ncia
      if (instance.user_id !== userId) {
        return res.status(403).json({
          error: 'Acesso negado',
        });
      }

      const success = await WhatsAppService.restartInstance(id);

      if (!success) {
        return res.status(500).json({
          error: 'Erro ao reiniciar instÃ¢ncia',
        });
      }

      logger.info(`InstÃ¢ncia ${id} reiniciada pelo usuÃ¡rio ${userId}`);

      res.json({
        message: 'InstÃ¢ncia reiniciada com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao reiniciar instÃ¢ncia:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * @swagger
   * /api/instances/{id}:
   *   delete:
   *     summary: Deletar instÃ¢ncia
   *     tags: [Instances]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: InstÃ¢ncia deletada
   *       404:
   *         description: InstÃ¢ncia nÃ£o encontrada
   */
  static async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      if (!InstanceController.validateInstanceId(id)) {
        return res.status(400).json({
          error: 'ID da instÃ¢ncia Ã© obrigatÃ³rio',
        });
      }

      const instance = await WhatsAppInstanceModel.findById(id);

      if (!instance) {
        return res.status(404).json({
          error: 'InstÃ¢ncia nÃ£o encontrada',
        });
      }

      // Verificar se o usuÃ¡rio tem acesso Ã  instÃ¢ncia
      if (instance.user_id !== userId) {
        return res.status(403).json({
          error: 'Acesso negado',
        });
      }

      // Desconectar instÃ¢ncia do WhatsApp primeiro
      await WhatsAppService.disconnectInstance(id);

      // Remover do banco de dados
      const deleted = await WhatsAppInstanceModel.delete(id);

      if (!deleted) {
        return res.status(500).json({
          error: 'Erro ao deletar instÃ¢ncia',
        });
      }

      logger.info(`InstÃ¢ncia ${id} deletada pelo usuÃ¡rio ${userId}`);

      res.json({
        message: 'InstÃ¢ncia deletada com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao deletar instÃ¢ncia:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
      });
    }
  }
}
