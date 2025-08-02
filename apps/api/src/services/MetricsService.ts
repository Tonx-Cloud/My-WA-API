import { BaseService } from './BaseService';
import { performance } from 'perf_hooks';
import os from 'os';
import process from 'process';

interface MetricData {
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'bytes' | 'percent' | 'rate';
  timestamp: number;
  tags?: Record<string, string>;
}

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  userId?: number;
  instanceId?: string;
  metadata?: Record<string, any>;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    free: number;
    total: number;
    usage: number;
  };
  disk: {
    usage: number;
  };
  network: {
    connections: number;
  };
  process: {
    uptime: number;
    pid: number;
    memoryUsage: NodeJS.MemoryUsage;
  };
}

interface BusinessMetrics {
  instances: {
    total: number;
    connected: number;
    disconnected: number;
    connecting: number;
    error: number;
  };
  messages: {
    sent: number;
    received: number;
    failed: number;
    ratePerMinute: number;
  };
  users: {
    active: number;
    total: number;
    newToday: number;
  };
  api: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

export class MetricsService extends BaseService {
  private metrics: MetricData[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private systemMetricsInterval?: NodeJS.Timeout;
  private businessMetricsInterval?: NodeJS.Timeout;
  
  private readonly maxMetrics = 10000; // Manter últimas 10k métricas
  private readonly maxPerformanceMetrics = 5000;
  
  constructor() {
    super();
    this.startSystemMetricsCollection();
    this.startBusinessMetricsCollection();
  }

  /**
   * Registrar métrica customizada
   */
  recordMetric(name: string, value: number, unit: MetricData['unit'], tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags: { ...tags, service: 'whatsapp-api' }
    };

    this.metrics.push(metric);

    // Manter apenas as métricas mais recentes
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    this.logger.debug(`Métrica registrada: ${name} = ${value}${unit}`, { tags });
  }

  /**
   * Registrar métrica de performance
   */
  recordPerformance(operation: string, startTime: number, success: boolean, metadata?: Record<string, any>): void {
    const duration = performance.now() - startTime;
    
    const perfMetric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      success,
      metadata
    };

    this.performanceMetrics.push(perfMetric);

    // Registrar como métrica padrão também
    this.recordMetric(`performance.${operation}`, duration, 'ms', {
      success: success.toString(),
      ...metadata
    });

