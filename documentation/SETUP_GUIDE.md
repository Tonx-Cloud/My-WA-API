# ⚙️ Guia de Configuração - Dashboard WhatsApp

## 🎯 Configuração Completa do Ambiente

### 📋 Pré-requisitos

| Requisito   | Versão Mínima | Versão Recomendada | Link                                       |
| ----------- | ------------- | ------------------ | ------------------------------------------ |
| **Node.js** | 18.0.0        | 20.x.x LTS         | [Download](https://nodejs.org/)            |
| **NPM**     | 8.0.0         | 10.x.x             | Incluído com Node.js                       |
| **Git**     | 2.30.0        | Mais recente       | [Download](https://git-scm.com/)           |
| **VS Code** | 1.80.0        | Mais recente       | [Download](https://code.visualstudio.com/) |

### 🚀 Configuração Inicial

#### 1. Clone e Configuração Base

```bash
# Clone do repositório
git clone https://github.com/Tonx-Cloud/My-WA-API.git
cd My-WA-API

# Instalar dependências principais
npm install

# Instalar dependências dos workspaces
npm run install:all
```

#### 2. Configuração do Turbo (Monorepo)

```bash
# Verificar configuração do Turbo
npx turbo --version

# Build de todos os projetos
npx turbo build

# Desenvolvimento em paralelo
npx turbo dev
```

#### 3. Configuração do Docker (Opcional)

```bash
# Build das imagens
docker-compose build

# Subir ambiente completo
docker-compose up -d

# Verificar status
docker-compose ps
```

---

## 📁 Estrutura de Configuração

### 🔧 Arquivos de Configuração Principal

```
My-WA-API/
├── turbo.json              # Configuração do Turbo (monorepo)
├── package.json            # Dependências e scripts principais
├── docker-compose.yml      # Orquestração Docker
├── ecosystem.config.json   # Configuração PM2
└── pm2.config.json        # PM2 alternativo
```

### ⚛️ Configuração Next.js (Web)

```javascript
// apps/web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Socket.IO configuração
  async rewrites() {
    return [
      {
        source: '/socket.io/:path*',
        destination: 'http://localhost:3001/socket.io/:path*',
      },
    ];
  },

  // Headers CORS para desenvolvimento
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
        ],
      },
    ];
  },

  // Otimizações para desenvolvimento
  experimental: {
    serverComponentsExternalPackages: ['socket.io-client'],
  },

  // Configurações de build
  output: 'standalone',
  images: {
    domains: ['localhost', '127.0.0.1'],
  },
};

module.exports = nextConfig;
```

### 🎨 Configuração Tailwind CSS

```javascript
// apps/web/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Cores do WhatsApp
      colors: {
        whatsapp: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          green: '#25D366',
          'green-dark': '#075E54',
          'green-light': '#128C7E',
          teal: '#25D366',
          blue: '#34B7F1',
          gray: '#ECE5DD',
        },
      },

      // Animações customizadas
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },

      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
```

### 🔧 Configuração TypeScript

```json
// apps/web/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 🔌 Configuração Socket.IO

### 🖥️ Servidor (Backend API)

```typescript
// apps/api/src/config/socket.ts
import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB
});

// Middleware de autenticação
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (isValidToken(token)) {
    next();
  } else {
    next(new Error('Authentication error'));
  }
});

// Eventos principais
io.on('connection', socket => {
  console.log(`Cliente conectado: ${socket.id}`);

  // Join em salas de instância
  socket.on('join:instance', (instanceId: string) => {
    socket.join(`instance:${instanceId}`);
    socket.emit('joined:instance', instanceId);
  });

  // Leave de salas
  socket.on('leave:instance', (instanceId: string) => {
    socket.leave(`instance:${instanceId}`);
    socket.emit('left:instance', instanceId);
  });

  // Envio de mensagens
  socket.on('send:message', async (payload, callback) => {
    try {
      const result = await sendMessage(payload);
      callback({ success: true, data: result });

      // Broadcast para sala da instância
      io.to(`instance:${payload.instanceId}`).emit('message:sent', result);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

export { io, server };
```

### 🌐 Cliente (Frontend Next.js)

```typescript
// apps/web/src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: {
        token: this.getAuthToken(),
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: false,
      timeout: 20000,
    });

    this.setupEventListeners();
    return this.socket;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket conectado');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', reason => {
      console.log('Socket desconectado:', reason);

      if (reason === 'io server disconnect') {
        // Reconexão manual necessária
        this.reconnect();
      }
    });

    this.socket.on('connect_error', error => {
      console.error('Erro de conexão:', error);
      this.handleReconnection();
    });
  }

  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Backoff exponencial

      setTimeout(() => {
        this.socket?.connect();
      }, delay);
    }
  }

  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketManager = new SocketManager();
