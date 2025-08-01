import { BaseService, ServiceResponse, PaginationOptions } from './BaseService';
import { WhatsAppInstance, WhatsAppInstanceModel, CreateInstanceData } from '../models/WhatsAppInstance';
import WhatsAppService from './WhatsAppService';
import { securityService } from './SecurityService';
import { 
  validateInput, 
  createInstanceSchema, 
  updateInstanceSchema, 
  userIdSchema, 
  instanceIdSchema 
} from '../schemas/validation';
import { v4 as uuidv4 } from 'uuid';

export class InstanceServiceImpl extends BaseService {
  
  async createInstance(userId: number, name: string, webhookUrl?: string): Promise<ServiceResponse<WhatsAppInstance>> {
    try {
      // Validar entrada com Zod
      const userValidation = validateInput(userIdSchema, userId);
      if (!userValidation.success) {
        return this.createErrorResponse<WhatsAppInstance>(
          'ID de usuário inválido', 
          'INVALID_USER_ID'
        );
      }

      const inputData = { name, webhookUrl };
      const instanceValidation = validateInput(createInstanceSchema, inputData);
      if (!instanceValidation.success) {
        return this.createErrorResponse<WhatsAppInstance>(
          'Dados da instância inválidos', 
          'INVALID_INSTANCE_DATA'
        );
      }

      // Sanitizar entrada
      const sanitizedName = securityService.sanitizeInput(name);
      const sanitizedWebhookUrl = webhookUrl ? securityService.sanitizeInput(webhookUrl) : undefined;

      // Check if user has reached instance limit (e.g., 10 instances per user)
      const userInstances = await WhatsAppInstanceModel.findByUserId(userId);
      const maxInstances = 10; // Could be configured per user tier
      
      if (userInstances.length >= maxInstances) {
        return this.createErrorResponse<WhatsAppInstance>('Limite máximo de instâncias atingido', 'INSTANCE_LIMIT_REACHED');
      }

      // Check for duplicate names for this user
      const existingInstance = userInstances.find(instance => 
        instance.name.toLowerCase() === sanitizedName.toLowerCase()
      );
      
      if (existingInstance) {
        return this.createErrorResponse<WhatsAppInstance>('Já existe uma instância com este nome', 'DUPLICATE_NAME');
      }

      // Generate unique ID
      const instanceId = uuidv4();

      // Create instance data
      const instanceData: CreateInstanceData = {
        id: instanceId,
        user_id: userId,
        name: name.trim(),
        ...(webhookUrl && { webhook_url: webhookUrl })
      };

      // Create in database
      const instance = await WhatsAppInstanceModel.create(instanceData);

      // Initialize WhatsApp service
      const whatsappInitialized = await WhatsAppService.createInstance(instanceId, userId);

      if (!whatsappInitialized) {
        // Rollback database creation
        await WhatsAppInstanceModel.delete(instanceId);
        return this.createErrorResponse<WhatsAppInstance>('Falha ao inicializar instância do WhatsApp', 'WHATSAPP_INIT_FAILED');
      }

      this.logger.info(`Instance created successfully: ${instanceId} for user ${userId}`);

      return this.createSuccessResponse(instance, 'Instância criada com sucesso');

    } catch (error) {
      return this.handleError<WhatsAppInstance>(error, 'createInstance');
    }
  }

  async getInstanceById(instanceId: string, userId: number): Promise<ServiceResponse<WhatsAppInstance>> {
    try {
      if (!instanceId || instanceId.trim().length === 0) {
        return this.createErrorResponse<WhatsAppInstance>('ID da instância é obrigatório', 'INVALID_INSTANCE_ID');
      }

      const instance = await WhatsAppInstanceModel.findById(instanceId);

      if (!instance) {
        return this.createErrorResponse<WhatsAppInstance>('Instância não encontrada', 'INSTANCE_NOT_FOUND');
      }

      // Check ownership
      if (instance.user_id !== userId) {
        return this.createErrorResponse<WhatsAppInstance>('Acesso negado', 'ACCESS_DENIED');
      }

      // Get additional info from WhatsApp service
      const whatsappInfo = await WhatsAppService.getInstanceInfo(instanceId);

      const enhancedInstance = {
        ...instance,
        whatsapp_status: whatsappInfo?.status || instance.status,
        is_ready: whatsappInfo?.isReady || false,
        qr_code: whatsappInfo?.qrCode
      };

      return this.createSuccessResponse(enhancedInstance as WhatsAppInstance);

    } catch (error) {
      return this.handleError<WhatsAppInstance>(error, 'getInstanceById');
    }
  }

  async getUserInstances(userId: number, options?: PaginationOptions): Promise<ServiceResponse<WhatsAppInstance[]>> {
    try {
      let instances = await WhatsAppInstanceModel.findByUserId(userId);

      // Apply pagination if provided
      if (options) {
        const { offset = 0, limit } = this.validatePagination(options);
        instances = instances.slice(offset, offset + limit);
      }

      // Enhance with WhatsApp service info
      const enhancedInstances = await Promise.all(
        instances.map(async (instance) => {
          const whatsappInfo = await WhatsAppService.getInstanceInfo(instance.id);
          return {
            ...instance,
            whatsapp_status: whatsappInfo?.status || instance.status,
            is_ready: whatsappInfo?.isReady || false
          };
        })
      );

      return this.createSuccessResponse(enhancedInstances);

    } catch (error) {
      return this.handleError(error, 'getUserInstances');
    }
  }

