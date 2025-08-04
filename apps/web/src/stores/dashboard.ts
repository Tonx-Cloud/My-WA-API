'use client';

import { create } from 'zustand';
import { DashboardStats, NotificationItem, SystemConfig } from '@my-wa-api/shared';

interface DashboardStore {
  // Stats
  stats: DashboardStats | null;
  setStats: (stats: DashboardStats) => void;

  // Notifications
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Config
  config: SystemConfig;
  setConfig: (config: Partial<SystemConfig>) => void;

  // Loading states
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  // Stats
  stats: null,
  setStats: stats => set({ stats }),

  // Notifications
  notifications: [],
  unreadCount: 0,
  addNotification: notification => {
    const newNotification: NotificationItem = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    set(state => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: id => {
    set(state => ({
      notifications: state.notifications.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(notif => ({ ...notif, read: true })),
      unreadCount: 0,
    }));
  },

  // UI State
  sidebarOpen: true,
  setSidebarOpen: open => set({ sidebarOpen: open }),

  // Config
  config: {
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
  setConfig: config => set(state => ({ config: { ...state.config, ...config } })),

  // Loading states
  loading: false,
  setLoading: loading => set({ loading }),
}));
