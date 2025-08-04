import { enhancedLogger } from '../config/enhanced-logger';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream, createReadStream } from 'fs';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { BaseService } from './BaseService';

export interface BackupConfig {
  enabled: boolean;
  schedule: string; // cron format
  retention: {
    daily: number; // dias
    weekly: number; // semanas
    monthly: number; // meses
  };
  compression: boolean;
  storage: {
    local: {
      enabled: boolean;
      path: string;
    };
    cloud?: {
      enabled: boolean;
      provider: 'aws' | 'azure' | 'gcp';
      bucket: string;
      credentials?: any;
    };
  };
  encryption?: {
    enabled: boolean;
    algorithm: string;
    key?: string;
  };
}

export interface BackupMetadata {
  id: string;
  timestamp: Date;
  type: 'full' | 'incremental' | 'differential';
  size: number;
  files: string[];
  checksum: string;
  compression: boolean;
  encrypted: boolean;
  tags?: Record<string, string>;
}

export interface RestoreOptions {
  backupId: string;
  targetPath?: string;
  overwrite?: boolean;
  selectiveRestore?: string[];
  dryRun?: boolean;
}

export class BackupService extends BaseService {
  private config: BackupConfig;
  private backupHistory: Map<string, BackupMetadata> = new Map();
  private isBackupRunning = false;

