import QRCode from 'qrcode';
import WAWebJS from 'whatsapp-web.js';
import logger from '../config/logger';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs';
import SocketManager from '../config/socket';

export interface InstanceStatus {
  id: string;
  status: 'initializing' | 'qr_ready' | 'authenticated' | 'ready' | 'disconnected' | 'destroyed';
  qr?: string;
  clientInfo?: any;
  lastSeen?: Date;
}

class WhatsAppServiceNew extends EventEmitter {
  private instances: Map<string, WAWebJS.Client> = new Map();
  private instanceStatus: Map<string, InstanceStatus> = new Map();
  private sessionsPath: string;

  constructor() {
    super();
    this.sessionsPath = path.resolve(process.cwd(), '.wwebjs_auth');
    this.ensureSessionsDir();
  }

  private ensureSessionsDir() {
    if (!fs.existsSync(this.sessionsPath)) {
      fs.mkdirSync(this.sessionsPath, { recursive: true });
      logger.info(`Created sessions directory: ${this.sessionsPath}`);
    }
  }

  async createInstance(instanceId: string): Promise<InstanceStatus> {
    try {
      if (this.instances.has(instanceId)) {
        logger.warn(`Instance ${instanceId} already exists`);
        return this.instanceStatus.get(instanceId)!;
      }

      // Inicializar status da instÃ¢ncia
      const status: InstanceStatus = {
        id: instanceId,
        status: 'initializing',
        lastSeen: new Date(),
      };
      this.instanceStatus.set(instanceId, status);

      // ConfiguraÃ§Ã£o do cliente WhatsApp Web.js
      const client = new WAWebJS.Client({
        authStrategy: new WAWebJS.LocalAuth({
          clientId: instanceId,
          dataPath: this.sessionsPath,
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
          ],
          timeout: 60000,
        },
        qrMaxRetries: 3,
        authTimeoutMs: 60000,
      });

      // Event listeners
      this.setupClientEventListeners(client, instanceId);

      // Armazenar instÃ¢ncia
      this.instances.set(instanceId, client);

      // Inicializar cliente
      await client.initialize();

      logger.info(`WhatsApp instance ${instanceId} created successfully`);
      return status;
    } catch (error) {
      logger.error(`Error creating WhatsApp instance ${instanceId}:`, error);

      // Cleanup em caso de erro
      this.cleanupInstance(instanceId);

      const errorStatus: InstanceStatus = {
        id: instanceId,
        status: 'destroyed',
        lastSeen: new Date(),
      };
      this.instanceStatus.set(instanceId, errorStatus);

      throw error;
    }
  }

