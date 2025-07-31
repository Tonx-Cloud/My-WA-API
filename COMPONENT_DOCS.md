# 📋 Guia de Componentes - Dashboard WhatsApp

## 🎯 Índice de Componentes

| Componente | Propósito | Socket.IO | Complexidade |
|------------|-----------|-----------|--------------|
| [EnhancedStatsCards](#enhancedstatscards) | Estatísticas em tempo real | ✅ | Média |
| [EnhancedMessageSender](#enhancedmessagesender) | Envio de mensagens | ✅ | Alta |
| [EnhancedRecentActivity](#enhancedrecentactivity) | Feed de atividades | ✅ | Média |
| [SimpleWhatsAppInterface](#simplewhatsappinterface) | Interface WhatsApp Web | ✅ | Alta |
| [AutomationBuilder](#automationbuilder) | Sistema no-code | ❌ | Muito Alta |
| [AdvancedMetrics](#advancedmetrics) | Métricas e relatórios | ✅ | Alta |
| [useSocket](#usesocket-hook) | Hook Socket.IO | ✅ | Crítica |

---

## 📊 EnhancedStatsCards

### Descrição
Componente que exibe cards de estatísticas com dados em tempo real via Socket.IO.

### Props Interface
```typescript
interface EnhancedStatsCardsProps {
  stats?: DashboardStats | null        // Dados estáticos (fallback)
  showRealtime?: boolean               // Habilita Socket.IO (default: true)
}

interface DashboardStats {
  connectedInstances: number
  totalInstances: number
  messagesSentToday: number
  messagesReceivedToday: number
  activeQueues: number
  systemUptime: string
}
```

### Funcionalidades

#### 🔄 Modo Real-time vs Estático
```typescript
// Real-time (padrão)
<EnhancedStatsCards showRealtime={true} />

// Estático com dados fixos
<EnhancedStatsCards 
  showRealtime={false} 
  stats={{
    connectedInstances: 5,
    totalInstances: 10,
    messagesSentToday: 1250,
    messagesReceivedToday: 890,
    activeQueues: 3,
    systemUptime: "2d 15h 30m"
  }} 
/>
```

#### 📈 Cards Disponíveis
1. **Instâncias Conectadas**
   - Formato: `5/10` (conectadas/total)
   - Trend: Taxa de conexão em %
   - Cor: Azul (`bg-blue-500`)

2. **Mensagens Enviadas Hoje**
   - Formato: Número formatado (`1.250`)
   - Ícone: Chat bubble
   - Cor: Verde (`bg-green-500`)

3. **Mensagens Recebidas Hoje**
   - Formato: Número formatado
   - Ícone: Chat bubble
   - Cor: Roxo (`bg-purple-500`)

4. **Filas Ativas**
   - Formato: Número inteiro
   - Trend: Filas pendentes (menos é melhor)
   - Cor: Laranja (`bg-orange-500`)

5. **Tempo Online**
   - Formato: `2d 15h 30m`
   - Ícone: Check circle
   - Cor: Esmeralda (`bg-emerald-500`)

#### 🔌 Status de Conexão
```typescript
// Indicadores visuais de conexão
const getConnectionStatusColor = (): string => {
  if (!showRealtime) return 'text-gray-500'    // Modo estático
  if (isConnected) return 'text-green-500'     // Conectado
  return 'text-red-500'                        // Desconectado
}
```

### Exemplo de Uso
```typescript
import EnhancedStatsCards from './components/dashboard/EnhancedStatsCards'

function Dashboard() {
  return (
    <div>
      {/* Modo real-time */}
      <EnhancedStatsCards showRealtime={true} />
      
      {/* Modo estático com fallback */}
      <EnhancedStatsCards 
        showRealtime={false}
        stats={staticStats}
      />
    </div>
  )
}
```

---

## 📨 EnhancedMessageSender

### Descrição
Interface avançada para envio de mensagens com validação e múltiplos tipos de mídia.

### Props Interface
```typescript
interface EnhancedMessageSenderProps {
  instanceId?: string                           // ID da instância específica
  onMessageSent?: (message: MessagePayload) => void  // Callback pós-envio
  enableRealtime?: boolean                     // Envio via Socket.IO
}

interface MessagePayload {
  instanceId: string
  to: string
  type: 'text' | 'image' | 'document' | 'audio' | 'video'
  content: string
  mediaUrl?: string
  filename?: string
}
```

### Funcionalidades

#### 📱 Validação de Telefone
```typescript
// Validação para números brasileiros
const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '')
  return /^55\d{10,11}$/.test(cleaned)  // +55 + DDD + número
}

// Formatação automática
const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, '+$1 ($2) $3-$4')
}
```

#### 📎 Tipos de Mídia Suportados
```typescript
const mediaTypes = [
  { value: 'text', label: '💬 Texto', icon: ChatBubbleLeftIcon },
  { value: 'image', label: '🖼️ Imagem', icon: PhotoIcon },
  { value: 'document', label: '📄 Documento', icon: DocumentIcon },
  { value: 'audio', label: '🎵 Áudio', icon: SpeakerWaveIcon },
  { value: 'video', label: '🎥 Vídeo', icon: VideoCameraIcon }
]
```

#### ⚡ Envio em Tempo Real
```typescript
const sendMessage = async (messageData: MessagePayload) => {
  if (enableRealtime && isConnected) {
    // Envio via Socket.IO com timeout
    return sendMessageViaSocket(messageData, { timeout: 10000 })
  } else {
    // Fallback para HTTP API
    return sendMessageViaAPI(messageData)
  }
}
```

#### 📋 Histórico de Mensagens
- Armazena últimas 50 mensagens enviadas
- Exibe status de entrega em tempo real
- Possibilidade de reenviar mensagens falhadas

### Estados do Componente
```typescript
interface MessageSenderState {
  phone: string
  message: string
  messageType: MessageType
  mediaUrl: string
  isSending: boolean
  lastSent: MessagePayload[]
  validationErrors: Record<string, string>
}
```

---

## 📈 EnhancedRecentActivity

### Descrição
Feed de atividades em tempo real com sistema de filtros avançado.

### Props Interface
```typescript
interface EnhancedRecentActivityProps {
  activities?: Activity[]               // Atividades estáticas
  maxItems?: number                    // Limite de itens (default: 50)
  enableRealtime?: boolean             // Socket.IO (default: true)
  showFilters?: boolean                // Exibir filtros (default: true)
}

interface Activity {
  id: string
  type: 'message_sent' | 'message_received' | 'instance_connected' | 'instance_disconnected' | 'webhook_received'
  instanceId: string
  timestamp: Date
  details: Record<string, any>
  status: 'success' | 'warning' | 'error'
}
```

### Sistema de Filtros

#### 🔍 Filtro por Tipo
```typescript
const activityFilters = [
  { value: 'all', label: 'Todas as atividades', icon: ListBulletIcon },
  { value: 'message_sent', label: 'Mensagens enviadas', icon: PaperAirplaneIcon },
  { value: 'message_received', label: 'Mensagens recebidas', icon: InboxIcon },
  { value: 'instance_connected', label: 'Conexões', icon: WifiIcon },
  { value: 'webhook_received', label: 'Webhooks', icon: BoltIcon }
]
```

#### 📅 Filtro por Período
```typescript
const timeFilters = [
  { value: 'all', label: 'Todo período' },
  { value: '1h', label: 'Última hora' },
  { value: '24h', label: 'Últimas 24h' },
  { value: '7d', label: 'Últimos 7 dias' }
]
```

### Funcionalidades

#### 🔄 Atualização em Tempo Real
```typescript
// Socket.IO listener para novas atividades
socket.on('activity:new', (newActivity: Activity) => {
  setActivities(prev => [newActivity, ...prev.slice(0, maxItems - 1)])
})
```

#### 📱 Interface Expansível
- Vista compacta: Mostra 5 itens iniciais
- Vista expandida: Mostra até `maxItems`
- Scroll infinito (se implementado)
- Loading states durante carregamento

#### 🎨 Ícones Contextuais
```typescript
const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'message_sent': return <PaperAirplaneIcon className="w-4 h-4 text-blue-500" />
    case 'message_received': return <InboxIcon className="w-4 h-4 text-green-500" />
    case 'instance_connected': return <WifiIcon className="w-4 h-4 text-emerald-500" />
    case 'instance_disconnected': return <WifiSlashIcon className="w-4 h-4 text-red-500" />
    case 'webhook_received': return <BoltIcon className="w-4 h-4 text-yellow-500" />
  }
}
```

---

## 💬 SimpleWhatsAppInterface

### Descrição
Réplica fiel da interface WhatsApp Web com tema verde característico.

### Funcionalidades Principais

#### 📱 Lista de Contatos
```typescript
interface Contact {
  id: string
  name: string
  phone: string
  avatar?: string
  lastMessage?: string
  lastMessageTime?: Date
  unreadCount: number
  isOnline: boolean
}
```

#### 🔍 Busca de Contatos
- Busca em tempo real por nome ou telefone
- Debouncing para performance
- Highlighting de termos encontrados

#### 💬 Interface de Chat
```typescript
interface Message {
  id: string
  contactId: string
  content: string
  type: 'text' | 'image' | 'document' | 'audio'
  timestamp: Date
  isFromMe: boolean
  status: 'sent' | 'delivered' | 'read' | 'failed'
}
```

#### ✅ Status de Mensagens
- **Enviado**: Ícone de check simples
- **Entregue**: Ícone de check duplo cinza
- **Lido**: Ícone de check duplo azul
- **Falhou**: Ícone de exclamação vermelho

### Tema WhatsApp
```css
/* Cores características do WhatsApp */
.whatsapp-green: #075E54
.whatsapp-light-green: #128C7E
.whatsapp-teal: #25D366
.whatsapp-blue: #34B7F1
.whatsapp-gray: #ECE5DD
```

---

## 🤖 AutomationBuilder

### Descrição
Sistema no-code para criação de automações complexas com triggers e ações.

### Estrutura de Automação
```typescript
interface AutomationRule {
  id: string
  name: string
  description: string
  isActive: boolean
  trigger: AutomationTrigger
  actions: AutomationAction[]
  conditions?: AutomationCondition[]
  statistics: AutomationStats
  createdAt: Date
  updatedAt: Date
}
```

### Tipos de Triggers

#### 🔤 Trigger de Palavra-chave
```typescript
interface KeywordTrigger {
  type: 'keyword'
  config: {
    keywords: string[]
    matchType: 'exact' | 'contains' | 'starts_with' | 'ends_with'
    caseSensitive: boolean
  }
}
```

#### ⏰ Trigger de Agendamento
```typescript
interface TimeTrigger {
  type: 'time'
  config: {
    schedule: 'once' | 'daily' | 'weekly' | 'monthly'
    datetime: Date
    timezone: string
    repeat?: {
      days?: number[]  // 0-6 (domingo-sábado)
      hours?: number[] // 0-23
    }
  }
}
```

#### 🔗 Trigger de Webhook
```typescript
interface WebhookTrigger {
  type: 'webhook'
  config: {
    url: string
    method: 'GET' | 'POST'
    headers?: Record<string, string>
    authType?: 'none' | 'basic' | 'bearer'
    credentials?: {
      username?: string
      password?: string
      token?: string
    }
  }
}
```

#### 👤 Trigger de Novo Contato
```typescript
interface NewContactTrigger {
  type: 'new_contact'
  config: {
    delay?: number  // Delay em minutos antes de executar
    conditions?: {
      fromGroup?: boolean
      hasProfilePicture?: boolean
      namePattern?: string
    }
  }
}
```

### Tipos de Ações

#### 📨 Enviar Mensagem
```typescript
interface SendMessageAction {
  type: 'send_message'
  config: {
    messageType: 'text' | 'image' | 'document' | 'template'
    content: string
    mediaUrl?: string
    variables?: Record<string, string>  // {{name}}, {{phone}}, etc.
  }
}
```

#### 🏷️ Adicionar Tag
```typescript
interface AddTagAction {
  type: 'add_tag'
  config: {
    tags: string[]
    category?: string
  }
}
```

#### 🔗 Chamar Webhook
```typescript
interface WebhookAction {
  type: 'webhook'
  config: {
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers?: Record<string, string>
    body?: Record<string, any>
    timeout?: number
  }
}
```

#### ⏱️ Delay
```typescript
interface DelayAction {
  type: 'delay'
  config: {
    duration: number  // Em minutos
    unit: 'minutes' | 'hours' | 'days'
  }
}
```

### Sistema de Condições
```typescript
interface AutomationCondition {
  field: 'contact.name' | 'contact.phone' | 'message.content' | 'time.hour' | 'time.day'
  operator: 'equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than'
  value: string | number | boolean
  logicalOperator?: 'AND' | 'OR'
}
```

### Estatísticas de Automação
```typescript
interface AutomationStats {
  triggered: number      // Quantas vezes foi acionada
  successful: number     // Execuções bem-sucedidas
  failed: number         // Execuções falhadas
  lastTriggered?: Date   // Última vez acionada
  lastError?: string     // Último erro registrado
  avgExecutionTime: number // Tempo médio de execução (ms)
}
```

---

## 📊 AdvancedMetrics

### Descrição
Sistema avançado de métricas com gráficos, tendências e exportação de relatórios.

### Dados de Métricas
```typescript
interface MetricData {
  timestamp: string
  messagesSent: number
  messagesReceived: number
  instancesConnected: number
  responseTime: number      // em milissegundos
  errorRate: number         // percentual 0-100
}

interface PerformanceMetric {
  name: string
  current: number
  previous: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  color: string
}
```

### Cálculo de Tendências
```typescript
const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
  const diff = ((current - previous) / previous) * 100
  if (Math.abs(diff) < 5) return 'stable'  // Mudança < 5% = estável
  return diff > 0 ? 'up' : 'down'
}

// Para métricas onde "menor é melhor" (erro, latência)
const invertedTrend = calculateTrend(previous, current)
```

### Períodos de Análise
```typescript
const periods = {
  '1h': { intervals: 12, intervalMs: 5 * 60 * 1000 },      // 5 min
  '6h': { intervals: 72, intervalMs: 5 * 60 * 1000 },      // 5 min  
  '24h': { intervals: 288, intervalMs: 5 * 60 * 1000 },    // 5 min
  '7d': { intervals: 168, intervalMs: 60 * 60 * 1000 },    // 1 hour
  '30d': { intervals: 720, intervalMs: 6 * 60 * 60 * 1000 } // 6 hours
}
```

### Funcionalidade de Exportação
```typescript
interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv'
  dateRange: 'today' | 'week' | 'month' | 'custom'
  metrics: string[]
  customRange?: {
    start: string
    end: string
  }
}
```

---

## 🔌 useSocket Hook

### Descrição
Hook customizado para gerenciamento centralizado de Socket.IO com reconexão inteligente.

### Interface Completa
```typescript
interface UseSocketOptions {
  autoConnect?: boolean              // Conecta automaticamente (default: true)
  reconnectionAttempts?: number      // Tentativas de reconexão (default: 5)
  reconnectionDelay?: number         // Delay entre tentativas (default: 2000ms)
}

interface UseSocketReturn {
  // Estado da conexão
  socketState: SocketState
  isConnected: boolean
  isConnecting: boolean
  
  // Dados em tempo real
  realtimeData: RealtimeData
  timeSinceLastUpdate: number | null
  
  // Métodos de controle
  connect: () => void
  disconnect: () => void
  joinInstanceRoom: (instanceId: string) => void
  leaveInstanceRoom: (instanceId: string) => void
  
  // Envio de mensagens
  sendMessageViaSocket: (payload: MessagePayload, options?: SendOptions) => Promise<MessageResponse>
}
```

### Estados da Conexão
```typescript
interface SocketState {
  isConnecting: boolean
  isConnected: boolean
  error: string | null
  lastConnected: Date | null
  reconnectAttempts: number
  currentRoom: string | null
}
```

### Gerenciamento de Salas
```typescript
// Entrar em sala específica de instância
const joinInstanceRoom = (instanceId: string) => {
  if (socket && isConnected) {
    socket.emit('join:instance', instanceId)
    setSocketState(prev => ({ ...prev, currentRoom: instanceId }))
  }
}

// Sair da sala atual
const leaveInstanceRoom = (instanceId: string) => {
  if (socket && isConnected) {
    socket.emit('leave:instance', instanceId)
    setSocketState(prev => ({ ...prev, currentRoom: null }))
  }
}
```

### Reconexão Inteligente
```typescript
const handleReconnection = () => {
  let attempts = 0
  const maxAttempts = reconnectionAttempts || 5
  const delay = reconnectionDelay || 2000
  
  const reconnect = () => {
    if (attempts < maxAttempts) {
      attempts++
      setTimeout(() => {
        connect()
        if (!isConnected) reconnect()
      }, delay * attempts) // Backoff exponencial
    } else {
      setSocketState(prev => ({ 
        ...prev, 
        error: 'Falha na reconexão após múltiplas tentativas' 
      }))
    }
  }
  
  reconnect()
}
```

### Cleanup e Performance
```typescript
useEffect(() => {
  return () => {
    // Cleanup ao desmontar componente
    if (socket) {
      socket.removeAllListeners()
      socket.disconnect()
    }
  }
}, [])

// Debouncing para atualizações frequentes
const debouncedUpdate = useMemo(
  () => debounce((data: any) => {
    setRealtimeData(prev => ({ ...prev, ...data }))
  }, 100),
  []
)
```

---

## 🛠️ Utilitários e Helpers

### Formatação de Dados
```typescript
// Formatação de tempo
const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return 'Agora'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min atrás`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`
  return `${Math.floor(diff / 86400000)}d atrás`
}

// Formatação de números
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('pt-BR').format(num)
}

// Formatação de telefone brasileiro
const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, '+$1 ($2) $3-$4')
}
```

### Validações
```typescript
// Validação de telefone brasileiro
const isValidBrazilianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '')
  return /^55\d{10,11}$/.test(cleaned)
}

// Validação de URL
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Validação de email
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
```

---

**📚 Esta documentação é um recurso vivo e deve ser atualizada conforme o projeto evolui.**

*Última atualização: 31 de Julho, 2025*
