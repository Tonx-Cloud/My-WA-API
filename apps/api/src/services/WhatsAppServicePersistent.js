/**
 * WhatsApp Service com PersistÃªncia de SessÃ£o Melhorada
 * Resolve problemas de persistÃªncia e reconexÃ£o automÃ¡tica
 */

const WAWebJS = require('whatsapp-web.js');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class WhatsAppServicePersistent extends EventEmitter {
  constructor() {
    super();
    this.instances = new Map();
    this.instanceStatus = new Map();
    this.sessionsPath = path.resolve(process.cwd(), '.wwebjs_auth');
    this.backupPath = path.resolve(process.cwd(), 'session_backups');
    this.setupDirectories();
  }

  async setupDirectories() {
    try {
      await fs.mkdir(this.sessionsPath, { recursive: true });
      await fs.mkdir(this.backupPath, { recursive: true });
      console.log('âœ… DiretÃ³rios de sessÃ£o configurados');
    } catch (error) {
      console.error('âŒ Erro ao configurar diretÃ³rios:', error);
    }
  }

  async createInstance(instanceId) {
    try {
      if (this.instances.has(instanceId)) {
        console.log(`âš ï¸ InstÃ¢ncia ${instanceId} jÃ¡ existe`);
        return this.instanceStatus.get(instanceId);
      }

      console.log(`ðŸ”„ Criando instÃ¢ncia ${instanceId}...`);

      // Verificar se hÃ¡ sessÃ£o salva
      const hasBackup = await this.hasSessionBackup(instanceId);

      const status = {
        id: instanceId,
        status: 'initializing',
        lastSeen: new Date(),
        hasBackup,
      };
      this.instanceStatus.set(instanceId, status);

      // ConfiguraÃ§Ã£o robusta do cliente
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
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--memory-pressure-off',
          ],
          timeout: 60000,
        },
        qrMaxRetries: 5,
        authTimeoutMs: 60000,
        takeoverOnConflict: true,
        takeoverTimeoutMs: 30000,
      });

      // Configurar eventos ANTES de inicializar
      this.setupClientEvents(client, instanceId);

      // Armazenar instÃ¢ncia
      this.instances.set(instanceId, client);

      // Inicializar cliente
      await client.initialize();

      console.log(`âœ… InstÃ¢ncia ${instanceId} criada com sucesso`);
      return status;
    } catch (error) {
      console.error(`âŒ Erro ao criar instÃ¢ncia ${instanceId}:`, error);

      // Cleanup em caso de erro
      await this.cleanupInstance(instanceId);

      const errorStatus = {
        id: instanceId,
        status: 'error',
        error: error.message,
        lastSeen: new Date(),
      };
      this.instanceStatus.set(instanceId, errorStatus);

      throw error;
    }
  }

  setupClientEvents(client, instanceId) {
    console.log(`ðŸ”§ Configurando eventos para instÃ¢ncia ${instanceId}`);

    // QR Code gerado
    client.on('qr', async qr => {
      try {
        console.log(`ðŸ“± QR Code gerado para ${instanceId}`);

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
          status.qr = qrImageDataURL;
          status.status = 'qr_ready';
          status.lastSeen = new Date();
        }

        this.emit('qr', { instanceId, qr: qrImageDataURL });
      } catch (error) {
        console.error(`âŒ Erro ao gerar QR ${instanceId}:`, error);
      }
    });

    // Autenticado
    client.on('authenticated', async () => {
      console.log(`ðŸ” InstÃ¢ncia ${instanceId} autenticada`);

      const status = this.instanceStatus.get(instanceId);
      if (status) {
        status.status = 'authenticated';
        status.qr = undefined;
        status.lastSeen = new Date();
      }

      // Fazer backup da sessÃ£o apÃ³s autenticaÃ§Ã£o
      await this.backupSession(instanceId);

      this.emit('authenticated', { instanceId });
    });

    // Cliente pronto
    client.on('ready', async () => {
      try {
        console.log(`âœ… InstÃ¢ncia ${instanceId} pronta para uso`);

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
        }

        // Backup da sessÃ£o quando estiver totalmente pronta
        await this.backupSession(instanceId);

        this.emit('ready', { instanceId, clientInfo: status.clientInfo });
      } catch (error) {
        console.error(`âŒ Erro ao processar ready ${instanceId}:`, error);
      }
    });

    // Falha de autenticaÃ§Ã£o
    client.on('auth_failure', async message => {
      console.error(`ðŸš« Falha de autenticaÃ§Ã£o ${instanceId}:`, message);

      const status = this.instanceStatus.get(instanceId);
      if (status) {
        status.status = 'auth_failure';
        status.error = message;
        status.qr = undefined;
        status.lastSeen = new Date();
      }

      // Tentar restaurar backup se disponÃ­vel
      if (await this.hasSessionBackup(instanceId)) {
        console.log(`ðŸ”„ Tentando restaurar backup para ${instanceId}`);
        await this.restoreSessionBackup(instanceId);
      }

      this.emit('auth_failure', { instanceId, message });
    });

    // Desconectado
    client.on('disconnected', async reason => {
      console.log(`ðŸ”Œ InstÃ¢ncia ${instanceId} desconectada: ${reason}`);

      const status = this.instanceStatus.get(instanceId);
      if (status) {
        status.status = 'disconnected';
        status.disconnectReason = reason;
        status.lastSeen = new Date();
      }

      this.emit('disconnected', { instanceId, reason });

      // Tentar reconexÃ£o automÃ¡tica apÃ³s 30 segundos
      setTimeout(async () => {
        console.log(`ðŸ”„ Tentando reconectar ${instanceId}...`);
        await this.reconnectInstance(instanceId);
      }, 30000);
    });

    // Mensagens recebidas
    client.on('message', message => {
      this.emit('message', { instanceId, message });
    });

    // Loading screen
    client.on('loading_screen', (percent, message) => {
      console.log(`â³ ${instanceId} carregando: ${percent}% - ${message}`);
      this.emit('loading_screen', { instanceId, percent, message });
    });

    // MudanÃ§a de estado
    client.on('change_state', state => {
      console.log(`ðŸ”„ ${instanceId} mudou estado: ${state}`);
      this.emit('state_change', { instanceId, state });
    });
  }

  async backupSession(instanceId) {
    try {
      const sessionDir = path.join(this.sessionsPath, `session-${instanceId}`);
      const backupFile = path.join(this.backupPath, `${instanceId}_${Date.now()}.backup`);

      // Verificar se diretÃ³rio de sessÃ£o existe
      try {
        await fs.access(sessionDir);

        // Comprimir e salvar
        const sessionData = await this.compressDirectory(sessionDir);
        await fs.writeFile(backupFile, sessionData);

        console.log(`ðŸ’¾ Backup criado para ${instanceId}: ${backupFile}`);

        // Limpar backups antigos (manter apenas os 3 mais recentes)
        await this.cleanOldBackups(instanceId);
      } catch (error) {
        console.log(`âš ï¸ SessÃ£o ainda nÃ£o disponÃ­vel para backup: ${instanceId}`);
      }
    } catch (error) {
      console.error(`âŒ Erro ao fazer backup ${instanceId}:`, error);
    }
  }

  async restoreSessionBackup(instanceId) {
    try {
      const backupFiles = await this.getBackupFiles(instanceId);

      if (backupFiles.length === 0) {
        console.log(`âš ï¸ Nenhum backup encontrado para ${instanceId}`);
        return false;
      }

      // Usar o backup mais recente
      const latestBackup = backupFiles[0];
      const sessionDir = path.join(this.sessionsPath, `session-${instanceId}`);

      // Remover sessÃ£o corrupta
      try {
        await fs.rmdir(sessionDir, { recursive: true });
      } catch (error) {
        // DiretÃ³rio pode nÃ£o existir
      }

      // Restaurar backup
      const backupData = await fs.readFile(latestBackup);
      await this.extractDirectory(backupData, sessionDir);

      console.log(`ðŸ”„ Backup restaurado para ${instanceId}`);
      return true;
    } catch (error) {
      console.error(`âŒ Erro ao restaurar backup ${instanceId}:`, error);
      return false;
    }
  }

  async hasSessionBackup(instanceId) {
    try {
      const backupFiles = await this.getBackupFiles(instanceId);
      return backupFiles.length > 0;
    } catch (error) {
      return false;
    }
  }

  async getBackupFiles(instanceId) {
    try {
      const files = await fs.readdir(this.backupPath);
      const backupFiles = files
        .filter(file => file.startsWith(`${instanceId}_`) && file.endsWith('.backup'))
        .map(file => ({
          name: file,
          path: path.join(this.backupPath, file),
          timestamp: parseInt(file.split('_')[1].replace('.backup', '')),
        }))
        .sort((a, b) => b.timestamp - a.timestamp);

      return backupFiles.map(f => f.path);
    } catch (error) {
      return [];
    }
  }

  async cleanOldBackups(instanceId) {
    try {
      const backupFiles = await this.getBackupFiles(instanceId);

      // Manter apenas os 3 mais recentes
      if (backupFiles.length > 3) {
        const filesToDelete = backupFiles.slice(3);

        for (const file of filesToDelete) {
          await fs.unlink(file);
          console.log(`ðŸ—‘ï¸ Backup antigo removido: ${file}`);
        }
      }
    } catch (error) {
      console.error(`âŒ Erro ao limpar backups antigos:`, error);
    }
  }

  async compressDirectory(dirPath) {
    // SimulaÃ§Ã£o simples de compressÃ£o (usar uma biblioteca real como tar ou zip)
    const files = await this.getAllFiles(dirPath);
    const data = [];

    for (const file of files) {
      const content = await fs.readFile(file);
      data.push({
        path: path.relative(dirPath, file),
        content: content.toString('base64'),
      });
    }

    return JSON.stringify(data);
  }

  async extractDirectory(data, targetDir) {
    const files = JSON.parse(data);
    await fs.mkdir(targetDir, { recursive: true });

    for (const file of files) {
      const filePath = path.join(targetDir, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, Buffer.from(file.content, 'base64'));
    }
  }

  async getAllFiles(dirPath) {
    const files = [];
    const items = await fs.readdir(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        const subFiles = await this.getAllFiles(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  async reconnectInstance(instanceId) {
    try {
      const client = this.instances.get(instanceId);
      if (!client) {
        console.log(`âš ï¸ Cliente ${instanceId} nÃ£o encontrado para reconexÃ£o`);
        return;
      }

      const status = this.instanceStatus.get(instanceId);
      if (status && status.status === 'ready') {
        console.log(`âœ… InstÃ¢ncia ${instanceId} jÃ¡ estÃ¡ conectada`);
        return;
      }

      console.log(`ðŸ”„ Reconectando instÃ¢ncia ${instanceId}...`);

      // Tentar reconectar
      await client.initialize();
    } catch (error) {
      console.error(`âŒ Erro na reconexÃ£o ${instanceId}:`, error);

      // Se falhar, tentar recriar a instÃ¢ncia
      setTimeout(async () => {
        console.log(`ðŸ”„ Tentando recriar instÃ¢ncia ${instanceId}...`);
        await this.destroyInstance(instanceId);
        await this.createInstance(instanceId);
      }, 60000);
    }
  }

  async sendMessage(instanceId, to, message) {
    const client = this.instances.get(instanceId);
    if (!client) {
      throw new Error(`InstÃ¢ncia ${instanceId} nÃ£o encontrada`);
    }

    const status = this.instanceStatus.get(instanceId);
    if (!status || status.status !== 'ready') {
      throw new Error(`InstÃ¢ncia ${instanceId} nÃ£o estÃ¡ pronta`);
    }

    try {
      const result = await client.sendMessage(to, message);
      console.log(`ðŸ“¤ Mensagem enviada de ${instanceId} para ${to}`);

      this.emit('message_sent', { instanceId, to, message, result });
      return result;
    } catch (error) {
      console.error(`âŒ Erro ao enviar mensagem ${instanceId}:`, error);
      throw error;
    }
  }

  async destroyInstance(instanceId) {
    try {
      console.log(`ðŸ—‘ï¸ Destruindo instÃ¢ncia ${instanceId}...`);

      const client = this.instances.get(instanceId);
      if (client) {
        await client.destroy();
        this.instances.delete(instanceId);
      }

      const status = this.instanceStatus.get(instanceId);
      if (status) {
        status.status = 'destroyed';
        status.lastSeen = new Date();
      }

      this.emit('destroyed', { instanceId });
      console.log(`âœ… InstÃ¢ncia ${instanceId} destruÃ­da`);
    } catch (error) {
      console.error(`âŒ Erro ao destruir instÃ¢ncia ${instanceId}:`, error);
      throw error;
    }
  }

  async cleanupInstance(instanceId) {
    try {
      const client = this.instances.get(instanceId);
      if (client) {
        try {
          await client.destroy();
        } catch (error) {
          console.log(`âš ï¸ Erro ao destruir cliente ${instanceId}:`, error);
        }
        this.instances.delete(instanceId);
      }

      this.instanceStatus.delete(instanceId);
    } catch (error) {
      console.error(`âŒ Erro no cleanup ${instanceId}:`, error);
    }
  }

  getInstanceStatus(instanceId) {
    return this.instanceStatus.get(instanceId) || null;
  }

  getAllInstances() {
    return Array.from(this.instanceStatus.values());
  }

  async initializeExistingInstances() {
    try {
      console.log('ðŸ”„ Inicializando instÃ¢ncias existentes...');

      const sessionDirs = await fs.readdir(this.sessionsPath);
      const instanceDirs = sessionDirs.filter(dir => dir.startsWith('session-'));

      console.log(`ðŸ“‚ Encontradas ${instanceDirs.length} sessÃµes existentes`);

      for (const sessionDir of instanceDirs) {
        const instanceId = sessionDir.replace('session-', '');
        try {
          console.log(`ðŸ”„ Restaurando instÃ¢ncia: ${instanceId}`);
          await this.createInstance(instanceId);
        } catch (error) {
          console.error(`âŒ Falha ao restaurar ${instanceId}:`, error);
        }
      }
    } catch (error) {
      console.error('âŒ Erro ao inicializar instÃ¢ncias existentes:', error);
    }
  }

  async cleanup() {
    console.log('ðŸ§¹ Limpando WhatsApp Service...');

    for (const [instanceId, client] of this.instances) {
      try {
        await client.destroy();
      } catch (error) {
        console.error(`Erro ao destruir ${instanceId}:`, error);
      }
    }

    this.instances.clear();
    this.instanceStatus.clear();
  }
}

module.exports = WhatsAppServicePersistent;
