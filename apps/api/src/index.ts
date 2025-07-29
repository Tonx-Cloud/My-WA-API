import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import session from 'express-session';

// Carregar variáveis de ambiente PRIMEIRO
dotenv.config({ path: '../.env' }); // Tentar na raiz do projeto
dotenv.config({ path: '.env' }); // Tentar no diretório da API
dotenv.config(); // Fallback padrão

console.log('DEBUG - Environment variables:');
console.log('GOOGLE_CLIENT_ID:', process.env['GOOGLE_CLIENT_ID']);
console.log('GOOGLE_CLIENT_SECRET:', process.env['GOOGLE_CLIENT_SECRET'] ? '[DEFINIDO]' : '[NÃO DEFINIDO]');

import logger from './config/logger';
import { initDatabase } from './config/database';
import passport, { initializePassport } from './config/passport'; // Importar passport e função de inicialização
import SocketManager from './config/socket';
import WhatsAppService from './services/WhatsAppService';
import { whatsappServiceNew } from './services/WhatsAppServiceNew';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth';
import nextauthRoutes from './routes/nextauth';
import instanceRoutes from './routes/instances';
import instanceNewRoutes from './routes/instances-new';
import messageRoutes from './routes/messages';
import webhookRoutes from './routes/webhooks';
import testRoutes from './routes/test';

// Inicializar Passport com as variáveis de ambiente carregadas
initializePassport();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env['FRONTEND_URL'] || "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env['PORT'] || 3000;

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My-wa-API',
      version: '2.0.0',
      description: 'API RESTful para automação WhatsApp multi-instância',
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

// Middlewares globais
app.use(helmet());
app.use(cors({
  origin: process.env['FRONTEND_URL'] || "http://localhost:3001",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Configuração de sessão
app.use(session({
  secret: process.env['SESSION_SECRET'] || 'fallback-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env['NODE_ENV'] === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(rateLimiter);

// Documentação da API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/nextauth', nextauthRoutes);
app.use('/api/instances', instanceRoutes);
app.use('/api/instances-v2', instanceNewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/test', testRoutes);

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

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

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

// Função para inicializar o servidor
async function startServer() {
  try {
    // Inicializar banco de dados
    await initDatabase();
    logger.info('✅ Banco de dados inicializado');

    // Inicializar instâncias existentes do WhatsApp (serviço legado)
    await WhatsAppService.initializeExistingInstances();
    logger.info('✅ Instâncias do WhatsApp (legado) inicializadas');

    // Iniciar servidor primeiro
    server.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`📚 Documentação disponível em http://localhost:${PORT}/api-docs`);
      logger.info(`🌐 Frontend disponível em ${process.env['FRONTEND_URL']}`);
    });

    // Inicializar instâncias existentes do WhatsApp (novo serviço) em background
    whatsappServiceNew.initializeExistingInstances()
      .then(() => {
        logger.info('✅ Instâncias do WhatsApp (v2) inicializadas');
      })
      .catch((error) => {
        logger.error('❌ Erro ao inicializar WhatsApp (v2):', error);
      });
  } catch (error) {
    logger.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

// Inicializar servidor
startServer();

export { io };
export default app;
