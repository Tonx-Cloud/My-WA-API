# 🎨 Guia de Consistência Visual - Dashboard WhatsApp

## 🎯 Paleta de Cores Oficial

### 🟢 Cores Principais WhatsApp

```css
/* Verde Principal */
--whatsapp-500: #25D366
--whatsapp-600: #16a34a
--whatsapp-700: #15803d

/* Verde Escuro (Cabeçalho) */
--whatsapp-dark-500: #128C7E
--whatsapp-dark-600: #0f7a6e
--whatsapp-dark-900: #075E54

/* Azul (Links e Ações) */
--whatsapp-blue: #34B7F1
```

### 📊 Cores de Status
```css
/* Estados de Conexão */
--status-connected: #25D366
--status-connecting: #fbbf24
--status-disconnected: #6b7280
--status-error: #ef4444

/* Indicadores */
--success: #25D366
--warning: #fbbf24
--error: #ef4444
--info: #34B7F1
```

### 🎨 Cores Semânticas
```css
/* Mensagens */
--message-sent: #dcf8c6     /* Verde claro */
--message-received: #ffffff  /* Branco */
--message-system: #fff3cd    /* Amarelo claro */

/* Fundos */
--bg-chat: #ECE5DD          /* Fundo do chat */
--bg-sidebar: #f0f0f0       /* Sidebar */
--bg-header: #075E54        /* Cabeçalho */
```

---

## 📐 Sistema de Espaçamento

### 🔲 Grid System
```typescript
// Responsivo padrão para cards de estatísticas
"grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"

// Dashboard principal
"grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"

// Métricas avançadas
"grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
```

### 📏 Espaçamentos Padrão
```css
/* Gaps */
gap-2   /* 8px  - Elementos pequenos */
gap-4   /* 16px - Componentes relacionados */
gap-6   /* 24px - Seções diferentes */
gap-8   /* 32px - Grandes divisões */

/* Padding interno */
p-3     /* 12px - Cards compactos */
p-4     /* 16px - Cards padrão */
p-6     /* 24px - Cards expandidos */
p-8     /* 32px - Containers principais */

/* Margens */
mb-4    /* 16px - Entre seções */
mb-6    /* 24px - Entre grupos */
mt-8    /* 32px - Separação principal */
```

---

## 🔤 Tipografia

### 📝 Hierarquia de Textos
```css
/* Títulos */
text-3xl font-bold        /* H1 - Título principal */
text-2xl font-semibold    /* H2 - Títulos de seção */
text-xl font-medium       /* H3 - Subtítulos */
text-lg font-medium       /* H4 - Cards importantes */

/* Conteúdo */
text-base font-normal     /* Texto padrão */
text-sm font-medium       /* Labels e metadados */
text-xs font-normal       /* Texto auxiliar */

/* Especiais */
text-2xl font-bold        /* Valores de estatísticas */
text-xs text-gray-500     /* Timestamps */
```

### 🎯 Pesos de Fonte
```css
font-normal     /* 400 - Texto comum */
font-medium     /* 500 - Labels importantes */
font-semibold   /* 600 - Títulos secundários */
font-bold       /* 700 - Títulos principais e valores */
```

---

## 🔘 Componentes Base

### 🎛️ Botões
```typescript
// Primário (Ações principais)
<Button variant="primary" size="md">
  Enviar Mensagem
</Button>

// Secundário (Ações secundárias)
<Button variant="secondary" size="md">
  Configurações
</Button>

// Outline (Ações neutras)
<Button variant="outline" size="md">
  Cancelar
</Button>

// Destrutivo (Ações perigosas)
<Button variant="destructive" size="sm">
  Excluir
</Button>
```

### 💳 Cards
```typescript
// Padrão com sombra
<Card variant="default" padding="md">
  Conteúdo do card
</Card>

// Elevado com hover
<Card variant="elevated" padding="lg">
  Card importante
</Card>

// Tema WhatsApp
<Card variant="whatsapp" padding="md">
  Card com estilo WhatsApp
</Card>
```

### 🏷️ Badges/Status
```typescript
// Status de conexão
<Badge variant="success" size="sm">
  Conectado
</Badge>

<Badge variant="warning" size="sm">
  Conectando...
</Badge>

<Badge variant="error" size="sm">
  Desconectado
</Badge>

// Com pulse para real-time
<Badge variant="success" pulse>
  Tempo Real
</Badge>
```

### 👤 Avatares
```typescript
// Tamanhos padrão
<Avatar size="sm" src="/avatar.jpg" />    /* 32x32 */
<Avatar size="md" src="/avatar.jpg" />    /* 40x40 */
<Avatar size="lg" src="/avatar.jpg" />    /* 48x48 */

// Com indicador online
<Avatar size="md" src="/avatar.jpg" online />

// Com fallback
<Avatar size="md" fallback="JD" />
```

---

## 🔄 Estados e Animações

