import { Server } from 'http';
import { AddressInfo } from 'net';
import logger from './logger';

interface ServerConfig {
  port: number;
  host: string;
  environment: string;
  shutdownTimeout: number;
}

export class ServerManager {
  private static instance: ServerManager;
  private server: Server | null = null;
  private config: ServerConfig;
  private isShuttingDown = false;

  private constructor() {
    this.config = {
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || '0.0.0.0',
      environment: process.env.NODE_ENV || 'development',
      shutdownTimeout: parseInt(process.env.SHUTDOWN_TIMEOUT || '30000', 10),
    };
  }

  static getInstance(): ServerManager {
    if (!ServerManager.instance) {
      ServerManager.instance = new ServerManager();
    }
    return ServerManager.instance;
  }

  public setServer(server: Server): void {
    this.server = server;
    this.setupGracefulShutdown();
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        reject(new Error('Server não foi configurado. Use setServer() primeiro.'));
        return;
      }

      this.server.listen(this.config.port, this.config.host, () => {
        const address = this.server?.address() as AddressInfo;
        const actualPort = address?.port || this.config.port;

        logger.info('🚀 Servidor iniciado com sucesso!', {
          port: actualPort,
          host: this.config.host,
          environment: this.config.environment,
          pid: process.pid,
          nodeVersion: process.version,
          timestamp: new Date().toISOString(),
        });

        logger.info(`📚 Documentação disponível em http://localhost:${actualPort}/api-docs`);
        logger.info(`🌐 API disponível em http://localhost:${actualPort}/api`);
        logger.info(`💊 Health check em http://localhost:${actualPort}/health`);

        resolve();
      });

      this.server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`❌ Porta ${this.config.port} já está em uso`);
        } else if (error.code === 'EACCES') {
          logger.error(`❌ Sem permissão para usar a porta ${this.config.port}`);
        } else {
          logger.error('❌ Erro ao iniciar servidor:', error);
        }
        reject(error);
      });
    });
  }

  private setupGracefulShutdown(): void {
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach(signal => {
      process.on(signal, () => {
        if (this.isShuttingDown) {
          logger.warn(`${signal} recebido novamente, forçando saída...`);
          process.exit(1);
        }

        logger.info(`${signal} recebido, iniciando shutdown graceful...`);
        this.gracefulShutdown(signal);
      });
    });

    process.on('uncaughtException', error => {
      logger.error('❌ Exceção não tratada:', error);
      this.gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Promise rejeitada não tratada:', { reason, promise });
      this.gracefulShutdown('unhandledRejection');
    });
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    logger.info(`Iniciando shutdown graceful por ${signal}...`);

    const shutdownTimer = setTimeout(() => {
      logger.error(`❌ Timeout de ${this.config.shutdownTimeout}ms atingido, forçando saída`);
      process.exit(1);
    }, this.config.shutdownTimeout);

    try {
      // Fechar servidor HTTP
      if (this.server) {
        await new Promise<void>(resolve => {
          this.server!.close(error => {
            if (error) {
              logger.error('❌ Erro ao fechar servidor HTTP:', error);
            } else {
              logger.info('✅ Servidor HTTP fechado');
            }
            resolve();
          });
        });
      }

      // Aqui você pode adicionar cleanup de outros recursos:
      // - Fechar conexões de banco de dados
      // - Limpar cache Redis
      // - Finalizar workers
      // - Etc.

      clearTimeout(shutdownTimer);
      logger.info('✅ Shutdown graceful concluído');
      process.exit(0);
    } catch (error) {
      clearTimeout(shutdownTimer);
      logger.error('❌ Erro durante shutdown graceful:', error);
      process.exit(1);
    }
  }

  public getConfig(): ServerConfig {
    return { ...this.config };
  }

  public isRunning(): boolean {
    return this.server?.listening || false;
  }
}

export default ServerManager;
