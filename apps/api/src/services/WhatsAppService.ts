import WAWebJS from 'whatsapp-web.js';
import qrcode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { WhatsAppInstanceModel } from '../models/WhatsAppInstance';
import logger from '../config/logger';
import SocketManager from '../config/socket';

interface WhatsAppClientInstance {
  id: string;
  client: WAWebJS.Client;
  isReady: boolean;
  qrCode?: string;
}

class WhatsAppService {
  private instances: Map<string, WhatsAppClientInstance> = new Map();
  private sessionsPath: string;

  constructor() {
    this.sessionsPath = process.env['WHATSAPP_SESSION_PATH'] || './sessions';
    this.ensureSessionsDirectory();
  }

  private ensureSessionsDirectory() {
    if (!fs.existsSync(this.sessionsPath)) {
      fs.mkdirSync(this.sessionsPath, { recursive: true });
    }
  }

  async createInstance(instanceId: string, userId: number): Promise<boolean> {
    try {
      if (this.instances.has(instanceId)) {
        logger.warn(`Instância ${instanceId} já existe`);
        return false;
      }

      const sessionPath = path.join(this.sessionsPath, instanceId);

      const client = new WAWebJS.Client({
        authStrategy: new WAWebJS.LocalAuth({
          clientId: instanceId,
          dataPath: sessionPath,
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
          ],
          executablePath: undefined, // Deixar que o sistema encontre o Chrome
        },
      });

      const instance: WhatsAppClientInstance = {
        id: instanceId,
        client,
        isReady: false,
      };

      this.setupClientEvents(instance);
      this.instances.set(instanceId, instance);

      await client.initialize();
      logger.info(`Instância ${instanceId} criada e inicializando`);

      return true;
    } catch (error) {
      logger.error(`Erro ao criar instância ${instanceId}:`, error);
      return false;
    }
  }

  private setupClientEvents(instance: WhatsAppClientInstance) {
    const { client, id } = instance;

    client.on('qr', async (qr: string) => {
      try {
        logger.info(`QR Code gerado para instância ${id}`);

        // Converter QR code para data URL
        const qrDataUrl = await qrcode.toDataURL(qr);
        instance.qrCode = qrDataUrl;

        // Atualizar no banco de dados
        await WhatsAppInstanceModel.updateStatus(id, 'connecting', qrDataUrl);

        // Emitir evento via Socket.IO
        SocketManager.getInstance().emit(`qr:${id}`, { qrCode: qrDataUrl });

        logger.info(`QR Code enviado para cliente da instância ${id}`);
      } catch (error) {
        logger.error(`Erro ao processar QR code da instância ${id}:`, error);
      }
    });

    client.on('ready', async () => {
      try {
        logger.info(`Instância ${id} conectada e pronta`);
        instance.isReady = true;

        const info = client.info;
        const phoneNumber = info?.wid?.user || 'unknown';

        // Atualizar status no banco
        await WhatsAppInstanceModel.updateStatus(id, 'connected');
        await WhatsAppInstanceModel.updatePhoneNumber(id, phoneNumber);

        // Emitir evento via Socket.IO
        SocketManager.getInstance().emit(`status:${id}`, {
          status: 'connected',
          phoneNumber,
        });

        logger.info(`Instância ${id} conectada com número ${phoneNumber}`);
      } catch (error) {
        logger.error(`Erro ao processar conexão da instância ${id}:`, error);
      }
    });

    client.on('authenticated', () => {
      logger.info(`Instância ${id} autenticada`);
    });

    client.on('auth_failure', async (msg: any) => {
      logger.error(`Falha de autenticação na instância ${id}:`, msg);
      await WhatsAppInstanceModel.updateStatus(id, 'error');
      SocketManager.getInstance().emit(`status:${id}`, {
        status: 'error',
        error: 'Authentication failed',
      });
    });

    client.on('disconnected', async (reason: any) => {
      logger.warn(`Instância ${id} desconectada:`, reason);
      instance.isReady = false;
      await WhatsAppInstanceModel.updateStatus(id, 'disconnected');
      SocketManager.getInstance().emit(`status:${id}`, { status: 'disconnected', reason });
    });

    client.on('message', async (message: WAWebJS.Message) => {
      try {
        await this.handleIncomingMessage(id, message);
      } catch (error) {
        logger.error(`Erro ao processar mensagem recebida na instância ${id}:`, error);
      }
    });
  }

  private async handleIncomingMessage(instanceId: string, message: WAWebJS.Message) {
    logger.info(`Mensagem recebida na instância ${instanceId}: ${message.from} -> ${message.body}`);

    // Emitir evento via Socket.IO
    SocketManager.getInstance().emit(`message:${instanceId}`, {
      id: message.id._serialized,
      from: message.from,
      to: message.to || '',
      body: message.body,
      type: message.type,
      timestamp: message.timestamp,
      isGroup: message.from.includes('@g.us'),
      hasMedia: message.hasMedia,
    });

    // Aqui você pode implementar lógica adicional:
    // - Salvar mensagem no banco de dados
    // - Enviar webhook para sistemas externos
    // - Implementar respostas automáticas
  }

