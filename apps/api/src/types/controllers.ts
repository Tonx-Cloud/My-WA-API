import { Request } from 'express';
import { DetailedWhatsAppInstance } from '@my-wa-api/shared';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    iat?: number;
    exp?: number;
  };
}

export interface CreateInstanceBody {
  name: string;
  webhook_url?: string;
}

export interface UpdateInstanceBody {
  name?: string;
  webhook_url?: string;
  status?: string;
}

export interface SendMessageBody {
  number: string;
  message: string;
  type?: 'text' | 'image' | 'document' | 'audio' | 'video';
  media_url?: string;
}

export interface BulkMessageBody {
  messages: Array<{
    number: string;
    message: string;
    type?: string;
  }>;
  delay?: number;
}

export interface InstanceParams {
  instanceId: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface InstanceQuery extends PaginationQuery {
  status?: string;
  search?: string;
}

export interface MessageQuery extends PaginationQuery {
  type?: string;
  direction?: 'incoming' | 'outgoing';
  from?: string;
  to?: string;
  start_date?: string;
  end_date?: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export interface ApiSuccess<T = unknown> {
  message?: string;
  data?: T;
}

export interface ControllerResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}
