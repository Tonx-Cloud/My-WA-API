export * from './types/api';
export * from './types/dashboard';
export * from './utils/helpers';

// Re-export instance types with aliases to avoid conflicts
export type {
  WhatsAppInstance as DetailedWhatsAppInstance,
  InstanceProfile,
  BusinessProfile,
  InstanceSettings,
  InstanceStats as DetailedInstanceStats,
  InstanceStatus,
  ConnectionState,
  CreateInstanceRequest,
  UpdateInstanceRequest,
  InstanceResponse,
  QRCodeData,
  InstanceEvent,
  WebSocketEvents,
  WebSocketMessage,
} from './types/instance';
