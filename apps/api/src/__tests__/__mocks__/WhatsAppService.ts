/**
 * Mock completo do WhatsAppService para testes isolados
 * Simula todas as operaÃ§Ãµes do WhatsApp sem dependÃªncias externas
 * @fileoverview Este arquivo contÃ©m apenas mocks - nÃ£o executa testes
 */

// Mock do estado das instÃ¢ncias
const mockInstances = new Map();
const mockSessions = new Map();

// Mock do WhatsAppService
export const mockWhatsAppService = {
  // Gerenciamento de instÃ¢ncias
  createInstance: jest.fn().mockImplementation(async (instanceData: any) => {
    const instanceId = instanceData.name || `instance-${Date.now()}`;
    const instance = {
      id: instanceId,
      status: 'created',
      qrCode: null,
      client: null,
      session: null,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      config: {
        webhook: instanceData.webhook || null,
        webhookEvents: instanceData.webhookEvents || [],
        ...instanceData,
      },
    };

    mockInstances.set(instanceId, instance);

    return {
      success: true,
      instance: {
        id: instanceId,
        status: 'created',
        qrCode: 'data:image/png;base64,mock-qr-code',
        webhook: instanceData.webhook || null,
      },
    };
  }),

  getInstance: jest.fn().mockImplementation((instanceId: string) => {
    return mockInstances.get(instanceId) || null;
  }),

  getInstanceStatus: jest.fn().mockImplementation((instanceId: string) => {
    const instance = mockInstances.get(instanceId);
    if (!instance) return 'not_found';

    // Retorno determinÃ­stico baseado no instanceId para testes consistentes
    if (instanceId.includes('test')) return 'ready';
    if (instanceId.includes('instance')) return 'connected';
    return instance.status || 'created';
  }),

  listInstances: jest.fn().mockImplementation(() => {
    return Array.from(mockInstances.values()).map(instance => ({
      id: instance.id,
      status: instance.status,
      lastActivity: instance.lastActivity,
      config: instance.config,
    }));
  }),

  // QR Code management
  getQRCode: jest.fn().mockImplementation(async (instanceId: string) => {
    const instance = mockInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    return {
      success: true,
      qrCode:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      status: 'qr_ready',
    };
  }),

  // ConexÃ£o e desconexÃ£o
  connectInstance: jest.fn().mockImplementation(async (instanceId: string) => {
    const instance = mockInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    instance.status = 'ready';
    instance.lastActivity = new Date().toISOString();

    return {
      success: true,
      status: 'connected',
      info: {
        pushname: 'Mock WhatsApp Bot',
        wid: `mock-${instanceId}@c.us`,
        phone: {
          wa_version: '2.2409.2',
          platform: 'android',
        },
      },
    };
  }),

  disconnectInstance: jest.fn().mockImplementation(async (instanceId: string) => {
    const instance = mockInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    instance.status = 'disconnected';
    instance.lastActivity = new Date().toISOString();

    return {
      success: true,
      status: 'disconnected',
    };
  }),

  deleteInstance: jest.fn().mockImplementation(async (instanceId: string) => {
    const deleted = mockInstances.delete(instanceId);
    mockSessions.delete(instanceId);

    return {
      success: deleted,
      message: deleted ? 'Instance deleted successfully' : 'Instance not found',
    };
  }),

  // Envio de mensagens
  sendMessage: jest
    .fn()
    .mockImplementation(async (instanceId: string, to: string, message: any) => {
      const instance = mockInstances.get(instanceId);
      if (!instance) {
        throw new Error(`Instance ${instanceId} not found`);
      }

      if (instance.status !== 'ready') {
        throw new Error(`Instance ${instanceId} is not ready. Current status: ${instance.status}`);
      }

      const messageId = `mock-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        message: {
          id: messageId,
          to: to,
          body: typeof message === 'string' ? message : message.text || message.body,
          type: message.type || 'text',
          timestamp: Math.floor(Date.now() / 1000),
          status: 'sent',
        },
      };
    }),

  sendMediaMessage: jest
    .fn()
    .mockImplementation(async (instanceId: string, to: string, media: any) => {
      const instance = mockInstances.get(instanceId);
      if (!instance) {
        throw new Error(`Instance ${instanceId} not found`);
      }

      const messageId = `mock-media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        message: {
          id: messageId,
          to: to,
          type: media.type || 'image',
          caption: media.caption || '',
          filename: media.filename || 'mock-file',
          timestamp: Math.floor(Date.now() / 1000),
          status: 'sent',
        },
      };
    }),

  // Contatos e chats
  getContacts: jest.fn().mockImplementation(async (instanceId: string) => {
    const instance = mockInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    return {
      success: true,
      contacts: [
        {
          id: '5511999999999@c.us',
          name: 'Mock Contact 1',
          pushname: 'Mock User 1',
          number: '5511999999999',
          isUser: true,
          isGroup: false,
        },
        {
          id: '5511888888888@c.us',
          name: 'Mock Contact 2',
          pushname: 'Mock User 2',
          number: '5511888888888',
          isUser: true,
          isGroup: false,
        },
      ],
    };
  }),

  getChats: jest.fn().mockImplementation(async (instanceId: string) => {
    const instance = mockInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    return {
      success: true,
      chats: [
        {
          id: '5511999999999@c.us',
          name: 'Mock Chat 1',
          isGroup: false,
          unreadCount: 0,
          lastMessage: {
            body: 'Last message mock',
            timestamp: Math.floor(Date.now() / 1000) - 3600,
          },
        },
      ],
    };
  }),

  // Webhook management
  setWebhook: jest
    .fn()
    .mockImplementation(async (instanceId: string, webhookUrl: string, events: string[] = []) => {
      const instance = mockInstances.get(instanceId);
      if (!instance) {
        throw new Error(`Instance ${instanceId} not found`);
      }

      instance.config.webhook = webhookUrl;
      instance.config.webhookEvents = events;

      return {
        success: true,
        webhook: webhookUrl,
        events: events,
      };
    }),

  getWebhook: jest.fn().mockImplementation((instanceId: string) => {
    const instance = mockInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    return {
      success: true,
      webhook: instance.config.webhook,
      events: instance.config.webhookEvents,
    };
  }),

  // SessÃ£o management
  saveSession: jest.fn().mockImplementation(async (instanceId: string) => {
    const instance = mockInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    const sessionData = {
      instanceId,
      timestamp: Date.now(),
      data: 'mock-session-data',
    };

    mockSessions.set(instanceId, sessionData);

    return {
      success: true,
      message: 'Session saved successfully',
    };
  }),

  loadSession: jest.fn().mockImplementation(async (instanceId: string) => {
    const sessionData = mockSessions.get(instanceId);

    return {
      success: !!sessionData,
      session: sessionData || null,
      message: sessionData ? 'Session loaded successfully' : 'No session found',
    };
  }),

  // Utility methods
  validatePhoneNumber: jest.fn().mockImplementation((phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const isValid = cleanPhone.length >= 10 && cleanPhone.length <= 15;

    return {
      isValid,
      formatted: isValid ? `${cleanPhone}@c.us` : null,
      original: phone,
    };
  }),

  getInstanceInfo: jest.fn().mockImplementation(async (instanceId: string) => {
    const instance = mockInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    return {
      success: true,
      info: {
        instanceId,
        status: instance.status,
        createdAt: instance.createdAt,
        lastActivity: instance.lastActivity,
        config: instance.config,
        stats: {
          messagesSent: Math.floor(Math.random() * 1000),
          messagesReceived: Math.floor(Math.random() * 1500),
          uptime: Math.floor(Math.random() * 86400),
        },
      },
    };
  }),

  // Event simulation for testing
  simulateEvent: jest
    .fn()
    .mockImplementation((instanceId: string, event: string, data: any = {}) => {
      const instance = mockInstances.get(instanceId);
      if (!instance) {
        return { success: false, error: 'Instance not found' };
      }

      // Simular evento para testes
      return {
        success: true,
        event,
        data,
        timestamp: Date.now(),
      };
    }),

  // Reset para testes
  __reset: jest.fn().mockImplementation(() => {
    mockInstances.clear();
    mockSessions.clear();
  }),
};

// Mock das classes auxiliares
export const mockWhatsAppClient = {
  initialize: jest.fn().mockResolvedValue(true),
  getState: jest.fn().mockReturnValue('CONNECTED'),
  sendMessage: jest.fn().mockResolvedValue({
    id: 'mock-message-id',
    ack: 1,
    body: 'Mock message',
    timestamp: Math.floor(Date.now() / 1000),
  }),
  getQRCode: jest.fn().mockResolvedValue('mock-qr-code'),
  disconnect: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true),
  on: jest.fn(),
  off: jest.fn(),
  removeAllListeners: jest.fn(),
};

// Export default para compatibilidade
export default mockWhatsAppService;
