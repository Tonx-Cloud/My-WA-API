/**
 * WhatsApp Service com Persistência de Sessão Melhorada
 * Resolve problemas de persistência e reconexão automática
 */

const WAWebJS = require("whatsapp-web.js");
const QRCode = require("qrcode");
const fs = require("fs").promises;
const path = require("path");
const { EventEmitter } = require("events");

class WhatsAppServicePersistent extends EventEmitter {
  constructor() {
    super();
    this.instances = new Map();
    this.instanceStatus = new Map();
    this.sessionsPath = path.resolve(process.cwd(), ".wwebjs_auth");
    this.backupPath = path.resolve(process.cwd(), "session_backups");
    this.setupDirectories();
  }

  async setupDirectories() {
    try {
      await fs.mkdir(this.sessionsPath, { recursive: true });
      await fs.mkdir(this.backupPath, { recursive: true });
      console.log("✅ Diretórios de sessão configurados");
    } catch (error) {
      console.error("❌ Erro ao configurar diretórios:", error);
    }
  }

  async createInstance(instanceId) {
    try {
      if (this.instances.has(instanceId)) {
        console.log(`⚠️ Instância ${instanceId} já existe`);
        return this.instanceStatus.get(instanceId);
      }

      console.log(`🔄 Criando instância ${instanceId}...`);

      // Verificar se há sessão salva
      const hasBackup = await this.hasSessionBackup(instanceId);

      const status = {
        id: instanceId,
        status: "initializing",
        lastSeen: new Date(),
        hasBackup,
      };
      this.instanceStatus.set(instanceId, status);

      // Configuração robusta do cliente
      const client = new WAWebJS.Client({
        authStrategy: new WAWebJS.LocalAuth({
          clientId: instanceId,
          dataPath: this.sessionsPath,
        }),
        puppeteer: {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-gpu",
            "--disable-extensions",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-features=TranslateUI",
            "--disable-ipc-flooding-protection",
            "--memory-pressure-off",
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

      // Armazenar instância
      this.instances.set(instanceId, client);

      // Inicializar cliente
      await client.initialize();

      console.log(`✅ Instância ${instanceId} criada com sucesso`);
      return status;
    } catch (error) {
      console.error(`❌ Erro ao criar instância ${instanceId}:`, error);

      // Cleanup em caso de erro
      await this.cleanupInstance(instanceId);

      const errorStatus = {
        id: instanceId,
        status: "error",
        error: error.message,
        lastSeen: new Date(),
      };
      this.instanceStatus.set(instanceId, errorStatus);

      throw error;
    }
  }

  setupClientEvents(client, instanceId) {
    console.log(`🔧 Configurando eventos para instância ${instanceId}`);

    // QR Code gerado
    client.on("qr", async (qr) => {
      try {
        console.log(`📱 QR Code gerado para ${instanceId}`);

        const qrImageDataURL = await QRCode.toDataURL(qr, {
          width: 256,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        const status = this.instanceStatus.get(instanceId);
        if (status) {
          status.qr = qrImageDataURL;
          status.status = "qr_ready";
          status.lastSeen = new Date();
        }

        this.emit("qr", { instanceId, qr: qrImageDataURL });
      } catch (error) {
        console.error(`❌ Erro ao gerar QR ${instanceId}:`, error);
      }
    });

    // Autenticado
    client.on("authenticated", async () => {
      console.log(`🔐 Instância ${instanceId} autenticada`);

      const status = this.instanceStatus.get(instanceId);
      if (status) {
        status.status = "authenticated";
        status.qr = undefined;
        status.lastSeen = new Date();
      }

      // Fazer backup da sessão após autenticação
      await this.backupSession(instanceId);

      this.emit("authenticated", { instanceId });
    });

    // Cliente pronto
    client.on("ready", async () => {
      try {
        console.log(`✅ Instância ${instanceId} pronta para uso`);

        const clientInfo = await client.info;

        const status = this.instanceStatus.get(instanceId);
        if (status) {
          status.status = "ready";
          status.clientInfo = {
            wid: clientInfo.wid,
            pushname: clientInfo.pushname,
            platform: clientInfo.platform,
          };
          status.lastSeen = new Date();
        }

        // Backup da sessão quando estiver totalmente pronta
        await this.backupSession(instanceId);

        this.emit("ready", { instanceId, clientInfo: status.clientInfo });
      } catch (error) {
        console.error(`❌ Erro ao processar ready ${instanceId}:`, error);
      }
    });

    // Falha de autenticação
    client.on("auth_failure", async (message) => {
      console.error(`🚫 Falha de autenticação ${instanceId}:`, message);

      const status = this.instanceStatus.get(instanceId);
      if (status) {
        status.status = "auth_failure";
        status.error = message;
        status.qr = undefined;
        status.lastSeen = new Date();
      }

      // Tentar restaurar backup se disponível
      if (await this.hasSessionBackup(instanceId)) {
        console.log(`🔄 Tentando restaurar backup para ${instanceId}`);
        await this.restoreSessionBackup(instanceId);
      }

      this.emit("auth_failure", { instanceId, message });
    });

    // Desconectado
    client.on("disconnected", async (reason) => {
      console.log(`🔌 Instância ${instanceId} desconectada: ${reason}`);

      const status = this.instanceStatus.get(instanceId);
      if (status) {
        status.status = "disconnected";
        status.disconnectReason = reason;
        status.lastSeen = new Date();
      }

      this.emit("disconnected", { instanceId, reason });

      // Tentar reconexão automática após 30 segundos
      setTimeout(async () => {
        console.log(`🔄 Tentando reconectar ${instanceId}...`);
        await this.reconnectInstance(instanceId);
      }, 30000);
    });

    // Mensagens recebidas
    client.on("message", (message) => {
      this.emit("message", { instanceId, message });
    });

    // Loading screen
    client.on("loading_screen", (percent, message) => {
      console.log(`⏳ ${instanceId} carregando: ${percent}% - ${message}`);
      this.emit("loading_screen", { instanceId, percent, message });
    });

    // Mudança de estado
    client.on("change_state", (state) => {
      console.log(`🔄 ${instanceId} mudou estado: ${state}`);
      this.emit("state_change", { instanceId, state });
    });
  }

  async backupSession(instanceId) {
    try {
      const sessionDir = path.join(this.sessionsPath, `session-${instanceId}`);
      const backupFile = path.join(
        this.backupPath,
        `${instanceId}_${Date.now()}.backup`,
      );

      // Verificar se diretório de sessão existe
      try {
        await fs.access(sessionDir);

        // Comprimir e salvar
        const sessionData = await this.compressDirectory(sessionDir);
        await fs.writeFile(backupFile, sessionData);

        console.log(`💾 Backup criado para ${instanceId}: ${backupFile}`);

        // Limpar backups antigos (manter apenas os 3 mais recentes)
        await this.cleanOldBackups(instanceId);
      } catch (error) {
        console.log(
          `⚠️ Sessão ainda não disponível para backup: ${instanceId}`,
        );
      }
    } catch (error) {
      console.error(`❌ Erro ao fazer backup ${instanceId}:`, error);
    }
  }

  async restoreSessionBackup(instanceId) {
    try {
      const backupFiles = await this.getBackupFiles(instanceId);

      if (backupFiles.length === 0) {
        console.log(`⚠️ Nenhum backup encontrado para ${instanceId}`);
        return false;
      }

      // Usar o backup mais recente
      const latestBackup = backupFiles[0];
      const sessionDir = path.join(this.sessionsPath, `session-${instanceId}`);

      // Remover sessão corrupta
      try {
        await fs.rmdir(sessionDir, { recursive: true });
      } catch (error) {
        // Diretório pode não existir
      }

      // Restaurar backup
      const backupData = await fs.readFile(latestBackup);
      await this.extractDirectory(backupData, sessionDir);

      console.log(`🔄 Backup restaurado para ${instanceId}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao restaurar backup ${instanceId}:`, error);
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
        .filter(
          (file) =>
            file.startsWith(`${instanceId}_`) && file.endsWith(".backup"),
        )
        .map((file) => ({
          name: file,
          path: path.join(this.backupPath, file),
          timestamp: parseInt(file.split("_")[1].replace(".backup", "")),
        }))
        .sort((a, b) => b.timestamp - a.timestamp);

      return backupFiles.map((f) => f.path);
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
          console.log(`🗑️ Backup antigo removido: ${file}`);
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao limpar backups antigos:`, error);
    }
  }

  async compressDirectory(dirPath) {
    // Simulação simples de compressão (usar uma biblioteca real como tar ou zip)
    const files = await this.getAllFiles(dirPath);
    const data = [];

    for (const file of files) {
      const content = await fs.readFile(file);
      data.push({
        path: path.relative(dirPath, file),
        content: content.toString("base64"),
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
      await fs.writeFile(filePath, Buffer.from(file.content, "base64"));
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
        console.log(`⚠️ Cliente ${instanceId} não encontrado para reconexão`);
        return;
      }

      const status = this.instanceStatus.get(instanceId);
      if (status && status.status === "ready") {
        console.log(`✅ Instância ${instanceId} já está conectada`);
        return;
      }

      console.log(`🔄 Reconectando instância ${instanceId}...`);

      // Tentar reconectar
      await client.initialize();
    } catch (error) {
      console.error(`❌ Erro na reconexão ${instanceId}:`, error);

      // Se falhar, tentar recriar a instância
      setTimeout(async () => {
        console.log(`🔄 Tentando recriar instância ${instanceId}...`);
        await this.destroyInstance(instanceId);
        await this.createInstance(instanceId);
      }, 60000);
    }
  }

  async sendMessage(instanceId, to, message) {
    const client = this.instances.get(instanceId);
    if (!client) {
      throw new Error(`Instância ${instanceId} não encontrada`);
    }

    const status = this.instanceStatus.get(instanceId);
    if (!status || status.status !== "ready") {
      throw new Error(`Instância ${instanceId} não está pronta`);
    }

    try {
      const result = await client.sendMessage(to, message);
      console.log(`📤 Mensagem enviada de ${instanceId} para ${to}`);

      this.emit("message_sent", { instanceId, to, message, result });
      return result;
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem ${instanceId}:`, error);
      throw error;
    }
  }

  async destroyInstance(instanceId) {
    try {
      console.log(`🗑️ Destruindo instância ${instanceId}...`);

      const client = this.instances.get(instanceId);
      if (client) {
        await client.destroy();
        this.instances.delete(instanceId);
      }

      const status = this.instanceStatus.get(instanceId);
      if (status) {
        status.status = "destroyed";
        status.lastSeen = new Date();
      }

      this.emit("destroyed", { instanceId });
      console.log(`✅ Instância ${instanceId} destruída`);
    } catch (error) {
      console.error(`❌ Erro ao destruir instância ${instanceId}:`, error);
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
          console.log(`⚠️ Erro ao destruir cliente ${instanceId}:`, error);
        }
        this.instances.delete(instanceId);
      }

      this.instanceStatus.delete(instanceId);
    } catch (error) {
      console.error(`❌ Erro no cleanup ${instanceId}:`, error);
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
      console.log("🔄 Inicializando instâncias existentes...");

      const sessionDirs = await fs.readdir(this.sessionsPath);
      const instanceDirs = sessionDirs.filter((dir) =>
        dir.startsWith("session-"),
      );

      console.log(`📂 Encontradas ${instanceDirs.length} sessões existentes`);

      for (const sessionDir of instanceDirs) {
        const instanceId = sessionDir.replace("session-", "");
        try {
          console.log(`🔄 Restaurando instância: ${instanceId}`);
          await this.createInstance(instanceId);
        } catch (error) {
          console.error(`❌ Falha ao restaurar ${instanceId}:`, error);
        }
      }
    } catch (error) {
      console.error("❌ Erro ao inicializar instâncias existentes:", error);
    }
  }

  async cleanup() {
    console.log("🧹 Limpando WhatsApp Service...");

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
