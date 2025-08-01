import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { WhatsAppInstanceModel, CreateInstanceData } from '../models/WhatsAppInstance';
import WhatsAppService from '../services/WhatsAppService';
import logger from '../config/logger';
import { 
  AuthenticatedRequest, 
  CreateInstanceBody,
  ApiError,
  ApiSuccess 
} from '../types/controllers';

export class InstanceController {
  /**
   * @swagger
   * /api/instances:
   *   post:
   *     summary: Criar nova instância do WhatsApp
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
   *         description: Instância criada com sucesso
   *       400:
   *         description: Dados inválidos
   *       401:
   *         description: Token inválido
   */
  static async create(req: AuthenticatedRequest, res: Response): Promise<Response<ApiSuccess | ApiError>> {
    try {
      const userId = req.user?.userId;
      const { name, webhook_url } = req.body as CreateInstanceBody;

      if (!userId) {
        return res.status(401).json({
          error: 'Usuário não autenticado'
        });
      }

      if (!name) {
        return res.status(400).json({
          error: 'Nome da instância é obrigatório'
        });
      }

      // Gerar ID único para a instância
      const instanceId = uuidv4();

      // Criar instância no banco de dados
      const instanceData: CreateInstanceData = {
        id: instanceId,
        user_id: userId,
        name,
        ...(webhook_url && { webhook_url })
      };

      const instance = await WhatsAppInstanceModel.create(instanceData);

      // Inicializar instância do WhatsApp
      const success = await WhatsAppService.createInstance(instanceId, userId);

      if (!success) {
        // Se falhou ao criar no WhatsApp, remover do banco
        await WhatsAppInstanceModel.delete(instanceId);
        return res.status(500).json({
          error: 'Erro ao inicializar instância do WhatsApp'
        });
      }

      logger.info(`Instância criada: ${instanceId} pelo usuário ${userId}`);

      return res.status(201).json({
        message: 'Instância criada com sucesso',
        data: {
          id: instance.id,
          name: instance.name,
          status: instance.status,
          created_at: instance.created_at
        }
      });
    } catch (error) {
      logger.error('Erro ao criar instância:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/instances:
   *   get:
   *     summary: Listar instâncias do usuário
   *     tags: [Instances]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de instâncias
   *       401:
   *         description: Token inválido
   */
  static async list(req: AuthenticatedRequest, res: Response): Promise<Response<ApiSuccess | ApiError>> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Usuário não autenticado'
        });
      }

      const instances = await WhatsAppInstanceModel.findByUserId(userId);

      // Adicionar informações do WhatsApp Service
      const instancesWithStatus = await Promise.all(
        instances.map(async (instance) => {
          const info = await WhatsAppService.getInstanceInfo(instance.id);
          return {
            ...instance,
            whatsapp_status: info?.status || instance.status,
            is_ready: info?.isReady || false
          };
        })
      );

