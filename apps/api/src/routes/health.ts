import * as express from 'express'
import { Request, Response } from 'express'
import { performanceHealthCheck, getPerformanceReport } from '../config/performance-monitor'
import { healthLogger } from '../config/enhanced-logger'

const router = express.Router()

// Interface para health check response
type HealthStatus = 'healthy' | 'warning' | 'critical'
type ServiceStatus = 'up' | 'down' | 'degraded'

interface HealthCheckResponse {
  status: HealthStatus
  timestamp: number
  uptime: number
  services: {
    [key: string]: {
      status: ServiceStatus
      responseTime?: number
      lastCheck: number
      message?: string
    }
  }
  performance: {
    status: HealthStatus
    details: any
  }
  system: {
    memory: NodeJS.MemoryUsage
    cpu: {
      loadAverage: number[]
    }
    process: {
      pid: number
      version: string
      uptime: number
    }
  }
  version: string
}

// Cache para armazenar status dos serviços
const servicesStatus = new Map<string, any>()

// Função para verificar saúde de um serviço específico
async function checkServiceHealth(serviceName: string): Promise<{
  status: 'up' | 'down' | 'degraded'
  responseTime?: number
  message?: string
}> {
  const startTime = Date.now()
  
  try {
    switch (serviceName) {
      case 'whatsapp':
        // Simular verificação do serviço WhatsApp
        await new Promise(resolve => setTimeout(resolve, 50))
        return {
          status: 'up',
          responseTime: Date.now() - startTime,
          message: 'WhatsApp service is operational'
        }
        
      case 'database':
        // Simular verificação do banco de dados
        await new Promise(resolve => setTimeout(resolve, 30))
        return {
          status: 'up',
          responseTime: Date.now() - startTime,
          message: 'Database connection is healthy'
        }
        
      case 'redis':
        // Simular verificação do Redis
        await new Promise(resolve => setTimeout(resolve, 20))
        return {
          status: 'up',
          responseTime: Date.now() - startTime,
          message: 'Redis cache is operational'
        }
        
      default:
        return {
          status: 'down',
          message: `Unknown service: ${serviceName}`
        }
    }
  } catch (error) {
    healthLogger.error('Service health check failed', {
      service: serviceName,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    })
    
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Service check failed'
    }
  }
}

// Função para atualizar status dos serviços em background
async function updateServicesStatus(): Promise<void> {
  const services = ['whatsapp', 'database', 'redis']
  
  for (const service of services) {
    try {
      const status = await checkServiceHealth(service)
      servicesStatus.set(service, {
        ...status,
        lastCheck: Date.now()
      })
    } catch (error) {
      servicesStatus.set(service, {
        status: 'down',
        lastCheck: Date.now(),
        message: error instanceof Error ? error.message : 'Health check failed'
      })
    }
  }
}

// Atualizar status dos serviços a cada 30 segundos
setInterval(updateServicesStatus, 30000)

// Inicializar status dos serviços
updateServicesStatus()

// Endpoint principal de health check
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Obter informações de performance
    const performanceHealth = performanceHealthCheck()
    
    // Obter informações do sistema
    const memoryUsage = process.memoryUsage()
    const loadAverage = process.platform === 'linux' ? require('os').loadavg() : [0, 0, 0]
    
    // Construir resposta
    const services: any = {}
    for (const [serviceName, serviceStatus] of servicesStatus.entries()) {
      services[serviceName] = serviceStatus
    }
    
    // Determinar status geral
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
    
    // Verificar status dos serviços
    const downServices = Array.from(servicesStatus.values()).filter(s => s.status === 'down')
    const degradedServices = Array.from(servicesStatus.values()).filter(s => s.status === 'degraded')
    
    if (downServices.length > 0) {
      overallStatus = 'critical'
    } else if (degradedServices.length > 0 || performanceHealth.status !== 'healthy') {
      overallStatus = 'warning'
    }
    
    // Verificar uso de memória
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
    if (memoryUsagePercent > 90) {
      overallStatus = 'critical'
    } else if (memoryUsagePercent > 75) {
      overallStatus = 'warning'
    }
    
    const healthResponse: HealthCheckResponse = {
      status: overallStatus,
      timestamp: Date.now(),
      uptime: process.uptime(),
      services,
      performance: performanceHealth,
      system: {
        memory: memoryUsage,
        cpu: {
          loadAverage
        },
        process: {
          pid: process.pid,
          version: process.version,
          uptime: process.uptime()
        }
      },
      version: process.env.npm_package_version || '1.0.0'
    }
    
    // Log do health check
    healthLogger.info('Health check performed', {
      status: overallStatus,
      servicesCount: servicesStatus.size,
      uptime: process.uptime(),
      memoryUsage: Math.round(memoryUsagePercent)
    })
    
    // Retornar status HTTP apropriado
    let statusCode: number
    if (overallStatus === 'healthy') {
      statusCode = 200
    } else if (overallStatus === 'warning') {
      statusCode = 200
    } else {
      statusCode = 503
    }
    
    res.status(statusCode).json(healthResponse)
    
  } catch (error) {
    healthLogger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    res.status(500).json({
      status: 'critical',
      timestamp: Date.now(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Endpoint para health check simples (para load balancers)
router.get('/health/simple', (req: Request, res: Response) => {
  const uptime = process.uptime()
  const memoryUsage = process.memoryUsage()
  const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
  
  // Status simples baseado em critérios básicos
  if (uptime < 10 || memoryUsagePercent > 95) {
    return res.status(503).json({ status: 'unhealthy' })
  }
  
  res.status(200).json({ 
    status: 'healthy',
    uptime: Math.floor(uptime)
  })
})

// Endpoint para readiness check (para Kubernetes)
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    // Verificar se serviços críticos estão funcionando
    const criticalServices = ['whatsapp', 'database']
    let isReady = true
    
    for (const service of criticalServices) {
      const status = servicesStatus.get(service)
      if (!status || status.status === 'down') {
        isReady = false
        break
      }
    }
    
    if (isReady) {
      res.status(200).json({ status: 'ready' })
    } else {
      res.status(503).json({ status: 'not ready' })
    }
    
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: 'Readiness check failed' })
  }
})

// Endpoint para liveness check (para Kubernetes)
router.get('/health/live', (req: Request, res: Response) => {
  // Verificação básica se o processo está vivo
  const uptime = process.uptime()
  
  if (uptime > 0) {
    res.status(200).json({ status: 'alive', uptime: Math.floor(uptime) })
  } else {
    res.status(503).json({ status: 'not alive' })
  }
})

// Endpoint para métricas detalhadas de performance
router.get('/health/metrics', (req: Request, res: Response) => {
  try {
    const performanceReport = getPerformanceReport()
    const memoryUsage = process.memoryUsage()
    
    res.json({
      timestamp: Date.now(),
      performance: performanceReport,
      system: {
        memory: {
          ...memoryUsage,
          usagePercent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
        },
        uptime: process.uptime(),
        pid: process.pid,
        version: process.version
      },
      services: Object.fromEntries(servicesStatus)
    })
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Endpoint para forçar verificação de todos os serviços
router.post('/health/check', async (req: Request, res: Response) => {
  try {
    await updateServicesStatus()
    
    res.json({
      message: 'Services health check completed',
      timestamp: Date.now(),
      services: Object.fromEntries(servicesStatus)
    })
    
  } catch (error) {
    res.status(500).json({
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
export { updateServicesStatus, servicesStatus }
