'use client'

import { useState, useEffect } from 'react'
import { DashboardStats } from '@my-wa-api/shared'
import StatsDashboard from '@/components/dashboard/StatsDashboard'
import UsageChart from '@/components/dashboard/UsageChart'
import RecentActivity from '@/components/dashboard/RecentActivity'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInstances: 0,
    connectedInstances: 0,
    messagesSentToday: 0,
    messagesReceivedToday: 0,
    activeQueues: 0,
    systemUptime: '0h 0m'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar estatísticas do backend
        const response = await fetch('/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setStats(data.data)
        } else {
          // Fallback para dados mock em desenvolvimento
          const mockStats: DashboardStats = {
            totalInstances: 5,
            connectedInstances: 3,
            messagesSentToday: 1247,
            messagesReceivedToday: 892,
            activeQueues: 12,
            systemUptime: '2d 14h 32m'
          }
          setStats(mockStats)
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error)
        // Fallback para dados mock
        const mockStats: DashboardStats = {
          totalInstances: 5,
          connectedInstances: 3,
          messagesSentToday: 1247,
          messagesReceivedToday: 892,
          activeQueues: 12,
          systemUptime: '2d 14h 32m'
        }
        setStats(mockStats)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    
    // Atualizar estatísticas a cada 30 segundos
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Visão geral do sistema de WhatsApp API
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm text-gray-600">Sistema Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <StatsDashboard stats={stats} />

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UsageChart />
        <RecentActivity />
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Status do Sistema
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">CPU</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full">
                  <div className="w-6 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-green-600">23%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Memória</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full">
                  <div className="w-20 h-2 bg-yellow-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-yellow-600">67%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Disco</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full">
                  <div className="w-14 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-green-600">45%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-medium text-blue-600">{stats.systemUptime}</span>
            </div>
          </div>
        </div>

        {/* Quick Statistics */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Métricas Principais
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">98.5%</p>
              <p className="text-sm text-blue-700">Taxa de Entrega</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">156</p>
              <p className="text-sm text-green-700">Webhooks Ativos</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">1.2s</p>
              <p className="text-sm text-purple-700">Tempo Resposta</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">99.9%</p>
              <p className="text-sm text-orange-700">Disponibilidade</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
