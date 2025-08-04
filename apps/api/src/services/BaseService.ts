import { WhatsAppInstance } from '../models/WhatsAppInstance';
import logger from '../config/logger';
import { AppError } from '../middleware/enhanced-error-handler';

export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterOptions {
  [key: string]: unknown;
}

export abstract class BaseService {
  protected logger = logger;

  protected handleError<T = unknown>(error: unknown, operation: string): ServiceResponse<T> {
    this.logger.error(`Error in ${operation}:`, error);
    
    if (error instanceof AppError) {
      return {
        success: false,
        error: error.message,
        ...(error.code && { code: error.code })
      } as ServiceResponse<T>;
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
        code: 'INTERNAL_ERROR'
      } as ServiceResponse<T>;
    }

    if (typeof error === 'string') {
      return {
        success: false,
        error: error,
        code: 'INTERNAL_ERROR'
      } as ServiceResponse<T>;
    }

    return {
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    } as ServiceResponse<T>;
  }

  protected validatePagination(options: PaginationOptions): PaginationOptions {
    const page = Math.max(1, options.page);
    const limit = Math.min(Math.max(1, options.limit), 100);
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  protected createSuccessResponse<T>(data: T, message?: string): ServiceResponse<T>;
  protected createSuccessResponse<T>(data?: T, message?: string): ServiceResponse<T | undefined>;
  protected createSuccessResponse<T>(data?: T, message?: string): ServiceResponse<T | undefined> {
    return {
      success: true,
      ...(data !== undefined && { data }),
      ...(message && { message })
    };
  }

  protected createErrorResponse<T = unknown>(error: string, code?: string): ServiceResponse<T> {
    return {
      success: false,
      error,
      ...(code && { code })
    } as ServiceResponse<T>;
  }
}

export interface InstanceService {
  createInstance(userId: number, name: string, webhookUrl?: string): Promise<ServiceResponse<WhatsAppInstance>>;
  getInstanceById(instanceId: string, userId: number): Promise<ServiceResponse<WhatsAppInstance>>;
  getUserInstances(userId: number, options?: PaginationOptions): Promise<ServiceResponse<WhatsAppInstance[]>>;
  updateInstance(instanceId: string, userId: number, updates: Partial<WhatsAppInstance>): Promise<ServiceResponse<WhatsAppInstance>>;
  deleteInstance(instanceId: string, userId: number): Promise<ServiceResponse<boolean>>;
  connectInstance(instanceId: string, userId: number): Promise<ServiceResponse<boolean>>;
  disconnectInstance(instanceId: string, userId: number): Promise<ServiceResponse<boolean>>;
  getQRCode(instanceId: string, userId: number): Promise<ServiceResponse<string>>;
}

export interface MessageService {
  sendTextMessage(instanceId: string, to: string, message: string): Promise<ServiceResponse<any>>;
  sendMediaMessage(instanceId: string, to: string, mediaUrl: string, type: string, caption?: string): Promise<ServiceResponse<any>>;
  sendBulkMessages(instanceId: string, messages: any[]): Promise<ServiceResponse<any>>;
  getMessages(instanceId: string, options?: PaginationOptions & FilterOptions): Promise<ServiceResponse<any[]>>;
  forwardMessage(instanceId: string, messageId: string, to: string[]): Promise<ServiceResponse<any>>;
  deleteMessage(instanceId: string, messageId: string, forEveryone?: boolean): Promise<ServiceResponse<boolean>>;
}

export interface WebhookService {
  configureWebhook(instanceId: string, webhookUrl: string, events: string[], secret?: string): Promise<ServiceResponse<boolean>>;
  removeWebhook(instanceId: string): Promise<ServiceResponse<boolean>>;
  testWebhook(instanceId: string): Promise<ServiceResponse<boolean>>;
}

export interface AnalyticsService {
  getInstanceStats(instanceId: string, userId: number): Promise<ServiceResponse<any>>;
  getUserStats(userId: number): Promise<ServiceResponse<any>>;
  getSystemStats(): Promise<ServiceResponse<any>>;
}

// Health check service interface
export interface HealthService {
  checkDatabaseConnection(): Promise<boolean>;
  checkWhatsAppService(): Promise<boolean>;
  checkExternalServices(): Promise<{ [service: string]: boolean }>;
  getSystemInfo(): Promise<any>;
}
