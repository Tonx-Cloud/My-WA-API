import { performance } from 'perf_hooks'
import { Request, Response, NextFunction } from 'express'
import { performanceLogger, logPerformanceMetric } from './enhanced-logger'

// Interface para métricas de performance
interface PerformanceMetric {
  operation: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
}

// Interface para estatísticas de endpoint
interface EndpointStats {
  count: number
  totalDuration: number
  averageDuration: number
  minDuration: number
  maxDuration: number
  lastAccess: number
  errorCount: number
  successCount: number
}

// Cache de métricas em memória
class PerformanceCache {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private endpointStats: Map<string, EndpointStats> = new Map()
  private readonly maxMetricsPerOperation = 1000
  private readonly metricsRetentionTime = 24 * 60 * 60 * 1000 // 24 horas

  // Adicionar métrica
  addMetric(metric: PerformanceMetric): void {
    const { operation } = metric
    
    // Adicionar à lista de métricas
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
    }
    
    const operationMetrics = this.metrics.get(operation)!
    operationMetrics.push(metric)
    
    // Limitar número de métricas por operação
    if (operationMetrics.length > this.maxMetricsPerOperation) {
      operationMetrics.shift()
    }
    
    // Atualizar estatísticas do endpoint
    this.updateEndpointStats(operation, metric)
    
    // Limpar métricas antigas
    this.cleanOldMetrics()
  }

  // Atualizar estatísticas do endpoint
  private updateEndpointStats(operation: string, metric: PerformanceMetric): void {
    if (!this.endpointStats.has(operation)) {
      this.endpointStats.set(operation, {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Number.MAX_VALUE,
        maxDuration: 0,
        lastAccess: Date.now(),
        errorCount: 0,
        successCount: 0
      })
    }
    
    const stats = this.endpointStats.get(operation)!
    stats.count++
    stats.totalDuration += metric.duration
    stats.averageDuration = stats.totalDuration / stats.count
    stats.minDuration = Math.min(stats.minDuration, metric.duration)
    stats.maxDuration = Math.max(stats.maxDuration, metric.duration)
    stats.lastAccess = Date.now()
    
    // Contar sucessos/erros baseado em metadata
    if (metric.metadata?.statusCode >= 400) {
      stats.errorCount++
    } else {
      stats.successCount++
    }
  }

  // Limpar métricas antigas
  private cleanOldMetrics(): void {
    const cutoffTime = Date.now() - this.metricsRetentionTime
    
    for (const [operation, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter(metric => metric.timestamp > cutoffTime)
      this.metrics.set(operation, filteredMetrics)
    }
  }

  // Obter estatísticas de um endpoint
  getEndpointStats(operation: string): EndpointStats | null {
    return this.endpointStats.get(operation) || null
  }

  // Obter todas as estatísticas
  getAllStats(): Record<string, EndpointStats> {
    const stats: Record<string, EndpointStats> = {}
    for (const [operation, stat] of this.endpointStats.entries()) {
      stats[operation] = { ...stat }
    }
    return stats
  }

  // Obter métricas de uma operação
  getOperationMetrics(operation: string, limit?: number): PerformanceMetric[] {
    const metrics = this.metrics.get(operation) || []
    return limit ? metrics.slice(-limit) : metrics
  }

  // Obter alertas de performance
  getPerformanceAlerts(): Array<{ operation: string; issue: string; details: any }> {
    const alerts: Array<{ operation: string; issue: string; details: any }> = []
    
    for (const [operation, stats] of this.endpointStats.entries()) {
      // Alerta para alta latência
      if (stats.averageDuration > 5000) {
        alerts.push({
          operation,
          issue: 'High Average Latency',
          details: {
            averageDuration: stats.averageDuration,
            threshold: 5000
          }
        })
      }
      
      // Alerta para alta taxa de erro
      const errorRate = stats.errorCount / stats.count
      if (errorRate > 0.1 && stats.count > 10) {
        alerts.push({
          operation,
          issue: 'High Error Rate',
          details: {
            errorRate: Math.round(errorRate * 100) + '%',
            threshold: '10%',
            totalRequests: stats.count,
            errors: stats.errorCount
          }
        })
      }
      
      // Alerta para latência máxima muito alta
      if (stats.maxDuration > 30000) {
        alerts.push({
          operation,
          issue: 'Extremely High Max Latency',
          details: {
            maxDuration: stats.maxDuration,
            threshold: 30000
          }
        })
      }
    }
    
    return alerts
  }

  // Resetar estatísticas
  reset(): void {
    this.metrics.clear()
    this.endpointStats.clear()
  }
}

// Instância global do cache de performance
const performanceCache = new PerformanceCache()

