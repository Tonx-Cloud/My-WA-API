/**
 * WhatsApp Integration Service
 * Integra o WebSocket Service com o WhatsApp Service Persistent
 */

const WhatsAppServicePersistent = require('./WhatsAppServicePersistent');
const WebSocketService = require('./WebSocketServiceFixed');

class WhatsAppIntegrationService {
  constructor() {
    this.whatsappService = new WhatsAppServicePersistent();
    this.websocketService = null;
    this.initialized = false;

    this.setupEventHandlers();
  }

  initialize(io) {
    if (this.initialized) {
      console.log('âš ï¸ WhatsApp Integration jÃ¡ inicializado');
      return;
    }

    console.log('ðŸš€ Inicializando WhatsApp Integration Service...');

    // Inicializar WebSocket Service
    this.websocketService = new WebSocketService(io);

    // Inicializar instÃ¢ncias existentes
    this.whatsappService
      .initializeExistingInstances()
      .then(() => {
        console.log('âœ… WhatsApp Integration Service inicializado');
        this.initialized = true;
      })
      .catch(error => {
        console.error('âŒ Erro na inicializaÃ§Ã£o:', error);
      });
  }

  setupEventHandlers() {
    // QR Code gerado
    this.whatsappService.on('qr', ({ instanceId, qr }) => {
      console.log(`ðŸ“± QR Code para ${instanceId}`);

      if (this.websocketService) {
        this.websocketService.broadcastToRoom(`instance-${instanceId}`, 'qr_code', {
          instanceId,
          qr,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // InstÃ¢ncia autenticada
    this.whatsappService.on('authenticated', ({ instanceId }) => {
      console.log(`ðŸ” ${instanceId} autenticado`);

      if (this.websocketService) {
        this.websocketService.broadcastToRoom(`instance-${instanceId}`, 'authenticated', {
          instanceId,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // InstÃ¢ncia pronta
    this.whatsappService.on('ready', ({ instanceId, clientInfo }) => {
      console.log(`âœ… ${instanceId} pronto`);

      if (this.websocketService) {
        // Broadcast para room especÃ­fica da instÃ¢ncia
        this.websocketService.broadcastToRoom(`instance-${instanceId}`, 'instance_ready', {
          instanceId,
          clientInfo,
          timestamp: new Date().toISOString(),
        });

        // Broadcast geral de status
        this.websocketService.broadcast('instance_status_update', {
          instanceId,
          status: 'ready',
          clientInfo,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Falha de autenticaÃ§Ã£o
    this.whatsappService.on('auth_failure', ({ instanceId, message }) => {
      console.error(`ðŸš« Falha auth ${instanceId}: ${message}`);

      if (this.websocketService) {
        this.websocketService.broadcastToRoom(`instance-${instanceId}`, 'auth_failure', {
          instanceId,
          error: message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Desconectado
    this.whatsappService.on('disconnected', ({ instanceId, reason }) => {
      console.log(`ðŸ”Œ ${instanceId} desconectado: ${reason}`);

      if (this.websocketService) {
        this.websocketService.broadcastToRoom(`instance-${instanceId}`, 'disconnected', {
          instanceId,
          reason,
          timestamp: new Date().toISOString(),
        });

        this.websocketService.broadcast('instance_status_update', {
          instanceId,
          status: 'disconnected',
          reason,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Mensagem recebida
    this.whatsappService.on('message', ({ instanceId, message }) => {
      if (this.websocketService) {
        this.websocketService.broadcastToRoom(`instance-${instanceId}`, 'message_received', {
          instanceId,
          message: {
            id: message.id,
            from: message.from,
            to: message.to,
            body: message.body,
            type: message.type,
            timestamp: message.timestamp,
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Mensagem enviada
    this.whatsappService.on('message_sent', ({ instanceId, to, message, result }) => {
      if (this.websocketService) {
        this.websocketService.broadcastToRoom(`instance-${instanceId}`, 'message_sent', {
          instanceId,
          to,
          message,
          result: result ? { id: result.id } : null,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Tela de carregamento
    this.whatsappService.on('loading_screen', ({ instanceId, percent, message }) => {
      if (this.websocketService) {
        this.websocketService.broadcastToRoom(`instance-${instanceId}`, 'loading_screen', {
          instanceId,
          percent,
          message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // MudanÃ§a de estado
    this.whatsappService.on('state_change', ({ instanceId, state }) => {
      if (this.websocketService) {
        this.websocketService.broadcastToRoom(`instance-${instanceId}`, 'state_change', {
          instanceId,
          state,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // InstÃ¢ncia destruÃ­da
    this.whatsappService.on('destroyed', ({ instanceId }) => {
      console.log(`ðŸ—‘ï¸ ${instanceId} destruÃ­do`);

      if (this.websocketService) {
        this.websocketService.broadcastToRoom(`instance-${instanceId}`, 'instance_destroyed', {
          instanceId,
          timestamp: new Date().toISOString(),
        });

        this.websocketService.broadcast('instance_status_update', {
          instanceId,
          status: 'destroyed',
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  // MÃ©todos da API

  async createInstance(instanceId, socketId = null) {
    try {
      console.log(`ðŸ”„ Criando instÃ¢ncia ${instanceId}...`);

      const result = await this.whatsappService.createInstance(instanceId);

      // Se hÃ¡ um socket especÃ­fico, adicionar Ã  room da instÃ¢ncia
      if (socketId && this.websocketService) {
        this.websocketService.joinRoom(socketId, `instance-${instanceId}`);
      }

      return result;
    } catch (error) {
      console.error(`âŒ Erro ao criar instÃ¢ncia ${instanceId}:`, error);
      throw error;
    }
  }

  async destroyInstance(instanceId) {
    try {
      console.log(`ðŸ—‘ï¸ Destruindo instÃ¢ncia ${instanceId}...`);

      const result = await this.whatsappService.destroyInstance(instanceId);

      // Notificar via WebSocket
      if (this.websocketService) {
        this.websocketService.broadcastToRoom(`instance-${instanceId}`, 'instance_destroyed', {
          instanceId,
          timestamp: new Date().toISOString(),
        });
      }

      return result;
    } catch (error) {
      console.error(`âŒ Erro ao destruir instÃ¢ncia ${instanceId}:`, error);
      throw error;
    }
  }

  async sendMessage(instanceId, to, message) {
    try {
      const result = await this.whatsappService.sendMessage(instanceId, to, message);

      // Evento serÃ¡ automaticamente tratado pelo handler 'message_sent'

      return result;
    } catch (error) {
      console.error(`âŒ Erro ao enviar mensagem ${instanceId}:`, error);

      // Notificar erro via WebSocket
      if (this.websocketService) {
        this.websocketService.broadcastToRoom(`instance-${instanceId}`, 'message_error', {
          instanceId,
          to,
          message,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }

      throw error;
    }
  }

  getInstanceStatus(instanceId) {
    return this.whatsappService.getInstanceStatus(instanceId);
  }

  getAllInstances() {
    return this.whatsappService.getAllInstances();
  }

  // MÃ©todos para WebSocket

  subscribeToInstance(socketId, instanceId) {
    if (this.websocketService) {
      this.websocketService.joinRoom(socketId, `instance-${instanceId}`);
      console.log(`ðŸ“¡ Socket ${socketId} inscrito na instÃ¢ncia ${instanceId}`);
    }
  }

  unsubscribeFromInstance(socketId, instanceId) {
    if (this.websocketService) {
      this.websocketService.leaveRoom(socketId, `instance-${instanceId}`);
      console.log(`ðŸ“¡ Socket ${socketId} desinscrito da instÃ¢ncia ${instanceId}`);
    }
  }

  getConnectedClients() {
    return this.websocketService ? this.websocketService.getConnectedClients() : 0;
  }

  // Health check
  async healthCheck() {
    const health = {
      whatsapp: {
        initialized: this.initialized,
        instances: this.getAllInstances().length,
      },
      websocket: {
        initialized: !!this.websocketService,
        connectedClients: this.getConnectedClients(),
      },
    };

    return health;
  }

  // Cleanup
  async cleanup() {
    console.log('ðŸ§¹ Limpando WhatsApp Integration Service...');

    if (this.whatsappService) {
      await this.whatsappService.cleanup();
    }

    if (this.websocketService) {
      this.websocketService.cleanup();
    }

    this.initialized = false;
    console.log('âœ… Cleanup concluÃ­do');
  }
}

// Singleton
let instance = null;

function getWhatsAppIntegrationService() {
  if (!instance) {
    instance = new WhatsAppIntegrationService();
  }
  return instance;
}

module.exports = {
  WhatsAppIntegrationService,
  getWhatsAppIntegrationService,
};