  async updateInstance(instanceId: string, userId: number, updates: Partial<WhatsAppInstance>): Promise<ServiceResponse<WhatsAppInstance>> {
    try {
      // First check if instance exists and user has access
      const existingResult = await this.getInstanceById(instanceId, userId);
      if (!existingResult.success) {
        return existingResult;
      }

      // Validate updates
      if (updates.name && updates.name.trim().length === 0) {
        return this.createErrorResponse('Nome não pode estar vazio', 'INVALID_NAME');
      }

      if (updates.name && updates.name.length > 100) {
        return this.createErrorResponse('Nome muito longo (máximo 100 caracteres)', 'NAME_TOO_LONG');
      }

      // Update in database
      const updated = await WhatsAppInstanceModel.update(instanceId, updates);

      if (!updated) {
        return this.createErrorResponse('Falha ao atualizar instância', 'UPDATE_FAILED');
      }

      // Get updated instance
      const updatedInstance = await WhatsAppInstanceModel.findById(instanceId);
      
      if (!updatedInstance) {
        return this.createErrorResponse('Instância não encontrada após atualização', 'INSTANCE_NOT_FOUND');
      }

      this.logger.info(`Instance updated: ${instanceId} by user ${userId}`);

      return this.createSuccessResponse(updatedInstance, 'Instância atualizada com sucesso');

    } catch (error) {
      return this.handleError(error, 'updateInstance');
    }
  }

  async deleteInstance(instanceId: string, userId: number): Promise<ServiceResponse<boolean>> {
    try {
      // First check if instance exists and user has access
      const existingResult = await this.getInstanceById(instanceId, userId);
      if (!existingResult.success) {
        return this.createErrorResponse<boolean>(existingResult.error || 'Erro de acesso', existingResult.code);
      }

      // Disconnect from WhatsApp first
      await WhatsAppService.disconnectInstance(instanceId);

      // Delete from database
      const deleted = await WhatsAppInstanceModel.delete(instanceId);

      if (!deleted) {
        return this.createErrorResponse('Falha ao excluir instância', 'DELETE_FAILED');
      }

      this.logger.info(`Instance deleted: ${instanceId} by user ${userId}`);

      return this.createSuccessResponse(true, 'Instância excluída com sucesso');

    } catch (error) {
      return this.handleError(error, 'deleteInstance');
    }
  }

  async connectInstance(instanceId: string, userId: number): Promise<ServiceResponse<boolean>> {
    try {
      // Check instance exists and user has access
      const existingResult = await this.getInstanceById(instanceId, userId);
      if (!existingResult.success) {
        return this.createErrorResponse<boolean>(existingResult.error || 'Erro de acesso', existingResult.code);
      }

      // Try to connect
      const connected = await WhatsAppService.createInstance(instanceId, userId);

      if (!connected) {
        return this.createErrorResponse('Falha ao conectar instância', 'CONNECTION_FAILED');
      }

      this.logger.info(`Instance connected: ${instanceId} by user ${userId}`);

      return this.createSuccessResponse(true, 'Instância conectada com sucesso');

    } catch (error) {
      return this.handleError(error, 'connectInstance');
    }
  }

  async disconnectInstance(instanceId: string, userId: number): Promise<ServiceResponse<boolean>> {
    try {
      // Check instance exists and user has access
      const existingResult = await this.getInstanceById(instanceId, userId);
      if (!existingResult.success) {
        return existingResult as ServiceResponse<boolean>;
      }

      // Disconnect
      const disconnected = await WhatsAppService.disconnectInstance(instanceId);

      if (!disconnected) {
        return this.createErrorResponse('Falha ao desconectar instância', 'DISCONNECTION_FAILED');
      }

      // Update status in database
      await WhatsAppInstanceModel.updateStatus(instanceId, 'disconnected');

      this.logger.info(`Instance disconnected: ${instanceId} by user ${userId}`);

      return this.createSuccessResponse(true, 'Instância desconectada com sucesso');

    } catch (error) {
      return this.handleError(error, 'disconnectInstance');
    }
  }

  async getQRCode(instanceId: string, userId: number): Promise<ServiceResponse<string>> {
    try {
      // Check instance exists and user has access
      const existingResult = await this.getInstanceById(instanceId, userId);
      if (!existingResult.success) {
        return existingResult as ServiceResponse<string>;
      }

      // Get QR code from WhatsApp service
      const whatsappInfo = await WhatsAppService.getInstanceInfo(instanceId);

      if (!whatsappInfo?.qrCode) {
        return this.createErrorResponse(
          'QR Code não disponível. A instância pode já estar conectada ou aguardando conexão.',
          'QR_CODE_NOT_AVAILABLE'
        );
      }

      return this.createSuccessResponse(whatsappInfo.qrCode);

    } catch (error) {
      return this.handleError(error, 'getQRCode');
    }
  }

  async restartInstance(instanceId: string, userId: number): Promise<ServiceResponse<boolean>> {
    try {
      // Check instance exists and user has access
      const existingResult = await this.getInstanceById(instanceId, userId);
      if (!existingResult.success) {
        return existingResult as ServiceResponse<boolean>;
      }

      // Restart via WhatsApp service
      const restarted = await WhatsAppService.restartInstance(instanceId);

      if (!restarted) {
        return this.createErrorResponse('Falha ao reiniciar instância', 'RESTART_FAILED');
      }

      this.logger.info(`Instance restarted: ${instanceId} by user ${userId}`);

      return this.createSuccessResponse(true, 'Instância reiniciada com sucesso');

    } catch (error) {
      return this.handleError(error, 'restartInstance');
    }
  }
}

// Export singleton instance
export const instanceService = new InstanceServiceImpl();