      return res.json({
        data: instancesWithStatus
      });
    } catch (error) {
      logger.error('Erro ao listar instâncias:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/instances/{id}:
   *   get:
   *     summary: Obter detalhes de uma instância
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
   *         description: Detalhes da instância
   *       404:
   *         description: Instância não encontrada
   */
  static async getById(req: AuthenticatedRequest, res: Response): Promise<Response<ApiSuccess | ApiError>> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          error: 'Usuário não autenticado'
        });
      }

      if (!id) {
        return res.status(400).json({
          error: 'ID da instância é obrigatório'
        });
      }

      const instance = await WhatsAppInstanceModel.findById(id);

      if (!instance) {
        return res.status(404).json({
          error: 'Instância não encontrada'
        });
      }

      // Verificar se o usuário tem acesso à instância
      if (instance.user_id !== userId) {
        return res.status(403).json({
          error: 'Acesso negado'
        });
      }

      // Obter informações do WhatsApp Service
      const info = await WhatsAppService.getInstanceInfo(id);

      return res.json({
        data: {
          ...instance,
          whatsapp_status: info?.status || instance.status,
          is_ready: info?.isReady || false,
          qr_code: info?.qrCode
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar instância:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter QR code público (sem autenticação)
   */
  static async getPublicQRCode(req: Request, res: Response): Promise<Response<ApiSuccess | ApiError>> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'ID da instância é obrigatório'
        });
      }

      const instance = await WhatsAppInstanceModel.findById(id);

      if (!instance) {
        return res.status(404).json({
          error: 'Instância não encontrada'
        });
      }

      // Obter informações do WhatsApp Service
      const info = await WhatsAppService.getInstanceInfo(id);

      if (!info?.qrCode) {
        return res.status(404).json({
          error: 'QR Code não disponível. A instância pode já estar conectada.'
        });
      }

      return res.json({
        data: {
          qr_code: info.qrCode,
          status: info.status,
          instance_name: instance.name
        }
      });
    } catch (error) {
      logger.error('Erro ao obter QR code público:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/instances/{id}/qr:
   *   get:
   *     summary: Obter QR code para conectar WhatsApp
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
   *         description: QR code da instância
   *       404:
   *         description: QR code não disponível
   */
  static async getQRCode(req: AuthenticatedRequest, res: Response): Promise<Response<ApiSuccess | ApiError>> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          error: 'Usuário não autenticado'
        });
      }

      if (!id) {
        return res.status(400).json({
          error: 'ID da instância é obrigatório'
        });
      }

      const instance = await WhatsAppInstanceModel.findById(id);

      if (!instance) {
        return res.status(404).json({
          error: 'Instância não encontrada'
        });
      }

      // Verificar se o usuário tem acesso à instância
      if (instance.user_id !== userId) {
        return res.status(403).json({
          error: 'Acesso negado'
        });
      }

      // Obter informações do WhatsApp Service
      const info = await WhatsAppService.getInstanceInfo(id);

      if (!info?.qrCode) {
        return res.status(404).json({
          error: 'QR Code não disponível. A instância pode já estar conectada ou aguardando conexão.'
        });
      }

      return res.json({
        data: {
          qr_code: info.qrCode,
          status: info.status
        }
      });
    } catch (error) {
      logger.error('Erro ao obter QR code:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/instances/{id}/disconnect:
   *   post:
   *     summary: Desconectar instância do WhatsApp
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
   *         description: Instância desconectada
   *       404:
   *         description: Instância não encontrada
   */
  static async disconnect(req: AuthenticatedRequest, res: Response): Promise<Response<ApiSuccess | ApiError>> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          error: 'Usuário não autenticado'
        });
      }

      if (!id) {
        return res.status(400).json({
          error: 'ID da instância é obrigatório'
        });
      }

      const instance = await WhatsAppInstanceModel.findById(id);

      if (!instance) {
        return res.status(404).json({
          error: 'Instância não encontrada'
        });
      }

      // Verificar se o usuário tem acesso à instância
      if (instance.user_id !== userId) {
        return res.status(403).json({
          error: 'Acesso negado'
        });
      }

      // Desconectar instância
      const success = await WhatsAppService.disconnectInstance(id);

      if (!success) {
        return res.status(500).json({
          error: 'Erro ao desconectar instância'
        });
      }

      // Atualizar status no banco
      await WhatsAppInstanceModel.updateStatus(id, 'disconnected');

      logger.info(`Instância desconectada: ${id} pelo usuário ${userId}`);

      return res.json({
        message: 'Instância desconectada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao desconectar instância:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/instances/{id}/restart:
   *   post:
   *     summary: Reiniciar instância do WhatsApp
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
   *         description: Instância reiniciada
   *       404:
   *         description: Instância não encontrada
   */
  static async restart(req: AuthenticatedRequest, res: Response): Promise<Response<ApiSuccess | ApiError>> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          error: 'Usuário não autenticado'
        });
      }

      if (!id) {
        return res.status(400).json({
          error: 'ID da instância é obrigatório'
        });
      }

      const instance = await WhatsAppInstanceModel.findById(id);

      if (!instance) {
        return res.status(404).json({
          error: 'Instância não encontrada'
        });
      }

      // Verificar se o usuário tem acesso à instância
      if (instance.user_id !== userId) {
        return res.status(403).json({
          error: 'Acesso negado'
        });
      }

      // Reiniciar instância
      const success = await WhatsAppService.restartInstance(id);

      if (!success) {
        return res.status(500).json({
          error: 'Erro ao reiniciar instância'
        });
      }

      logger.info(`Instância reiniciada: ${id} pelo usuário ${userId}`);

      return res.json({
        message: 'Instância reiniciada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao reiniciar instância:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/instances/{id}:
   *   delete:
   *     summary: Excluir instância
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
   *         description: Instância excluída
   *       404:
   *         description: Instância não encontrada
   */
  static async delete(req: AuthenticatedRequest, res: Response): Promise<Response<ApiSuccess | ApiError>> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          error: 'Usuário não autenticado'
        });
      }

      if (!id) {
        return res.status(400).json({
          error: 'ID da instância é obrigatório'
        });
      }

      const instance = await WhatsAppInstanceModel.findById(id);

      if (!instance) {
        return res.status(404).json({
          error: 'Instância não encontrada'
        });
      }

      // Verificar se o usuário tem acesso à instância
      if (instance.user_id !== userId) {
        return res.status(403).json({
          error: 'Acesso negado'
        });
      }

      // Desconectar instância antes de excluir
      await WhatsAppService.disconnectInstance(id);

      // Excluir do banco de dados
      const deleted = await WhatsAppInstanceModel.delete(id);

      if (!deleted) {
        return res.status(500).json({
          error: 'Erro ao excluir instância'
        });
      }

      logger.info(`Instância excluída: ${id} pelo usuário ${userId}`);

      return res.json({
        message: 'Instância excluída com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao excluir instância:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
}

export default InstanceController;
