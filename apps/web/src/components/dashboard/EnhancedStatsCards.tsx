'use client';

import React from 'react';
import {
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { DashboardStats } from '@my-wa-api/shared';
import useSocket from '../../hooks/useSocket';
import { Card, StatusIndicator, StatCard } from '../ui';
import { cn } from '../../lib/utils';

interface EnhancedStatsCardsProps {
  readonly stats?: DashboardStats | null;
  readonly showRealtime?: boolean;
}

export default function EnhancedStatsCards({
  stats: propStats,
  showRealtime = true,
}: EnhancedStatsCardsProps) {
  const { realtimeData, socketState, isConnected, timeSinceLastUpdate } = useSocket({
    autoConnect: showRealtime,
  });

  // Usar dados em tempo real se disponÃ­veis, senÃ£o usar props
  const stats = showRealtime && realtimeData.stats ? realtimeData.stats : propStats;

  const formatTimeSinceUpdate = (seconds: number | null): string => {
    if (!seconds) return 'Nunca';
    if (seconds < 60) return `${seconds}s atrÃ¡s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min atrÃ¡s`;
    return `${Math.floor(seconds / 3600)}h atrÃ¡s`;
  };

  const getConnectionStatusColor = (): string => {
    if (!showRealtime) return 'text-gray-500';
    if (isConnected) return 'text-green-500';
    return 'text-red-500';
  };

  const getConnectionStatusText = (): string => {
    if (!showRealtime) return 'Modo estÃ¡tico';
    if (isConnected) return 'Conectado';
    if (socketState.error) return socketState.error;
    return 'Desconectado';
  };

  return (
    <div className="space-y-6">
      {/* Status de conexÃ£o em tempo real */}
      {showRealtime && (
        <Card variant="outlined" padding="sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <StatusIndicator
                status={isConnected ? 'connected' : 'disconnected'}
                pulse={isConnected}
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Status da ConexÃ£o:</span>
                <span className={cn('text-sm font-semibold ml-2', getConnectionStatusColor())}>
                  {getConnectionStatusText()}
                </span>
              </div>
            </div>
            {isConnected && timeSinceLastUpdate !== null && (
              <div className="text-xs text-gray-500">
                Atualizado {formatTimeSinceUpdate(timeSinceLastUpdate)}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Cards de estatÃ­sticas usando StatCard */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="InstÃ¢ncias Conectadas"
          value={stats ? `${stats.connectedInstances}/${stats.totalInstances}` : '0/0'}
          description="InstÃ¢ncias ativas"
          icon={<UsersIcon className="w-6 h-6 text-white" />}
          color="bg-whatsapp-500"
          {...(stats &&
            stats.totalInstances > 0 && {
              trend: {
                value: Math.round((stats.connectedInstances / stats.totalInstances) * 100),
                isPositive: stats.connectedInstances > 0,
                label: 'Taxa de conexÃ£o',
              },
            })}
          realtime={showRealtime && isConnected}
        />

        <StatCard
          title="Mensagens Enviadas Hoje"
          value={stats ? stats.messagesSentToday.toLocaleString() : '0'}
          description="Total do dia"
          icon={<ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />}
          color="bg-green-500"
          realtime={showRealtime && isConnected}
        />

        <StatCard
          title="Mensagens Recebidas Hoje"
          value={stats ? stats.messagesReceivedToday.toLocaleString() : '0'}
          description="Total do dia"
          icon={<ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />}
          color="bg-purple-500"
          realtime={showRealtime && isConnected}
        />

        <StatCard
          title="Filas Ativas"
          value={stats ? stats.activeQueues.toString() : '0'}
          description="Em processamento"
          icon={<ClockIcon className="w-6 h-6 text-white" />}
          color="bg-orange-500"
          {...(stats &&
            stats.activeQueues > 0 && {
              trend: {
                value: stats.activeQueues,
                isPositive: stats.activeQueues < 10,
                label: 'Filas pendentes',
              },
            })}
          realtime={showRealtime && isConnected}
        />

        <StatCard
          title="Tempo Online"
          value={stats ? stats.systemUptime : '--:--:--'}
          description="Sistema ativo"
          icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
          color="bg-emerald-500"
          realtime={showRealtime && isConnected}
        />
      </div>

      {/* Indicador de erro de conexÃ£o */}
      {showRealtime && !isConnected && socketState.error && (
        <Card variant="outlined" className="border-red-200 bg-red-50">
          <div className="flex items-start space-x-3">
            <SignalIcon className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Problema de ConexÃ£o</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{socketState.error}</p>
                <p className="mt-1 text-xs">
                  Os dados podem estar desatualizados. Verifique sua conexÃ£o com a internet e tente
                  recarregar a pÃ¡gina.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
