﻿# ðŸ“š DocumentaÃ§Ã£o TÃ©cnica - Dashboard WhatsApp API

## ðŸŽ¯ VisÃ£o Geral

Este projeto implementa um dashboard completo para gerenciamento de APIs WhatsApp com recursos avanÃ§ados de monitoramento em tempo real, interface estilo WhatsApp Web, sistema de automaÃ§Ã£o no-code e mÃ©tricas detalhadas.

## ðŸ—ï¸ Arquitetura do Sistema

### Stack TecnolÃ³gico

- **Frontend**: Next.js 15.4.5 + React 18 + TypeScript
- **Styling**: Tailwind CSS + Heroicons
- **Real-time**: Socket.IO Client
- **State Management**: React Hooks + Context API
- **Build**: Turbo (Monorepo)
- **Linting**: ESLint + TypeScript

### Estrutura de Componentes

```
ðŸ“ src/components/dashboard/
â”œâ”€â”€ ðŸ“„ EnhancedStatsCards.tsx      # Cards de estatÃ­sticas com Socket.IO
â”œâ”€â”€ ðŸ“„ EnhancedMessageSender.tsx   # Envio de mensagens com validaÃ§Ã£o
â”œâ”€â”€ ðŸ“„ EnhancedRecentActivity.tsx  # Feed de atividades em tempo real
â”œâ”€â”€ ðŸ“„ SimpleWhatsAppInterface.tsx # Interface estilo WhatsApp Web
â”œâ”€â”€ ðŸ“„ AutomationBuilder.tsx       # Sistema de automaÃ§Ã£o no-code
â”œâ”€â”€ ðŸ“„ AdvancedMetrics.tsx         # MÃ©tricas e relatÃ³rios avanÃ§ados
â”œâ”€â”€ ðŸ“„ EnhancedDashboard.tsx       # Dashboard principal integrado
â””â”€â”€ ðŸ“„ QRCodeGenerator.tsx         # Gerador de QR Code para conexÃ£o
```

## ðŸ”Œ Socket.IO Integration

### Hook useSocket.ts

O hook customizado `useSocket` Ã© o coraÃ§Ã£o da comunicaÃ§Ã£o em tempo real:

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

- âœ… ConexÃ£o automÃ¡tica com reconexÃ£o inteligente
- âœ… Estado de conexÃ£o reativo
- âœ… Gerenciamento de dados em tempo real
- âœ… Controle de salas (rooms) por instÃ¢ncia
- âœ… Timeout de mensagens configurÃ¡vel
- âœ… Cleanup automÃ¡tico na desmontagem

#### Eventos Suportados:

```typescript
// Eventos de entrada
'stats:update'; // AtualizaÃ§Ã£o de estatÃ­sticas
'activity:new'; // Nova atividade
'message:new'; // Nova mensagem
'instance:update'; // AtualizaÃ§Ã£o de instÃ¢ncia

// Eventos de saÃ­da
'join:instance'; // Entrar em sala de instÃ¢ncia
'leave:instance'; // Sair de sala de instÃ¢ncia
'send:message'; // Enviar mensagem
```

## ðŸ“Š Componentes Principais

### 1. EnhancedStatsCards

**PropÃ³sito**: ExibiÃ§Ã£o de estatÃ­sticas em tempo real com indicadores visuais

```typescript
interface EnhancedStatsCardsProps {
  stats?: DashboardStats | null;
  showRealtime?: boolean;
}
```

**CaracterÃ­sticas**:

- ðŸ“¡ IntegraÃ§Ã£o Socket.IO opcional
- ðŸ“ˆ Indicadores de tendÃªncia visual
- ðŸ”„ Status de conexÃ£o em tempo real
- â±ï¸ Timestamp de Ãºltima atualizaÃ§Ã£o
- ðŸŽ¨ Design responsivo com hover effects

**MÃ©tricas Exibidas**:

- InstÃ¢ncias conectadas (com taxa de conexÃ£o)
- Mensagens enviadas/recebidas hoje
- Filas ativas de processamento
- Tempo de uptime do sistema

