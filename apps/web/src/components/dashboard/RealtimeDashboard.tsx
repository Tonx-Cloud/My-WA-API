import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface Instance {
  id: string;
  name: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'qr_pending';
  phone?: string | undefined;
  lastActivity?: Date | undefined;
  qrCode?: string | undefined;
}

interface Message {
  id: string;
  instanceId: string;
  from: string;
  to: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'audio';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
}

interface Activity {
  id: string;
  type: 'message_sent' | 'message_received' | 'instance_connected' | 'instance_disconnected';
  instanceId: string;
  instanceName: string;
  description: string;
  timestamp: Date;
  icon: string;
}

export const RealtimeDashboard: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeQueues, setActiveQueues] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Conectar ao socket.io
    const newSocket = io(process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000');
    setSocket(newSocket);

    // Listeners de conexão
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Conectado ao servidor em tempo real');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Desconectado do servidor');
    });

    // Listeners de instâncias
    newSocket.on(
      'instance_status_updated',
      (data: { instanceId: string; status: string; phone?: string }) => {
        setInstances(prev =>
          prev.map(instance => {
            if (instance.id === data.instanceId) {
              return {
                ...instance,
                status: data.status as Instance['status'],
                phone: data.phone,
                lastActivity: new Date(),
              };
            }
            return instance;
          })
        );
        setLastUpdate(new Date());

        // Adicionar atividade
        addActivity({
          type: data.status === 'connected' ? 'instance_connected' : 'instance_disconnected',
          instanceId: data.instanceId,
          instanceName: instances.find(i => i.id === data.instanceId)?.name || 'Instância',
          description: `Status alterado para: ${getStatusText(data.status)}`,
          icon: data.status === 'connected' ? '🟢' : '🔴',
        });
      }
    );

    // Listeners de mensagens
    newSocket.on('message_sent', (data: Message) => {
      setRecentMessages(prev => [data, ...prev.slice(0, 9)]); // Manter apenas 10 mensagens
      setLastUpdate(new Date());

      addActivity({
        type: 'message_sent',
        instanceId: data.instanceId,
        instanceName: instances.find(i => i.id === data.instanceId)?.name || 'Instância',
        description: `Mensagem enviada para ${data.to}`,
        icon: '📤',
      });
    });

    newSocket.on('message_received', (data: Message) => {
      setRecentMessages(prev => [data, ...prev.slice(0, 9)]);
      setLastUpdate(new Date());

      addActivity({
        type: 'message_received',
        instanceId: data.instanceId,
        instanceName: instances.find(i => i.id === data.instanceId)?.name || 'Instância',
        description: `Mensagem recebida de ${data.from}`,
        icon: '📥',
      });
    });

    // Listeners de filas
    newSocket.on('queue_updated', (data: { active: number }) => {
      setActiveQueues(data.active);
      setLastUpdate(new Date());
    });

    // Cleanup
    return () => {
      newSocket.close();
    };
  }, []);

  const addActivity = (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    setActivities(prev => [newActivity, ...prev.slice(0, 19)]); // Manter apenas 20 atividades
  };

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      connecting: 'Conectando',
      connected: 'Conectado',
      disconnected: 'Desconectado',
      qr_pending: 'Aguardando QR Code',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      connecting: 'text-yellow-500',
      connected: 'text-green-500',
      disconnected: 'text-red-500',
      qr_pending: 'text-blue-500',
    };
    return colorMap[status] || 'text-gray-500';
  };

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s atrás`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min atrás`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`;
    return `${Math.floor(seconds / 86400)}d atrás`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header com Status de Conexão */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard WhatsApp</h1>
          <p className="text-gray-600">Monitoramento em tempo real</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <div className="text-sm text-gray-500">Atualizado {formatTimeAgo(lastUpdate)}</div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">📱</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Instâncias Ativas</p>
              <p className="text-2xl font-bold text-gray-900">
                {instances.filter(i => i.status === 'connected').length}
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            {instances.filter(i => i.status === 'connecting').length} conectando
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">💬</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Mensagens Hoje</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  recentMessages.filter(m => {
                    const today = new Date();
                    const messageDate = new Date(m.timestamp);
                    return messageDate.toDateString() === today.toDateString();
                  }).length
                }
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            {recentMessages.filter(m => m.status === 'delivered').length} entregues
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Filas Ativas</p>
              <p className="text-2xl font-bold text-gray-900">{activeQueues}</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">Processando mensagens</div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Taxa de Sucesso</p>
              <p className="text-2xl font-bold text-gray-900">
                {recentMessages.length > 0
                  ? Math.round(
                      (recentMessages.filter(m => m.status === 'delivered').length /
                        recentMessages.length) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">Últimas 24h</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instâncias em Tempo Real */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Instâncias WhatsApp</h2>
            <p className="text-sm text-gray-600">Status atualizado automaticamente</p>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {instances.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-4 block">📱</span>
                <p>Nenhuma instância criada ainda</p>
                <p className="text-sm">Crie sua primeira instância para começar</p>
              </div>
            ) : (
              instances.map(instance => (
                <div
                  key={instance.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        instance.status === 'connected'
                          ? 'bg-green-500'
                          : instance.status === 'connecting'
                            ? 'bg-yellow-500'
                            : instance.status === 'qr_pending'
                              ? 'bg-blue-500'
                              : 'bg-red-500'
                      }`}
                    ></div>
                    <div>
                      <p className="font-medium text-gray-900">{instance.name}</p>
                      <p className="text-sm text-gray-600">{instance.phone || 'Não conectado'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getStatusColor(instance.status)}`}>
                      {getStatusText(instance.status)}
                    </p>
                    {instance.lastActivity && (
                      <p className="text-xs text-gray-500">
                        {formatTimeAgo(instance.lastActivity)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Atividades Recentes */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Atividades Recentes</h2>
            <p className="text-sm text-gray-600">Histórico em tempo real</p>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-4 block">📋</span>
                <p>Nenhuma atividade ainda</p>
                <p className="text-sm">As atividades aparecerão aqui conforme acontecem</p>
              </div>
            ) : (
              activities.map(activity => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg"
                >
                  <span className="text-xl">{activity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.instanceName}</p>
                    <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
