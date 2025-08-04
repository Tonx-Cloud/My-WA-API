'use client';

import { useEffect } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import { useDashboardStore } from '@/stores/dashboard';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarOpen, addNotification } = useDashboardStore();

  useEffect(() => {
    // Simulate some initial notifications
    addNotification({
      type: 'success',
      title: 'Sistema Inicializado',
      message: 'Dashboard carregado com sucesso!',
    });

    addNotification({
      type: 'info',
      title: 'Bem-vindo',
      message: 'Acesse o menu lateral para navegar pelas funcionalidades.',
    });
  }, [addNotification]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className={`${sidebarOpen ? 'lg:pl-72' : ''} transition-all duration-300`}>
        <TopBar />

        <main className="flex-1">
          <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
