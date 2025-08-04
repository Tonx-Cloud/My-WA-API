'use client';

import {
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { DashboardStats } from '@my-wa-api/shared';

interface StatsCardProps {
  stats: DashboardStats | null;
}

export default function StatsCards({ stats }: StatsCardProps) {
  const cards = [
    {
      name: 'Instâncias Conectadas',
      value: stats ? `${stats.connectedInstances}/${stats.totalInstances}` : '0/0',
      icon: UsersIcon,
      color: 'bg-blue-500',
      description: 'Instâncias ativas',
    },
    {
      name: 'Mensagens Enviadas Hoje',
      value: stats ? stats.messagesSentToday.toLocaleString() : '0',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-green-500',
      description: 'Total do dia',
    },
    {
      name: 'Mensagens Recebidas Hoje',
      value: stats ? stats.messagesReceivedToday.toLocaleString() : '0',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-purple-500',
      description: 'Total do dia',
    },
    {
      name: 'Filas Ativas',
      value: stats ? stats.activeQueues.toString() : '0',
      icon: ClockIcon,
      color: 'bg-orange-500',
      description: 'Em processamento',
    },
    {
      name: 'Tempo Online',
      value: stats ? stats.systemUptime : '--:--:--',
      icon: CheckCircleIcon,
      color: 'bg-emerald-500',
      description: 'Sistema ativo',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card, index) => (
        <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div
                  className={`w-8 h-8 ${card.color} rounded-md flex items-center justify-center`}
                >
                  <card.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{card.name}</dt>
                  <dd className="text-lg font-medium text-gray-900">{card.value}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500">{card.description}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
