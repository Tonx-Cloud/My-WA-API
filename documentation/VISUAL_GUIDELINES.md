﻿# ðŸŽ¨ Guia de ConsistÃªncia Visual - Dashboard WhatsApp

## ðŸŽ¯ Paleta de Cores Oficial

### ðŸŸ¢ Cores Principais WhatsApp

```css
/* Verde Principal */
--whatsapp-500: #25d366 --whatsapp-600: #16a34a --whatsapp-700: #15803d
  /* Verde Escuro (CabeÃ§alho) */ --whatsapp-dark-500: #128c7e --whatsapp-dark-600: #0f7a6e
  --whatsapp-dark-900: #075e54 /* Azul (Links e AÃ§Ãµes) */ --whatsapp-blue: #34b7f1;
```

### ðŸ“Š Cores de Status

```css
/* Estados de ConexÃ£o */
--status-connected: #25d366 --status-connecting: #fbbf24 --status-disconnected: #6b7280
  --status-error: #ef4444 /* Indicadores */ --success: #25d366 --warning: #fbbf24 --error: #ef4444
  --info: #34b7f1;
```

### ðŸŽ¨ Cores SemÃ¢nticas

```css
/* Mensagens */
--message-sent: #dcf8c6 /* Verde claro */ --message-received: #ffffff /* Branco */
  --message-system: #fff3cd /* Amarelo claro */ /* Fundos */ --bg-chat: #ece5dd /* Fundo do chat */
  --bg-sidebar: #f0f0f0 /* Sidebar */ --bg-header: #075e54 /* CabeÃ§alho */;
```

---

## ðŸ“ Sistema de EspaÃ§amento

### ðŸ”² Grid System

```typescript
// Responsivo padrÃ£o para cards de estatÃ­sticas
'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';

// Dashboard principal
'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3';

// MÃ©tricas avanÃ§adas
'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
```

### ðŸ“ EspaÃ§amentos PadrÃ£o

```css
/* Gaps */
gap-2   /* 8px  - Elementos pequenos */
gap-4   /* 16px - Componentes relacionados */
gap-6   /* 24px - SeÃ§Ãµes diferentes */
gap-8   /* 32px - Grandes divisÃµes */

/* Padding interno */
p-3     /* 12px - Cards compactos */
p-4     /* 16px - Cards padrÃ£o */
p-6     /* 24px - Cards expandidos */
p-8     /* 32px - Containers principais */

/* Margens */
mb-4    /* 16px - Entre seÃ§Ãµes */
mb-6    /* 24px - Entre grupos */
mt-8    /* 32px - SeparaÃ§Ã£o principal */
```

---

## ðŸ”¤ Tipografia

### ðŸ“ Hierarquia de Textos

```css
/* TÃ­tulos */
text-3xl font-bold        /* H1 - TÃ­tulo principal */
text-2xl font-semibold    /* H2 - TÃ­tulos de seÃ§Ã£o */
text-xl font-medium       /* H3 - SubtÃ­tulos */
text-lg font-medium       /* H4 - Cards importantes */

/* ConteÃºdo */
text-base font-normal     /* Texto padrÃ£o */
text-sm font-medium       /* Labels e metadados */
text-xs font-normal       /* Texto auxiliar */

/* Especiais */
text-2xl font-bold        /* Valores de estatÃ­sticas */
text-xs text-gray-500     /* Timestamps */
```

### ðŸŽ¯ Pesos de Fonte

```css
font-normal     /* 400 - Texto comum */
font-medium     /* 500 - Labels importantes */
font-semibold   /* 600 - TÃ­tulos secundÃ¡rios */
font-bold       /* 700 - TÃ­tulos principais e valores */
```

---

## ðŸ”˜ Componentes Base

### ðŸŽ›ï¸ BotÃµes

```typescript
// PrimÃ¡rio (AÃ§Ãµes principais)
<Button variant="primary" size="md">
  Enviar Mensagem
</Button>

// SecundÃ¡rio (AÃ§Ãµes secundÃ¡rias)
<Button variant="secondary" size="md">
  ConfiguraÃ§Ãµes
</Button>

// Outline (AÃ§Ãµes neutras)
<Button variant="outline" size="md">
  Cancelar
</Button>

// Destrutivo (AÃ§Ãµes perigosas)
<Button variant="destructive" size="sm">
  Excluir
</Button>
```

### ðŸ’³ Cards

```typescript
// PadrÃ£o com sombra
<Card variant="default" padding="md">
  ConteÃºdo do card
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

### ðŸ·ï¸ Badges/Status

```typescript
// Status de conexÃ£o
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

### ðŸ‘¤ Avatares

