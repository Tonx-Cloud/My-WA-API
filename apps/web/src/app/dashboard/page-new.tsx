'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import StatsDashboard from '@/components/dashboard/StatsDashboard';
import UsageChart from '@/components/dashboard/UsageChart';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { useDashboardStore } from '@/stores/dashboard-new';
import { DashboardStats } from '@my-wa-api/shared';

export default function DashboardPage() {
  const { stats, updateStats } = useDashboardStore();
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  // Processar token OAuth quando chegada do callback
  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));

        // Salvar no localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Definir cookie para o middleware
        document.cookie = `token=${token}; path=/; max-age=86400`; // 24h

        console.log('Login OAuth concluído com sucesso:', user);

        // Limpar parâmetros da URL
        window.history.replaceState({}, '', '/dashboard');
      } catch (err) {
        console.error('Erro ao processar dados OAuth:', err);
      }
    }
  }, [searchParams]);

  // Buscar dados do dashboard
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar estatísticas do backend
        const response = await fetch('/api/dashboard/stats', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          updateStats(data.data);
        } else {
          // Fallback para dados mock em desenvolvimento
          const mockStats: DashboardStats = {
            totalInstances: 3,
            connectedInstances: 2,
            messagesSentToday: 1247,
            messagesReceivedToday: 892,
            activeQueues: 5,
            systemUptime: '2d 14h 32m',
          };
          updateStats(mockStats);
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        // Fallback para dados mock
        const mockStats: DashboardStats = {
          totalInstances: 3,
          connectedInstances: 2,
          messagesSentToday: 1247,
          messagesReceivedToday: 892,
          activeQueues: 5,
          systemUptime: '2d 14h 32m',
        };
        updateStats(mockStats);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Atualizar estatísticas a cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [updateStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">Visão geral do sistema WhatsApp API</p>
      </div>

      {/* Estatísticas principais */}
      <StatsDashboard stats={stats} />

      {/* Gráficos de uso */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UsageChart />
        <RecentActivity />
      </div>
    </div>
  );
}
