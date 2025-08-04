﻿# My-wa-API v2.1 - Quick Start

## âœ… Projeto Modernizado com Sucesso!

Seu projeto My-wa-API foi totalmente refatorado e modernizado com:

- âœ… Testes automatizados (Jest + React Testing Library)
- âœ… CI/CD com GitHub Actions
- âœ… Monitoramento com Sentry
- âœ… ValidaÃ§Ã£o com Joi
- âœ… OtimizaÃ§Ã£o de imagens com Next.js Image
- âœ… Dependabot para atualizaÃ§Ãµes automÃ¡ticas
- âœ… AnÃ¡lise de cÃ³digo com ESLint + Prettier

## ðŸš€ InÃ­cio RÃ¡pido

### ðŸ›  Comandos de Desenvolvimento

```bash
# InstalaÃ§Ã£o inicial
npm install

# Iniciar em modo desenvolvimento (ambos os serviÃ§os)
npm run dev

# Iniciar serviÃ§os separadamente
npm run dev:api   # API na porta 3000
npm run dev:web   # Frontend na porta 3001

# Build para produÃ§Ã£o
npm run build

# Iniciar em produÃ§Ã£o
npm start
```

### ðŸ§ª Testes e Qualidade

```bash
# Executar todos os testes
npm test

# Testes especÃ­ficos
npm run test:api      # Testes da API
npm run test:web      # Testes do frontend
npm run test:coverage # Com coverage

# AnÃ¡lise de cÃ³digo
npm run lint          # ESLint
npm run format        # Prettier
npm run typecheck     # TypeScript
```

### ðŸš€ Acessos do Sistema

- **Frontend (Dashboard):** http://localhost:3001
- **API Backend:** http://localhost:3000
- **Health Check:** http://localhost:3000/health
- **Socket.IO:** ws://localhost:3000

### ðŸ“¦ Docker & ProduÃ§Ã£o

```bash
# Desenvolvimento com Docker
docker-compose up -d

# Build de imagens para produÃ§Ã£o
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose logs -f

# Parar serviÃ§os
docker-compose down
```

### ðŸ›¡ï¸ SeguranÃ§a e ValidaÃ§Ã£o

O projeto agora inclui:

- **ValidaÃ§Ã£o Joi**: Schemas para todos os endpoints
- **Rate Limiting**: ProteÃ§Ã£o contra spam
- **SanitizaÃ§Ã£o**: ProteÃ§Ã£o XSS e SQL injection
- **Monitoring**: Sentry para tracking de erros

### ï¿½ ConfiguraÃ§Ã£o do Ambiente

```bash
# API (.env)
cp apps/api/.env.example apps/api/.env

# Frontend (.env.local)
cp apps/web/.env.local.example apps/web/.env.local
```

**VariÃ¡veis principais:**

```env
# API
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
SENTRY_DSN=your-sentry-dsn

# Web
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### ï¿½ðŸ”‘ Credenciais PadrÃ£o

- **Username:** admin
- **Password:** admin123

### ðŸ“š Estrutura Modernizada

```
my-wa-api/
â”œâ”€â”€ .github/workflows/     # CI/CD pipelines
â”œâ”€â”€ apps/
â”‚   â”œâ”€â”€ api/              # Backend + testes + Sentry
â”‚   â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”‚   â”œâ”€â”€ validation/  # Schemas Joi
â”‚   â”‚   â”‚   â””â”€â”€ middleware/  # ValidaÃ§Ã£o + Rate limiting
â”‚   â”‚   â””â”€â”€ tests/          # Testes Jest + Supertest
â”‚   â””â”€â”€ web/              # Frontend + testes + Sentry
â”‚       â”œâ”€â”€ src/
â”‚       â”‚   â””â”€â”€ components/ # Componentes otimizados
â”‚       â””â”€â”€ tests/          # Testes React Testing Library
â”œâ”€â”€ packages/shared/      # Tipos TypeScript
â”œâ”€â”€ docker-compose.yml    # ContainerizaÃ§Ã£o
â”œâ”€â”€ lighthouserc.js      # Performance testing
â”œâ”€â”€ sonar-project.properties # Code quality
â””â”€â”€ turbo.json           # Monorepo config
```

### ðŸš€ PrÃ³ximos Passos

1. **Configure o ambiente** com suas variÃ¡veis
2. **Execute os testes** para validar tudo: `npm test`
3. **Inicie desenvolvimento**: `npm run dev`
4. **Acesse o dashboard**: http://localhost:3001
5. **Crie sua primeira instÃ¢ncia WhatsApp**
6. **Configure CI/CD** no GitHub para deploy automatizado

### ðŸ“– DocumentaÃ§Ã£o Completa

Para mais detalhes, consulte:

- `README.md` - DocumentaÃ§Ã£o completa
- `PM2-GUIDE.md` - Guia de produÃ§Ã£o
- `modelo-dashboard.md` - EspecificaÃ§Ãµes do dashboard

### ðŸŽ¯ PrÃ³ximos Passos

1. **Conectar uma instÃ¢ncia WhatsApp:**
   - Acesse: http://localhost:3001
   - VÃ¡ para "InstÃ¢ncias"
   - Crie uma nova instÃ¢ncia
   - Escaneie o QR Code

2. **Testar envio de mensagens:**
   - Use a documentaÃ§Ã£o Swagger: http://localhost:3000/api-docs
   - Teste os endpoints `/api/messages/send`

3. **Implementar funcionalidades adicionais:**
   - Redis + BullMQ para filas
   - PostgreSQL para produÃ§Ã£o
   - Testes E2E com Playwright

### ðŸ”§ ConfiguraÃ§Ã£o AvanÃ§ada

Edite os arquivos `.env` em:

- `apps/api/.env` (Backend)
- `apps/web/.env.local` (Frontend)

### ðŸ“– DocumentaÃ§Ã£o

- **API:** http://localhost:3000/api-docs
- **README completo:** readme.md