# My-wa-API v2.0 - Quick Start

## ✅ Projeto Inicializado com Sucesso!

# My-wa-API - Quick Start

## 🚀 Início Rápido

Seu projeto My-wa-API foi criado e está funcionando perfeitamente!

### 🚀 Acessos Rápidos

- **Frontend (Dashboard):** http://localhost:3001
- **API Backend:** http://localhost:3000
- **Documentação Swagger:** http://localhost:3000/api-docs
- **Health Check:** http://localhost:3000/health

### 🛠 Comandos Úteis

```bash
# Iniciar em modo desenvolvimento
npm run dev

# Build do projeto
npm run build

# Executar testes
npm run test

# Linting
npm run lint

# Limpar builds
npm run clean
```

### 📦 Docker (Opcional)

```bash
# Subir todos os serviços
docker-compose up -d

# Parar serviços
docker-compose down

# Ver logs
docker-compose logs -f
```

### 🔑 Credenciais Padrão

- **Username:** admin
- **Password:** admin123

### 📚 Estrutura do Projeto

```
my-wa-api/
├── apps/
│   ├── api/          # Backend Node.js + Express
│   └── web/          # Frontend Next.js
├── packages/
│   ├── shared/       # Tipos e utilitários
│   └── database/     # Abstração de dados
├── docker-compose.yml
└── turbo.json        # Configuração Turborepo
```

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
