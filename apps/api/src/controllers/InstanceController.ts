import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  WhatsAppInstanceModel,
  CreateInstanceData,
} from "../models/WhatsAppInstance";
import WhatsAppService from "../services/WhatsAppService";
import logger from "../config/logger";
import {
  AuthenticatedRequest,
  CreateInstanceBody,
  ApiError,
  ApiSuccess,
} from "../types/controllers";

export class InstanceController {
  // Helper para validar ID de instância
  private static validateInstanceId(id: string | undefined): id is string {
    return typeof id === "string" && id.trim().length > 0;
  }

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
  static async create(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response<ApiSuccess | ApiError>> {
    try {
      const userId = req.user?.userId;
      const { name, webhook_url } = req.body as CreateInstanceBody;

      if (!userId) {
        return res.status(401).json({
          error: "Usuário não autenticado",
        });
      }

      if (!name) {
        return res.status(400).json({
          error: "Nome da instância é obrigatório",
        });
      }

      // Gerar ID único para a instância
      const instanceId = uuidv4();

      // Criar instância no banco de dados
      const instanceData: CreateInstanceData = {
        id: instanceId,
        user_id: userId,
        name,
        webhook_url,
      };

      const instance = await WhatsAppInstanceModel.create(instanceData);

      // Inicializar instância do WhatsApp
      const success = await WhatsAppService.createInstance(instanceId, userId);

      if (!success) {
        // Se falhou ao criar no WhatsApp, remover do banco
        await WhatsAppInstanceModel.delete(instanceId);
        return res.status(500).json({
          error: "Erro ao inicializar instância do WhatsApp",
        });
      }

      logger.info(`Instância criada: ${instanceId} pelo usuário ${userId}`);

      return res.status(201).json({
        message: "Instância criada com sucesso",
        instance: {
          id: instance.id,
          name: instance.name,
          status: instance.status,
          created_at: instance.created_at,
        },
      });
    } catch (error) {
      logger.error("Erro ao criar instância:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
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
  static async list(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      const instances = await WhatsAppInstanceModel.findByUserId(userId);

      // Adicionar informações de status do WhatsApp Service
      const instancesWithStatus = await Promise.all(
        instances.map(async (instance) => {
          const info = await WhatsAppService.getInstanceInfo(instance.id);
          return {
            ...instance,
            whatsapp_status: info?.status || instance.status,
            is_ready: info?.isReady || false,
          };
        }),
      );

      res.json({
        instances: instancesWithStatus,
      });
    } catch (error) {
      logger.error("Erro ao listar instâncias:", error);
      res.status(500).json({
        error: "Erro interno do servidor",
      });
    }
  }

  /**
   * Método público temporário para desenvolvimento - listar todas as instâncias
   * TODO: Remover em produção
   */
  static async listPublic(req: Request, res: Response) {
    try {
      // Para desenvolvimento, retornar algumas instâncias exemplo
      const mockInstances = [
        {
          id: "instance_1",
          name: "Instância Principal",
          status: "disconnected",
          created_at: new Date().toISOString(),
          whatsapp_status: "disconnected",
          is_ready: false,
        },
        {
          id: "instance_2",
          name: "Instância Teste",
          status: "ready",
          created_at: new Date().toISOString(),
          whatsapp_status: "ready",
          is_ready: true,
        },
      ];

      res.json({
        success: true,
        data: mockInstances,
      });
    } catch (error) {
      logger.error("Erro ao listar instâncias públicas:", error);
      res.status(500).json({
        error: "Erro interno do servidor",
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
  static async getById(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response<ApiSuccess | ApiError>> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          error: "Usuário não autenticado",
        });
      }

      if (!id) {
        return res.status(400).json({
          error: "ID da instância é obrigatório",
        });
      }

      const instance = await WhatsAppInstanceModel.findById(id);

      if (!instance) {
        return res.status(404).json({
          error: "Instância não encontrada",
        });
      }

      // Verificar se o usuário tem acesso à instância
      if (instance.user_id !== userId) {
        return res.status(403).json({
          error: "Acesso negado",
        });
      }

      // Obter informações do WhatsApp Service
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
      logger.error("Erro ao buscar instância:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
      });
    }
  }

  /**
   * Obter QR code público (sem autenticação)
   */
  static async getPublicQRCode(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: "ID da instância é obrigatório",
        });
      }

      const instance = await WhatsAppInstanceModel.findById(id);

      if (!instance) {
        return res.status(404).json({
          error: "Instância não encontrada",
        });
      }

      const info = await WhatsAppService.getInstanceInfo(id);

      if (!info?.qrCode) {
        return res.status(404).json({
          error:
            "QR code não disponível. A instância pode já estar conectada ou aguardando conexão.",
        });
      }

