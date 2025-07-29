export interface DashboardStats {
  totalInstances: number;
  connectedInstances: number;
  messagesSentToday: number;
  messagesReceivedToday: number;
  activeQueues: number;
  systemUptime: string;
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface InstanceStats {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting';
  phoneNumber?: string;
  messagesSent: number;
  messagesReceived: number;
  lastActivity: Date;
}

export interface QueueStats {
  name: string;
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  paused: boolean;
}

export interface SystemConfig {
  language: 'pt' | 'en' | 'es';
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    webhook: boolean;
  };
  oauth: {
    google: {
      enabled: boolean;
      clientId?: string;
    };
  };
}