```

---

## 📊 Configuração de Logs

### 📝 Winston Logger (Backend)

```typescript
// apps/api/src/config/logger.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'whatsapp-api' },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),

    // File logs com rotação
    new DailyRotateFile({
      filename: 'logs/api-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      maxSize: '20m',
    }),

    // Error logs separados
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      maxSize: '20m',
    }),
  ],
});

export default logger;
```

### 🎯 Configuração PM2

```json
// ecosystem.config.json
{
  "apps": [
    {
      "name": "whatsapp-api",
      "script": "apps/api/dist/index.js",
      "cwd": "./",
      "instances": 1,
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3001
      },
      "env_development": {
        "NODE_ENV": "development",
        "PORT": 3001
      },
      "log_file": "logs/api.log",
      "error_file": "logs/api-error.log",
      "out_file": "logs/api-out.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
      "merge_logs": true,
      "max_memory_restart": "1G",
      "watch": false,
      "ignore_watch": ["node_modules", "logs", "sessions"],
      "restart_delay": 4000
    },
    {
      "name": "whatsapp-web",
      "script": "npm",
      "args": "start",
      "cwd": "apps/web",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3000
      },
      "log_file": "logs/web.log",
      "error_file": "logs/web-error.log",
      "out_file": "logs/web-out.log",
      "max_memory_restart": "512M"
    }
  ]
}
```

---

## 🔒 Configuração de Segurança

### 🛡️ Variáveis de Ambiente

```bash
# .env.local (Frontend)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_APP_ENV=development

# .env (Backend)
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# WhatsApp API
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_WEBHOOK_SECRET=your_webhook_secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_db

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Logs
LOG_LEVEL=debug
LOG_RETENTION_DAYS=30
```

### 🔐 Middleware de Segurança

```typescript
// apps/api/src/middleware/security.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

// Rate limiting
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: {
    error: 'Muitas requisições. Tente novamente em 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuração
export const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Helmet para headers de segurança
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
});
```

---

## 🧪 Configuração de Testes

### 🎯 Jest + Testing Library

```json
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}
```

### 🔧 Scripts de Desenvolvimento

```json
// package.json scripts
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "start": "turbo start",
    "test": "turbo test",
    "test:watch": "turbo test -- --watch",
    "test:coverage": "turbo test -- --coverage",
    "lint": "turbo lint",
    "lint:fix": "turbo lint -- --fix",
    "type-check": "turbo type-check",
    "clean": "turbo clean",
    "install:all": "npm install && npm run install:workspaces",
    "install:workspaces": "npm install --workspaces",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    "pm2:start": "pm2 start ecosystem.config.json",
    "pm2:stop": "pm2 stop ecosystem.config.json",
    "pm2:restart": "pm2 restart ecosystem.config.json",
    "pm2:logs": "pm2 logs"
  }
}
```

---

## 🚀 Comandos de Deploy

### 🐳 Docker Production

```bash
# Build para produção
docker-compose -f docker-compose.prod.yml build

# Deploy completo
docker-compose -f docker-compose.prod.yml up -d

# Verificar saúde dos containers
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

### 📦 PM2 Production

```bash
# Build de produção
npm run build

# Start com PM2
npm run pm2:start

# Monitoramento
npm run pm2:logs
pm2 monit

# Updates com zero-downtime
pm2 reload ecosystem.config.json
```

---

**⚙️ Esta configuração garante um ambiente robusto e escalável para desenvolvimento e produção.**

_Última atualização: 31 de Julho, 2025_
