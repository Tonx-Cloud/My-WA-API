# WhatsApp Web API with Next.js Dashboard

![WhatsApp API](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![CI/CD](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![Security](https://img.shields.io/badge/Sentry-362D59?style=for-the-badge&logo=sentry&logoColor=white)
![Testing](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)

Sistema completo de automação WhatsApp com interface dashboard em tempo real, construído com Next.js, Express.js e Socket.IO. Totalmente modernizado com CI/CD, testes automatizados, monitoramento e segurança de nível empresarial.

## 🚀 Funcionalidades Principais

- **🔄 Dashboard em Tempo Real**: Interface Next.js com updates automáticos via Socket.IO
- **📱 Gerenciamento de Instâncias**: Criar, conectar, desconectar e excluir instâncias WhatsApp
- **🔗 QR Code Dinâmico**: Geração automática de QR codes em PNG para conexão
- **📊 Estatísticas ao Vivo**: Mensagens enviadas/recebidas, status de conexão, última atividade
- **🔧 Automação PowerShell**: Scripts para inicialização e gerenciamento de serviços
- **⚡ Socket.IO Integration**: Comunicação em tempo real entre frontend e backend
- **🐳 Docker Support**: Containerização completa com docker-compose
- **📦 Monorepo Structure**: Organização com Turbo para melhor performance
- **🛡️ Segurança Avançada**: Validação Joi, rate limiting, sanitização de dados
- **📈 Monitoramento**: Sentry para tracking de erros e performance
- **🧪 Testes Automatizados**: Jest, React Testing Library, testes de integração
- **🚀 CI/CD Pipeline**: GitHub Actions para deploy automatizado
- **🎨 Otimização de Imagens**: Next.js Image para performance otimizada
- **⚡ Performance Monitoring**: Middleware avançado para análise de performance
- **🔄 Graceful Shutdown**: Sistema de shutdown graceful para produção
- **📱 Dashboard APIs**: APIs completas para métricas, atividades e overview do sistema

## 🎯 Implementação Final

### Parte 7: Configuração Express Completa ✅

A implementação final do sistema inclui:

**Backend Express Avançado:**
- ✅ Socket.IO com broadcasting em tempo real
- ✅ APIs de dashboard com métricas completas
- ✅ Middleware de performance e monitoramento
- ✅ Sistema de graceful shutdown para produção
- ✅ Configuração completa de segurança
- ✅ Scripts de deploy automatizado

**Estrutura de Produção:**
- ✅ PM2 configuration para cluster mode
- ✅ Scripts de build e deploy
- ✅ Monitoramento de performance
- ✅ Health checks avançados
- ✅ Logging estruturado com Winston

## 🏗️ Arquitetura do Sistema

```
my-wa-api/
├── .github/
│   └── workflows/              # GitHub Actions CI/CD
│       ├── ci-cd.yml          # Pipeline principal
│       ├── api-tests.yml      # Testes da API
│       ├── frontend-tests.yml # Testes do frontend
│       ├── docker-deploy.yml  # Deploy com Docker
│       └── code-quality.yml   # Análise de qualidade
├── apps/
│   ├── api/                    # Backend Express.js
│   │   ├── src/
│   │   │   ├── config/         # Configurações (logger, socket, database)
│   │   │   ├── controllers/    # Controllers da API
│   │   │   ├── middleware/     # Middlewares (auth, rate limiting, validation)
│   │   │   ├── models/         # Modelos de dados
│   │   │   ├── routes/         # Rotas da API
│   │   │   ├── services/       # Serviços WhatsApp
│   │   │   ├── validation/     # Schemas Joi para validação
│   │   │   └── index.ts        # Entry point
│   │   ├── tests/              # Testes unitários e integração
│   │   ├── sentry.server.config.ts # Configuração Sentry
│   │   └── package.json
│   └── web/                    # Frontend Next.js
│       ├── src/
│       │   ├── app/            # App Router (Next.js 13+)
│       │   │   ├── dashboard/  # Dashboard reorganizado
│       │   │   │   ├── page.tsx           # Dashboard principal (estatísticas)
│       │   │   │   ├── instances/         # Gerenciamento de instâncias
│       │   │   │   └── messages/          # Interface de mensagens
│       │   │   ├── login/      # Página de login
│       │   │   └── api/        # API routes
│       │   ├── components/     # Componentes React otimizados
│       │   │   ├── dashboard/  # Componentes do dashboard
│       │   │   │   ├── StatsDashboard.tsx    # Cards de estatísticas
│       │   │   │   ├── UsageChart.tsx        # Gráficos de uso
│       │   │   │   ├── RecentActivity.tsx    # Atividades recentes
│       │   │   │   ├── InstanceList.tsx      # Lista de instâncias
│       │   │   │   ├── QRCodeGenerator.tsx   # Gerador de QR
│       │   │   │   └── MessageSender.tsx     # Envio de mensagens
│       │   │   ├── layout/     # Componentes de layout
│       │   │   └── ui/         # Componentes UI reutilizáveis
│       │   ├── hooks/          # Custom hooks com performance
│       │   ├── lib/            # Utilitários
│       │   └── stores/         # Estado global
│       ├── tests/              # Testes de componentes
│       ├── sentry.client.config.ts # Configuração Sentry client
│       ├── sentry.edge.config.ts   # Configuração Sentry edge
│       └── package.json
├── packages/
│   └── shared/                 # Tipos e utilitários compartilhados
├── scripts/                    # Scripts PowerShell de automação
├── docker-compose.yml          # Configuração Docker
├── lighthouserc.js            # Configuração Lighthouse
├── sonar-project.properties   # Configuração SonarCloud
└── package.json               # Root package.json
```

## ⚡ Quick Start

### 1. **Instalação**

```bash
# Clone o repositório
git clone https://github.com/Tonx-Cloud/my-wa-api.git
cd my-wa-api

# Instale as dependências
npm install
```

### 2. **Configuração do Ambiente**

```bash
# Copie os arquivos de exemplo
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Configure as variáveis necessárias nos arquivos .env
```

### 3. **Deploy Rápido (Novo! 🚀)**

**Windows:**
```cmd
# Deploy para produção
.\deploy.bat production

# Deploy para desenvolvimento
.\deploy.bat development
```

**Linux/Mac:**
```bash
# Deploy para produção
./deploy.sh production

# Deploy para desenvolvimento  
./deploy.sh development
```

### 4. **Scripts de Inicialização Rápida**

**Windows (PowerShell/Batch):**
```cmd
# Iniciar apenas o backend
.\scripts\start-backend.bat

# Iniciar apenas o frontend
.\scripts\start-frontend.bat

# Ou usar o script principal (recomendado)
npm run dev
```

**Turbo Monorepo (Recomendado):**
```bash
# Iniciar tudo com Turbo (API + Web)
npm run dev

# Iniciar apenas a API
npm run dev:api

# Iniciar apenas o frontend
npm run dev:web
```

### 5. **Inicialização Manual (Alternativa)**

### 5. **Desenvolvimento**

```bash
# Inicie em modo desenvolvimento (ambos os serviços)
npm run dev

# Ou inicie separadamente:
npm run dev:api  # API na porta 3001
npm run dev:web  # Web na porta 3000
```

### 6. **Testes**

```bash
# Rodar todos os testes
npm test

# Testes específicos
npm run test:api    # Testes da API
npm run test:web    # Testes do frontend
npm run test:e2e    # Testes end-to-end

# Com coverage
npm run test -- --coverage
```

### 7. **Build & Deploy**

```bash
# Build para produção
npm run build

# Build específico
npm run build:api
npm run build:web

# Iniciar em produção
npm start
```

### 8. **Inicialização Rápida (PowerShell)**

```powershell
# Windows - Execute o script de inicialização (Método correto)
.\scripts\start-all.ps1

# Alternativa com ExecutionPolicy
PowerShell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1

# Ou inicie manualmente usando PM2:
pm2 start ecosystem.config.json
```

**📝 Importante**: Use `.\scripts\start-all.ps1` (com o caminho relativo) em vez de apenas `start-all.ps1`

### 9. **Docker (Produção)**

```bash
# Build e start com Docker Compose
docker-compose up -d --build

# Logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

## ✅ Reorganização do Frontend Concluída

### **Nova Arquitetura de Rotas**

A reorganização do frontend foi implementada com sucesso, seguindo o padrão de separação de responsabilidades:

**✅ Dashboard Principal (`/dashboard`)**
- Componente `StatsDashboard`: Cards com métricas principais
- Componente `UsageChart`: Gráficos interativos com recharts
- Componente `RecentActivity`: Timeline de atividades do sistema
- Layout limpo focado apenas em estatísticas e métricas

**✅ Gerenciamento de Instâncias (`/dashboard/instances`)**
- Interface dedicada para todas as operações de instâncias
- QR Code generator integrado
- Status de conexão em tempo real
- Controles de conectar/desconectar

**✅ Interface de Mensagens (`/dashboard/messages`)**
- Layout estilo WhatsApp Web
- Chat em tempo real com Socket.IO
- Lista de contatos na sidebar
- Histórico de conversas

### **Componentes Criados**

```typescript
// StatsDashboard.tsx - Cards de estatísticas
interface DashboardStats {
  totalInstances: number
  connectedInstances: number
  messagesSentToday: number
  messagesReceivedToday: number
  activeQueues: number
  systemUptime: string
}

// UsageChart.tsx - Gráficos interativos
- Gráficos de linha e barra
- Dados de mensagens e conexões
- Interface responsiva com recharts

// RecentActivity.tsx - Atividades recentes  
- Timeline de eventos do sistema
- Ícones categorizados por tipo
- Formatação de datas com date-fns
```

### **Teste da Reorganização**

```bash
# 1. Build do projeto (✅ Sucesso)
npm run build

# 2. Iniciar o sistema
npm run dev

# 3. Acessar as rotas reorganizadas:
# - http://localhost:3001/dashboard (Estatísticas)
# - http://localhost:3001/dashboard/instances (Instâncias)  
# - http://localhost:3001/dashboard/messages (Mensagens)
```

## 🧪 Testes e Qualidade

### **Testes Automatizados**

```bash
# Testes unitários
npm run test

# Testes com coverage
npm run test:coverage

# Testes de integração da API
npm run test:api

# Testes de componentes React
npm run test:web

# Modo watch para desenvolvimento
npm run test:watch
```

### **Análise de Código**

```bash
# ESLint
npm run lint
npm run lint:fix

# Prettier
npm run format
npm run format:check

# TypeScript check
npm run typecheck
```

### **CI/CD Pipeline**

O projeto inclui workflows do GitHub Actions para:

- ✅ **Lint e Type Check**: Análise de código e tipos
- 🏗️ **Build**: Compilação dos projetos
- 🧪 **Tests**: Execução de testes automatizados
- 🛡️ **Security**: Auditoria de segurança
- 📊 **Code Quality**: SonarCloud, CodeQL
- 🚀 **Deploy**: Deploy automatizado

### **Monitoramento**

- **Sentry**: Tracking de erros e performance
- **Lighthouse**: Análise de performance do frontend
- **Dependabot**: Atualizações automáticas de dependências

## 🔧 Acesso ao Sistema

- **Dashboard Principal**: http://localhost:3001/dashboard
- **Gerenciamento de Instâncias**: http://localhost:3001/dashboard/instances
- **Interface de Mensagens**: http://localhost:3001/dashboard/messages
- **API Backend**: http://localhost:3000
- **Socket.IO**: ws://localhost:3000
- **Socket.IO**: ws://localhost:3000

## 🛡️ Segurança

### **Validação de Dados**

```typescript
// Exemplo de validação Joi implementada
const messageSchema = Joi.object({
  to: Joi.string().required().min(10).max(15),
  message: Joi.string().required().min(1).max(4096),
  instanceId: Joi.string().required().uuid()
});
```

### **Rate Limiting**

```typescript
// Configuração de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  standardHeaders: true
});
```

### **Sanitização**

- Sanitização automática de inputs
- Validação de tipos TypeScript
- Escape de caracteres especiais
- Filtros de XSS e SQL injection

## 📚 Documentação da API

### **Autenticação**

```bash
# Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

### **Gerenciamento de Instâncias**

```bash
# Criar instância
POST /api/instances
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "WhatsApp Instance 1",
  "description": "Minha primeira instância"
}

# Listar instâncias
GET /api/instances
Authorization: Bearer <token>

# Conectar instância
POST /api/instances/:id/connect
Authorization: Bearer <token>

# Gerar QR Code
GET /api/instances/:id/qr
Authorization: Bearer <token>
```

### **Envio de Mensagens**

```bash
# Enviar mensagem
POST /api/messages/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "instanceId": "uuid-da-instancia",
  "to": "5511999999999",
  "message": "Olá! Esta é uma mensagem via API."
}
```

## 🔧 Scripts de Automação PowerShell

O projeto inclui scripts PowerShell para facilitar o gerenciamento:

| Script | Descrição |
|--------|-----------|
| `start-all.ps1` | Inicia todos os serviços (API + Web) |
| `stop-all.ps1` | Para todos os serviços |
| `restart-all.ps1` | Reinicia todos os serviços |
| `status.ps1` | Verifica status dos serviços |

### **Uso Correto dos Scripts**

```powershell
# ✅ CORRETO - Com caminho relativo
.\scripts\start-all.ps1    # Iniciar tudo
.\scripts\status.ps1       # Verificar status
.\scripts\stop-all.ps1     # Parar tudo

# ❌ INCORRETO - Sem caminho
start-all.ps1              # Erro: comando não encontrado
```

### **Troubleshooting PowerShell**

**Problema: "não é reconhecido como comando"**
```powershell
# Solução: Use o caminho relativo
.\scripts\start-all.ps1

# Ou com ExecutionPolicy
PowerShell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1
```

**Problema: "Execução de scripts está desabilitada"**
```powershell
# Solução: Alterar ExecutionPolicy temporariamente
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\start-all.ps1

# Ou executar diretamente
PowerShell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1
```

## 📱 Uso do Dashboard

### **Navegação do Sistema**
O dashboard foi reorganizado com separação clara de responsabilidades:

#### **Dashboard Principal** (`/dashboard`)
- 📊 **Estatísticas Gerais**: Cards com métricas principais do sistema
- 📈 **Gráficos de Uso**: Visualização de mensagens e conexões por período
- 🔄 **Atividades Recentes**: Timeline de eventos do sistema
- 🖥️ **Status do Sistema**: CPU, memória, disco e uptime
- 🎯 **Métricas Principais**: Taxa de entrega, webhooks, tempo de resposta

#### **Gerenciamento de Instâncias** (`/dashboard/instances`)
- 📱 **Lista de Instâncias**: Todas as instâncias WhatsApp cadastradas
- ➕ **Criar Nova Instância**: Formulário para adicionar instâncias
- 🔗 **QR Code Generator**: Geração automática de QR codes
- 🔌 **Conectar/Desconectar**: Controle de conexões
- 🗑️ **Excluir Instâncias**: Remoção de instâncias não utilizadas

#### **Interface de Mensagens** (`/dashboard/messages`)
- 💬 **WhatsApp Web-like**: Interface similar ao WhatsApp Web
- 📋 **Lista de Contatos**: Sidebar com contatos e últimas mensagens
- 🔄 **Chat em Tempo Real**: Mensagens com Socket.IO
- 📎 **Envio de Arquivos**: Upload de mídias e documentos
- 🕒 **Histórico**: Busca e navegação por conversas antigas

### **Criar Nova Instância**
1. Acesse o dashboard em `/dashboard/instances`
2. Clique em "Nova Instância"
3. Insira um nome para a instância
4. QR code será gerado automaticamente

### **Conectar WhatsApp**
1. Clique em "Gerar QR Code" na instância
2. Escaneie o QR code com seu WhatsApp
3. Aguarde a conexão (status mudará para "Conectado")

### **Gerenciar Instâncias**
- ✅ **Status em Tempo Real**: Verde (conectado), Amarelo (conectando), Vermelho (desconectado)
- 📊 **Estatísticas**: Mensagens enviadas/recebidas do dia
- 🔄 **Auto-refresh**: Atualização automática a cada 5 segundos
- 🗑️ **Excluir**: Remover instâncias não utilizadas

## 🔌 API Endpoints

### **Instâncias**
```http
GET    /api/instances-v2/all         # Listar todas as instâncias
POST   /api/instances-v2/create      # Criar nova instância
GET    /api/instances-v2/:id/qr      # Obter QR code
POST   /api/instances-v2/:id/logout  # Desconectar instância
DELETE /api/instances-v2/:id         # Excluir instância
```

### **Mensagens**
```http
POST   /api/messages/send            # Enviar mensagem
GET    /api/messages/history         # Histórico de mensagens
```

## 🔗 Socket.IO Events

### **Cliente → Servidor**
- `join_instance` - Entrar na sala da instância
- `leave_instance` - Sair da sala da instância

### **Servidor → Cliente**
- `{instanceId}:qr_received` - QR code recebido
- `{instanceId}:authenticated` - WhatsApp autenticado
- `{instanceId}:ready` - Instância pronta para uso
- `{instanceId}:disconnected` - Instância desconectada

## 🐳 Docker

### **Desenvolvimento**
```bash
# Subir todos os serviços
docker-compose up -d

# Logs em tempo real
docker-compose logs -f
```

### **Produção**
```bash
# Build e deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 🛠️ Tecnologias Utilizadas

### **Backend**
- **Express.js** - Framework web
- **Socket.IO** - Comunicação em tempo real
- **whatsapp-web.js** - Integração WhatsApp
- **TypeScript** - Tipagem estática
- **Winston** - Logging
- **Helmet** - Segurança

### **Frontend**
- **Next.js 13+** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Heroicons** - Ícones
- **Socket.IO Client** - Comunicação em tempo real
- **Zustand** - Gerenciamento de estado

### **DevOps & Tools**
- **Turbo** - Monorepo build system
- **Docker** - Containerização
- **PM2** - Process manager
- **ESLint** - Linting
- **PowerShell** - Scripts de automação

## 📋 Variáveis de Ambiente

### **API (.env)**
```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3001
```

### **Web (.env)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-here
```

## 🔒 Segurança

- **Rate Limiting**: Proteção contra spam
- **CORS**: Configurado para origens específicas
- **Helmet**: Headers de segurança
- **Input Validation**: Validação de dados de entrada
- **Session Management**: Gerenciamento seguro de sessões

## 📊 Monitoramento

- **Winston Logging**: Logs estruturados
- **PM2 Monitoring**: Métricas de processo
- **Health Checks**: Endpoints de saúde
- **Real-time Status**: Status em tempo real via Socket.IO

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/Tonx-Cloud/my-wa-api/issues)
- **Documentação**: [Wiki](https://github.com/Tonx-Cloud/my-wa-api/wiki)
- **Email**: hiltonsf@gmail.com

---

**⭐ Se este projeto te ajudou, considere dar uma estrela no GitHub!**

## 🚀 Roadmap

- [ ] Sistema de templates de mensagem
- [ ] Agendamento de mensagens
- [ ] Webhook system
- [ ] Métricas avançadas
- [ ] API para integrações externas
- [ ] Sistema de backup
- [ ] Multi-tenancy support
- [ ] Interface mobile responsiva