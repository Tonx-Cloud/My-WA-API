'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import useSocket from '../../hooks/useSocket'

interface MetricData {
  timestamp: string
  messagesSent: number
  messagesReceived: number
  instancesConnected: number
  responseTime: number
  errorRate: number
}

interface PerformanceMetric {
  name: string
  current: number
  previous: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  color: string
}

export default function AdvancedMetrics() {
  const { isConnected } = useSocket({ autoConnect: true })
  const [selectedPeriod, setSelectedPeriod] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h')
  const [metricsHistory, setMetricsHistory] = useState<MetricData[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Função para calcular intervalos baseada no período selecionado
  const getIntervalSettings = (period: string) => {
    switch (period) {
      case '1h':
        return { intervals: 12, intervalMs: 5 * 60 * 1000 }
      case '6h':
        return { intervals: 72, intervalMs: 5 * 60 * 1000 }
      case '24h':
        return { intervals: 288, intervalMs: 5 * 60 * 1000 }
      case '7d':
        return { intervals: 168, intervalMs: 60 * 60 * 1000 }
      case '30d':
        return { intervals: 720, intervalMs: 6 * 60 * 60 * 1000 }
      default:
        return { intervals: 288, intervalMs: 5 * 60 * 1000 }
    }
  }

  // Simular dados históricos
  useEffect(() => {
    const generateHistoricalData = (): MetricData[] => {
      const data: MetricData[] = []
      const now = new Date()
      const { intervals, intervalMs } = getIntervalSettings(selectedPeriod)

      for (let i = intervals; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - (i * intervalMs))

        data.push({
          timestamp: timestamp.toISOString(),
          messagesSent: Math.floor(Math.random() * 1000) + 500,
          messagesReceived: Math.floor(Math.random() * 800) + 400,
          instancesConnected: Math.floor(Math.random() * 10) + 5,
          responseTime: Math.random() * 500 + 100,
          errorRate: Math.random() * 5
        })
      }
      return data
    }

    setMetricsHistory(generateHistoricalData())
    setLastUpdate(new Date())
  }, [selectedPeriod])

  // Calcular métricas de performance
  const performanceMetrics = useMemo((): PerformanceMetric[] => {
    if (metricsHistory.length < 2) return []

    const current = metricsHistory[metricsHistory.length - 1]
    const previous = metricsHistory[metricsHistory.length - 2]

    if (!current || !previous) return []

    const calculateTrend = (curr: number, prev: number): 'up' | 'down' | 'stable' => {
      const diff = ((curr - prev) / prev) * 100
      if (Math.abs(diff) < 5) return 'stable'
      return diff > 0 ? 'up' : 'down'
    }

    return [
      {
        name: 'Mensagens/Hora',
        current: current.messagesSent,
        previous: previous.messagesSent,
        unit: 'msg/h',
        trend: calculateTrend(current.messagesSent, previous.messagesSent),
        color: '#10B981'
      },
      {
        name: 'Tempo de Resposta',
        current: Math.round(current.responseTime),
        previous: Math.round(previous.responseTime),
        unit: 'ms',
        trend: calculateTrend(previous.responseTime, current.responseTime),
        color: '#3B82F6'
      },
      {
        name: 'Taxa de Erro',
        current: Math.round(current.errorRate * 10) / 10,
        previous: Math.round(previous.errorRate * 10) / 10,
        unit: '%',
        trend: calculateTrend(previous.errorRate, current.errorRate),
        color: '#EF4444'
      },
      {
        name: 'Instâncias Ativas',
        current: current.instancesConnected,
        previous: previous.instancesConnected,
        unit: 'inst',
        trend: calculateTrend(current.instancesConnected, previous.instancesConnected),
        color: '#F59E0B'
      }
    ]
  }, [metricsHistory])

  const formatChartData = useMemo(() => {
    return metricsHistory.map((item: MetricData) => ({
      time: new Date(item.timestamp).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      messagesSent: item.messagesSent,
      messagesReceived: item.messagesReceived,
      instances: item.instancesConnected,
      responseTime: Math.round(item.responseTime),
      errorRate: Math.round(item.errorRate * 10) / 10
    }))
  }, [metricsHistory])

  const refreshData = () => {
    setLastUpdate(new Date())
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com controles */}
      <div className="bg-white rounded-lg shadow-lg border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <ChartBarIcon className="w-7 h-7 text-blue-600 mr-3" />
              Métricas Avançadas
            </h2>
            <p className="text-gray-600 mt-1">
              Análise detalhada de performance e tendências do sistema
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-0">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Selecionar período de análise"
            >
              <option value="1h">Última hora</option>
              <option value="6h">Últimas 6 horas</option>
              <option value="24h">Últimas 24 horas</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
            </select>

            <button
              onClick={refreshData}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Atualizar
            </button>

            <button
              onClick={() => alert('Função de exportação será implementada na próxima versão')}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Dados em tempo real' : 'Conexão perdida'}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <ClockIcon className="w-4 h-4 mr-1" />
              Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
            </div>
          </div>
        </div>
      </div>

      {/* Cards de métricas de performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric) => {
          const getTrendBgColor = () => {
            if (metric.trend === 'up') return 'bg-green-100'
            if (metric.trend === 'down') return 'bg-red-100'
            return 'bg-gray-100'
          }

          const getTrendIcon = () => {
            if (metric.trend === 'up') return <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
            if (metric.trend === 'down') return <ArrowTrendingDownIcon className="w-6 h-6 text-red-600" />
            return <CogIcon className="w-6 h-6 text-gray-600" />
          }

          const getTrendTextColor = () => {
            if (metric.trend === 'up') return 'text-green-600'
            if (metric.trend === 'down') return 'text-red-600'
            return 'text-gray-600'
          }

          const getTrendArrow = () => {
            if (metric.trend === 'up') return '↗'
            if (metric.trend === 'down') return '↘'
            return '→'
          }

          return (
            <div key={metric.name} className="bg-white rounded-lg shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {metric.current.toLocaleString()} {metric.unit}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${getTrendBgColor()}`}>
                  {getTrendIcon()}
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center">
                  <span className={`text-sm font-medium ${getTrendTextColor()}`}>
                    {getTrendArrow()} 
                    {Math.abs(((metric.current - metric.previous) / metric.previous) * 100).toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Gráfico de mensagens simplificado */}
      <div className="bg-white rounded-lg shadow-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Volume de Mensagens (Período: {selectedPeriod})
        </h3>
        <div className="h-64 flex items-end space-x-1">
          {formatChartData.slice(-20).map((item) => {
            const sentHeight = Math.max((item.messagesSent / 1500) * 100, 2)
            const receivedHeight = Math.max((item.messagesReceived / 1500) * 100, 2)
            
            return (
              <div key={`${item.time}-chart`} className="flex-1 flex flex-col items-center">
                <div className="flex flex-col justify-end h-48 space-y-1">
                  <div 
                    className="bg-green-500 rounded-t w-full transition-all duration-200"
                    style={{ height: `${sentHeight}%` }}
                    title={`Enviadas: ${item.messagesSent}`}
                  ></div>
                  <div 
                    className="bg-blue-500 rounded-t w-full transition-all duration-200"
                    style={{ height: `${receivedHeight}%` }}
                    title={`Recebidas: ${item.messagesReceived}`}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 mt-1 truncate">
                  {item.time}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center space-x-4 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Enviadas</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Recebidas</span>
          </div>
        </div>
      </div>

      {/* Resumo de métricas */}
      <div className="bg-white rounded-lg shadow-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Resumo do Período ({selectedPeriod})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatChartData.reduce((acc, item) => acc + item.messagesSent + item.messagesReceived, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total de Mensagens</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatChartData.length > 0 ? Math.round(formatChartData.reduce((acc, item) => acc + item.responseTime, 0) / formatChartData.length) : 0} ms
            </div>
            <div className="text-sm text-gray-600">Tempo Resp. Médio</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatChartData.length > 0 ? (formatChartData.reduce((acc, item) => acc + item.errorRate, 0) / formatChartData.length).toFixed(1) : 0}%
            </div>
            <div className="text-sm text-gray-600">Taxa de Erro Média</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatChartData.length > 0 ? Math.max(...formatChartData.map(item => item.instances)) : 0}
            </div>
            <div className="text-sm text-gray-600">Pico de Instâncias</div>
          </div>
        </div>
      </div>
    </div>
  )
}