      res.json({
        qr_code: info.qrCode,
        status: info.status,
      });
    } catch (error) {
      logger.error("Erro ao obter QR code público:", error);
      res.status(500).json({
        error: "Erro interno do servidor",
      });
    }
  }

  /**
   * @swagger
   * /api/instances/{id}/qr:
   *   get:
   *     summary: Obter QR code da instância
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
   *         description: Instância não encontrada ou QR não disponível
   */
  static async getQRCode(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      if (!InstanceController.validateInstanceId(id)) {
        return res.status(400).json({
          error: "ID da instância é obrigatório",
        });
      }

      const instance = await WhatsAppInstanceModel.findById(id);

      if (!instance) {
        return res.status(404).json({
          error: "Instância não encontrada",
        });
      }

      // Verificar se o usuário tem acesso à instância
      if (instance.user_id !== userId) {
        return res.status(403).json({
          error: "Acesso negado",
        });
      }

      const info = await WhatsAppService.getInstanceInfo(id);

      if (!info?.qrCode) {
        return res.status(404).json({
          error:
            "QR code não disponível. A instância pode já estar conectada ou aguardando conexão.",
        });
      }

      res.json({
        qr_code: info.qrCode,
        status: info.status,
      });
    } catch (error) {
      logger.error("Erro ao obter QR code:", error);
      res.status(500).json({
        error: "Erro interno do servidor",
      });
    }
  }

  /**
   * @swagger
   * /api/instances/{id}/disconnect:
   *   post:
   *     summary: Desconectar instância
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
  static async disconnect(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      if (!InstanceController.validateInstanceId(id)) {
        return res.status(400).json({
          error: "ID da instância é obrigatório",
        });
      }

      const instance = await WhatsAppInstanceModel.findById(id);

      if (!instance) {
        return res.status(404).json({
          error: "Instância não encontrada",
        });
      }

      // Verificar se o usuário tem acesso à instância
      if (instance.user_id !== userId) {
        return res.status(403).json({
          error: "Acesso negado",
        });
      }

      const success = await WhatsAppService.disconnectInstance(id);

      if (!success) {
        return res.status(500).json({
          error: "Erro ao desconectar instância",
        });
      }

      logger.info(`Instância ${id} desconectada pelo usuário ${userId}`);

      res.json({
        message: "Instância desconectada com sucesso",
      });
    } catch (error) {
      logger.error("Erro ao desconectar instância:", error);
      res.status(500).json({
        error: "Erro interno do servidor",
      });
    }
  }

  /**
   * @swagger
   * /api/instances/{id}/restart:
   *   post:
   *     summary: Reiniciar instância
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
  static async restart(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      if (!InstanceController.validateInstanceId(id)) {
        return res.status(400).json({
          error: "ID da instância é obrigatório",
        });
      }

      const instance = await WhatsAppInstanceModel.findById(id);

      if (!instance) {
        return res.status(404).json({
          error: "Instância não encontrada",
        });
      }

      // Verificar se o usuário tem acesso à instância
      if (instance.user_id !== userId) {
        return res.status(403).json({
          error: "Acesso negado",
        });
      }

      const success = await WhatsAppService.restartInstance(id);

      if (!success) {
        return res.status(500).json({
          error: "Erro ao reiniciar instância",
        });
      }

      logger.info(`Instância ${id} reiniciada pelo usuário ${userId}`);

      res.json({
        message: "Instância reiniciada com sucesso",
      });
    } catch (error) {
      logger.error("Erro ao reiniciar instância:", error);
      res.status(500).json({
        error: "Erro interno do servidor",
      });
    }
  }

  /**
   * @swagger
   * /api/instances/{id}:
   *   delete:
   *     summary: Deletar instância
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
   *         description: Instância deletada
   *       404:
   *         description: Instância não encontrada
   */
  static async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      if (!InstanceController.validateInstanceId(id)) {
        return res.status(400).json({
          error: "ID da instância é obrigatório",
        });
      }

      const instance = await WhatsAppInstanceModel.findById(id);

      if (!instance) {
        return res.status(404).json({
          error: "Instância não encontrada",
        });
      }

      // Verificar se o usuário tem acesso à instância
      if (instance.user_id !== userId) {
        return res.status(403).json({
          error: "Acesso negado",
        });
      }

      // Desconectar instância do WhatsApp primeiro
      await WhatsAppService.disconnectInstance(id);

      // Remover do banco de dados
      const deleted = await WhatsAppInstanceModel.delete(id);

      if (!deleted) {
        return res.status(500).json({
          error: "Erro ao deletar instância",
        });
      }

      logger.info(`Instância ${id} deletada pelo usuário ${userId}`);

      res.json({
        message: "Instância deletada com sucesso",
      });
    } catch (error) {
      logger.error("Erro ao deletar instância:", error);
      res.status(500).json({
        error: "Erro interno do servidor",
      });
    }
  }
}