  constructor(config: BackupConfig) {
    super();
    this.config = config;
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Criar diretórios necessários
      await this.ensureDirectories();

      // Carregar histórico de backups
      await this.loadBackupHistory();

      // Configurar agendamento automático
      if (this.config.enabled && this.config.schedule) {
        await this.setupScheduledBackups();
      }

      this.logger.info('BackupService inicializado com sucesso', {
        config: {
          enabled: this.config.enabled,
          schedule: this.config.schedule,
          storage: Object.keys(this.config.storage),
        },
      });
    } catch (error) {
      this.logger.error('Erro ao inicializar BackupService', { error });
      throw error;
    }
  }

  private async ensureDirectories(): Promise<void> {
    const directories = [
      this.config.storage.local.path,
      path.join(this.config.storage.local.path, 'metadata'),
      path.join(this.config.storage.local.path, 'temp'),
    ];

    for (const dir of directories) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
        this.logger.info(`Diretório criado: ${dir}`);
      }
    }
  }

  private async loadBackupHistory(): Promise<void> {
    try {
      const metadataDir = path.join(this.config.storage.local.path, 'metadata');
      const files = await fs.readdir(metadataDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(metadataDir, file), 'utf8');
          const metadata: BackupMetadata = JSON.parse(content);
          this.backupHistory.set(metadata.id, metadata);
        }
      }

      this.logger.info(`Carregados ${this.backupHistory.size} backups do histórico`);
    } catch (error) {
      this.logger.warn('Erro ao carregar histórico de backups', { error });
    }
  }

  private async setupScheduledBackups(): Promise<void> {
    // Implementação de agendamento com node-cron seria aqui
    this.logger.info('Agendamento de backups configurado', {
      schedule: this.config.schedule,
    });
  }

  async createBackup(
    sources: string[],
    type: 'full' | 'incremental' | 'differential' = 'full',
    tags?: Record<string, string>
  ): Promise<BackupMetadata> {
    if (this.isBackupRunning) {
      throw new Error('Backup já está em execução');
    }

    this.isBackupRunning = true;
    const backupId = `backup_${Date.now()}_${type}`;
    const timestamp = new Date();

    try {
      this.logger.info('Iniciando backup', { backupId, type, sources });

      // Validar fontes
      await this.validateSources(sources);

      // Criar backup
      const backupPath = await this.createBackupArchive(backupId, sources, type);

      // Calcular checksum
      const checksum = await this.calculateChecksum(backupPath);

      // Obter tamanho do arquivo
      const stats = await fs.stat(backupPath);

      // Criar metadata
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp,
        type,
        size: stats.size,
        files: sources,
        checksum,
        compression: this.config.compression,
        encrypted: this.config.encryption?.enabled || false,
        ...(tags && { tags }),
      };

      // Salvar metadata
      await this.saveBackupMetadata(metadata);

      // Adicionar ao histórico
      this.backupHistory.set(backupId, metadata);

      // Upload para cloud se configurado
      if (this.config.storage.cloud?.enabled) {
        await this.uploadToCloud(backupPath, metadata);
      }

      // Limpeza de backups antigos
      await this.cleanupOldBackups();

      this.logger.info('Backup criado com sucesso', {
        backupId,
        size: metadata.size,
        files: metadata.files.length,
      });

      return metadata;
    } catch (error) {
      this.logger.error('Erro ao criar backup', { backupId, error });
      throw error;
    } finally {
      this.isBackupRunning = false;
    }
  }

  private async validateSources(sources: string[]): Promise<void> {
    for (const source of sources) {
      try {
        await fs.access(source);
      } catch {
        throw new Error(`Fonte não encontrada: ${source}`);
      }
    }
  }

  private async createBackupArchive(
    backupId: string,
    sources: string[],
    type: string
  ): Promise<string> {
    const backupPath = path.join(
      this.config.storage.local.path,
      `${backupId}.tar${this.config.compression ? '.gz' : ''}`
    );

    // Implementação simplificada - em produção usaria tar/zip libraries
    const backupData: {
      id: string;
      type: string;
      timestamp: Date;
      sources: string[];
      data: Record<string, string>;
    } = {
      id: backupId,
      type,
      timestamp: new Date(),
      sources,
      data: {},
    };

    // Coletar dados dos arquivos
    for (const source of sources) {
      try {
        const stats = await fs.stat(source);
        if (stats.isFile()) {
          const content = await fs.readFile(source, 'utf8');
          backupData.data[source] = content;
        } else if (stats.isDirectory()) {
          // Recursivamente adicionar arquivos do diretório
          await this.addDirectoryToBackup(source, backupData.data);
        }
      } catch (error) {
        this.logger.warn(`Erro ao adicionar ${source} ao backup`, { error });
      }
    }

    // Salvar backup
    const jsonData = JSON.stringify(backupData, null, 2);

    if (this.config.compression) {
      // Comprimir com gzip
      const writeStream = createWriteStream(backupPath);
      const gzipStream = createGzip();

      await pipeline(Buffer.from(jsonData), gzipStream, writeStream);
    } else {
      await fs.writeFile(backupPath, jsonData, 'utf8');
    }

    return backupPath;
  }

  private async addDirectoryToBackup(
    dirPath: string,
    data: Record<string, any>,
    basePath: string = dirPath
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(basePath, fullPath);

        if (entry.isFile()) {
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            data[relativePath] = content;
          } catch (error) {
            // Pular arquivos que não podem ser lidos como texto
            this.logger.debug(`Pulando arquivo binário: ${fullPath}`, { error });
          }
        } else if (entry.isDirectory()) {
          await this.addDirectoryToBackup(fullPath, data, basePath);
        }
      }
    } catch (error) {
      this.logger.warn(`Erro ao processar diretório ${dirPath}`, { error });
    }
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    const { createHash } = await import('crypto');
    const hash = createHash('sha256');

    const stream = createReadStream(filePath);

    return new Promise((resolve, reject) => {
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    const metadataPath = path.join(
      this.config.storage.local.path,
      'metadata',
      `${metadata.id}.json`
    );

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  private async uploadToCloud(backupPath: string, metadata: BackupMetadata): Promise<void> {
    // Implementação de upload para cloud seria aqui
    this.logger.info('Upload para cloud não implementado ainda', {
      backupId: metadata.id,
      provider: this.config.storage.cloud?.provider,
    });
  }

  async restoreBackup(options: RestoreOptions): Promise<void> {
    const metadata = this.backupHistory.get(options.backupId);
    if (!metadata) {
      throw new Error(`Backup não encontrado: ${options.backupId}`);
    }

    this.logger.info('Iniciando restauração', { options });

    try {
      // Validar opções
      await this.validateRestoreOptions(options, metadata);

      if (options.dryRun) {
        this.logger.info('Dry run - simulando restauração', { options });
        return;
      }

      // Carregar backup
      const backupData = await this.loadBackupData(metadata);

      // Restaurar arquivos
      await this.restoreFiles(backupData, options);

      this.logger.info('Restauração concluída com sucesso', {
        backupId: options.backupId,
      });
    } catch (error) {
      this.logger.error('Erro na restauração', { options, error });
      throw error;
    }
  }

  private async validateRestoreOptions(
    options: RestoreOptions,
    metadata: BackupMetadata
  ): Promise<void> {
    // Validar se o target path existe
    if (options.targetPath) {
      try {
        await fs.access(path.dirname(options.targetPath));
      } catch {
        throw new Error(`Diretório de destino não existe: ${path.dirname(options.targetPath)}`);
      }
    }

    // Validar arquivos seletivos
    if (options.selectiveRestore) {
      for (const file of options.selectiveRestore) {
        if (!metadata.files.includes(file)) {
          throw new Error(`Arquivo não encontrado no backup: ${file}`);
        }
      }
    }
  }

  private async loadBackupData(metadata: BackupMetadata): Promise<any> {
    const backupPath = path.join(
      this.config.storage.local.path,
      `${metadata.id}.tar${metadata.compression ? '.gz' : ''}`
    );

    let content: string;

    if (metadata.compression) {
      // Descomprimir
      const readStream = createReadStream(backupPath);
      const gunzipStream = createGunzip();

      const chunks: Buffer[] = [];

      await pipeline(readStream, gunzipStream, async function* (source) {
        for await (const chunk of source) {
          chunks.push(chunk);
          yield chunk;
        }
      });

      content = Buffer.concat(chunks).toString('utf8');
    } else {
      content = await fs.readFile(backupPath, 'utf8');
    }

    return JSON.parse(content);
  }

  private async restoreFiles(backupData: any, options: RestoreOptions): Promise<void> {
    const targetPath = options.targetPath || process.cwd();
    const filesToRestore = options.selectiveRestore || Object.keys(backupData.data);

    for (const filePath of filesToRestore) {
      const content = backupData.data[filePath];
      if (!content) continue;

      const fullTargetPath = path.resolve(targetPath, filePath);

      // Verificar se arquivo já existe
      if (!options.overwrite) {
        try {
          await fs.access(fullTargetPath);
          this.logger.warn(`Arquivo já existe, pulando: ${fullTargetPath}`);
          continue;
        } catch {
          // Arquivo não existe, pode prosseguir
        }
      }

      // Criar diretório se necessário
      await fs.mkdir(path.dirname(fullTargetPath), { recursive: true });

      // Restaurar arquivo
      await fs.writeFile(fullTargetPath, content, 'utf8');

      this.logger.debug(`Arquivo restaurado: ${fullTargetPath}`);
    }
  }

  async listBackups(filters?: {
    type?: string;
    dateFrom?: Date;
    dateTo?: Date;
    tags?: Record<string, string>;
  }): Promise<BackupMetadata[]> {
    let backups = Array.from(this.backupHistory.values());

    if (filters) {
      if (filters.type) {
        backups = backups.filter(b => b.type === filters.type);
      }

      if (filters.dateFrom) {
        backups = backups.filter(b => b.timestamp >= filters.dateFrom!);
      }

      if (filters.dateTo) {
        backups = backups.filter(b => b.timestamp <= filters.dateTo!);
      }

      if (filters.tags) {
        backups = backups.filter(b => {
          if (!b.tags) return false;
          return Object.entries(filters.tags!).every(([key, value]) => b.tags![key] === value);
        });
      }
    }

    return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async deleteBackup(backupId: string): Promise<void> {
    const metadata = this.backupHistory.get(backupId);
    if (!metadata) {
      throw new Error(`Backup não encontrado: ${backupId}`);
    }

    try {
      // Remover arquivo de backup
      const backupPath = path.join(
        this.config.storage.local.path,
        `${metadata.id}.tar${metadata.compression ? '.gz' : ''}`
      );
      await fs.unlink(backupPath);

      // Remover metadata
      const metadataPath = path.join(
        this.config.storage.local.path,
        'metadata',
        `${metadata.id}.json`
      );
      await fs.unlink(metadataPath);

      // Remover do histórico
      this.backupHistory.delete(backupId);

      this.logger.info('Backup removido com sucesso', { backupId });
    } catch (error) {
      this.logger.error('Erro ao remover backup', { backupId, error });
      throw error;
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    const now = new Date();
    const backups = Array.from(this.backupHistory.values());

    for (const backup of backups) {
      const age = now.getTime() - backup.timestamp.getTime();
      const daysDiff = age / (1000 * 60 * 60 * 24);

      let shouldDelete = false;

      // Aplicar política de retenção
      if (backup.type === 'full') {
        if (daysDiff > this.config.retention.daily * 30) {
          shouldDelete = true;
        }
      } else if (backup.type === 'incremental') {
        if (daysDiff > this.config.retention.daily) {
          shouldDelete = true;
        }
      }

      if (shouldDelete) {
        try {
          await this.deleteBackup(backup.id);
          this.logger.info('Backup antigo removido automaticamente', {
            backupId: backup.id,
            age: Math.round(daysDiff),
          });
        } catch (error) {
          this.logger.warn('Erro ao remover backup antigo', {
            backupId: backup.id,
            error,
          });
        }
      }
    }
  }

  async getBackupStatus(): Promise<{
    isRunning: boolean;
    lastBackup?: BackupMetadata;
    nextScheduled?: Date;
    totalBackups: number;
    totalSize: number;
  }> {
    const backups = Array.from(this.backupHistory.values());
    const lastBackup = backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);

    return {
      isRunning: this.isBackupRunning,
      ...(lastBackup && { lastBackup }),
      totalBackups: backups.length,
      totalSize,
    };
  }

  async verifyBackup(backupId: string): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const metadata = this.backupHistory.get(backupId);
    if (!metadata) {
      return {
        valid: false,
        issues: [`Backup não encontrado: ${backupId}`],
      };
    }

    const issues: string[] = [];

    try {
      // Verificar se arquivo existe
      const backupPath = path.join(
        this.config.storage.local.path,
        `${metadata.id}.tar${metadata.compression ? '.gz' : ''}`
      );

      await fs.access(backupPath);

      // Verificar checksum
      const currentChecksum = await this.calculateChecksum(backupPath);
      if (currentChecksum !== metadata.checksum) {
        issues.push('Checksum não confere - arquivo pode estar corrompido');
      }

      // Verificar se pode ser carregado
      try {
        await this.loadBackupData(metadata);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        issues.push(`Erro ao carregar backup: ${errorMessage}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      issues.push(`Arquivo de backup não encontrado: ${errorMessage}`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
