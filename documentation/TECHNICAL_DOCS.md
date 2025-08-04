# 📚 Documentação Técnica - Dashboard WhatsApp API

## 🎯 Visão Geral

Este projeto implementa um dashboard completo para gerenciamento de APIs WhatsApp com recursos avançados de monitoramento em tempo real, interface estilo WhatsApp Web, sistema de automação no-code e métricas detalhadas.

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico

- **Frontend**: Next.js 15.4.5 + React 18 + TypeScript
- **Styling**: Tailwind CSS + Heroicons
- **Real-time**: Socket.IO Client
- **State Management**: React Hooks + Context API
- **Build**: Turbo (Monorepo)
- **Linting**: ESLint + TypeScript

### Estrutura de Componentes

```
📁 src/components/dashboard/
├── 📄 EnhancedStatsCards.tsx      # Cards de estatísticas com Socket.IO
├── 📄 EnhancedMessageSender.tsx   # Envio de mensagens com validação
├── 📄 EnhancedRecentActivity.tsx  # Feed de atividades em tempo real
├── 📄 SimpleWhatsAppInterface.tsx # Interface estilo WhatsApp Web
├── 📄 AutomationBuilder.tsx       # Sistema de automação no-code
├── 📄 AdvancedMetrics.tsx         # Métricas e relatórios avançados
├── 📄 EnhancedDashboard.tsx       # Dashboard principal integrado
└── 📄 QRCodeGenerator.tsx         # Gerador de QR Code para conexão
```

## 🔌 Socket.IO Integration

### Hook useSocket.ts

O hook customizado `useSocket` é o coração da comunicação em tempo real:

```typescript
interface UseSocketOptions {
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface SocketState {
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  lastConnected: Date | null;
}

interface RealtimeData {
  stats: DashboardStats | null;
  activities: Activity[];
  messages: Message[];
  instances: Instance[];
}
```

#### Funcionalidades:

- ✅ Conexão automática com reconexão inteligente
- ✅ Estado de conexão reativo
- ✅ Gerenciamento de dados em tempo real
- ✅ Controle de salas (rooms) por instância
- ✅ Timeout de mensagens configurável
- ✅ Cleanup automático na desmontagem

#### Eventos Suportados:

```typescript
// Eventos de entrada
'stats:update'; // Atualização de estatísticas
'activity:new'; // Nova atividade
'message:new'; // Nova mensagem
'instance:update'; // Atualização de instância

// Eventos de saída
'join:instance'; // Entrar em sala de instância
'leave:instance'; // Sair de sala de instância
'send:message'; // Enviar mensagem
```

## 📊 Componentes Principais

### 1. EnhancedStatsCards

**Propósito**: Exibição de estatísticas em tempo real com indicadores visuais

```typescript
interface EnhancedStatsCardsProps {
  stats?: DashboardStats | null;
  showRealtime?: boolean;
}
```

**Características**:

- 📡 Integração Socket.IO opcional
- 📈 Indicadores de tendência visual
- 🔄 Status de conexão em tempo real
- ⏱️ Timestamp de última atualização
- 🎨 Design responsivo com hover effects

**Métricas Exibidas**:

- Instâncias conectadas (com taxa de conexão)
- Mensagens enviadas/recebidas hoje
- Filas ativas de processamento
- Tempo de uptime do sistema

### 2. EnhancedMessageSender

**Propósito**: Interface avançada para envio de mensagens com validação

```typescript
interface EnhancedMessageSenderProps {
  instanceId?: string;
  onMessageSent?: (message: MessagePayload) => void;
  enableRealtime?: boolean;
}
```

**Funcionalidades**:

- 📱 Validação de número de telefone (formato brasileiro)
- 📎 Suporte a diferentes tipos de mídia
- ⚡ Envio em tempo real via Socket.IO
- 📋 Histórico de mensagens enviadas
- 🔄 Status de entrega em tempo real
- 🎯 Seleção de instância ativa

### 3. EnhancedRecentActivity

**Propósito**: Feed de atividades com filtros e expansão

```typescript
interface EnhancedRecentActivityProps {
  activities?: Activity[];
  maxItems?: number;
  enableRealtime?: boolean;
  showFilters?: boolean;
}
```

**Recursos**:

- 🔍 Filtros por tipo de atividade
- 📅 Filtros por período temporal
- 🔄 Atualização em tempo real
- 📱 Interface expansível
- 🎨 Ícones contextuais por tipo de atividade

### 4. SimpleWhatsAppInterface

**Propósito**: Réplica da interface WhatsApp Web

**Características**:

- 📱 Lista de contatos com busca
- 💬 Interface de chat familiar
- 🟢 Tema verde característico do WhatsApp
- ✅ Status de mensagens (enviado, entregue, lido)
- 🔍 Busca de contatos em tempo real
- 📸 Suporte a avatares e perfis

### 5. AutomationBuilder

**Propósito**: Sistema no-code para automação de mensagens

```typescript
interface AutomationRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: {
    type: 'keyword' | 'time' | 'webhook' | 'new_contact';
    config: Record<string, any>;
  };
  actions: Action[];
  statistics: {
    triggered: number;
    successful: number;
    failed: number;
  };
}
```

**Triggers Disponíveis**:

- 🔤 **Palavra-chave**: Resposta automática por palavras
- ⏰ **Agendamento**: Execução por tempo
- 🔗 **Webhook**: Trigger por chamada externa
- 👤 **Novo contato**: Quando novo contato entra

**Ações Possíveis**:

- 📨 Enviar mensagem
- 🏷️ Adicionar tag ao contato
- 🔗 Chamar webhook
- ⏱️ Adicionar delay