### ⚡ Transições Padrão
```css
/* Hover suave */
transition-all duration-200 ease-in-out

/* Hover com escala */
hover:scale-105 transition-transform duration-200

/* Hover com sombra */
hover:shadow-xl transition-shadow duration-200

/* Estados ativos */
active:scale-95 transition-transform duration-100
```

### 🎭 Animações Especiais
```css
/* Loading spinner */
animate-spin

/* Pulse para indicadores */
animate-pulse

/* Bounce para notificações */
animate-bounce-in

/* Fade in para novos elementos */
animate-fade-in

/* Slide up para modais */
animate-slide-up
```

### 🔍 Indicadores de Estado
```typescript
// Conexão real-time
<StatusIndicator 
  status="connected" 
  pulse={true} 
  showLabel={true} 
/>

// Loading states
<LoadingSpinner size="md" color="primary" />

// Com texto
<div className="flex items-center space-x-2">
  <LoadingSpinner size="sm" />
  <span>Carregando...</span>
</div>
```

---

## 📱 Responsividade

### 📐 Breakpoints
```css
/* Mobile first */
sm:   640px   /* Tablet pequeno */
md:   768px   /* Tablet */
lg:   1024px  /* Desktop pequeno */
xl:   1280px  /* Desktop */
2xl:  1536px  /* Desktop grande */
```

### 📊 Layout Responsivo
```typescript
// Stats Cards (1→2→3→5 colunas)
"grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"

// Dashboard principal (1→2→3 colunas)
"grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"

// Sidebar responsiva
"hidden lg:block lg:w-64"

// Mobile menu
"block lg:hidden"
```

### 📲 Otimizações Mobile
```css
/* Touch targets maiores */
min-h-[44px]    /* iOS guideline */
min-w-[44px]

/* Texto legível */
text-base       /* Mínimo 16px no mobile */

/* Espaçamento adequado */
p-4 sm:p-6      /* Mais padding em telas maiores */
gap-4 sm:gap-6  /* Gaps responsivos */
```

---

## 🎯 Padrões de UX

### 💬 Interface de Chat
```typescript
// Mensagem enviada (direita, verde)
<div className="ml-auto max-w-xs bg-whatsapp-500 text-white rounded-lg p-3">
  <p>Sua mensagem aqui</p>
  <div className="text-xs opacity-75 mt-1">14:30 ✓✓</div>
</div>

// Mensagem recebida (esquerda, branca)
<div className="mr-auto max-w-xs bg-white rounded-lg p-3 shadow-sm">
  <p>Mensagem recebida</p>
  <div className="text-xs text-gray-500 mt-1">14:28</div>
</div>
```

### 📊 Cards de Estatísticas
```typescript
// Estrutura padrão
<StatCard
  title="Métrica"
  value="1,234"
  description="Descrição da métrica"
  icon={<Icon className="w-6 h-6 text-white" />}
  color="bg-whatsapp-500"
  trend={{
    value: 12,
    isPositive: true,
    label: "vs. semana passada"
  }}
  realtime={true}
/>
```

### 🔔 Notificações
```css
/* Toast de sucesso */
bg-green-50 border-green-200 text-green-800

/* Toast de erro */
bg-red-50 border-red-200 text-red-800

/* Toast de info */
bg-blue-50 border-blue-200 text-blue-800

/* Toast de warning */
bg-yellow-50 border-yellow-200 text-yellow-800
```

---

## 🎨 Temas e Variações

### 🌙 Modo Escuro (Futuro)
```css
/* Cores para modo escuro */
--dark-bg-primary: #111827
--dark-bg-secondary: #1f2937
--dark-text-primary: #f9fafb
--dark-text-secondary: #d1d5db
```

### 🎭 Variações de Marca
```css
/* WhatsApp Business */
--business-primary: #00d856
--business-secondary: #00a944

/* WhatsApp Web Classic */
--classic-primary: #25d366
--classic-secondary: #128c7e
```

---

## 📏 Checklist de Consistência

### ✅ Cores
- [ ] Usar paleta WhatsApp oficial
- [ ] Cores de status consistentes
- [ ] Contrastes acessíveis (WCAG AA)
- [ ] Cores semânticas apropriadas

### ✅ Tipografia
- [ ] Hierarquia clara de títulos
- [ ] Tamanhos legíveis (min 14px)
- [ ] Pesos apropriados
- [ ] Line-height adequada

### ✅ Espaçamento
- [ ] Grid system responsivo
- [ ] Espaçamentos múltiplos de 4px
- [ ] Consistency em padding/margin
- [ ] Touch targets de 44px+

### ✅ Componentes
- [ ] Estados visuais claros
- [ ] Feedback de interação
- [ ] Loading states
- [ ] Error states

### ✅ Animações
- [ ] Transições suaves
- [ ] Performance otimizada
- [ ] Redução de movimento respeitada
- [ ] Indicadores de progresso

---

**🎨 Este guia garante consistência visual em todo o dashboard WhatsApp.**

*Última atualização: 31 de Julho, 2025*