### 2. EnhancedMessageSender

**PropÃ³sito**: Interface avanÃ§ada para envio de mensagens com validaÃ§Ã£o

```typescript
interface EnhancedMessageSenderProps {
  instanceId?: string;
  onMessageSent?: (message: MessagePayload) => void;
  enableRealtime?: boolean;
}
```

**Funcionalidades**:

- ðŸ“± ValidaÃ§Ã£o de nÃºmero de telefone (formato brasileiro)
- ðŸ“Ž Suporte a diferentes tipos de mÃ­dia
- âš¡ Envio em tempo real via Socket.IO
- ðŸ“‹ HistÃ³rico de mensagens enviadas
- ðŸ”„ Status de entrega em tempo real
- ðŸŽ¯ SeleÃ§Ã£o de instÃ¢ncia ativa

### 3. EnhancedRecentActivity

**PropÃ³sito**: Feed de atividades com filtros e expansÃ£o

```typescript
interface EnhancedRecentActivityProps {
  activities?: Activity[];
  maxItems?: number;
  enableRealtime?: boolean;
  showFilters?: boolean;
}
```

**Recursos**:

- ðŸ” Filtros por tipo de atividade
- ðŸ“… Filtros por perÃ­odo temporal
- ðŸ”„ AtualizaÃ§Ã£o em tempo real
- ðŸ“± Interface expansÃ­vel
- ðŸŽ¨ Ãcones contextuais por tipo de atividade

### 4. SimpleWhatsAppInterface

**PropÃ³sito**: RÃ©plica da interface WhatsApp Web

**CaracterÃ­sticas**:

- ðŸ“± Lista de contatos com busca
- ðŸ’¬ Interface de chat familiar
- ðŸŸ¢ Tema verde caracterÃ­stico do WhatsApp
- âœ… Status de mensagens (enviado, entregue, lido)
- ðŸ” Busca de contatos em tempo real
- ðŸ“¸ Suporte a avatares e perfis

### 5. AutomationBuilder

**PropÃ³sito**: Sistema no-code para automaÃ§Ã£o de mensagens

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

**Triggers DisponÃ­veis**:

- ðŸ”¤ **Palavra-chave**: Resposta automÃ¡tica por palavras
- â° **Agendamento**: ExecuÃ§Ã£o por tempo
- ðŸ”— **Webhook**: Trigger por chamada externa
- ðŸ‘¤ **Novo contato**: Quando novo contato entra

**AÃ§Ãµes PossÃ­veis**:

- ðŸ“¨ Enviar mensagem
- ðŸ·ï¸ Adicionar tag ao contato
- ðŸ”— Chamar webhook
- â±ï¸ Adicionar delay

### 6. AdvancedMetrics

**PropÃ³sito**: AnÃ¡lise detalhada de performance e mÃ©tricas

**Funcionalidades**:

- ðŸ“Š Cards de mÃ©tricas com tendÃªncias
- ðŸ“ˆ GrÃ¡ficos de volume de mensagens
- â±ï¸ SeleÃ§Ã£o flexÃ­vel de perÃ­odos (1h a 30d)
- ðŸ“‹ Resumos estatÃ­sticos
- ðŸ’¾ PreparaÃ§Ã£o para exportaÃ§Ã£o de relatÃ³rios
- ðŸ”„ AtualizaÃ§Ã£o em tempo real

**MÃ©tricas Calculadas**:

- Mensagens por hora com tendÃªncia
- Tempo de resposta mÃ©dio
- Taxa de erro do sistema
- Pico de instÃ¢ncias ativas

## ðŸŽ¨ Design System

### Cores Principais

```css
/* Paleta de cores do sistema */
--primary-green: #10b981 /* WhatsApp Green */ --primary-blue: #3b82f6 /* Info Blue */
  --warning-orange: #f59e0b /* Warning Orange */ --danger-red: #ef4444 /* Error Red */
  --success-green: #10b981 /* Success Green */ --neutral-gray: #6b7280 /* Neutral Gray */;
```

