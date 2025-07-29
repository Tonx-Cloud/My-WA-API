'use client'

import { 
  UsersIcon, 
  ChatBubbleLeftRightIcon, 
  ClockIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline'
import { DashboardStats } from '@my-wa-api/shared'

interface EnhancedStatsCardsProps {
  stats: DashboardStats
}

export default function EnhancedStatsCards({ stats }: EnhancedStatsCardsProps) {
  const cards = [
    {
      name: 'Instâncias Conectadas',
      value: `${stats.connectedInstances}/${stats.totalInstances}`,
      icon: UsersIcon,
      gradient: 'from-purple-400 via-pink-500 to-red-500',
      description: 'Instâncias ativas'
    },
    {
      name: 'Mensagens Enviadas Hoje',
      value: stats.messagesSentToday.toLocaleString(),
      icon: ChatBubbleLeftRightIcon,
      gradient: 'from-blue-400 via-blue-500 to-blue-600',
      description: 'Total do dia'
    },
    {
      name: 'Mensagens Recebidas Hoje',
      value: stats.messagesReceivedToday.toLocaleString(),
      icon: ChatBubbleLeftRightIcon,
      gradient: 'from-green-400 via-green-500 to-green-600',
      description: 'Total do dia'
    },
    {
      name: 'Filas Ativas',
      value: stats.activeQueues.toString(),
      icon: ClockIcon,
      gradient: 'from-yellow-400 via-orange-500 to-red-500',
      description: 'Em processamento'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div 
            key={card.name} 
            className={`bg-gradient-to-br ${card.gradient} text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">{card.name}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
                <p className="text-white/70 text-xs mt-2">{card.description}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <Icon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