  private setupClientEventListeners(client: WAWebJS.Client, instanceId: string) {
    // QR Code gerado
    client.on('qr', async (qr: string) => {
      logger.info(`QR code generated for instance ${instanceId}`);

      try {
        // Converter o string QR para imagem Data URL
        const qrImageDataURL = await QRCode.toDataURL(qr, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        const status = this.instanceStatus.get(instanceId);
        if (status) {
          status.qr = qrImageDataURL; // Usar a imagem em vez do string
          status.status = 'qr_ready';
          status.lastSeen = new Date();

          // Emitir evento para o frontend via Socket.IO
          SocketManager.emitToInstance(instanceId, 'qr_received', { qr: qrImageDataURL });

          // Emitir evento interno
          this.emit('qr', { instanceId, qr: qrImageDataURL });
        }
      } catch (error) {
        logger.error(`Error generating QR image for instance ${instanceId}:`, error);
      }
    });

    // Autenticado com sucesso
    client.on('authenticated', () => {
      logger.info(`Instance ${instanceId} authenticated`);

      const status = this.instanceStatus.get(instanceId);
      if (status) {
        status.status = 'authenticated';
        status.qr = undefined; // Limpar QR code
        status.lastSeen = new Date();

        SocketManager.emitToInstance(instanceId, 'authenticated', {});
        this.emit('authenticated', { instanceId });
      }
    });

    // Cliente pronto para uso
    client.on('ready', async () => {
      logger.info(`Instance ${instanceId} is ready`);

      try {
        const clientInfo = await client.info;

        const status = this.instanceStatus.get(instanceId);
        if (status) {
          status.status = 'ready';
          status.clientInfo = {
            wid: clientInfo.wid,
            pushname: clientInfo.pushname,
            platform: clientInfo.platform,
          };
          status.lastSeen = new Date();

          SocketManager.emitToInstance(instanceId, 'ready', { clientInfo: status.clientInfo });
          this.emit('ready', { instanceId, clientInfo: status.clientInfo });
        }
      } catch (error) {
        logger.error(`Error getting client info for ${instanceId}:`, error);
      }
    });

    // Falha na autenticaÃ§Ã£o
    client.on('auth_failure', (message: string) => {
      logger.error(`Authentication failed for instance ${instanceId}:`, message);

      const status = this.instanceStatus.get(instanceId);
      if (status) {
        status.status = 'disconnected';
        status.qr = undefined;
        status.lastSeen = new Date();

        SocketManager.emitToInstance(instanceId, 'auth_failure', { message });
        this.emit('auth_failure', { instanceId, message });
      }
    });

    // Cliente desconectado
    client.on('disconnected', (reason: string) => {
      logger.warn(`Instance ${instanceId} disconnected:`, reason);

      const status = this.instanceStatus.get(instanceId);
      if (status) {
        status.status = 'disconnected';
        status.qr = undefined;
        status.lastSeen = new Date();

        SocketManager.emitToInstance(instanceId, 'disconnected', { reason });
        this.emit('disconnected', { instanceId, reason });
      }
    });

    // Loading screen progress
    client.on('loading_screen', (percent: number, message: string) => {
      logger.debug(`Instance ${instanceId} loading: ${percent}% - ${message}`);
      SocketManager.emitToInstance(instanceId, 'loading_screen', { percent, message });
      this.emit('loading_screen', { instanceId, percent, message });
    });

    // Mensagens recebidas
    client.on('message', (message: any) => {
      logger.debug(`Message received on instance ${instanceId}`);
      SocketManager.emitToInstance(instanceId, 'message_received', { message });
      this.emit('message', { instanceId, message });
    });

    // Mensagens criadas (incluindo prÃ³prias)
    client.on('message_create', (message: any) => {
      logger.debug(`Message created on instance ${instanceId}`);
      SocketManager.emitToInstance(instanceId, 'message_create', { message });
    });

    // Estado da conexÃ£o mudou
    client.on('change_state', (state: string) => {
      logger.debug(`Instance ${instanceId} state changed to: ${state}`);
      SocketManager.emitToInstance(instanceId, 'state_changed', { state });
    });
  }

  async getInstanceStatus(instanceId: string): Promise<InstanceStatus | null> {
    return this.instanceStatus.get(instanceId) || null;
  }

  async getAllInstances(): Promise<InstanceStatus[]> {
    return Array.from(this.instanceStatus.values());
  }

  async generateQRCode(instanceId: string): Promise<string | null> {
    const status = this.instanceStatus.get(instanceId);
    if (!status) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    if (status.status === 'qr_ready' && status.qr) {
      return status.qr;
    }

    return null;
  }

  async destroyInstance(instanceId: string): Promise<void> {
    try {
      const client = this.instances.get(instanceId);
      if (client) {
        await client.destroy();
        this.instances.delete(instanceId);
      }

      const status = this.instanceStatus.get(instanceId);
      if (status) {
        status.status = 'destroyed';
        status.qr = undefined;
        status.clientInfo = undefined;
        status.lastSeen = new Date();
      }

      SocketManager.emitToInstance(instanceId, 'destroyed', {});
      logger.info(`Instance ${instanceId} destroyed successfully`);
    } catch (error) {
      logger.error(`Error destroying instance ${instanceId}:`, error);
      throw error;
    }
  }

  private cleanupInstance(instanceId: string) {
    const client = this.instances.get(instanceId);
    if (client) {
      client.removeAllListeners();
      this.instances.delete(instanceId);
    }
  }

  async sendMessage(instanceId: string, to: string, message: string): Promise<any> {
    const client = this.instances.get(instanceId);
    if (!client) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    const status = this.instanceStatus.get(instanceId);
    if (!status || status.status !== 'ready') {
      throw new Error(`Instance ${instanceId} is not ready`);
    }

    try {
      const result = await client.sendMessage(to, message);
      logger.info(`Message sent from instance ${instanceId} to ${to}`);
      return result;
    } catch (error) {
      logger.error(`Error sending message from instance ${instanceId}:`, error);
      throw error;
    }
  }

  async getClientInfo(instanceId: string): Promise<any> {
    const client = this.instances.get(instanceId);
    if (!client) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    const status = this.instanceStatus.get(instanceId);
    if (!status || status.status !== 'ready') {
      throw new Error(`Instance ${instanceId} is not ready`);
    }

    return status.clientInfo;
  }

  async getState(instanceId: string): Promise<string | null> {
    const client = this.instances.get(instanceId);
    if (!client) {
      return null;
    }

    try {
      return await client.getState();
    } catch (error) {
      logger.error(`Error getting state for instance ${instanceId}:`, error);
      return null;
    }
  }

  async logout(instanceId: string): Promise<void> {
    const client = this.instances.get(instanceId);
    if (!client) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    try {
      await client.logout();
      logger.info(`Instance ${instanceId} logged out successfully`);
    } catch (error) {
      logger.error(`Error logging out instance ${instanceId}:`, error);
      throw error;
    }
  }

  // Inicializar instÃ¢ncias existentes ao startup
  async initializeExistingInstances(): Promise<void> {
    try {
      if (!fs.existsSync(this.sessionsPath)) {
        logger.info('No existing sessions found');
        return;
      }

      const sessionDirs = fs.readdirSync(this.sessionsPath).filter(dir => {
        const dirPath = path.join(this.sessionsPath, dir);
        return fs.statSync(dirPath).isDirectory() && dir.startsWith('session-');
      });

      logger.info(`Found ${sessionDirs.length} existing sessions`);

      for (const sessionDir of sessionDirs) {
        const instanceId = sessionDir.replace('session-', '');
        try {
          await this.createInstance(instanceId);
          logger.info(`Restored instance: ${instanceId}`);
        } catch (error) {
          logger.error(`Failed to restore instance ${instanceId}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error initializing existing instances:', error);
    }
  }

  // MÃ©todo para forÃ§ar refresh do QR code
  async refreshQR(instanceId: string): Promise<void> {
    const client = this.instances.get(instanceId);
    if (!client) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    try {
      // ForÃ§a um novo QR code
      await client.pupPage?.evaluate(() => {
        // @ts-ignore
        if (window.Store && window.Store.Cmd) {
          // @ts-ignore
          window.Store.Cmd.refreshQR();
        }
      });

      logger.info(`QR refresh requested for instance ${instanceId}`);
    } catch (error) {
      logger.error(`Error refreshing QR for instance ${instanceId}:`, error);
      throw error;
    }
  }
}

export const whatsappServiceNew = new WhatsAppServiceNew();
