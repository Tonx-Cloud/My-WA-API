#!/usr/bin/env node

/**
 * Benchmark Script
 * Executa testes de performance nos endpoints da API
 */

import { createLogger, format, transports } from 'winston';

// Configurar logger
const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.colorize(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/benchmark.log' })
  ]
});

// Verificar se fetch está disponível (Node.js 18+)
let fetch;
try {
  fetch = globalThis.fetch;
  if (!fetch) {
    const { default: nodeFetch } = await import('node-fetch');
    fetch = nodeFetch;
  }
} catch (error) {
  logger.error('Não foi possível carregar a funcionalidade de fetch:', error.message);
  process.exit(1);
}

class Benchmark {
  constructor() {
    this.endpoints = [
      { name: 'Health Check', url: 'http://localhost:3000/health', method: 'GET' },
      { name: 'Dashboard Stats', url: 'http://localhost:3000/api/dashboard/stats', method: 'GET' },
      { name: 'Instances List', url: 'http://localhost:3000/api/instances', method: 'GET' }
    ];
    
    this.config = {
      warmupRequests: 5,
      benchmarkRequests: 20,
      concurrency: 5,
      timeout: 10000
    };

    this.results = [];
  }

  async runBenchmark() {
    logger.info('⚡ Iniciando Benchmark de Performance...\n');

    for (const endpoint of this.endpoints) {
      await this.benchmarkEndpoint(endpoint);
    }

    this.printResults();
  }

  async benchmarkEndpoint(endpoint) {
    logger.info(`📊 Testando: ${endpoint.name}`);

    // Aquecimento
    logger.info(`   🔥 Aquecimento (${this.config.warmupRequests} requests)...`);
    for (let i = 0; i < this.config.warmupRequests; i++) {
      try {
        await this.makeRequest(endpoint);
      } catch (error) {
        // Ignorar erros durante aquecimento - expected behavior
        logger.debug(`Warmup request failed: ${error.message}`);
      }
    }

    // Benchmark real
    logger.info(`   ⚡ Benchmark (${this.config.benchmarkRequests} requests)...`);
    const times = [];
    const errors = [];

    for (let i = 0; i < this.config.benchmarkRequests; i++) {
      try {
        const duration = await this.makeRequest(endpoint);
        times.push(duration);
      } catch (error) {
        errors.push(error.message);
      }
    }

    // Calcular estatísticas
    if (times.length > 0) {
      const stats = this.calculateStats(times);
      this.results.push({
        endpoint: endpoint.name,
        url: endpoint.url,
        successful: times.length,
        failed: errors.length,
        ...stats
      });

      logger.info(`   ✅ Concluído: ${times.length}/${this.config.benchmarkRequests} sucessos`);
    } else {
      logger.error(`   ❌ Todos os requests falharam para ${endpoint.name}`);
    }

    logger.info('');
  }

  async makeRequest(endpoint) {
    const startTime = process.hrtime.bigint();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        signal: controller.signal,
        headers: {
          'User-Agent': 'Benchmark/1.0',
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const endTime = process.hrtime.bigint();
      return Number(endTime - startTime) / 1000000; // Convert to milliseconds

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  calculateStats(times) {
    const sorted = times.slice().sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);
    
    return {
      min: Math.round(sorted[0] * 100) / 100,
      max: Math.round(sorted[sorted.length - 1] * 100) / 100,
      mean: Math.round((sum / times.length) * 100) / 100,
      median: Math.round(sorted[Math.floor(sorted.length / 2)] * 100) / 100,
      p95: Math.round(sorted[Math.floor(sorted.length * 0.95)] * 100) / 100,
      p99: Math.round(sorted[Math.floor(sorted.length * 0.99)] * 100) / 100
    };
  }

  printResults() {
    logger.info('📊 Resultados do Benchmark:\n');

    console.log('┌─────────────────────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐');
    console.log('│ Endpoint                │ Success │ Min(ms) │ Med(ms) │ Avg(ms) │ P95(ms) │ Max(ms) │');
    console.log('├─────────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤');

    for (const result of this.results) {
      const name = result.endpoint.padEnd(23);
      const success = `${result.successful}/${this.config.benchmarkRequests}`.padStart(7);
      const min = result.min.toString().padStart(7);
      const median = result.median.toString().padStart(7);
      const mean = result.mean.toString().padStart(7);
      const p95 = result.p95.toString().padStart(7);
      const max = result.max.toString().padStart(7);

      console.log(`│ ${name} │ ${success} │ ${min} │ ${median} │ ${mean} │ ${p95} │ ${max} │`);
    }

    console.log('└─────────────────────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘');

    // Análise de performance
    logger.info('\n🎯 Análise de Performance:');
    
    for (const result of this.results) {
      const successRate = (result.successful / this.config.benchmarkRequests) * 100;
      let status = '✅ Excelente';
      
      if (result.p95 > 1000) {
        status = '❌ Lento';
      } else if (result.p95 > 500) {
        status = '⚠️  Moderado';
      } else if (result.p95 > 200) {
        status = '🔶 Bom';
      }

      logger.info(`   ${result.endpoint}: ${status} (P95: ${result.p95}ms, Taxa: ${successRate.toFixed(1)}%)`);
    }

    // Recomendações
    const slowEndpoints = this.results.filter(r => r.p95 > 500);
    if (slowEndpoints.length > 0) {
      logger.warn('\n💡 Recomendações:');
      slowEndpoints.forEach(endpoint => {
        logger.warn(`   - ${endpoint.endpoint}: Considere otimização (P95: ${endpoint.p95}ms)`);
      });
    }
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const benchmark = new Benchmark();
  benchmark.runBenchmark()
    .catch(error => {
      logger.error('❌ Erro durante benchmark:', error);
      process.exit(1);
    });
}

export default Benchmark;