### Componentes de UI ReutilizÃ¡veis

- Cards com shadow e hover effects
- Buttons com estados (loading, disabled)
- Inputs com validaÃ§Ã£o visual
- Modals responsivos
- Indicadores de status
- Tooltips informativos

## ðŸ”§ ConfiguraÃ§Ã£o e InstalaÃ§Ã£o

### PrÃ©-requisitos

```bash
Node.js >= 18.0.0
npm >= 9.0.0
TypeScript >= 5.0.0
```

### InstalaÃ§Ã£o

```bash
# Clone o repositÃ³rio
git clone <repository-url>

# Instale dependÃªncias
npm install

# Configure variÃ¡veis de ambiente
cp .env.example .env.local

# Execute em desenvolvimento
npm run dev

# Build para produÃ§Ã£o
npm run build
```

### VariÃ¡veis de Ambiente

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

## ðŸ”— IntegraÃ§Ã£o com Backend

### Endpoints Esperados

```typescript
// EstatÃ­sticas
GET /api/stats
Response: DashboardStats

// Atividades
GET /api/activities?limit=50&offset=0
Response: Activity[]

// Mensagens
POST /api/messages
Body: MessagePayload
Response: MessageResponse

// InstÃ¢ncias
GET /api/instances
Response: Instance[]

// AutomaÃ§Ãµes
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

## ðŸ§ª Testes e Qualidade

### Estrutura de Testes

```bash
ðŸ“ __tests__/
â”œâ”€â”€ ðŸ“ components/
â”‚   â”œâ”€â”€ EnhancedStatsCards.test.tsx
â”‚   â”œâ”€â”€ useSocket.test.ts
â”‚   â””â”€â”€ ...
â”œâ”€â”€ ðŸ“ utils/
â””â”€â”€ ðŸ“ integration/
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

## ðŸš€ Deploy e Performance

### Build Otimizado

- Code splitting automÃ¡tico por rota
- Tree shaking para reduÃ§Ã£o de bundle
- Lazy loading de componentes pesados
- OtimizaÃ§Ã£o de imagens com Next.js Image

### RecomendaÃ§Ãµes de Performance

1. **Socket.IO**: Use rooms para reduzir trÃ¡fego
2. **React**: Implemente React.memo em componentes pesados
3. **Estado**: Use useMemo/useCallback para cÃ¡lculos custosos
4. **Network**: Implemente debouncing em inputs de busca

## ðŸ” Troubleshooting

### Problemas Comuns

**1. Socket.IO nÃ£o conecta**

```javascript
// Verifique CORS no servidor
// Confirme URL correta em NEXT_PUBLIC_SOCKET_URL
// Verifique se o servidor Socket.IO estÃ¡ rodando
```

**2. Componentes nÃ£o renderizam dados**

```javascript
// Verifique se enableRealtime=true
// Confirme se os tipos TypeScript estÃ£o corretos
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

## ðŸ“ˆ Roadmap Futuro

### Funcionalidades Planejadas

- ðŸ“Š Dashboard customizÃ¡vel com drag & drop
- ðŸ”” Sistema de notificaÃ§Ãµes push
- ðŸ“± PWA com offline support
- ðŸŒ InternacionalizaÃ§Ã£o (i18n)
- ðŸ” Sistema de permissÃµes granular
- ðŸ“ˆ Analytics avanÃ§ado com BI
- ðŸ¤– IntegraÃ§Ã£o com ChatGPT/AI
- ðŸ“‹ Sistema de templates de mensagem

### Melhorias TÃ©cnicas

- MigraÃ§Ã£o para React Server Components
- ImplementaÃ§Ã£o de testes E2E com Playwright
- Cache inteligente com React Query
- Monitoramento com OpenTelemetry
- CI/CD com GitHub Actions

---

**Desenvolvido com â¤ï¸ para otimizar comunicaÃ§Ã£o via WhatsApp**

_Ãšltima atualizaÃ§Ã£o: 31 de Julho, 2025_