export interface WhatsAppInstance {
  id: string;
  name: string;
  phoneNumber?: string;
  status: InstanceStatus;
  qrCode?: string;
  connectionState: ConnectionState;
  profile?: InstanceProfile;
  settings: InstanceSettings;
  stats: InstanceStats;
  createdAt: Date;
  updatedAt: Date;
  lastActivity?: Date;
}

export interface InstanceProfile {
  name: string;
  about?: string;
  profilePictureUrl?: string;
  businessProfile?: BusinessProfile;
}

export interface BusinessProfile {
  description?: string;
  category?: string;
  email?: string;
  website?: string;
  address?: string;
}

export interface InstanceSettings {
  webhookUrl?: string;
  autoReply?: boolean;
  autoReplyMessage?: string;
  groupsAllowed: boolean;
  readReceipts: boolean;
  typing: boolean;
  presence: boolean;
  chatLock?: boolean;
  callReject?: boolean;
  alwaysOnline?: boolean;
  msgRetryCounterCache?: boolean;
  syncFullHistory?: boolean;
}

export interface InstanceStats {
  messagesReceived: number;
  messagesSent: number;
  contactsCount: number;
  groupsCount: number;
  lastMessageAt?: Date;
  totalStorage: number;
}

export enum InstanceStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  OPEN = 'open',
  CLOSE = 'close',
  QR_CODE = 'qr_code',
  LOADING = 'loading',
  ERROR = 'error',
}

export enum ConnectionState {
  CLOSE = 'close',
  CONNECTING = 'connecting',
  OPEN = 'open',
}

export interface CreateInstanceRequest {
  instanceName: string;
  webhookUrl?: string;
  settings?: Partial<InstanceSettings>;
}

export interface UpdateInstanceRequest {
  instanceName?: string;
  webhookUrl?: string;
  settings?: Partial<InstanceSettings>;
}

export interface InstanceResponse {
  instance: WhatsAppInstance;
  qrCode?: string;
}

export interface QRCodeData {
  instanceId: string;
  qrCode: string;
  base64: string;
}

export interface InstanceEvent {
  instanceId: string;
  event: string;
  data: any;
  timestamp: Date;
}

// WebSocket events
export enum WebSocketEvents {
  INSTANCE_CONNECTED = 'instance.connected',
  INSTANCE_DISCONNECTED = 'instance.disconnected',
  INSTANCE_CONNECTING = 'instance.connecting',
  INSTANCE_QR_CODE = 'instance.qr_code',
  INSTANCE_ERROR = 'instance.error',
  MESSAGE_RECEIVED = 'message.received',
  MESSAGE_SENT = 'message.sent',
  CONTACT_UPDATE = 'contact.update',
  GROUP_UPDATE = 'group.update',
}

export interface WebSocketMessage {
  event: WebSocketEvents;
  instanceId: string;
  data: any;
  timestamp: Date;
}