```typescript
// Tamanhos padrÃ£o
<Avatar size="sm" src="/avatar.jpg" />    /* 32x32 */
<Avatar size="md" src="/avatar.jpg" />    /* 40x40 */
<Avatar size="lg" src="/avatar.jpg" />    /* 48x48 */

// Com indicador online
<Avatar size="md" src="/avatar.jpg" online />

// Com fallback
<Avatar size="md" fallback="JD" />
```

---

## ðŸ”„ Estados e AnimaÃ§Ãµes

### âš¡ TransiÃ§Ãµes PadrÃ£o

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

### ðŸŽ­ AnimaÃ§Ãµes Especiais

```css
/* Loading spinner */
animate-spin

/* Pulse para indicadores */
animate-pulse

/* Bounce para notificaÃ§Ãµes */
animate-bounce-in

/* Fade in para novos elementos */
animate-fade-in

/* Slide up para modais */
animate-slide-up
```

### ðŸ” Indicadores de Estado

```typescript
// ConexÃ£o real-time
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

## ðŸ“± Responsividade

### ðŸ“ Breakpoints

```css
/* Mobile first */
sm:   640px   /* Tablet pequeno */
md:   768px   /* Tablet */
lg:   1024px  /* Desktop pequeno */
xl:   1280px  /* Desktop */
2xl:  1536px  /* Desktop grande */
```

### ðŸ“Š Layout Responsivo

```typescript
// Stats Cards (1â†’2â†’3â†’5 colunas)
'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';

// Dashboard principal (1â†’2â†’3 colunas)
'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3';

// Sidebar responsiva
'hidden lg:block lg:w-64';

// Mobile menu
'block lg:hidden';
```

### ðŸ“² OtimizaÃ§Ãµes Mobile

```css
/* Touch targets maiores */
min-h-[44px]    /* iOS guideline */
min-w-[44px]

/* Texto legÃ­vel */
text-base       /* MÃ­nimo 16px no mobile */

/* EspaÃ§amento adequado */
p-4 sm:p-6      /* Mais padding em telas maiores */
gap-4 sm:gap-6  /* Gaps responsivos */
```

---

## ðŸŽ¯ PadrÃµes de UX

### ðŸ’¬ Interface de Chat

```typescript
// Mensagem enviada (direita, verde)
<div className="ml-auto max-w-xs bg-whatsapp-500 text-white rounded-lg p-3">
  <p>Sua mensagem aqui</p>
  <div className="text-xs opacity-75 mt-1">14:30 âœ“âœ“</div>
</div>

// Mensagem recebida (esquerda, branca)
<div className="mr-auto max-w-xs bg-white rounded-lg p-3 shadow-sm">
  <p>Mensagem recebida</p>
  <div className="text-xs text-gray-500 mt-1">14:28</div>
</div>
```

### ðŸ“Š Cards de EstatÃ­sticas

```typescript
// Estrutura padrÃ£o
<StatCard
  title="MÃ©trica"
  value="1,234"
  description="DescriÃ§Ã£o da mÃ©trica"
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

### ðŸ”” NotificaÃ§Ãµes

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

## ðŸŽ¨ Temas e VariaÃ§Ãµes

### ðŸŒ™ Modo Escuro (Futuro)

```css
/* Cores para modo escuro */
--dark-bg-primary: #111827 --dark-bg-secondary: #1f2937 --dark-text-primary: #f9fafb
  --dark-text-secondary: #d1d5db;
```

### ðŸŽ­ VariaÃ§Ãµes de Marca

```css
/* WhatsApp Business */
--business-primary: #00d856 --business-secondary: #00a944 /* WhatsApp Web Classic */
  --classic-primary: #25d366 --classic-secondary: #128c7e;
```

---

## ðŸ“ Checklist de ConsistÃªncia

### âœ… Cores

- [ ] Usar paleta WhatsApp oficial
- [ ] Cores de status consistentes
- [ ] Contrastes acessÃ­veis (WCAG AA)
- [ ] Cores semÃ¢nticas apropriadas

### âœ… Tipografia

- [ ] Hierarquia clara de tÃ­tulos
- [ ] Tamanhos legÃ­veis (min 14px)
- [ ] Pesos apropriados
- [ ] Line-height adequada

### âœ… EspaÃ§amento

- [ ] Grid system responsivo
- [ ] EspaÃ§amentos mÃºltiplos de 4px
- [ ] Consistency em padding/margin
- [ ] Touch targets de 44px+

### âœ… Componentes

- [ ] Estados visuais claros
- [ ] Feedback de interaÃ§Ã£o
- [ ] Loading states
- [ ] Error states

### âœ… AnimaÃ§Ãµes

- [ ] TransiÃ§Ãµes suaves
- [ ] Performance otimizada
- [ ] ReduÃ§Ã£o de movimento respeitada
- [ ] Indicadores de progresso

---

**ðŸŽ¨ Este guia garante consistÃªncia visual em todo o dashboard WhatsApp.**

_Ãšltima atualizaÃ§Ã£o: 31 de Julho, 2025_