  async sendMessage(instanceId: string, to: string, message: string): Promise<boolean> {
    try {
      const instance = this.instances.get(instanceId);

      if (!instance || !instance.isReady) {
        logger.error(`Instância ${instanceId} não está pronta para envio`);
        return false;
      }

      const sentMessage = await instance.client.sendMessage(to, message);

      logger.info(`Mensagem enviada da instância ${instanceId} para ${to}`);

      // Emitir evento via Socket.IO
      SocketManager.getInstance().emit(`message:sent:${instanceId}`, {
        id: sentMessage.id._serialized,
        to,
        body: message,
        timestamp: sentMessage.timestamp,
      });

      return true;
    } catch (error) {
      logger.error(`Erro ao enviar mensagem da instância ${instanceId}:`, error);
      return false;
    }
  }

  async sendMedia(
    instanceId: string,
    to: string,
    media: WAWebJS.MessageMedia,
    caption?: string
  ): Promise<boolean> {
    try {
      const instance = this.instances.get(instanceId);

      if (!instance || !instance.isReady) {
        logger.error(`Instância ${instanceId} não está pronta para envio`);
        return false;
      }

      const options = caption ? { caption } : {};
      const sentMessage = await instance.client.sendMessage(to, media, options);

      logger.info(`Mídia enviada da instância ${instanceId} para ${to}`);

      return true;
    } catch (error) {
      logger.error(`Erro ao enviar mídia da instância ${instanceId}:`, error);
      return false;
    }
  }

  async getInstanceInfo(instanceId: string) {
    const instance = this.instances.get(instanceId);

    if (!instance) {
      return null;
    }

    const dbInstance = await WhatsAppInstanceModel.findById(instanceId);

    return {
      id: instanceId,
      isReady: instance.isReady,
      qrCode: instance.qrCode,
      status: dbInstance?.status,
      phoneNumber: dbInstance?.phone_number,
    };
  }

  async disconnectInstance(instanceId: string): Promise<boolean> {
    try {
      const instance = this.instances.get(instanceId);

      if (!instance) {
        logger.warn(`Instância ${instanceId} não encontrada para desconexão`);
        return false;
      }

      await instance.client.destroy();
      this.instances.delete(instanceId);

      await WhatsAppInstanceModel.updateStatus(instanceId, 'disconnected');

      logger.info(`Instância ${instanceId} desconectada com sucesso`);
      return true;
    } catch (error) {
      logger.error(`Erro ao desconectar instância ${instanceId}:`, error);
      return false;
    }
  }

  async restartInstance(instanceId: string): Promise<boolean> {
    try {
      await this.disconnectInstance(instanceId);

      // Aguardar um pouco antes de reconectar
      await new Promise(resolve => setTimeout(resolve, 2000));

      const dbInstance = await WhatsAppInstanceModel.findById(instanceId);
      if (!dbInstance) {
        logger.error(`Instância ${instanceId} não encontrada no banco de dados`);
        return false;
      }

      return await this.createInstance(instanceId, dbInstance.user_id);
    } catch (error) {
      logger.error(`Erro ao reiniciar instância ${instanceId}:`, error);
      return false;
    }
  }

  getInstanceStatus(instanceId: string): string | null {
    const instance = this.instances.get(instanceId);

    if (!instance) {
      return null;
    }

    if (instance.isReady) {
      return 'connected';
    } else if (instance.qrCode) {
      return 'connecting';
    } else {
      return 'disconnected';
    }
  }

  generateQRCode(instanceId: string): Promise<string | null> {
    return new Promise(resolve => {
      const instance = this.instances.get(instanceId);

      if (!instance) {
        logger.warn(`Instância ${instanceId} não encontrada`);
        resolve(null);
        return;
      }

      // Se já tem QR code, retornar imediatamente
      if (instance.qrCode) {
        logger.info(`QR code já disponível para instância ${instanceId}`);
        resolve(instance.qrCode);
        return;
      }

      // Se já está conectado, não precisa de QR
      if (instance.isReady) {
        logger.info(`Instância ${instanceId} já está conectada`);
        resolve(null);
        return;
      }

      // Aguardar QR code ser gerado
      let attempts = 0;
      const maxAttempts = 20; // 10 segundos

      const checkForQR = () => {
        const updatedInstance = this.instances.get(instanceId);

        if (updatedInstance?.qrCode) {
          logger.info(`QR code gerado para instância ${instanceId}`);
          resolve(updatedInstance.qrCode);
          return;
        }

        if (updatedInstance?.isReady) {
          logger.info(`Instância ${instanceId} conectou-se antes do QR`);
          resolve(null);
          return;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          logger.warn(`Timeout aguardando QR code para instância ${instanceId}`);
          resolve(null);
          return;
        }

        setTimeout(checkForQR, 500);
      };

      checkForQR();
    });
  }

  async getAllInstancesStatus(): Promise<Array<{ id: string; status: string; isReady: boolean }>> {
    const results = [];

    for (const [id, instance] of this.instances.entries()) {
      results.push({
        id,
        status: this.getInstanceStatus(id) || 'unknown',
        isReady: instance.isReady,
      });
    }

    return results;
  }

  // Método para inicializar instâncias existentes ao startar o servidor
  async initializeExistingInstances() {
    try {
      const instances = await WhatsAppInstanceModel.getConnectedInstances();

      for (const instance of instances) {
        logger.info(`Inicializando instância existente: ${instance.id}`);
        await this.createInstance(instance.id, instance.user_id);
      }

      logger.info(`${instances.length} instâncias existentes inicializadas`);
    } catch (error) {
      logger.error('Erro ao inicializar instâncias existentes:', error);
    }
  }
}

export default new WhatsAppService();
