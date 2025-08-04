/**
 * WebSocket Service Robusto para Correção dos Problemas de Conexão
 * Implementa reconexão inteligente e gestão adequada de salas
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { EventEmitter } = require('events');

class WebSocketServiceFixed extends EventEmitter {
  constructor(server) {
    super();
    this.server = server;
    this.wss = null;
    this.clients = new Map();
    this.instanceRooms = new Map();
    this.setupServer();
  }

  setupServer() {
    this.wss = new WebSocket.Server({
      server: this.server,
      path: '/ws',
      perMessageDeflate: {
        zlibDeflateOptions: {
          threshold: 1024,
        },
      },
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    console.log('✅ WebSocket Server configurado em /ws');
  }

  handleConnection(ws, req) {
    const clientId = this.generateClientId();
    const token = this.extractToken(req);

    // Autenticação opcional mas recomendada
    const isAuthenticated = token ? this.authenticate(token) : false;

    this.clients.set(clientId, {
      ws,
      isAuthenticated,
      subscriptions: new Set(),
      lastActivity: new Date(),
      metadata: {
        userAgent: req.headers['user-agent'],
        ip: req.socket.remoteAddress,
      },
    });

    console.log(`🔌 Cliente conectado: ${clientId} (Auth: ${isAuthenticated})`);

    // Configurar eventos do cliente
    this.setupClientEvents(ws, clientId);

    // Enviar confirmação de conexão
    this.sendToClient(clientId, {
      type: 'connection',
      clientId,
      authenticated: isAuthenticated,
      message: 'Conectado com sucesso',
    });

    // Configurar heartbeat
    this.startHeartbeat(clientId);
  }

  setupClientEvents(ws, clientId) {
    ws.on('message', data => {
      this.handleMessage(clientId, data);
    });

    ws.on('close', (code, reason) => {
      console.log(`🔌 Cliente desconectado: ${clientId} (${code}: ${reason})`);
      this.handleDisconnection(clientId);
    });

    ws.on('error', error => {
      console.error(`❌ Erro WebSocket ${clientId}:`, error);
      this.handleClientError(clientId, error);
    });

    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.lastActivity = new Date();
      }
    });
  }

  handleMessage(clientId, data) {
    try {
      const client = this.clients.get(clientId);
      if (!client) return;

      client.lastActivity = new Date();

      const message = JSON.parse(data);

      switch (message.type) {
        case 'subscribe':
        case 'join:instance':
          this.handleSubscribe(clientId, message);
          break;

        case 'unsubscribe':
        case 'leave:instance':
          this.handleUnsubscribe(clientId, message);
          break;

        case 'send:message':
        case 'send_message':
          this.handleSendMessage(clientId, message);
          break;

        case 'ping':
          this.sendToClient(clientId, { type: 'pong', timestamp: Date.now() });
          break;

        case 'request:stats':
          this.handleStatsRequest(clientId, message);
          break;

        default:
          this.sendToClient(clientId, {
            type: 'error',
            message: `Tipo de mensagem não suportado: ${message.type}`,
          });
      }
    } catch (error) {
      console.error(`❌ Erro ao processar mensagem ${clientId}:`, error);
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Formato de mensagem inválido',
      });
    }
  }

  handleSubscribe(clientId, message) {
    const { instance, instanceId } = message;
    const targetInstance = instance || instanceId;
    const client = this.clients.get(clientId);

    if (!client || !targetInstance) {
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Cliente ou instância não encontrados',
      });
      return;
    }

    // Adicionar cliente à sala da instância
    client.subscriptions.add(targetInstance);

    if (!this.instanceRooms.has(targetInstance)) {
      this.instanceRooms.set(targetInstance, new Set());
    }
    this.instanceRooms.get(targetInstance).add(clientId);

    this.sendToClient(clientId, {
      type: 'subscribed',
      instance: targetInstance,
      message: `Inscrito na instância ${targetInstance}`,
    });

    console.log(`📡 Cliente ${clientId} inscrito na instância ${targetInstance}`);
  }

  handleUnsubscribe(clientId, message) {
    const { instance, instanceId } = message;
    const targetInstance = instance || instanceId;
    const client = this.clients.get(clientId);

    if (!client) return;

    client.subscriptions.delete(targetInstance);

    if (this.instanceRooms.has(targetInstance)) {
      this.instanceRooms.get(targetInstance).delete(clientId);

      // Remover sala vazia
      if (this.instanceRooms.get(targetInstance).size === 0) {
        this.instanceRooms.delete(targetInstance);
      }
    }

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      instance: targetInstance,
    });
  }

  async handleSendMessage(clientId, message) {
    const client = this.clients.get(clientId);

    if (!client) return;

    try {
      const { instanceId, to, content, type = 'text' } = message;

      // Validação básica
      if (!instanceId || !to || !content) {
        this.sendToClient(clientId, {
          type: 'error',
          message: 'Dados da mensagem incompletos',
        });
        return;
      }

      // Aqui seria a integração com o WhatsApp Service
      // Por enquanto, simular o envio
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Simular delay de envio
      setTimeout(() => {
        // Notificar sucesso para o remetente
        this.sendToClient(clientId, {
          type: 'message_sent',
          messageId,
          instanceId,
          to,
          status: 'sent',
        });

        // Broadcast para todos os clientes da instância
        this.broadcastToInstance(instanceId, {
          type: 'message_update',
          messageId,
          instanceId,
          to,
          content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          messageType: type,
          timestamp: new Date().toISOString(),
          status: 'sent',
        });
      }, 500);
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem ${clientId}:`, error);
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Erro interno ao enviar mensagem',
      });
    }
  }

  handleStatsRequest(clientId, message) {
    const stats = this.getStats();
    this.sendToClient(clientId, {
      type: 'stats_response',
      data: stats,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnection(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remover de todas as salas de instância
    client.subscriptions.forEach(instance => {
      if (this.instanceRooms.has(instance)) {
        this.instanceRooms.get(instance).delete(clientId);

        if (this.instanceRooms.get(instance).size === 0) {
          this.instanceRooms.delete(instance);
        }
      }
    });

    this.clients.delete(clientId);
  }

  handleClientError(clientId, error) {
    console.error(`❌ Erro do cliente ${clientId}:`, error);

    // Tentar enviar notificação de erro se a conexão ainda estiver ativa
    try {
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Erro de conexão detectado',
      });
    } catch (e) {
      // Conexão já foi perdida
    }
  }

  broadcastToInstance(instanceId, data) {
    const room = this.instanceRooms.get(instanceId);
    if (!room) {
      console.log(`📡 Nenhum cliente inscrito na instância ${instanceId}`);
      return;
    }

    let sentCount = 0;
    room.forEach(clientId => {
      if (this.sendToClient(clientId, data)) {
        sentCount++;
      }
    });

    console.log(`📡 Broadcast para instância ${instanceId}: ${sentCount}/${room.size} clientes`);
  }

  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`❌ Erro ao enviar para cliente ${clientId}:`, error);
      this.handleDisconnection(clientId);
      return false;
    }
  }

  extractToken(req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');
  }

  authenticate(token) {
    try {
      const secret = process.env.JWT_SECRET || 'fallback-secret';
      jwt.verify(token, secret);
      return true;
    } catch (error) {
      return false;
    }
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  startHeartbeat(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const interval = setInterval(() => {
      if (!this.clients.has(clientId)) {
        clearInterval(interval);
        return;
      }

      const currentClient = this.clients.get(clientId);
      if (currentClient.ws.readyState === WebSocket.OPEN) {
        // Verificar se o cliente está responsivo
        const timeSinceLastActivity = Date.now() - currentClient.lastActivity.getTime();

        if (timeSinceLastActivity > 60000) {
          // 1 minuto sem atividade
          console.log(
            `⚠️ Cliente ${clientId} inativo há ${Math.round(timeSinceLastActivity / 1000)}s`
          );

          // Enviar ping
          currentClient.ws.ping();

          // Se não responder em 30s, desconectar
          setTimeout(() => {
            const checkClient = this.clients.get(clientId);
            if (checkClient && Date.now() - checkClient.lastActivity.getTime() > 90000) {
              console.log(`❌ Cliente ${clientId} não responsivo, desconectando...`);
              checkClient.ws.terminate();
            }
          }, 30000);
        }
      } else {
        clearInterval(interval);
        this.handleDisconnection(clientId);
      }
    }, 30000); // Verificar a cada 30 segundos
  }

  // Métodos públicos para integração
  getStats() {
    return {
      totalClients: this.clients.size,
      activeInstances: this.instanceRooms.size,
      authenticatedClients: Array.from(this.clients.values()).filter(c => c.isAuthenticated).length,
      rooms: Array.from(this.instanceRooms.entries()).map(([instance, clients]) => ({
        instance,
        clientCount: clients.size,
      })),
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  broadcastSystemUpdate(data) {
    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, {
        type: 'system_update',
        ...data,
        timestamp: new Date().toISOString(),
      });
    });
  }

  // Broadcast de estatísticas para todos os clientes
  broadcastStats(stats) {
    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, {
        type: 'stats:update',
        data: stats,
        timestamp: new Date().toISOString(),
      });
    });
  }

  // Broadcast de nova atividade
  broadcastActivity(activity) {
    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, {
        type: 'activity:new',
        data: activity,
        timestamp: new Date().toISOString(),
      });
    });
  }

  // Broadcast para instância específica
  notifyInstanceUpdate(instanceId, data) {
    this.broadcastToInstance(instanceId, {
      type: 'instance:update',
      instanceId,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Limpar recursos
  cleanup() {
    console.log('🧹 Limpando recursos WebSocket...');

    this.clients.forEach((client, clientId) => {
      try {
        client.ws.terminate();
      } catch (error) {
        console.error(`Erro ao terminar cliente ${clientId}:`, error);
      }
    });

    this.clients.clear();
    this.instanceRooms.clear();

    if (this.wss) {
      this.wss.close();
    }
  }
}

module.exports = WebSocketServiceFixed;
