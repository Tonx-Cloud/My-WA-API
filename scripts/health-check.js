#!/usr/bin/env node

/**
 * Health Check Script
 * Executa verificaÃ§Ãµes de saÃºde nos serviÃ§os da aplicaÃ§Ã£o
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
    new transports.File({ filename: 'logs/health-check.log' }),
  ],
});

// Verificar se fetch estÃ¡ disponÃ­vel (Node.js 18+)
let fetch;
try {
  fetch = globalThis.fetch;
  if (!fetch) {
    const { default: nodeFetch } = await import('node-fetch');
    fetch = nodeFetch;
  }
} catch (error) {
  logger.error('NÃ£o foi possÃ­vel carregar a funcionalidade de fetch:', error.message);
  process.exit(1);
}

class HealthChecker {
  constructor() {
    this.endpoints = [
      { name: 'API Health', url: 'http://localhost:3000/health' },
      { name: 'API Live', url: 'http://localhost:3000/health/live' },
      { name: 'API Ready', url: 'http://localhost:3000/health/ready' },
      { name: 'Web Health', url: 'http://localhost:3001/health' },
    ];

    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      checks: [],
    };
  }

  async checkAll() {
    logger.info('ðŸ¥ Iniciando Health Checks...\n');

    for (const endpoint of this.endpoints) {
      await this.checkEndpoint(endpoint);
    }

    this.printSummary();
    return this.results.failed === 0;
  }

  async checkEndpoint(endpoint) {
    this.results.total++;

    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(endpoint.url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'HealthChecker/1.0',
        },
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (response.ok) {
        this.results.passed++;
        this.results.checks.push({
          name: endpoint.name,
          status: 'PASS',
          duration,
          statusCode: response.status,
        });

        logger.info(`âœ… ${endpoint.name}: OK (${duration}ms)`);
      } else {
        this.results.failed++;
        this.results.checks.push({
          name: endpoint.name,
          status: 'FAIL',
          duration,
          statusCode: response.status,
          error: `HTTP ${response.status}`,
        });

        logger.error(`âŒ ${endpoint.name}: HTTP ${response.status} (${duration}ms)`);
      }
    } catch (error) {
      this.results.failed++;
      this.results.checks.push({
        name: endpoint.name,
        status: 'FAIL',
        error: error.message,
      });

      if (error.name === 'AbortError') {
        logger.error(`âŒ ${endpoint.name}: Timeout (>5s)`);
      } else {
        logger.error(`âŒ ${endpoint.name}: ${error.message}`);
      }
    }
  }

  printSummary() {
    logger.info('\nðŸ“Š Resumo dos Health Checks:');
    logger.info(
      `Total: ${this.results.total} | Passed: ${this.results.passed} | Failed: ${this.results.failed}`
    );

    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    logger.info(`Taxa de Sucesso: ${successRate}%`);

    if (this.results.failed > 0) {
      logger.warn('\nâš ï¸  ServiÃ§os com problemas:');
      this.results.checks
        .filter(check => check.status === 'FAIL')
        .forEach(check => {
          logger.warn(`   - ${check.name}: ${check.error}`);
        });
    }
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new HealthChecker();
  checker
    .checkAll()
    .then(allPassed => {
      process.exit(allPassed ? 0 : 1);
    })
    .catch(error => {
      logger.error('âŒ Erro durante health checks:', error);
      process.exit(1);
    });
}

export default HealthChecker;
