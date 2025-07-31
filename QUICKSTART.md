# My-wa-API v2.1 - Quick Start

## ✅ Projeto Modernizado com Sucesso!

Seu projeto My-wa-API foi totalmente refatorado e modernizado com:
- ✅ Testes automatizados (Jest + React Testing Library)
- ✅ CI/CD com GitHub Actions
- ✅ Monitoramento com Sentry
- ✅ Validação com Joi
- ✅ Otimização de imagens com Next.js Image
- ✅ Dependabot para atualizações automáticas
- ✅ Análise de código com ESLint + Prettier

## 🚀 Início Rápido

### 🛠 Comandos de Desenvolvimento

```bash
# Instalação inicial
npm install

# Iniciar em modo desenvolvimento (ambos os serviços)
npm run dev

# Iniciar serviços separadamente
npm run dev:api   # API na porta 3000
npm run dev:web   # Frontend na porta 3001

# Build para produção
npm run build

# Iniciar em produção
npm start
```

### 🧪 Testes e Qualidade

```bash
# Executar todos os testes
npm test

# Testes específicos
npm run test:api      # Testes da API
npm run test:web      # Testes do frontend
npm run test:coverage # Com coverage

# Análise de código
npm run lint          # ESLint
npm run format        # Prettier
npm run typecheck     # TypeScript
```

### 🚀 Acessos do Sistema

- **Frontend (Dashboard):** http://localhost:3001
- **API Backend:** http://localhost:3000
- **Health Check:** http://localhost:3000/health
- **Socket.IO:** ws://localhost:3000

### 📦 Docker & Produção

```bash
# Desenvolvimento com Docker
docker-compose up -d

# Build de imagens para produção
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

### 🛡️ Segurança e Validação

O projeto agora inclui:
- **Validação Joi**: Schemas para todos os endpoints
- **Rate Limiting**: Proteção contra spam
- **Sanitização**: Proteção XSS e SQL injection
- **Monitoring**: Sentry para tracking de erros

### � Configuração do Ambiente

```bash
# API (.env)
cp apps/api/.env.example apps/api/.env

# Frontend (.env.local)
cp apps/web/.env.local.example apps/web/.env.local
```

**Variáveis principais:**
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

### �🔑 Credenciais Padrão

- **Username:** admin
- **Password:** admin123

### 📚 Estrutura Modernizada

```
my-wa-api/
├── .github/workflows/     # CI/CD pipelines
├── apps/
│   ├── api/              # Backend + testes + Sentry
│   │   ├── src/
│   │   │   ├── validation/  # Schemas Joi
│   │   │   └── middleware/  # Validação + Rate limiting
│   │   └── tests/          # Testes Jest + Supertest
│   └── web/              # Frontend + testes + Sentry
│       ├── src/
│       │   └── components/ # Componentes otimizados
│       └── tests/          # Testes React Testing Library
├── packages/shared/      # Tipos TypeScript
├── docker-compose.yml    # Containerização
├── lighthouserc.js      # Performance testing
├── sonar-project.properties # Code quality
└── turbo.json           # Monorepo config
```

### 🚀 Próximos Passos

1. **Configure o ambiente** com suas variáveis
2. **Execute os testes** para validar tudo: `npm test`
3. **Inicie desenvolvimento**: `npm run dev`
4. **Acesse o dashboard**: http://localhost:3001
5. **Crie sua primeira instância WhatsApp**
6. **Configure CI/CD** no GitHub para deploy automatizado

### 📖 Documentação Completa

Para mais detalhes, consulte:
- `README.md` - Documentação completa
- `PM2-GUIDE.md` - Guia de produção
- `modelo-dashboard.md` - Especificações do dashboard

### 🎯 Próximos Passos

1. **Conectar uma instância WhatsApp:**
   - Acesse: http://localhost:3001
   - Vá para "Instâncias"
   - Crie uma nova instância
   - Escaneie o QR Code

2. **Testar envio de mensagens:**
   - Use a documentação Swagger: http://localhost:3000/api-docs
   - Teste os endpoints `/api/messages/send`

3. **Implementar funcionalidades adicionais:**
   - Redis + BullMQ para filas
   - PostgreSQL para produção
   - Testes E2E com Playwright

### 🔧 Configuração Avançada

Edite os arquivos `.env` em:
- `apps/api/.env` (Backend)
- `apps/web/.env.local` (Frontend)

### 📖 Documentação

- **API:** http://localhost:3000/api-docs
- **README completo:** readme.md
