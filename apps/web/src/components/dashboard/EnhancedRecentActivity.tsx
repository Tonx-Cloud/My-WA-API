'use client';

import React, { useState } from 'react';
import {
  CloudIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  WifiIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import useSocket from '../../hooks/useSocket';

interface ActivityItem {
  id: string;
  type: 'connection' | 'message' | 'webhook' | 'error' | 'instance';
  title: string;
  description?: string;
  timestamp: Date;
  status?: 'online' | 'success' | 'warning' | 'error' | 'info';
  instanceId?: string;
  metadata?: Record<string, any>;
}

interface EnhancedRecentActivityProps {
  maxItems?: number;
  showRealtime?: boolean;
  autoRefresh?: boolean;
}

export default function EnhancedRecentActivity({
  maxItems = 10,
  showRealtime = true,
  autoRefresh = true,
}: EnhancedRecentActivityProps) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  // Socket para dados em tempo real
  const { realtimeData, isConnected, timeSinceLastUpdate } = useSocket({
    autoConnect: showRealtime,
  });

  // Usar atividades em tempo real se disponÃ­vel
  const activities =
    showRealtime && realtimeData.recentActivities.length > 0 ? realtimeData.recentActivities : [];

  // Atividades filtradas
  const filteredActivities =
    filter === 'all' ? activities : activities.filter(activity => activity.type === filter);

  // Mostrar apenas algumas atividades se nÃ£o expandido
  const displayedActivities = expanded
    ? filteredActivities.slice(0, maxItems * 2)
    : filteredActivities.slice(0, maxItems);

  // FunÃ§Ã£o para obter Ã­cone baseado no tipo
  const getActivityIcon = (type: string, status?: string) => {
    const baseClasses = 'w-5 h-5';

    switch (type) {
      case 'connection':
        if (status === 'online') {
          return <WifiIcon className={`${baseClasses} text-green-500`} />;
        }
        return <SignalIcon className={`${baseClasses} text-red-500`} />;
      case 'message':
        return <ChatBubbleLeftRightIcon className={`${baseClasses} text-blue-500`} />;
      case 'webhook':
        return <CloudIcon className={`${baseClasses} text-purple-500`} />;
      case 'error':
        return <ExclamationTriangleIcon className={`${baseClasses} text-red-500`} />;
      case 'instance':
        return <CheckCircleIcon className={`${baseClasses} text-green-500`} />;
      default:
        return <ClockIcon className={`${baseClasses} text-gray-400`} />;
    }
  };

  // FunÃ§Ã£o para obter label de filtro
  const getFilterLabel = (filterType: string): string => {
    switch (filterType) {
      case 'all':
        return 'Todos';
      case 'connection':
        return 'ConexÃµes';
      case 'message':
        return 'Mensagens';
      case 'instance':
        return 'InstÃ¢ncias';
      case 'error':
        return 'Erros';
      default:
        return filterType;
    }
  };

  // FunÃ§Ã£o para obter label de status
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'success':
        return 'Sucesso';
      case 'warning':
        return 'Aviso';
      case 'error':
        return 'Erro';
      case 'info':
        return 'Info';
      default:
        return status;
    }
  };

  // FunÃ§Ã£o para formatar mensagem de atualizaÃ§Ã£o
  const getUpdateMessage = (): string => {
    if (!showRealtime || !isConnected) {
      return 'Modo estÃ¡tico';
    }

    const timeText = timeSinceLastUpdate ? `${timeSinceLastUpdate}s atrÃ¡s` : 'agora';
    return `Tempo real â€¢ Atualizado ${timeText}`;
  };

  // FunÃ§Ã£o para obter cor de status
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // FunÃ§Ã£o para formatar timestamp
  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrÃ¡s`;
    if (hours < 24) return `${hours}h atrÃ¡s`;
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrÃ¡s`;

    return timestamp.toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-500 p-2 rounded-lg">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Atividades Recentes</h3>
              <p className="text-sm text-gray-500">{getUpdateMessage()}</p>
            </div>
          </div>

          {/* Status de conexÃ£o */}
          {showRealtime && (
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center space-x-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">Online</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs font-medium">Offline</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="mt-4 flex space-x-2">
          {['all', 'connection', 'message', 'instance', 'error'].map(filterType => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                filter === filterType
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {getFilterLabel(filterType)}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de atividades */}
      <div className="p-6">
        {displayedActivities.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma atividade recente</p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-2 text-blue-500 hover:text-blue-700 text-sm"
              >
                Ver todas as atividades
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedActivities.map((activity, index) => (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Ãcone */}
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type, activity.status)}
                </div>

                {/* ConteÃºdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      )}

                      {/* Metadata */}
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <span
                              key={key}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                            >
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Status e timestamp */}
                    <div className="flex flex-col items-end space-y-1 ml-4">
                      {activity.status && (
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded border ${getStatusColor(activity.status)}`}
                        >
                          {getStatusLabel(activity.status)}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* BotÃ£o expandir/colapsar */}
            {filteredActivities.length > maxItems && (
              <div className="text-center pt-4 border-t border-gray-100">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {expanded ? (
                    <>
                      <ChevronUpIcon className="w-4 h-4" />
                      <span>Mostrar menos</span>
                    </>
                  ) : (
                    <>
                      <ChevronDownIcon className="w-4 h-4" />
                      <span>Mostrar mais ({filteredActivities.length - maxItems} restantes)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
