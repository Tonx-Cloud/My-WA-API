// Design System - Cores WhatsApp
export const whatsappColors = {
  // Cores principais do WhatsApp
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#25D366', // WhatsApp Green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Verde escuro caracterÃ­stico
  dark: {
    50: '#f0f9f0',
    100: '#dcf2dc',
    200: '#b9e5b9',
    300: '#8fd48f',
    400: '#5ebd5e',
    500: '#128C7E', // WhatsApp Teal
    600: '#0f7a6e',
    700: '#0d655b',
    800: '#0c5049',
    900: '#075E54', // WhatsApp Dark Green
  },

  // Azul caracterÃ­stico
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#34B7F1', // WhatsApp Blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Cinzas do WhatsApp
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    chat: '#ECE5DD', // WhatsApp Chat Background
  },

  // Status colors
  success: '#25D366',
  warning: '#fbbf24',
  error: '#ef4444',
  info: '#34B7F1',

  // Estados especiais
  online: '#25D366',
  away: '#fbbf24',
  offline: '#6b7280',
  typing: '#34B7F1',
};

// Tamanhos padronizados
export const sizes = {
  // Avatares
  avatar: {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20',
  },

  // Ãcones
  icon: {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  },

  // Cards
  card: {
    padding: {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    },
    gap: {
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    },
  },
};

// Sombras estilizadas
export const shadows = {
  xs: 'shadow-xs',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  inner: 'shadow-inner',
  none: 'shadow-none',

  // Sombras especÃ­ficas do WhatsApp
  whatsapp: {
    card: 'shadow-lg hover:shadow-xl transition-shadow duration-200',
    floating: 'shadow-2xl',
    message: 'shadow-sm',
  },
};

// TransiÃ§Ãµes padronizadas
export const transitions = {
  all: 'transition-all duration-200 ease-in-out',
  colors: 'transition-colors duration-200 ease-in-out',
  shadow: 'transition-shadow duration-200 ease-in-out',
  transform: 'transition-transform duration-200 ease-in-out',

  // TransiÃ§Ãµes especÃ­ficas
  hover: 'hover:scale-105 transition-transform duration-200',
  press: 'active:scale-95 transition-transform duration-100',
  fade: 'transition-opacity duration-300 ease-in-out',
};

// Bordas arredondadas
export const borderRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',

  // Bordas especÃ­ficas do WhatsApp
  whatsapp: {
    message: 'rounded-lg',
    card: 'rounded-xl',
    avatar: 'rounded-full',
    button: 'rounded-lg',
  },
};

// Tipografia WhatsApp-like
export const typography = {
  // Tamanhos de fonte
  fontSize: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
  },

  // Pesos
  fontWeight: {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },

  // Alturas de linha
  lineHeight: {
    tight: 'leading-tight',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
  },
};

// Estados de conexÃ£o
export const connectionStates = {
  connected: {
    color: 'text-green-500',
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-500',
    pulse: 'bg-green-400',
  },
  connecting: {
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-500',
    pulse: 'bg-yellow-400',
  },
  disconnected: {
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    pulse: 'bg-red-400',
  },
  error: {
    color: 'text-red-600',
    bg: 'bg-red-100',
    border: 'border-red-300',
    icon: 'text-red-600',
    pulse: 'bg-red-500',
  },
};

// Layout grid system
export const grid = {
  cols: {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  },

  responsive: {
    statsCards: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    dashboard: 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
    metrics: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  },
};

// AnimaÃ§Ãµes personalizadas
export const animations = {
  // Pulsar suave
  pulse: 'animate-pulse',
  pulseSlow: 'animate-pulse-slow',

  // Bounce
  bounce: 'animate-bounce',
  bounceIn: 'animate-bounce-in',

  // Fade
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',

  // RotaÃ§Ã£o
  spin: 'animate-spin',
  spinSlow: 'animate-spin-slow',

  // WhatsApp especÃ­ficos
  typing: 'animate-pulse',
  messageSlide: 'animate-slide-up',
  connectionPulse: 'animate-pulse-slow',
};

// Z-indexes organizados
export const zIndex = {
  dropdown: 'z-10',
  sticky: 'z-20',
  fixed: 'z-30',
  modalBackdrop: 'z-40',
  modal: 'z-50',
  popover: 'z-60',
  tooltip: 'z-70',
  notification: 'z-80',
  max: 'z-[9999]',
};

export default {
  colors: whatsappColors,
  sizes,
  shadows,
  transitions,
  borderRadius,
  typography,
  connectionStates,
  grid,
  animations,
  zIndex,
};
