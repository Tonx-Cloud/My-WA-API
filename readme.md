# My-WA-API

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/Tonx-Cloud/My-WA-API)
[![Version](https://img.shields.io/badge/version-2.1.0-blue)](https://github.com/Tonx-Cloud/My-WA-API)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)

Uma API RESTful completa e multi-instância para integrar e automatizar o WhatsApp, construída com Node.js, TypeScript e Express.

## 🌟 Características Principais

- **Multi-instância**: Gerencie múltiplas sessões WhatsApp simultaneamente
- **API RESTful**: Interface padronizada para envio e recebimento de mensagens
- **TypeScript**: Código totalmente tipado para maior segurança e manutenibilidade
- **Monitoramento**: Sistema completo de health checks e métricas
- **Docker**: Containerização completa para fácil deploy
- **WebSocket**: Comunicação em tempo real para eventos
- **Logging Estruturado**: Sistema avançado de logs para debugging
- **Cache Redis**: Performance otimizada com cache em memória
- **Dashboard Web**: Interface gráfica para gerenciamento

## 📋 Pré-requisitos

- **Node.js** >= 20.0.0
- **npm** >= 9.0.0
- **Docker** >= 24.0.0 (opcional, para containerização)
- **Redis** >= 6.0.0 (para cache)
- **PostgreSQL** >= 14.0 (para persistência)

## 🚀 Instalação Rápida

### 1. Clone o repositório
```bash
git clone https://github.com/Tonx-Cloud/My-WA-API.git
cd My-WA-API
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 4. Execute o projeto
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm run start
```

## 🐳 Docker (Recomendado)

```bash
# Desenvolvimento
docker-compose -f config/docker-compose.yml up -d

# Produção
docker-compose -f config/docker-compose.production.yml up -d
```

## 📁 Estrutura do Projeto

```
My-WA-API/
├── apps/
│   ├── api/                 # Backend API
│   │   ├── src/
│   │   │   ├── controllers/ # Controladores REST
│   │   │   ├── services/    # Lógica de negócio
│   │   │   ├── routes/      # Definição de rotas
│   │   │   ├── middleware/  # Middlewares personalizados
│   │   │   └── types/       # Tipos TypeScript
│   │   └── package.json
│   └── web/                 # Dashboard Frontend
│       ├── src/
│       │   ├── components/  # Componentes React
│       │   ├── pages/       # Páginas da aplicação
│       │   └── utils/       # Utilitários
│       └── package.json
├── packages/
│   └── shared/              # Código compartilhado
├── docker/                  # Configurações Docker
├── monitoring/              # Stack de monitoramento
├── scripts/                 # Scripts de automação
└── docs/                    # Documentação
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
# Aplicação
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001

# Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_db
REDIS_URL=redis://localhost:6379

# WhatsApp
WA_SESSION_PATH=./sessions
WA_AUTO_RESTART=true

# Segurança
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:3000

# Monitoramento
ENABLE_METRICS=true
LOG_LEVEL=info
```

## 🏃‍♂️ Executando a Aplicação

### Desenvolvimento

```bash
# Inicia todos os serviços em modo desenvolvimento
npm run dev

# Apenas a API
npm run dev:api

# Apenas o frontend
npm run dev:web
```

### Produção

```bash
# Build da aplicação
npm run build

# Inicia em produção
npm run start

# Com PM2 (recomendado)
npm install -g pm2
pm2 start ecosystem.config.json
```

## 🧪 Executando Testes

```bash
# Todos os testes
npm test

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes com cobertura
npm run test:coverage

# Testes de performance
npm run test:performance
```

## 📊 API Endpoints

### Health Check
- `GET /health` - Status geral da aplicação
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

### Instâncias WhatsApp
- `POST /instances` - Criar nova instância
- `GET /instances` - Listar instâncias
- `GET /instances/:id` - Detalhes da instância
- `DELETE /instances/:id` - Remover instância

### Mensagens
- `POST /instances/:id/send` - Enviar mensagem
- `GET /instances/:id/messages` - Histórico de mensagens
- `POST /instances/:id/media` - Enviar mídia

### WebSocket Events
- `connection` - Nova conexão estabelecida
- `qr` - QR Code para autenticação
- `ready` - Instância pronta
- `message` - Nova mensagem recebida

## 🎛️ Dashboard

Acesse o dashboard em `http://localhost:3000` para:

- ✅ Gerenciar instâncias WhatsApp
- 📊 Visualizar métricas em tempo real
- 📱 Gerar QR Codes para autenticação
- 💬 Enviar mensagens em massa
- 📈 Monitorar performance

## 🔍 Monitoramento

### Métricas Disponíveis
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3000`
- **Health Checks**: `http://localhost:3001/health`

### Logs
```bash
# Logs da aplicação
docker-compose logs -f api

# Logs estruturados
tail -f logs/combined.log

# Logs de performance
tail -f logs/performance.log
```

## 🛠️ Scripts Úteis

```bash
# Limpeza completa
npm run clean

# Verificação de tipos
npm run typecheck

# Formatação de código
npm run format

# Lint
npm run lint

# Backup do banco
npm run backup

# Restart do sistema
npm run restart-system
```

## 🔒 Segurança

- **Autenticação JWT** para proteção das rotas
- **Rate Limiting** para prevenção de abuso
- **CORS** configurado adequadamente
- **Validação de entrada** com schemas Zod
- **Headers de segurança** implementados

## 🚀 Deploy

### Docker Compose (Recomendado)
```bash
docker-compose -f docker-compose.production.yml up -d
```

### Manual
```bash
npm run build
npm run start
```

### Cloud Providers
- Configurações para AWS, Azure e GCP disponíveis em `/deploy`

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📚 Documentação

- [Guia de Configuração](./docs/SETUP_GUIDE.md)
- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOY.md)
- [Testing Guide](./TESTING.md)

## 📄 Tecnologias Utilizadas

- **Backend**: Node.js, TypeScript, Express.js
- **Frontend**: Next.js, React, TailwindCSS
- **Banco de Dados**: PostgreSQL, Redis
- **Testes**: Jest, Supertest
- **Monitoramento**: Prometheus, Grafana
- **Containerização**: Docker, Docker Compose
- **Build**: Turbo (Monorepo)

## 📈 Roadmap

- [ ] Sistema de templates de mensagem
- [ ] Integração com CRM populares
- [ ] Chatbot com IA
- [ ] Analytics avançados
- [ ] API webhooks
- [ ] Multi-tenancy

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/Tonx-Cloud/My-WA-API/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Tonx-Cloud/My-WA-API/discussions)
- **Email**: support@my-wa-api.com

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para detalhes.

---

**Desenvolvido com ❤️ pela equipe My-WA-API**