    // Manter apenas as métricas mais recentes
    if (this.performanceMetrics.length > this.maxPerformanceMetrics) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxPerformanceMetrics);
    }

    // Log para operações lentas
    if (duration > 1000) {
      this.logger.warn(`Operação lenta detectada: ${operation} levou ${duration.toFixed(2)}ms`, {
        operation,
        duration,
        success,
        metadata
      });
    }
  }

  /**
   * Incrementar contador
   */
  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.recordMetric(`counter.${name}`, value, 'count', tags);
  }

  /**
   * Registrar gauge (valor que pode subir e descer)
   */
  recordGauge(name: string, value: number, unit: MetricData['unit'] = 'count', tags?: Record<string, string>): void {
    this.recordMetric(`gauge.${name}`, value, unit, tags);
  }

  /**
   * Registrar histogram (para distribuição de valores)
   */
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric(`histogram.${name}`, value, 'ms', tags);
  }

  /**
   * Coletar métricas do sistema
   */
  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const memInfo = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const cpuUsage = await this.getCPUUsage();
    
    return {
      cpu: {
        usage: cpuUsage,
        loadAverage: os.loadavg()
      },
      memory: {
        used: usedMem,
        free: freeMem,
        total: totalMem,
        usage: (usedMem / totalMem) * 100
      },
      disk: {
        usage: await this.getDiskUsage()
      },
      network: {
        connections: await this.getNetworkConnections()
      },
      process: {
        uptime: process.uptime(),
        pid: process.pid,
        memoryUsage: memInfo
      }
    };
  }

  /**
   * Coletar métricas de negócio
   */
  private async collectBusinessMetrics(): Promise<BusinessMetrics> {
    // Aqui você integraria com seus modelos de dados reais
    // Por enquanto, retornando dados simulados
    
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Simular coleta de dados do banco
    const instanceMetrics = await this.getInstanceMetrics();
    const messageMetrics = await this.getMessageMetrics(oneMinuteAgo, now);
    const userMetrics = await this.getUserMetrics();
    const apiMetrics = await this.getAPIMetrics(oneMinuteAgo, now);

    return {
      instances: instanceMetrics,
      messages: messageMetrics,
      users: userMetrics,
      api: apiMetrics
    };
  }

  /**
   * Obter uso de CPU
   */
  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();

      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const currentTime = process.hrtime(startTime);
        
        const totalTime = currentTime[0] * 1e6 + currentTime[1] / 1e3; // microseconds
        const totalUsage = currentUsage.user + currentUsage.system;
        const cpuPercent = (totalUsage / totalTime) * 100;
        
        resolve(Math.min(100, Math.max(0, cpuPercent)));
      }, 100);
    });
  }

  /**
   * Obter uso de disco (simulado)
   */
  private async getDiskUsage(): Promise<number> {
    // Em produção, você usaria uma biblioteca como 'diskusage'
    return Math.random() * 100;
  }

  /**
   * Obter conexões de rede (simulado)
   */
  private async getNetworkConnections(): Promise<number> {
    // Em produção, você coletaria dados reais de conexões
    return Math.floor(Math.random() * 100);
  }

  /**
   * Obter métricas de instâncias (simulado)
   */
  private async getInstanceMetrics() {
    // Integrar com WhatsAppInstanceModel
    return {
      total: 150,
      connected: 120,
      disconnected: 20,
      connecting: 8,
      error: 2
    };
  }

  /**
   * Obter métricas de mensagens (simulado)
   */
  private async getMessageMetrics(startTime: number, endTime: number) {
    const messagesInPeriod = Math.floor(Math.random() * 1000);
    return {
      sent: messagesInPeriod,
      received: Math.floor(messagesInPeriod * 0.8),
      failed: Math.floor(messagesInPeriod * 0.05),
      ratePerMinute: messagesInPeriod
    };
  }

  /**
   * Obter métricas de usuários (simulado)
   */
  private async getUserMetrics() {
    return {
      active: 45,
      total: 200,
      newToday: 5
    };
  }

  /**
   * Obter métricas de API (baseado em métricas coletadas)
   */
  private async getAPIMetrics(startTime: number, endTime: number) {
    const recentMetrics = this.performanceMetrics.filter(
      m => m.timestamp >= startTime && m.timestamp <= endTime
    );

    const totalRequests = recentMetrics.length;
    const avgResponseTime = totalRequests > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests 
      : 0;
    
    const errorCount = recentMetrics.filter(m => !m.success).length;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    return {
      requestsPerMinute: totalRequests,
      averageResponseTime: avgResponseTime,
      errorRate
    };
  }

  /**
   * Iniciar coleta automática de métricas do sistema
   */
  private startSystemMetricsCollection(): void {
    this.systemMetricsInterval = setInterval(async () => {
      try {
        const metrics = await this.collectSystemMetrics();
        
        // Registrar métricas de CPU
        this.recordGauge('system.cpu.usage', metrics.cpu.usage, 'percent');
        metrics.cpu.loadAverage.forEach((load, index) => {
          this.recordGauge(`system.cpu.load.${index + 1}min`, load, 'count');
        });

        // Registrar métricas de memória
        this.recordGauge('system.memory.used', metrics.memory.used, 'bytes');
        this.recordGauge('system.memory.free', metrics.memory.free, 'bytes');
        this.recordGauge('system.memory.usage', metrics.memory.usage, 'percent');

        // Registrar métricas de processo
        this.recordGauge('process.uptime', metrics.process.uptime, 'count');
        this.recordGauge('process.memory.rss', metrics.process.memoryUsage.rss, 'bytes');
        this.recordGauge('process.memory.heapUsed', metrics.process.memoryUsage.heapUsed, 'bytes');
        this.recordGauge('process.memory.heapTotal', metrics.process.memoryUsage.heapTotal, 'bytes');

        // Registrar métricas de disco e rede
        this.recordGauge('system.disk.usage', metrics.disk.usage, 'percent');
        this.recordGauge('system.network.connections', metrics.network.connections, 'count');

      } catch (error) {
        this.logger.error('Erro ao coletar métricas do sistema:', error);
      }
    }, 30000); // A cada 30 segundos
  }

  /**
   * Iniciar coleta automática de métricas de negócio
   */
  private startBusinessMetricsCollection(): void {
    this.businessMetricsInterval = setInterval(async () => {
      try {
        const metrics = await this.collectBusinessMetrics();
        
        // Registrar métricas de instâncias
        this.recordGauge('business.instances.total', metrics.instances.total);
        this.recordGauge('business.instances.connected', metrics.instances.connected);
        this.recordGauge('business.instances.disconnected', metrics.instances.disconnected);
        this.recordGauge('business.instances.connecting', metrics.instances.connecting);
        this.recordGauge('business.instances.error', metrics.instances.error);

        // Registrar métricas de mensagens
        this.recordGauge('business.messages.sent', metrics.messages.sent);
        this.recordGauge('business.messages.received', metrics.messages.received);
        this.recordGauge('business.messages.failed', metrics.messages.failed);
        this.recordGauge('business.messages.rate', metrics.messages.ratePerMinute, 'rate');

        // Registrar métricas de usuários
        this.recordGauge('business.users.active', metrics.users.active);
        this.recordGauge('business.users.total', metrics.users.total);
        this.recordGauge('business.users.new_today', metrics.users.newToday);

        // Registrar métricas de API
        this.recordGauge('business.api.requests_per_minute', metrics.api.requestsPerMinute, 'rate');
        this.recordGauge('business.api.avg_response_time', metrics.api.averageResponseTime, 'ms');
        this.recordGauge('business.api.error_rate', metrics.api.errorRate, 'percent');

      } catch (error) {
        this.logger.error('Erro ao coletar métricas de negócio:', error);
      }
    }, 60000); // A cada 1 minuto
  }

  /**
   * Obter métricas filtradas por período
   */
  getMetrics(startTime?: number, endTime?: number, nameFilter?: string): MetricData[] {
    let filtered = this.metrics;

    if (startTime) {
      filtered = filtered.filter(m => m.timestamp >= startTime);
    }

    if (endTime) {
      filtered = filtered.filter(m => m.timestamp <= endTime);
    }

    if (nameFilter) {
      filtered = filtered.filter(m => m.name.includes(nameFilter));
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Obter métricas de performance
   */
  getPerformanceMetrics(operation?: string, startTime?: number, endTime?: number): PerformanceMetric[] {
    let filtered = this.performanceMetrics;

    if (operation) {
      filtered = filtered.filter(m => m.operation.includes(operation));
    }

    if (startTime) {
      filtered = filtered.filter(m => m.timestamp >= startTime);
    }

    if (endTime) {
      filtered = filtered.filter(m => m.timestamp <= endTime);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Obter resumo de métricas
   */
  getMetricsSummary(): {
    totalMetrics: number;
    totalPerformanceMetrics: number;
    lastSystemUpdate: number;
    lastBusinessUpdate: number;
    topOperations: Array<{ operation: string; count: number; avgDuration: number }>;
  } {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    const recentPerf = this.performanceMetrics.filter(m => m.timestamp >= oneHourAgo);
    
    // Agrupar por operação
    const operationStats = recentPerf.reduce((acc, metric) => {
      if (!acc[metric.operation]) {
        acc[metric.operation] = { count: 0, totalDuration: 0 };
      }
      // Remove a verificação redundante já que acabamos de criar o objeto
      acc[metric.operation]!.count++;
      acc[metric.operation]!.totalDuration += metric.duration;
      return acc;
    }, {} as Record<string, { count: number; totalDuration: number }>);

    const topOperations = Object.entries(operationStats)
      .map(([operation, stats]) => ({
        operation,
        count: stats.count,
        avgDuration: stats.totalDuration / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalMetrics: this.metrics.length,
      totalPerformanceMetrics: this.performanceMetrics.length,
      lastSystemUpdate: now,
      lastBusinessUpdate: now,
      topOperations
    };
  }

  /**
   * Limpar métricas antigas
   */
  cleanup(): void {
    const now = Date.now();
    const cutoff = now - (24 * 60 * 60 * 1000); // 24 horas

    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp > cutoff);

    this.logger.debug('Limpeza de métricas concluída', {
      metricsRemaining: this.metrics.length,
      performanceMetricsRemaining: this.performanceMetrics.length
    });
  }

  /**
   * Parar coleta de métricas
   */
  stop(): void {
    if (this.systemMetricsInterval) {
      clearInterval(this.systemMetricsInterval);
    }
    if (this.businessMetricsInterval) {
      clearInterval(this.businessMetricsInterval);
    }
    this.logger.info('Coleta de métricas parada');
  }
}

// Exportar instância singleton
export const metricsService = new MetricsService();
