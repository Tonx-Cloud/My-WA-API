'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import EnhancedDashboard from '@/components/dashboard/EnhancedDashboard'
import { useDashboardStore } from '@/stores/dashboard-new'
import { DashboardStats } from '@my-wa-api/shared'

export default function DashboardPage() {
  const { stats, updateStats } = useDashboardStore()
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  // Processar token OAuth quando chegada do callback
  useEffect(() => {
    const token = searchParams.get('token')
    const userParam = searchParams.get('user')

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam))
        
        // Salvar no localStorage
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        // Definir cookie para o middleware
        document.cookie = `token=${token}; path=/; max-age=86400` // 24h
        
        console.log('Login OAuth concluído com sucesso:', user)
        
        // Limpar parâmetros da URL
        window.history.replaceState({}, '', '/dashboard')
      } catch (err) {
        console.error('Erro ao processar dados OAuth:', err)
      }
    }
  }, [searchParams])

  // Simulação de dados para desenvolvimento
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simular dados do dashboard
        const mockStats: DashboardStats = {
          totalInstances: 3,
          connectedInstances: 2,
          messagesSentToday: 1247,
          messagesReceivedToday: 892,
          activeQueues: 5,
          systemUptime: '7d 14h 32m'
        }

        updateStats(mockStats)
        // Instâncias agora são gerenciadas pelo Socket.IO no useSocket hook
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [updateStats])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Principal</h1>
        <p className="text-gray-600">
          Visão geral da sua plataforma de automação WhatsApp com sincronização em tempo real
        </p>
      </div>

      {/* Dashboard aprimorado com componentes integrados */}
      <EnhancedDashboard 
        enableRealtime={true}
        layout="grid"
        settings={{
          statsCards: {
            autoRefresh: true,
            refreshInterval: 30000
          },
          messageSender: {
            enableValidation: true,
            showTemplates: true
          },
          recentActivity: {
            maxItems: 8,
            showFilters: true
          },
          qrGenerator: {
            autoRefresh: true,
            showInstanceSelector: true
          }
        }}
      />

      {/* Seção de gráficos e métricas do sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status do sistema */}
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

        {/* Estatísticas rápidas */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resumo Rápido
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">98.5%</p>
              <p className="text-sm text-blue-700">Taxa de Entrega</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">156</p>
              <p className="text-sm text-green-700">Webhooks</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">24h</p>
              <p className="text-sm text-purple-700">Média Resposta</p>
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
