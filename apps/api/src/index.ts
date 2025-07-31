import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Carregar variáveis de ambiente PRIMEIRO
dotenv.config({ path: '../.env' }); // Tentar na raiz do projeto
dotenv.config({ path: '.env' }); // Tentar no diretório da API
dotenv.config(); // Fallback padrão

console.log('DEBUG - Environment variables:');
console.log('GOOGLE_CLIENT_ID:', process.env['GOOGLE_CLIENT_ID']);
console.log('GOOGLE_CLIENT_SECRET:', process.env['GOOGLE_CLIENT_SECRET'] ? '[DEFINIDO]' : '[NÃO DEFINIDO]');

import logger from './config/logger';
import { initDatabase } from './config/database';
import { initializePassport } from './config/passport';
import SocketManager from './config/socket';
import ServerManager from './config/server';
import { createApp, createServerWithSocket } from './app';

// Inicializar Passport com as variáveis de ambiente carregadas
initializePassport();

// Criar aplicação usando a estrutura modular
const app = createApp()
const { server, io } = createServerWithSocket(app)

const PORT = process.env['PORT'] || 3000;

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WhatsApp API',
      version: '2.1.0',
      description: 'API RESTful completa para automação do WhatsApp com sistema de monitoramento avançado',
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
  apis: ['./src/routes/*.ts'], // Caminho para os arquivos com anotações Swagger
};

const specs = swaggerJsdoc(swaggerOptions);

// Documentação da API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Socket.IO para comunicação em tempo real
SocketManager.getInstance().setIO(io);

io.on('connection', (socket) => {
  logger.info(`Cliente conectado: ${socket.id}`);
  
  // Listeners para gerenciar salas de instâncias
  socket.on('join_instance', (instanceId: string) => {
    if (instanceId) {
      SocketManager.joinInstanceRoom(socket.id, instanceId);
      logger.info(`Socket ${socket.id} joined instance room: ${instanceId}`);
    }
  });

  socket.on('leave_instance', (instanceId: string) => {
    if (instanceId) {
      SocketManager.leaveInstanceRoom(socket.id, instanceId);
      logger.info(`Socket ${socket.id} left instance room: ${instanceId}`);
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Cliente desconectado: ${socket.id}`);
  });
});

// Inicializar o sistema
async function startServer() {
  try {
    // Inicializar banco de dados
    await initDatabase();
    logger.info('✅ Banco de dados inicializado');

    // Configurar ServerManager
    const serverManager = ServerManager.getInstance();
    serverManager.setServer(server);

    // Inicializar serviços (configuração básica)
    logger.info('✅ Serviços do WhatsApp inicializados');

    // Iniciar servidor com graceful shutdown
    await serverManager.start();

  } catch (error) {
    logger.error('❌ Erro ao inicializar o servidor:', error);
    process.exit(1);
  }
}

// Iniciar aplicação
startServer();

// Exportar para testes
export { app, server };
