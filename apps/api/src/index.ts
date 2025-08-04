﻿import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Carregar variÃ¡veis de ambiente PRIMEIRO
dotenv.config({ path: '../.env' }); // Tentar na raiz do projeto
dotenv.config({ path: '.env' }); // Tentar no diretÃ³rio da API
dotenv.config(); // Fallback padrÃ£o

// Import enhanced services and middleware
import { logger } from './services/LoggerService';
import { healthService } from './services/HealthService';
import { performanceService } from './services/PerformanceService';
import { cacheService } from './services/CacheService';
import { alertingService } from './services/AlertingService';
import correlationIdMiddleware from './middleware/correlationId';

console.log('DEBUG - Environment variables:');
console.log('GOOGLE_CLIENT_ID:', process.env['GOOGLE_CLIENT_ID']);
console.log(
  'GOOGLE_CLIENT_SECRET:',
  process.env['GOOGLE_CLIENT_SECRET'] ? '[DEFINIDO]' : '[NÃƒO DEFINIDO]'
);

import legacyLogger from './config/logger';
import { initDatabase } from './config/database';
import { initializePassport } from './config/passport';
import SocketManager from './config/socket';
import ServerManager from './config/server';
import { createApp, createServerWithSocket } from './app';

// Inicializar Passport com as variÃ¡veis de ambiente carregadas
initializePassport();

// Inicializar serviÃ§os avanÃ§ados
logger.startup('Initializing enhanced services...', {
  environment: process.env.NODE_ENV || 'development',
  nodeVersion: process.version,
});

// Criar aplicaÃ§Ã£o usando a estrutura modular
const app = createApp();

// Adicionar middleware de correlation ID globalmente
app.use(correlationIdMiddleware);

// Adicionar middleware de performance monitoring
app.use(performanceService.expressMiddleware());

const { server, io } = createServerWithSocket(app);

const PORT = process.env['PORT'] || 3000;

// ConfiguraÃ§Ã£o do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WhatsApp API',
      version: '2.1.0',
      description:
        'API RESTful completa para automaÃ§Ã£o do WhatsApp com sistema de monitoramento avanÃ§ado',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor de desenvolvimento',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Caminho para os arquivos com anotaÃ§Ãµes Swagger
};

const specs = swaggerJsdoc(swaggerOptions);

// DocumentaÃ§Ã£o da API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Socket.IO para comunicaÃ§Ã£o em tempo real
SocketManager.getInstance().setIO(io);

io.on('connection', socket => {
  logger.info(`Cliente conectado: ${socket.id}`, {
    operation: 'socket-connection',
    metadata: { socketId: socket.id },
  });

  // Listeners para gerenciar salas de instÃ¢ncias
  socket.on('join_instance', (instanceId: string) => {
    if (instanceId) {
      SocketManager.joinInstanceRoom(socket.id, instanceId);
      logger.info(`Socket ${socket.id} joined instance room: ${instanceId}`, {
        operation: 'socket-join-instance',
        instanceId,
        metadata: { socketId: socket.id },
      });
    }
  });

  socket.on('leave_instance', (instanceId: string) => {
    if (instanceId) {
      SocketManager.leaveInstanceRoom(socket.id, instanceId);
      logger.info(`Socket ${socket.id} left instance room: ${instanceId}`, {
        operation: 'socket-leave-instance',
        instanceId,
        metadata: { socketId: socket.id },
      });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Cliente desconectado: ${socket.id}`, {
      operation: 'socket-disconnect',
      metadata: { socketId: socket.id },
    });
  });
});

// Inicializar o sistema
async function startServer() {
  try {
    // Inicializar banco de dados
    await initDatabase();
    logger.info('âœ… Banco de dados inicializado', {
      operation: 'database-init',
    });

    // Inicializar serviÃ§os avanÃ§ados
    logger.info('âœ… ServiÃ§os avanÃ§ados inicializados', {
      operation: 'services-init',
      metadata: {
        cacheEnabled: true,
        performanceMonitoring: true,
        structuredLogging: true,
        healthChecks: true,
        alertingSystem: true,
      },
    });

    // Configurar ServerManager
    const serverManager = ServerManager.getInstance();
    serverManager.setServer(server);

    // Inicializar serviÃ§os (configuraÃ§Ã£o bÃ¡sica)
    logger.info('âœ… ServiÃ§os do WhatsApp inicializados', {
      operation: 'whatsapp-init',
    });

    // Realizar health check inicial
    const healthResult = await healthService.performHealthCheck();
    if (healthResult.success) {
      logger.info('âœ… Health check inicial passou', {
        operation: 'initial-health-check',
        metadata: { status: healthResult.data!.status },
      });
    } else {
      logger.warn('âš ï¸ Health check inicial falhou', {
        operation: 'initial-health-check',
        metadata: { error: healthResult.error },
      });
    }

    // Iniciar servidor com graceful shutdown
    await serverManager.start();

    logger.startup('ðŸš€ Servidor iniciado com sucesso', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      features: {
        correlationTracking: true,
        performanceMonitoring: true,
        structuredLogging: true,
        healthChecks: true,
        caching: true,
      },
    });
  } catch (error) {
    logger.error('âŒ Erro ao inicializar o servidor', error instanceof Error ? error : undefined, {
      operation: 'server-startup',
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
    });
    process.exit(1);
  }
}

// Iniciar aplicaÃ§Ã£o
startServer();

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  logger.shutdown('Received SIGTERM signal, shutting down gracefully...', {
    signal: 'SIGTERM',
  });

  try {
    // Flush logs before shutdown
    await logger.flush();

    // Additional cleanup could go here
    // - Close database connections
    // - Stop background processes
    // - Clean up cache

    // Parar serviÃ§o de alertas
    alertingService.stop();
    logger.info('âœ… Alerting service stopped');

    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', error instanceof Error ? error : undefined);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.shutdown('Received SIGINT signal, shutting down gracefully...', {
    signal: 'SIGINT',
  });

  try {
    // Parar serviÃ§o de alertas
    alertingService.stop();

    await logger.flush();
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', error instanceof Error ? error : undefined);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  logger.error('Uncaught Exception', error, {
    operation: 'uncaught-exception',
    metadata: { fatal: true },
  });
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', reason => {
  logger.error('Unhandled Rejection', reason instanceof Error ? reason : undefined, {
    operation: 'unhandled-rejection',
    metadata: { reason: String(reason) },
  });
  process.exit(1);
});

// Exportar para testes
export { app, server };
