'use client'

import React, { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { RealtimeDashboard } from './RealtimeDashboard'
import { MessageSenderOptimized } from './MessageSenderOptimized'
import WhatsAppPanel from './WhatsAppPanel'

interface Instance {
  id: string
  name: string
  phone?: string
  status: 'connected' | 'disconnected' | 'connecting' | 'qr_pending'
  lastActivity?: string | undefined
  messageCount?: number
}

interface DashboardStats {
  totalInstances: number
  connectedInstances: number
  totalMessages: number
  messagesLastHour: number
  queueSize: number
  uptime: string
}

interface DashboardProps {
  initialInstances?: Instance[]
  initialStats?: DashboardStats
}

export const DashboardPrincipal: React.FC<DashboardProps> = ({ 
  initialInstances = [],
  initialStats
}) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [instances, setInstances] = useState<Instance[]>(initialInstances)
  const [stats, setStats] = useState<DashboardStats>(initialStats || {
    totalInstances: 0,
    connectedInstances: 0,
    totalMessages: 0,
    messagesLastHour: 0,
    queueSize: 0,
    uptime: '0h 0m'
  })
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'send'>('overview')
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  useEffect(() => {
    // Conectar ao socket.io
    const newSocket = io(process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000')
    setSocket(newSocket)

    // Eventos de conexão
    newSocket.on('connect', () => {
      setConnectionStatus('connected')
      console.log('✅ Conectado ao servidor')
    })

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected')
      console.log('❌ Desconectado do servidor')
    })

    // Eventos de dados em tempo real
    newSocket.on('stats_updated', (newStats: DashboardStats) => {
      setStats(newStats)
    })

    newSocket.on('instance_status_updated', (data: { instanceId: string; status: string; lastActivity?: string }) => {
      setInstances(prev => prev.map(instance => 
        instance.id === data.instanceId 
          ? { ...instance, status: data.status as Instance['status'], lastActivity: data.lastActivity || undefined }
          : instance
      ))
    })

    newSocket.on('new_instance_added', (newInstance: Instance) => {
      setInstances(prev => [...prev, newInstance])
      setStats(prev => ({ ...prev, totalInstances: prev.totalInstances + 1 }))
    })

    newSocket.on('instance_removed', (instanceId: string) => {
      setInstances(prev => prev.filter(instance => instance.id !== instanceId))
      setStats(prev => ({ ...prev, totalInstances: prev.totalInstances - 1 }))
    })

    // Carregar dados iniciais
    loadInitialData()

    return () => {
      newSocket.close()
    }
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Carregar instâncias
      const instancesResponse = await fetch(`${process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000'}/api/instances`)
      if (instancesResponse.ok) {
        const instancesData = await instancesResponse.json()
        setInstances(instancesData.instances || [])
      }

      // Carregar estatísticas
      const statsResponse = await fetch(`${process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000'}/api/dashboard/stats`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConnectionStatusColor = (): string => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600'
      case 'connecting': return 'text-yellow-600'
      default: return 'text-red-600'
    }
  }

  const getConnectionStatusIcon = (): string => {
    switch (connectionStatus) {
      case 'connected': return '🟢'
      case 'connecting': return '🟡'
      default: return '🔴'
    }
  }

  const getTabIcon = (tab: string): string => {
    switch (tab) {
      case 'overview': return '📊'
      case 'chat': return '💬'
      case 'send': return '📤'
      default: return '📱'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Carregando Dashboard</h2>
          <p className="text-gray-600">Conectando ao servidor e carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">WA</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">WhatsApp Dashboard</h1>
              </div>
              
              <div className="hidden md:flex items-center space-x-2">
                <span className={`text-sm ${getConnectionStatusColor()}`}>
                  {getConnectionStatusIcon()} {connectionStatus}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{stats.connectedInstances}</span>
                <span className="mx-1">/</span>
                <span>{stats.totalInstances}</span>
                <span className="ml-1">instâncias conectadas</span>
              </div>
              
              <div className="text-sm text-gray-600">
                <span className="font-medium">{stats.totalMessages}</span>
                <span className="ml-1">mensagens hoje</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Visão Geral', description: 'Dashboard principal com estatísticas em tempo real' },
              { id: 'chat', label: 'Painel WhatsApp', description: 'Interface de chat estilo WhatsApp Web' },
              { id: 'send', label: 'Enviar Mensagem', description: 'Ferramenta para envio de mensagens individuais' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{getTabIcon(tab.id)}</span>
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Informações sobre a aba ativa */}
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-2xl mr-3">
                {getTabIcon(activeTab)}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-blue-900 mb-1">
                  {activeTab === 'overview' && 'Visão Geral do Sistema'}
                  {activeTab === 'chat' && 'Painel de Mensagens WhatsApp'}
                  {activeTab === 'send' && 'Envio de Mensagens'}
                </h2>
                <p className="text-blue-800 text-sm">
                  {activeTab === 'overview' && 'Acompanhe em tempo real o status das suas instâncias WhatsApp, estatísticas de mensagens e atividade do sistema.'}
                  {activeTab === 'chat' && 'Interface completa estilo WhatsApp Web para gerenciar conversas, enviar mensagens e acompanhar atividades em tempo real.'}
                  {activeTab === 'send' && 'Ferramenta otimizada para envio rápido de mensagens individuais com validação instantânea e feedback em tempo real.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo da aba ativa */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <RealtimeDashboard />
          )}

          {activeTab === 'chat' && (
            <WhatsAppPanel 
              instances={instances}
            />
          )}

          {activeTab === 'send' && (
            <MessageSenderOptimized 
              instances={instances}
            />
          )}
        </div>
      </main>

      {/* Footer com informações do sistema */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>📱 WhatsApp API Dashboard</span>
              <span>•</span>
              <span>⏱️ Uptime: {stats.uptime}</span>
              <span>•</span>
              <span>📊 Fila: {stats.queueSize} mensagens</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span>Status:</span>
              <span className={`font-medium ${getConnectionStatusColor()}`}>
                {getConnectionStatusIcon()} {connectionStatus}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default DashboardPrincipal
