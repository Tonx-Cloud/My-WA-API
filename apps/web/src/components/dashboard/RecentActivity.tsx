'use client'

import { useState, useEffect } from 'react'

interface ActivityItem {
  id: string
  type: 'connection' | 'message' | 'webhook' | 'error'
  title: string
  timestamp: Date
  status?: 'online' | 'success' | 'warning' | 'error'
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    // Load activities from API when available
    setActivities([])
  }, [])

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500 animate-pulse'
      case 'success':
        return 'bg-blue-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'agora mesmo'
    if (diffMins === 1) return 'há 1 minuto'
    if (diffMins < 60) return `há ${diffMins} minutos`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours === 1) return 'há 1 hora'
    if (diffHours < 24) return `há ${diffHours} horas`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'há 1 dia'
    return `há ${diffDays} dias`
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Atividade Recente</h3>
        <span className="text-sm text-gray-500">Últimas atualizações</span>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(activity.status)}`}></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {activity.title}
              </p>
              <p className="text-xs text-gray-500">
                {formatTimeAgo(activity.timestamp)}
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                activity.status === 'online' ? 'bg-green-100 text-green-800' :
                activity.status === 'success' ? 'bg-blue-100 text-blue-800' :
                activity.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {activity.type}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          Ver todas as atividades
        </button>
      </div>
    </div>
  )
}
