﻿# My-WA-API

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/Tonx-Cloud/My-WA-API)
[![Version](https://img.shields.io/badge/version-2.1.0-blue)](https://github.com/Tonx-Cloud/My-WA-API)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)

Uma API RESTful completa e multi-instÃ¢ncia para integrar e automatizar o WhatsApp, construÃ­da com Node.js, TypeScript e Express.

## ðŸŒŸ CaracterÃ­sticas Principais

- **Multi-instÃ¢ncia**: Gerencie mÃºltiplas sessÃµes WhatsApp simultaneamente
- **API RESTful**: Interface padronizada para envio e recebimento de mensagens
- **TypeScript**: CÃ³digo totalmente tipado para maior seguranÃ§a e manutenibilidade
- **Monitoramento**: Sistema completo de health checks e mÃ©tricas
- **Docker**: ContainerizaÃ§Ã£o completa para fÃ¡cil deploy
- **WebSocket**: ComunicaÃ§Ã£o em tempo real para eventos
- **Logging Estruturado**: Sistema avanÃ§ado de logs para debugging
- **Cache Redis**: Performance otimizada com cache em memÃ³ria
- **Dashboard Web**: Interface grÃ¡fica para gerenciamento

## ðŸ“‹ PrÃ©-requisitos

- **Node.js** >= 20.0.0
- **npm** >= 9.0.0
- **Docker** >= 24.0.0 (opcional, para containerizaÃ§Ã£o)
- **Redis** >= 6.0.0 (para cache)
- **PostgreSQL** >= 14.0 (para persistÃªncia)

## ðŸš€ InstalaÃ§Ã£o RÃ¡pida

### 1. Clone o repositÃ³rio

```bash
git clone https://github.com/Tonx-Cloud/My-WA-API.git
cd My-WA-API
```

### 2. Instale as dependÃªncias

```bash
npm install
```

### 3. Configure as variÃ¡veis de ambiente

```bash
cp .env.example .env
# Edite o arquivo .env com suas configuraÃ§Ãµes
```

### 4. Execute o projeto

```bash
# Desenvolvimento
npm run dev

# ProduÃ§Ã£o
npm run build
npm run start
```

## ðŸ³ Docker (Recomendado)

```bash
# Desenvolvimento
docker-compose -f config/docker-compose.yml up -d

# ProduÃ§Ã£o
docker-compose -f config/docker-compose.production.yml up -d
```

## ðŸ“ Estrutura do Projeto

```
My-WA-API/
â”œâ”€â”€ apps/
â”‚   â”œâ”€â”€ api/                 # Backend API
â”‚   â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”‚   â”œâ”€â”€ controllers/ # Controladores REST
â”‚   â”‚   â”‚   â”œâ”€â”€ services/    # LÃ³gica de negÃ³cio
â”‚   â”‚   â”‚   â”œâ”€â”€ routes/      # DefiniÃ§Ã£o de rotas
â”‚   â”‚   â”‚   â”œâ”€â”€ middleware/  # Middlewares personalizados
â”‚   â”‚   â”‚   â””â”€â”€ types/       # Tipos TypeScript
â”‚   â”‚   â””â”€â”€ package.json
â”‚   â””â”€â”€ web/                 # Dashboard Frontend
â”‚       â”œâ”€â”€ src/
â”‚       â”‚   â”œâ”€â”€ components/  # Componentes React
â”‚       â”‚   â”œâ”€â”€ pages/       # PÃ¡ginas da aplicaÃ§Ã£o
â”‚       â”‚   â””â”€â”€ utils/       # UtilitÃ¡rios
â”‚       â””â”€â”€ package.json
â”œâ”€â”€ packages/
â”‚   â””â”€â”€ shared/              # CÃ³digo compartilhado
â”œâ”€â”€ docker/                  # ConfiguraÃ§Ãµes Docker
â”œâ”€â”€ monitoring/              # Stack de monitoramento
â”œâ”€â”€ scripts/                 # Scripts de automaÃ§Ã£o
â””â”€â”€ docs/                    # DocumentaÃ§Ã£o
```

## ðŸ”§ ConfiguraÃ§Ã£o

### VariÃ¡veis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
# AplicaÃ§Ã£o
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001

# Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_db
REDIS_URL=redis://localhost:6379

# WhatsApp
WA_SESSION_PATH=./sessions
WA_AUTO_RESTART=true

# SeguranÃ§a
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:3000

# Monitoramento
ENABLE_METRICS=true
LOG_LEVEL=info
```

## ðŸƒâ€â™‚ï¸ Executando a AplicaÃ§Ã£o

### Desenvolvimento

```bash
# Inicia todos os serviÃ§os em modo desenvolvimento
npm run dev

# Apenas a API
npm run dev:api

# Apenas o frontend
npm run dev:web
```

### ProduÃ§Ã£o

```bash
# Build da aplicaÃ§Ã£o
npm run build

# Inicia em produÃ§Ã£o
npm run start

# Com PM2 (recomendado)
npm install -g pm2
pm2 start ecosystem.config.json
```

## ðŸ§ª Executando Testes

```bash
# Todos os testes
npm test

# Testes unitÃ¡rios
npm run test:unit

# Testes de integraÃ§Ã£o
npm run test:integration

# Testes com cobertura
npm run test:coverage

# Testes de performance
npm run test:performance
```

## ðŸ“Š API Endpoints

### Health Check

- `GET /health` - Status geral da aplicaÃ§Ã£o
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

### InstÃ¢ncias WhatsApp

- `POST /instances` - Criar nova instÃ¢ncia
- `GET /instances` - Listar instÃ¢ncias
- `GET /instances/:id` - Detalhes da instÃ¢ncia
- `DELETE /instances/:id` - Remover instÃ¢ncia

### Mensagens

- `POST /instances/:id/send` - Enviar mensagem
- `GET /instances/:id/messages` - HistÃ³rico de mensagens
- `POST /instances/:id/media` - Enviar mÃ­dia

### WebSocket Events

- `connection` - Nova conexÃ£o estabelecida
- `qr` - QR Code para autenticaÃ§Ã£o
- `ready` - InstÃ¢ncia pronta
- `message` - Nova mensagem recebida

## ðŸŽ›ï¸ Dashboard

Acesse o dashboard em `http://localhost:3000` para:

- âœ… Gerenciar instÃ¢ncias WhatsApp
- ðŸ“Š Visualizar mÃ©tricas em tempo real
- ðŸ“± Gerar QR Codes para autenticaÃ§Ã£o
- ðŸ’¬ Enviar mensagens em massa
- ðŸ“ˆ Monitorar performance

## ðŸ” Monitoramento

### MÃ©tricas DisponÃ­veis

- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3000`
- **Health Checks**: `http://localhost:3001/health`

### Logs

```bash
# Logs da aplicaÃ§Ã£o
docker-compose logs -f api

# Logs estruturados
tail -f logs/combined.log

# Logs de performance
tail -f logs/performance.log
```

## ðŸ› ï¸ Scripts Ãšteis

```bash
# Limpeza completa
npm run clean

# VerificaÃ§Ã£o de tipos
npm run typecheck

# FormataÃ§Ã£o de cÃ³digo
npm run format

# Lint
npm run lint

# Backup do banco
npm run backup

# Restart do sistema
npm run restart-system
```

## ðŸ”’ SeguranÃ§a

- **AutenticaÃ§Ã£o JWT** para proteÃ§Ã£o das rotas
- **Rate Limiting** para prevenÃ§Ã£o de abuso
- **CORS** configurado adequadamente
- **ValidaÃ§Ã£o de entrada** com schemas Zod
- **Headers de seguranÃ§a** implementados

## ðŸš€ Deploy

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

- ConfiguraÃ§Ãµes para AWS, Azure e GCP disponÃ­veis em `/deploy`

## ðŸ¤ Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanÃ§as (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## ðŸ“š DocumentaÃ§Ã£o

- [Guia de ConfiguraÃ§Ã£o](./docs/SETUP_GUIDE.md)
- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOY.md)
- [Testing Guide](./TESTING.md)

## ðŸ“„ Tecnologias Utilizadas

- **Backend**: Node.js, TypeScript, Express.js
- **Frontend**: Next.js, React, TailwindCSS
- **Banco de Dados**: PostgreSQL, Redis
- **Testes**: Jest, Supertest
- **Monitoramento**: Prometheus, Grafana
- **ContainerizaÃ§Ã£o**: Docker, Docker Compose
- **Build**: Turbo (Monorepo)

## ðŸ“ˆ Roadmap

- [ ] Sistema de templates de mensagem
- [ ] IntegraÃ§Ã£o com CRM populares
- [ ] Chatbot com IA
- [ ] Analytics avanÃ§ados
- [ ] API webhooks
- [ ] Multi-tenancy

## ðŸ“ž Suporte

- **Issues**: [GitHub Issues](https://github.com/Tonx-Cloud/My-WA-API/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Tonx-Cloud/My-WA-API/discussions)
- **Email**: support@my-wa-api.com

## ðŸ“„ LicenÃ§a

Este projeto estÃ¡ licenciado sob a licenÃ§a MIT. Veja o arquivo [LICENSE](./LICENSE) para detalhes.

---

**Desenvolvido com â¤ï¸ pela equipe My-WA-API**