// Middleware para monitoramento de performance de requests HTTP
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = performance.now()
  const operation = `${req.method} ${req.route?.path || req.path}`
  
  // Adicionar ID único à requisição
  req.performanceId = Math.random().toString(36).substring(7)
  
  performanceLogger.debug('Request Started', {
    operation,
    requestId: req.performanceId,
    timestamp: Date.now()
  })

  // Interceptar o final da resposta
  const originalSend = res.send
  res.send = function(data: any) {
    const endTime = performance.now()
    const duration = Math.round(endTime - startTime)
    
    // Criar métrica
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      metadata: {
        statusCode: res.statusCode,
        requestId: req.performanceId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        responseSize: Buffer.byteLength(data)
      }
    }
    
    // Adicionar ao cache
    performanceCache.addMetric(metric)
    
    // Log da métrica
    logPerformanceMetric(operation, duration, metric.metadata)
    
    // Log de debug para requisições lentas
    if (duration > 5000) {
      performanceLogger.warn('Slow Request Detected', {
        operation,
        duration: `${duration}ms`,
        threshold: '5000ms',
        requestId: req.performanceId,
        statusCode: res.statusCode
      })
    }
    
    return originalSend.call(this, data)
  }
  
  next()
}

// Função para monitorar operações assíncronas
export const monitorAsyncOperation = async <T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  const startTime = performance.now()
  
  try {
    performanceLogger.debug('Async Operation Started', {
      operation: operationName,
      timestamp: Date.now(),
      ...metadata
    })
    
    const result = await operation()
    const duration = Math.round(performance.now() - startTime)
    
    // Adicionar métrica de sucesso
    const metric: PerformanceMetric = {
      operation: operationName,
      duration,
      timestamp: Date.now(),
      metadata: {
        success: true,
        ...metadata
      }
    }
    
    performanceCache.addMetric(metric)
    logPerformanceMetric(operationName, duration, metric.metadata)
    
    return result
  } catch (error) {
    const duration = Math.round(performance.now() - startTime)
    
    // Adicionar métrica de erro
    const metric: PerformanceMetric = {
      operation: operationName,
      duration,
      timestamp: Date.now(),
      metadata: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        ...metadata
      }
    }
    
    performanceCache.addMetric(metric)
    logPerformanceMetric(operationName, duration, metric.metadata)
    
    throw error
  }
}

// Função para obter relatório de performance
export const getPerformanceReport = (): {
  overview: Record<string, EndpointStats>
  alerts: Array<{ operation: string; issue: string; details: any }>
  timestamp: number
} => {
  return {
    overview: performanceCache.getAllStats(),
    alerts: performanceCache.getPerformanceAlerts(),
    timestamp: Date.now()
  }
}

// Função para obter métricas de uma operação específica
export const getOperationMetrics = (operation: string, limit?: number): PerformanceMetric[] => {
  return performanceCache.getOperationMetrics(operation, limit)
}

// Função para obter estatísticas de um endpoint
export const getEndpointStats = (operation: string): EndpointStats | null => {
  return performanceCache.getEndpointStats(operation)
}

// Middleware para health check de performance
export const performanceHealthCheck = (): {
  status: 'healthy' | 'warning' | 'critical'
  details: any
} => {
  const alerts = performanceCache.getPerformanceAlerts()
  const stats = performanceCache.getAllStats()
  
  // Calcular métricas gerais
  const operations = Object.keys(stats)
  const totalRequests = operations.reduce((sum, op) => sum + (stats[op]?.count || 0), 0)
  const averageLatency = operations.length > 0 
    ? operations.reduce((sum, op) => sum + (stats[op]?.averageDuration || 0), 0) / operations.length 
    : 0
  
  let status: 'healthy' | 'warning' | 'critical' = 'healthy'
  
  // Determinar status baseado em alertas
  if (alerts.length > 0) {
    const hasHighLatency = alerts.some(alert => alert.issue.includes('Latency'))
    const hasHighErrorRate = alerts.some(alert => alert.issue.includes('Error Rate'))
    
    if (hasHighLatency && hasHighErrorRate) {
      status = 'critical'
    } else if (alerts.length > 3) {
      status = 'critical'
    } else {
      status = 'warning'
    }
  }
  
  return {
    status,
    details: {
      totalRequests,
      averageLatency: Math.round(averageLatency),
      activeOperations: operations.length,
      alertCount: alerts.length,
      alerts: alerts.slice(0, 5), // Primeiros 5 alertas
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: Date.now()
    }
  }
}

// Função para resetar métricas (útil para testes)
export const resetPerformanceMetrics = (): void => {
  performanceCache.reset()
  performanceLogger.info('Performance metrics reset')
}

// Agendar limpeza periódica de métricas antigas
setInterval(() => {
  performanceCache['cleanOldMetrics']()
  performanceLogger.debug('Cleaned old performance metrics')
}, 60 * 60 * 1000) // A cada hora

export {
  performanceCache
}

export type {
  PerformanceMetric,
  EndpointStats
}

// Adicionar tipos ao namespace Express
declare global {
  namespace Express {
    interface Request {
      performanceId?: string
    }
  }
}