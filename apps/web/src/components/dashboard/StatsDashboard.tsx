'use client';

import {
  DevicePhoneMobileIcon,
  ChatBubbleLeftRightIcon,
  QueueListIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { DashboardStats } from '@my-wa-api/shared';

interface StatsDashboardProps {
  stats: DashboardStats;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'purple';
}

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = 'blue',
}: StatCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {trend && (
              <div
                className={`flex items-center text-sm ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                )}
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
      </div>
    </div>
  );
};

export default function StatsDashboard({ stats }: StatsDashboardProps) {
  const connectionRate =
    stats.totalInstances > 0
      ? ((stats.connectedInstances / stats.totalInstances) * 100).toFixed(1)
      : '0';

  const totalMessages = stats.messagesSentToday + stats.messagesReceivedToday;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="InstÃ¢ncias Conectadas"
        value={`${stats.connectedInstances}/${stats.totalInstances}`}
        description={`${connectionRate}% de conexÃ£o`}
        icon={DevicePhoneMobileIcon}
        color="blue"
        trend={{
          value: 12,
          isPositive: true,
        }}
      />

      <StatCard
        title="Mensagens Hoje"
        value={totalMessages.toLocaleString()}
        description={`${stats.messagesSentToday} enviadas Â· ${stats.messagesReceivedToday} recebidas`}
        icon={ChatBubbleLeftRightIcon}
        color="green"
        trend={{
          value: 8,
          isPositive: true,
        }}
      />

      <StatCard
        title="Filas Ativas"
        value={stats.activeQueues}
        description="Processamento em andamento"
        icon={QueueListIcon}
        color="yellow"
      />

      <StatCard
        title="Tempo Ativo"
        value={stats.systemUptime}
        description="Sistema funcionando"
        icon={ClockIcon}
        color="purple"
      />
    </div>
  );
}
