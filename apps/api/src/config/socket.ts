import { Server } from 'socket.io';
import logger from './logger';

interface SocketData {
  userId?: string;
  instanceId?: string;
}

interface ClientToServerEvents {
  'join:instance': (instanceId: string) => void;
  'leave:instance': (instanceId: string) => void;
  'send:message': (payload: any, callback: (response: any) => void) => void;
  'request:stats': (callback: (data: any) => void) => void;
  'request:activities': (filter: any, callback: (data: any) => void) => void;
}

interface ServerToClientEvents {
  'stats:update': (data: any) => void;
  'activity:new': (activity: any) => void;
  'message:sent': (message: any) => void;
  'message:received': (message: any) => void;
  'instance:connected': (instanceId: string) => void;
  'instance:disconnected': (instanceId: string) => void;
  'qr:updated': (instanceId: string, qrCode: string) => void;
  'connection:status': (status: string) => void;
  'error': (error: any) => void;
}

// Estado global do sistema
let systemStats = {
  connectedInstances: 0,
  totalInstances: 0,
  messagesSentToday: 0,
  messagesReceivedToday: 0,
  activeQueues: 0,
  systemUptime: '0d 0h 0m'
};

let recentActivities: any[] = [];

class SocketManager {
  private static instance: SocketManager;
  private io: Server | null = null;

  private constructor() {}

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  setIO(io: Server): void {
    this.io = io;
    this.setupEventHandlers();
    this.startPeriodicBroadcasts();
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      logger.info(`✅ Cliente conectado: ${socket.id}`);

      // Enviar estado atual ao conectar
      socket.emit('stats:update', systemStats);
      socket.emit('connection:status', 'connected');

      // Join em sala de instância
      socket.on('join:instance', (instanceId: string) => {
        if (!instanceId) {
          socket.emit('error', { message: 'ID da instância é obrigatório' });
          return;
        }

        socket.join(`instance:${instanceId}`);
        logger.info(`Socket ${socket.id} entrou na sala da instância: ${instanceId}`);
        socket.emit('connection:status', `joined:${instanceId}`);
      });

      // Leave sala de instância
      socket.on('leave:instance', (instanceId: string) => {
        if (!instanceId) return;

        socket.leave(`instance:${instanceId}`);
        logger.info(`Socket ${socket.id} saiu da sala da instância: ${instanceId}`);
        socket.emit('connection:status', `left:${instanceId}`);
      });

      // Enviar mensagem via socket
      socket.on('send:message', async (payload, callback) => {
        try {
          logger.info(`Enviando mensagem via socket:`, payload);

          // Validação básica
          if (!payload.to || !payload.content) {
            callback({ 
              success: false, 
              error: 'Destinatário e conteúdo são obrigatórios' 
            });
            return;
          }

          // Simular envio (integração com WhatsApp Web.js seria aqui)
          const message = {
            id: `msg_${Date.now()}`,
            instanceId: payload.instanceId || 'default',
            to: payload.to,
            content: payload.content,
            type: payload.type || 'text',
            timestamp: new Date(),
            status: 'sent'
          };

          // Simular delay de envio
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Responder sucesso
          callback({ success: true, data: message });

          // Broadcast para sala da instância
          if (payload.instanceId && this.io) {
            this.io.to(`instance:${payload.instanceId}`).emit('message:sent', message);
          }

          // Atualizar estatísticas
          systemStats.messagesSentToday++;
          this.broadcastStats();

          // Adicionar atividade
          this.addActivity({
            id: `activity_${Date.now()}`,
            type: 'message_sent',
            instanceId: payload.instanceId || 'default',
            timestamp: new Date(),
            details: {
              to: payload.to,
              content: payload.content.substring(0, 50) + '...'
            },
            status: 'success'
          });

        } catch (error) {
          logger.error('Erro ao enviar mensagem via socket:', error);
          callback({ 
            success: false, 
            error: 'Erro interno do servidor' 
          });
        }
      });

      // Solicitar estatísticas atuais
      socket.on('request:stats', (callback) => {
        callback(systemStats);
      });

      // Solicitar atividades recentes
      socket.on('request:activities', (filter, callback) => {
        let filteredActivities = [...recentActivities];

        if (filter?.type && filter.type !== 'all') {
          filteredActivities = filteredActivities.filter(a => a.type === filter.type);
        }

        if (filter?.timeRange && filter.timeRange !== 'all') {
          const now = new Date();
          let timeLimit = new Date();

          switch (filter.timeRange) {
            case '1h':
              timeLimit.setHours(now.getHours() - 1);
              break;
            case '24h':
              timeLimit.setDate(now.getDate() - 1);
              break;
            case '7d':
              timeLimit.setDate(now.getDate() - 7);
              break;
          }

          filteredActivities = filteredActivities.filter(a => 
            new Date(a.timestamp) > timeLimit
          );
        }

        callback(filteredActivities.slice(0, 50));
      });

      // Desconexão
      socket.on('disconnect', (reason) => {
        logger.info(`❌ Cliente desconectado: ${socket.id}, motivo: ${reason}`);
      });
    });
  }

  private startPeriodicBroadcasts(): void {
    // Atualizar uptime a cada minuto
    setInterval(() => {
      const uptime = process.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      
      systemStats.systemUptime = `${days}d ${hours}h ${minutes}m`;
      this.broadcastStats();
    }, 60000);

    // Simular atividades em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        if (Math.random() > 0.7) {
          const activity = {
            id: `activity_${Date.now()}`,
            type: 'message_received',
            instanceId: 'demo',
            timestamp: new Date(),
            details: {
              from: '+55119' + Math.floor(Math.random() * 100000000),
              content: 'Mensagem de demonstração recebida'
            },
            status: 'success'
          };

          this.addActivity(activity);
          systemStats.messagesReceivedToday++;
          this.broadcastStats();
        }
      }, 30000);
    }
  }

  getIO(): Server | null {
    return this.io;
  }

  emit(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  broadcastStats(): void {
    if (this.io) {
      this.io.emit('stats:update', systemStats);
    }
  }

  addActivity(activity: any): void {
    recentActivities.unshift(activity);
    
    // Manter apenas as últimas 100 atividades
    if (recentActivities.length > 100) {
      recentActivities = recentActivities.slice(0, 100);
    }

    if (this.io) {
      this.io.emit('activity:new', activity);
    }
  }

  updateStats(newStats: Partial<typeof systemStats>): void {
    systemStats = { ...systemStats, ...newStats };
    this.broadcastStats();
  }

  // Métodos estáticos para compatibilidade
  static emitToInstance(instanceId: string, event: string, data: any): void {
    const manager = SocketManager.getInstance();
    if (manager.io) {
      manager.io.to(`instance:${instanceId}`).emit(event, data);
    }
  }

  static joinInstanceRoom(socketId: string, instanceId: string): void {
    const manager = SocketManager.getInstance();
    if (manager.io) {
      const socket = manager.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(`instance:${instanceId}`);
      }
    }
  }

  static leaveInstanceRoom(socketId: string, instanceId: string): void {
    const manager = SocketManager.getInstance();
    if (manager.io) {
      const socket = manager.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(`instance:${instanceId}`);
      }
    }
  }

  static updateSystemStats(newStats: Partial<typeof systemStats>): void {
    const manager = SocketManager.getInstance();
    manager.updateStats(newStats);
  }

  static addSystemActivity(activity: any): void {
    const manager = SocketManager.getInstance();
    manager.addActivity(activity);
  }

  static getSystemStats() {
    return systemStats;
  }

  static getRecentActivities() {
    return recentActivities;
  }
}

export default SocketManager;
