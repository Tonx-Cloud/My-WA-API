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

      // Check if user has reached instance limit
      const userInstances = await WhatsAppInstanceModel.findByUserId(userId);
      const maxInstances = 10;
      
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
        name: sanitizedName.trim(),
        webhook_url: sanitizedWebhookUrl
      };

      const instance = await WhatsAppInstanceModel.create(instanceData);
      
      // Log successful creation
      this.logger.info(`Nova instância criada: ${instanceId} para usuário ${userId}`);
      
      return this.createSuccessResponse(instance, 'Instância criada com sucesso');
    } catch (error) {
      this.logger.error('Erro ao criar instância:', error);
      return this.createErrorResponse<WhatsAppInstance>('Erro interno ao criar instância', 'INTERNAL_ERROR');
    }
  }

  async getInstanceById(instanceId: string, userId: number): Promise<ServiceResponse<WhatsAppInstance>> {
    try {
      // Validar entrada com Zod
      const instanceValidation = validateInput(instanceIdSchema, instanceId);
      if (!instanceValidation.success) {
        return this.createErrorResponse<WhatsAppInstance>('ID de instância inválido', 'INVALID_INSTANCE_ID');
      }

      const userValidation = validateInput(userIdSchema, userId);
      if (!userValidation.success) {
        return this.createErrorResponse<WhatsAppInstance>('ID de usuário inválido', 'INVALID_USER_ID');
      }

      // Sanitizar entrada
      const sanitizedInstanceId = securityService.sanitizeInput(instanceId);

      const instance = await WhatsAppInstanceModel.findById(sanitizedInstanceId);
      
      if (!instance) {
        return this.createErrorResponse<WhatsAppInstance>('Instância não encontrada', 'INSTANCE_NOT_FOUND');
      }

      // Check if user owns this instance
      if (instance.user_id !== userId) {
        this.logger.warn(`Tentativa de acesso não autorizado à instância ${instanceId} pelo usuário ${userId}`);
        return this.createErrorResponse<WhatsAppInstance>('Acesso negado à instância', 'ACCESS_DENIED');
      }

      return this.createSuccessResponse(instance);
    } catch (error) {
      this.logger.error('Erro ao buscar instância:', error);
      return this.createErrorResponse<WhatsAppInstance>('Erro interno ao buscar instância', 'INTERNAL_ERROR');
    }
  }

  async getUserInstances(userId: number, options?: PaginationOptions): Promise<ServiceResponse<WhatsAppInstance[]>> {
    try {
      // Validar entrada
      const userValidation = validateInput(userIdSchema, userId);
      if (!userValidation.success) {
        return this.createErrorResponse<WhatsAppInstance[]>('ID de usuário inválido', 'INVALID_USER_ID');
      }

      const instances = await WhatsAppInstanceModel.findByUserId(userId);
      
      return this.createSuccessResponse(instances, `${instances.length} instâncias encontradas`);
    } catch (error) {
      this.logger.error('Erro ao buscar instâncias do usuário:', error);
      return this.createErrorResponse<WhatsAppInstance[]>('Erro interno ao buscar instâncias', 'INTERNAL_ERROR');
    }
  }

  async updateInstance(instanceId: string, userId: number, updates: Partial<{ name: string; webhook_url: string }>): Promise<ServiceResponse<WhatsAppInstance>> {
    try {
      // Validar entrada
      const instanceValidation = validateInput(instanceIdSchema, instanceId);
      if (!instanceValidation.success) {
        return this.createErrorResponse<WhatsAppInstance>('ID de instância inválido', 'INVALID_INSTANCE_ID');
      }

      const userValidation = validateInput(userIdSchema, userId);
      if (!userValidation.success) {
        return this.createErrorResponse<WhatsAppInstance>('ID de usuário inválido', 'INVALID_USER_ID');
      }

      const updateValidation = validateInput(updateInstanceSchema, updates);
      if (!updateValidation.success) {
        return this.createErrorResponse<WhatsAppInstance>('Dados de atualização inválidos', 'INVALID_UPDATE_DATA');
      }

      // Sanitizar entrada
      const sanitizedInstanceId = securityService.sanitizeInput(instanceId);
      const sanitizedUpdates = {
        ...updates,
        ...(updates.name && { name: securityService.sanitizeInput(updates.name) }),
        ...(updates.webhook_url && { webhook_url: securityService.sanitizeInput(updates.webhook_url) })
      };

      // First check if instance exists and user owns it
      const existingResult = await this.getInstanceById(sanitizedInstanceId, userId);
      if (!existingResult.success) {
        return existingResult;
      }

      if (!existingResult.data) {
        return this.createErrorResponse<WhatsAppInstance>('Dados da instância não encontrados', 'INSTANCE_DATA_NOT_FOUND');
      }

      // Check for duplicate name if name is being updated
      if (sanitizedUpdates.name && sanitizedUpdates.name !== existingResult.data.name) {
        const userInstances = await WhatsAppInstanceModel.findByUserId(userId);
        const duplicateName = userInstances.find(instance => 
          instance.id !== sanitizedInstanceId && 
          instance.name.toLowerCase() === sanitizedUpdates.name!.toLowerCase()
        );
        
        if (duplicateName) {
          return this.createErrorResponse<WhatsAppInstance>('Já existe uma instância com este nome', 'DUPLICATE_NAME');
        }
      }

      const updatedInstance = await WhatsAppInstanceModel.update(sanitizedInstanceId, {
        ...sanitizedUpdates,
        updated_at: new Date().toISOString()
      });

      if (!updatedInstance) {
        return this.createErrorResponse<WhatsAppInstance>('Falha ao atualizar instância', 'UPDATE_FAILED');
      }

      this.logger.info(`Instância ${sanitizedInstanceId} atualizada pelo usuário ${userId}`);
      
      return this.createSuccessResponse(updatedInstance, 'Instância atualizada com sucesso');
    } catch (error) {
      this.logger.error('Erro ao atualizar instância:', error);
      return this.createErrorResponse<WhatsAppInstance>('Erro interno ao atualizar instância', 'INTERNAL_ERROR');
    }
  }

  async deleteInstance(instanceId: string, userId: number): Promise<ServiceResponse<boolean>> {
    try {
      // Validar entrada
      const instanceValidation = validateInput(instanceIdSchema, instanceId);
      if (!instanceValidation.success) {
        return this.createErrorResponse<boolean>('ID de instância inválido', 'INVALID_INSTANCE_ID');
      }

      const userValidation = validateInput(userIdSchema, userId);
      if (!userValidation.success) {
        return this.createErrorResponse<boolean>('ID de usuário inválido', 'INVALID_USER_ID');
      }

      // Sanitizar entrada
      const sanitizedInstanceId = securityService.sanitizeInput(instanceId);

      // First check if instance exists and user owns it
      const existingResult = await this.getInstanceById(sanitizedInstanceId, userId);
      if (!existingResult.success) {
        return {
          success: false,
          message: existingResult.message,
          error: existingResult.error
        };
      }

      if (!existingResult.data) {
        return this.createErrorResponse<boolean>('Dados da instância não encontrados', 'INSTANCE_DATA_NOT_FOUND');
      }

      // Disconnect WhatsApp session if connected
      if (existingResult.data.status === 'connected') {
        try {
          await WhatsAppService.disconnectInstance(sanitizedInstanceId);
        } catch (error) {
          this.logger.warn(`Erro ao desconectar WhatsApp para instância ${sanitizedInstanceId}:`, error);
          // Continue with deletion even if disconnect fails
        }
      }

      const deleted = await WhatsAppInstanceModel.delete(sanitizedInstanceId);
      
      if (!deleted) {
        return this.createErrorResponse<boolean>('Falha ao deletar instância', 'DELETE_FAILED');
      }

      this.logger.info(`Instância ${sanitizedInstanceId} deletada pelo usuário ${userId}`);
      
      return this.createSuccessResponse(true, 'Instância deletada com sucesso');
    } catch (error) {
      this.logger.error('Erro ao deletar instância:', error);
      return this.createErrorResponse<boolean>('Erro interno ao deletar instância', 'INTERNAL_ERROR');
    }
  }

  async connectInstance(instanceId: string, userId: number): Promise<ServiceResponse<string>> {
    try {
      // Validar entrada
      const instanceValidation = validateInput(instanceIdSchema, instanceId);
      if (!instanceValidation.success) {
        return this.createErrorResponse<string>('ID de instância inválido', 'INVALID_INSTANCE_ID');
      }

      const userValidation = validateInput(userIdSchema, userId);
      if (!userValidation.success) {
        return this.createErrorResponse<string>('ID de usuário inválido', 'INVALID_USER_ID');
      }

      // Sanitizar entrada
      const sanitizedInstanceId = securityService.sanitizeInput(instanceId);

      // First check if instance exists and user owns it
      const existingResult = await this.getInstanceById(sanitizedInstanceId, userId);
      if (!existingResult.success) {
        return {
          success: false,
          message: existingResult.message,
          error: existingResult.error
        };
      }

      if (!existingResult.data) {
        return this.createErrorResponse<string>('Dados da instância não encontrados', 'INSTANCE_DATA_NOT_FOUND');
      }

      if (existingResult.data.status === 'connected') {
        return this.createErrorResponse<string>('Instância já está conectada', 'ALREADY_CONNECTED');
      }

      // Generate QR code for WhatsApp connection
      const qrCode = await WhatsAppService.generateQRCode(sanitizedInstanceId);
      
      if (!qrCode) {
        return this.createErrorResponse<string>('Falha ao gerar QR Code', 'QR_GENERATION_FAILED');
      }
      
      // Update instance status
      await WhatsAppInstanceModel.update(sanitizedInstanceId, {
        status: 'connecting',
        updated_at: new Date().toISOString()
      });

      this.logger.info(`QR Code gerado para instância ${sanitizedInstanceId}`);
      
      return this.createSuccessResponse(qrCode, 'QR Code gerado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao conectar instância:', error);
      return this.createErrorResponse<string>('Erro interno ao conectar instância', 'INTERNAL_ERROR');
    }
  }

  async disconnectInstance(instanceId: string, userId: number): Promise<ServiceResponse<boolean>> {
    try {
      // Validar entrada
      const instanceValidation = validateInput(instanceIdSchema, instanceId);
      if (!instanceValidation.success) {
        return this.createErrorResponse<boolean>('ID de instância inválido', 'INVALID_INSTANCE_ID');
      }

      const userValidation = validateInput(userIdSchema, userId);
      if (!userValidation.success) {
        return this.createErrorResponse<boolean>('ID de usuário inválido', 'INVALID_USER_ID');
      }

      // Sanitizar entrada
      const sanitizedInstanceId = securityService.sanitizeInput(instanceId);

      // First check if instance exists and user owns it
      const existingResult = await this.getInstanceById(sanitizedInstanceId, userId);
      if (!existingResult.success) {
        return {
          success: false,
          message: existingResult.message,
          error: existingResult.error
        };
      }

      if (!existingResult.data) {
        return this.createErrorResponse<boolean>('Dados da instância não encontrados', 'INSTANCE_DATA_NOT_FOUND');
      }

      if (existingResult.data.status === 'disconnected') {
        return this.createErrorResponse<boolean>('Instância já está desconectada', 'ALREADY_DISCONNECTED');
      }

      // Disconnect WhatsApp session
      await WhatsAppService.disconnectInstance(sanitizedInstanceId);
      
      // Update instance status
      await WhatsAppInstanceModel.update(sanitizedInstanceId, {
        status: 'disconnected',
        updated_at: new Date().toISOString()
      });

      this.logger.info(`Instância ${sanitizedInstanceId} desconectada`);
      
      return this.createSuccessResponse(true, 'Instância desconectada com sucesso');
    } catch (error) {
      this.logger.error('Erro ao desconectar instância:', error);
      return this.createErrorResponse<boolean>('Erro interno ao desconectar instância', 'INTERNAL_ERROR');
    }
  }

  async getInstanceStatus(instanceId: string, userId: number): Promise<ServiceResponse<{ status: string; lastSeen?: Date }>> {
    try {
      // Validar entrada
      const instanceValidation = validateInput(instanceIdSchema, instanceId);
      if (!instanceValidation.success) {
        return this.createErrorResponse<{ status: string; lastSeen?: Date }>('ID de instância inválido', 'INVALID_INSTANCE_ID');
      }

      const userValidation = validateInput(userIdSchema, userId);
      if (!userValidation.success) {
        return this.createErrorResponse<{ status: string; lastSeen?: Date }>('ID de usuário inválido', 'INVALID_USER_ID');
      }

      // Sanitizar entrada
      const sanitizedInstanceId = securityService.sanitizeInput(instanceId);

      const existingResult = await this.getInstanceById(sanitizedInstanceId, userId);
      if (!existingResult.success) {
        return {
          success: false,
          message: existingResult.message,
          error: existingResult.error
        };
      }

      if (!existingResult.data) {
        return this.createErrorResponse<{ status: string; lastSeen?: Date }>('Dados da instância não encontrados', 'INSTANCE_DATA_NOT_FOUND');
      }

      const status = {
        status: existingResult.data.status,
        lastSeen: existingResult.data.updated_at ? new Date(existingResult.data.updated_at) : undefined
      };

      return this.createSuccessResponse(status);
    } catch (error) {
      this.logger.error('Erro ao buscar status da instância:', error);
      return this.createErrorResponse<{ status: string; lastSeen?: Date }>('Erro interno ao buscar status', 'INTERNAL_ERROR');
    }
  }
}

// Export instance
export const InstanceService = new InstanceServiceImpl();