### 6. AdvancedMetrics

**Propósito**: Análise detalhada de performance e métricas

**Funcionalidades**:

- 📊 Cards de métricas com tendências
- 📈 Gráficos de volume de mensagens
- ⏱️ Seleção flexível de períodos (1h a 30d)
- 📋 Resumos estatísticos
- 💾 Preparação para exportação de relatórios
- 🔄 Atualização em tempo real

**Métricas Calculadas**:

- Mensagens por hora com tendência
- Tempo de resposta médio
- Taxa de erro do sistema
- Pico de instâncias ativas

## 🎨 Design System

### Cores Principais

```css
/* Paleta de cores do sistema */
--primary-green: #10b981 /* WhatsApp Green */ --primary-blue: #3b82f6 /* Info Blue */
  --warning-orange: #f59e0b /* Warning Orange */ --danger-red: #ef4444 /* Error Red */
  --success-green: #10b981 /* Success Green */ --neutral-gray: #6b7280 /* Neutral Gray */;
```

### Componentes de UI Reutilizáveis

- Cards com shadow e hover effects
- Buttons com estados (loading, disabled)
- Inputs com validação visual
- Modals responsivos
- Indicadores de status
- Tooltips informativos

## 🔧 Configuração e Instalação

### Pré-requisitos

```bash
Node.js >= 18.0.0
npm >= 9.0.0
TypeScript >= 5.0.0
```

### Instalação

```bash
# Clone o repositório
git clone <repository-url>

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local

# Execute em desenvolvimento
npm run dev

# Build para produção
npm run build
```

### Variáveis de Ambiente

```env
# Socket.IO Configuration
NEXT_PUBLIC_SOCKET_URL=ws://localhost:3001
NEXT_PUBLIC_SOCKET_TIMEOUT=10000

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_API_TIMEOUT=30000

# Feature Flags
NEXT_PUBLIC_ENABLE_REALTIME=true
NEXT_PUBLIC_ENABLE_AUTOMATION=true
```

## 🔗 Integração com Backend

### Endpoints Esperados

```typescript
// Estatísticas
GET /api/stats
Response: DashboardStats

// Atividades
GET /api/activities?limit=50&offset=0
Response: Activity[]

// Mensagens
POST /api/messages
Body: MessagePayload
Response: MessageResponse

// Instâncias
GET /api/instances
Response: Instance[]

// Automações
GET /api/automations
POST /api/automations
PUT /api/automations/:id
DELETE /api/automations/:id
```

### Socket.IO Events

```typescript
// Client -> Server
interface ClientToServerEvents {
  'join:instance': (instanceId: string) => void;
  'leave:instance': (instanceId: string) => void;
  'send:message': (payload: MessagePayload) => void;
}

// Server -> Client
interface ServerToClientEvents {
  'stats:update': (stats: DashboardStats) => void;
  'activity:new': (activity: Activity) => void;
  'message:new': (message: Message) => void;
  'instance:update': (instance: Instance) => void;
}
```

## 🧪 Testes e Qualidade

### Estrutura de Testes

```bash
📁 __tests__/
├── 📁 components/
│   ├── EnhancedStatsCards.test.tsx
│   ├── useSocket.test.ts
│   └── ...
├── 📁 utils/
└── 📁 integration/
```

### Comandos de Teste

```bash
# Executar testes
npm run test

# Testes com coverage
npm run test:coverage

# Testes em watch mode
npm run test:watch

# Lint e type checking
npm run lint
npm run type-check
```

## 🚀 Deploy e Performance

### Build Otimizado

- Code splitting automático por rota
- Tree shaking para redução de bundle
- Lazy loading de componentes pesados
- Otimização de imagens com Next.js Image

### Recomendações de Performance

1. **Socket.IO**: Use rooms para reduzir tráfego
2. **React**: Implemente React.memo em componentes pesados
3. **Estado**: Use useMemo/useCallback para cálculos custosos
4. **Network**: Implemente debouncing em inputs de busca

## 🔍 Troubleshooting

### Problemas Comuns

**1. Socket.IO não conecta**

```javascript
// Verifique CORS no servidor
// Confirme URL correta em NEXT_PUBLIC_SOCKET_URL
// Verifique se o servidor Socket.IO está rodando
```

**2. Componentes não renderizam dados**

```javascript
// Verifique se enableRealtime=true
// Confirme se os tipos TypeScript estão corretos
// Verifique console do navegador para erros
```

**3. Build falha**

```bash
# Limpe cache e reinstale
rm -rf .next node_modules
npm install
npm run build
```

### Logs e Debug

```typescript
// Ative debug do Socket.IO
localStorage.debug = 'socket.io-client:socket';

// Use React DevTools para inspecionar estado
// Verifique Network tab para chamadas de API
```

## 📈 Roadmap Futuro

### Funcionalidades Planejadas

- 📊 Dashboard customizável com drag & drop
- 🔔 Sistema de notificações push
- 📱 PWA com offline support
- 🌍 Internacionalização (i18n)
- 🔐 Sistema de permissões granular
- 📈 Analytics avançado com BI
- 🤖 Integração com ChatGPT/AI
- 📋 Sistema de templates de mensagem

### Melhorias Técnicas

- Migração para React Server Components
- Implementação de testes E2E com Playwright
- Cache inteligente com React Query
- Monitoramento com OpenTelemetry
- CI/CD com GitHub Actions

---

**Desenvolvido com ❤️ para otimizar comunicação via WhatsApp**

_Última atualização: 31 de Julho, 2025_
