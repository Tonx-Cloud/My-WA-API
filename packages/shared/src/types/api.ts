export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WhatsAppInstance {
  id: string;
  name: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_ready';
  qrCode?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface WhatsAppMessage {
  id: string;
  instanceId: string;
  from: string;
  to: string;
  message: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video';
  direction: 'incoming' | 'outgoing';
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface User {
  id: string | number;
  username: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'user';
  createdAt?: Date;
}

export interface BulkMessageJob {
  id: string;
  instanceId: string;
  totalMessages: number;
  processedMessages: number;
  failedMessages: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  estimatedTime?: string;
}

export interface WebhookEvent {
  event: string;
  instanceId: string;
  data: Record<string, any>;
  timestamp: string;
}
