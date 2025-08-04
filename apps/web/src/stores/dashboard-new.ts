import { create } from 'zustand';
import { DashboardStats, NotificationItem, SystemConfig } from '@my-wa-api/shared';

interface DashboardStore {
  // Stats
  stats: DashboardStats;
  setStats: (stats: DashboardStats) => void;
  updateStats: (stats: Partial<DashboardStats>) => void;

  // Notifications
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentLanguage: string;
  setCurrentLanguage: (language: string) => void;

  // System config
  systemConfig: SystemConfig;
  setSystemConfig: (config: SystemConfig) => void;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  // Initial stats
  stats: {
    totalInstances: 0,
    connectedInstances: 0,
    messagesSentToday: 0,
    messagesReceivedToday: 0,
    activeQueues: 0,
    systemUptime: '0m',
  },

  setStats: stats => set({ stats }),
  updateStats: newStats =>
    set(state => ({
      stats: { ...state.stats, ...newStats },
    })),

  // Notifications
  notifications: [],

  addNotification: notification => {
    const newNotification: NotificationItem = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };

    set(state => ({
      notifications: [newNotification, ...state.notifications],
    }));
  },

  removeNotification: id =>
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    })),

  markAsRead: id =>
    set(state => ({
      notifications: state.notifications.map(n => (n.id === id ? { ...n, read: true } : n)),
    })),

  clearAllNotifications: () => set({ notifications: [] }),

  // UI State
  sidebarOpen: true,
  setSidebarOpen: open => set({ sidebarOpen: open }),
  currentLanguage: 'pt-BR',
  setCurrentLanguage: language => set({ currentLanguage: language }),

  // System config
  systemConfig: {
    language: 'pt',
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      webhook: false,
    },
    oauth: {
      google: {
        enabled: false,
      },
    },
  },

  setSystemConfig: config => set({ systemConfig: config }),
}));
