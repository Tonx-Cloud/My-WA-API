#!/usr/bin/env node

/**
 * Script de Testes Automatizados Completo
 * Executa todas as rotinas de testes do projeto com logging avançado
 *
 * Recursos:
 * - Reinicialização automática do sistema antes dos testes
 * - Testes unitários, integração e performance
 * - Sistema de logging Winston estruturado
 * - Health checks automatizados
 * - Relatórios detalhados em JSON e TXT
 * - Execução sequencial com análise de dependências
 */

import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { restartSystem } from './restart-system.js';

// Verificar se fetch está disponível (Node.js 18+)
let fetchAvailable = false;
try {
  if (typeof fetch !== 'undefined') {
    fetchAvailable = true;
  }
} catch {
  // fetch não disponível
}

// Fallback para versões antigas do Node.js
if (!fetchAvailable) {
  try {
    const { default: fetch } = await import('node-fetch');
    globalThis.fetch = fetch;
    fetchAvailable = true;
  } catch {
    console.warn('⚠️ fetch não disponível. Health checks podem falhar.');
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Configuração de cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Estado global dos testes
const testState = {
  startTime: new Date(),
  results: {
    unit: { passed: 0, failed: 0, skipped: 0, duration: 0 },
    integration: { passed: 0, failed: 0, skipped: 0, duration: 0 },
    performance: { passed: 0, failed: 0, skipped: 0, duration: 0 },
    security: { passed: 0, failed: 0, skipped: 0, duration: 0 },
    e2e: { passed: 0, failed: 0, skipped: 0, duration: 0 },
  },
  logs: {
    info: [],
    warnings: [],
    errors: [],
    performance: [],
    security: [],
  },
  healthChecks: [],
  coverage: null,
};

/**
 * Logger estruturado para testes
 */
class TestLogger {
  constructor() {
    this.logFile = path.join(rootDir, 'logs', `test-run-${Date.now()}.log`);
    this.jsonFile = path.join(rootDir, 'logs', `test-results-${Date.now()}.json`);

    // Garantir que o diretório de logs existe
    this.ensureLogDir();
  }

  async ensureLogDir() {
    const logDir = path.dirname(this.logFile);
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      console.error('Erro ao criar diretório de logs:', error);
    }
  }

  log(level, category, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      ...metadata,
    };

    // Adicionar ao estado global
    if (testState.logs[level]) {
      testState.logs[level].push(logEntry);
    } else if (testState.logs[category]) {
      testState.logs[category].push(logEntry);
    }

    // Output no console com cores
    const color = this.getColor(level);
    console.log(
      `${color}[${level.toUpperCase()}]${colors.reset} ${colors.cyan}[${category}]${colors.reset} ${message}`
    );

    if (Object.keys(metadata).length > 0) {
      console.log(`  ${colors.yellow}Metadata:${colors.reset}`, JSON.stringify(metadata, null, 2));
    }

    // Escrever no arquivo de log
    this.writeToFile(logEntry);
  }

  getColor(level) {
    const colorMap = {
      info: colors.blue,
      warn: colors.yellow,
      error: colors.red,
      success: colors.green,
      performance: colors.magenta,
      security: colors.cyan,
    };
    return colorMap[level] || colors.reset;
  }

  async writeToFile(logEntry) {
    try {
      const logLine = `${logEntry.timestamp} [${logEntry.level.toUpperCase()}] [${logEntry.category}] ${logEntry.message}\n`;
      await fs.appendFile(this.logFile, logLine);
    } catch (error) {
      console.error('Erro ao escrever no arquivo de log:', error);
    }
  }

  async saveResults() {
    try {
      const finalResults = {
        ...testState,
        endTime: new Date(),
        duration: Date.now() - testState.startTime.getTime(),
        summary: this.generateSummary(),
      };

      await fs.writeFile(this.jsonFile, JSON.stringify(finalResults, null, 2));

      this.log('info', 'SYSTEM', `Resultados salvos em: ${this.jsonFile}`);
      this.log('info', 'SYSTEM', `Logs detalhados em: ${this.logFile}`);

      return finalResults;
    } catch (error) {
      this.log('error', 'SYSTEM', 'Erro ao salvar resultados', { error: error.message });
    }
  }

  generateSummary() {
    const totalTests = Object.values(testState.results).reduce(
      (acc, result) => acc + result.passed + result.failed + result.skipped,
      0
    );

    const totalPassed = Object.values(testState.results).reduce(
      (acc, result) => acc + result.passed,
      0
    );

    const totalFailed = Object.values(testState.results).reduce(
      (acc, result) => acc + result.failed,
      0
    );

    const totalDuration = Object.values(testState.results).reduce(
      (acc, result) => acc + result.duration,
      0
    );

    return {
      totalTests,
      totalPassed,
      totalFailed,
      totalSkipped: totalTests - totalPassed - totalFailed,
      successRate: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0,
      totalDuration,
      healthChecksPerformed: testState.healthChecks.length,
      coverageGenerated: testState.coverage !== null,
    };
  }
}

/**
 * Executor de comandos com logging
 */
class CommandExecutor {
  constructor(logger) {
    this.logger = logger;
  }

  async runCommand(command, options = {}) {
    const startTime = Date.now();
    this.logger.log('info', 'COMMAND', `Executando: ${command}`, { cwd: options.cwd || rootDir });

    return new Promise((resolve, reject) => {
      // Configurar comando baseado no ambiente
      const isWindows = process.platform === 'win32';
      const shell = isWindows ? 'cmd.exe' : '/bin/bash';
      const shellArgs = isWindows ? ['/c'] : ['-c'];

      const child = spawn(shell, [...shellArgs, command], {
        cwd: options.cwd || rootDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
        timeout: options.timeout || 300000, // 5 minutos timeout padrão
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', data => {
        const output = data.toString();
        stdout += output;

        // Parse de resultados Jest em tempo real
        this.parseJestOutput(output, options.testType || 'unit');

        // Log output em tempo real se verbose
        if (options.verbose) {
          console.log(output.trim());
        }
      });

      child.stderr?.on('data', data => {
        const output = data.toString();
        stderr += output;

        // Log erros importantes
        if (output.includes('FAIL') || output.includes('Error') || output.includes('ERROR')) {
          this.logger.log('error', options.testType || 'COMMAND', output.trim());
        }
      });

      child.on('close', code => {
        const duration = Date.now() - startTime;

        if (code === 0) {
          this.logger.log('success', 'COMMAND', `Comando concluído com sucesso`, {
            command: command.slice(0, 100), // Limitar tamanho do log
            duration,
            exitCode: code,
          });
          resolve({ code, stdout, stderr, duration });
        } else {
          this.logger.log('error', 'COMMAND', `Comando falhou`, {
            command: command.slice(0, 100),
            duration,
            exitCode: code,
            stderr: stderr.slice(-500), // Últimos 500 chars do erro
          });
          // Não rejeitar automaticamente - deixar o chamador decidir
          resolve({ code, stdout, stderr, duration, failed: true });
        }
      });

      child.on('error', error => {
        const duration = Date.now() - startTime;
        this.logger.log('error', 'COMMAND', `Erro ao executar comando`, {
          command: command.slice(0, 100),
          error: error.message,
          duration,
        });
        resolve({ error, stderr: error.message, duration, failed: true });
      });

      // Timeout handler
      const timeoutHandler = setTimeout(() => {
        child.kill('SIGTERM');
        this.logger.log('warn', 'COMMAND', `Comando interrompido por timeout`, {
          command: command.slice(0, 100),
          timeout: options.timeout || 300000,
        });
      }, options.timeout || 300000);

      child.on('close', () => {
        clearTimeout(timeoutHandler);
      });
    });
  }

  parseJestOutput(output, testType) {
    // Parse de resultados Jest
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    const skippedMatch = output.match(/(\d+) skipped/);
    const timeMatch = output.match(/Time:\s*([\d.]+)\s*s/);

    if (passedMatch) testState.results[testType].passed += parseInt(passedMatch[1]);
    if (failedMatch) testState.results[testType].failed += parseInt(failedMatch[1]);
    if (skippedMatch) testState.results[testType].skipped += parseInt(skippedMatch[1]);
    if (timeMatch) testState.results[testType].duration += parseFloat(timeMatch[1]) * 1000;
  }

  async runHealthCheck(endpoint) {
    const startTime = Date.now();

    if (!fetchAvailable) {
      // Fallback para quando fetch não está disponível
      return this.runHealthCheckFallback(endpoint, startTime);
    }

    try {
      // Usar fetch nativo do Node.js 18+ em vez de curl
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'My-WA-API Test Runner v1.0',
        },
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      const healthCheck = {
        endpoint,
        httpCode: response.status,
        responseTime,
        timestamp: new Date().toISOString(),
        success: response.status >= 200 && response.status < 400,
        headers: Object.fromEntries(response.headers.entries()),
        method: 'fetch',
      };

      testState.healthChecks.push(healthCheck);

      if (healthCheck.success) {
        this.logger.log('success', 'HEALTH', `Health check passou: ${endpoint}`, healthCheck);
      } else {
        this.logger.log('error', 'HEALTH', `Health check falhou: ${endpoint}`, healthCheck);
      }

      return healthCheck;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthCheck = {
        endpoint,
        error: error.message,
        responseTime,
        timestamp: new Date().toISOString(),
        success: false,
        errorType: error.name,
        method: 'fetch',
      };

      testState.healthChecks.push(healthCheck);
      this.logger.log('error', 'HEALTH', `Erro no health check: ${endpoint}`, healthCheck);
      return healthCheck;
    }
  }

  async runHealthCheckFallback(endpoint, startTime) {
    try {
      // Usar curl como fallback se disponível
      const command =
        process.platform === 'win32'
          ? `powershell -Command "try { $response = Invoke-WebRequest -Uri '${endpoint}' -TimeoutSec 10 -UseBasicParsing; Write-Output $response.StatusCode; Write-Output ([Math]::Round((Measure-Command { Invoke-WebRequest -Uri '${endpoint}' -TimeoutSec 10 -UseBasicParsing }).TotalMilliseconds, 2)) } catch { Write-Output 'ERROR'; Write-Output $_.Exception.Message }"`
          : `curl -s -w "\\n%{http_code}\\n%{time_total}\\n" "${endpoint}" -m 10`;

      const result = await this.runCommand(command, { timeout: 15000 });

      if (result.failed) {
        throw new Error(result.stderr || 'Health check failed');
      }

      const lines = result.stdout.split('\n').filter(line => line.trim());
      const responseTime = Date.now() - startTime;

      let httpCode = 0;
      if (process.platform === 'win32') {
        // Parse PowerShell output
        httpCode = parseInt(lines[0]) || 0;
      } else {
        // Parse curl output
        httpCode = parseInt(lines[lines.length - 2]) || 0;
      }

      const healthCheck = {
        endpoint,
        httpCode,
        responseTime,
        timestamp: new Date().toISOString(),
        success: httpCode >= 200 && httpCode < 400,
        method: 'fallback',
      };

      testState.healthChecks.push(healthCheck);

      if (healthCheck.success) {
        this.logger.log(
          'success',
          'HEALTH',
          `Health check passou (fallback): ${endpoint}`,
          healthCheck
        );
      } else {
        this.logger.log(
          'error',
          'HEALTH',
          `Health check falhou (fallback): ${endpoint}`,
          healthCheck
        );
      }

      return healthCheck;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthCheck = {
        endpoint,
        error: error.message,
        responseTime,
        timestamp: new Date().toISOString(),
        success: false,
        errorType: 'fallback_error',
        method: 'fallback',
      };

      testState.healthChecks.push(healthCheck);
      this.logger.log(
        'warn',
        'HEALTH',
        `Health check não pôde ser executado: ${endpoint}`,
        healthCheck
      );
      return healthCheck;
    }
  }
}

/**
 * Classe principal de execução de testes
 */
class TestRunner {
  constructor() {
    this.logger = new TestLogger();
    this.executor = new CommandExecutor(this.logger);
  }

  async run() {
    this.logger.log('info', 'SYSTEM', 'Iniciando execução completa de testes', {
      timestamp: testState.startTime.toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
    });

    try {
      // 1. Verificar serviços
      await this.checkServices();

      // 2. Executar testes por categoria
      await this.runUnitTests();
      await this.runIntegrationTests();
      await this.runPerformanceTests();
      await this.runSecurityTests();

      // 3. Executar testes E2E
      await this.runE2ETests();

      // 4. Gerar coverage
      await this.generateCoverage();

      // 5. Health checks
      await this.runHealthChecks();

      // 6. Gerar relatório final
      const results = await this.generateFinalReport();

      return results;
    } catch (error) {
      this.logger.log('error', 'SYSTEM', 'Erro crítico na execução de testes', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async checkServices() {
    this.logger.log('info', 'SYSTEM', 'Verificando status dos serviços...');

    // Verificar se os serviços estão rodando
    const services = [
      { name: 'API Backend', port: 3000, url: 'http://localhost:3000/health' },
      { name: 'Web Frontend', port: 3001, url: 'http://localhost:3001' },
    ];

    const serviceResults = [];

    for (const service of services) {
      try {
        this.logger.log('info', 'SERVICE', `Verificando ${service.name}...`);
        const healthCheck = await this.executor.runHealthCheck(service.url);

        if (healthCheck.success) {
          this.logger.log('success', 'SERVICE', `${service.name} está ativo`, {
            port: service.port,
            responseTime: healthCheck.responseTime + 'ms',
          });
          serviceResults.push({ ...service, status: 'active', ...healthCheck });
        } else {
          this.logger.log('warn', 'SERVICE', `${service.name} não está respondendo adequadamente`, {
            port: service.port,
            httpCode: healthCheck.httpCode,
            error: healthCheck.error,
          });
          serviceResults.push({ ...service, status: 'inactive', ...healthCheck });
        }
      } catch (error) {
        this.logger.log('error', 'SERVICE', `Erro ao verificar ${service.name}`, {
          port: service.port,
          error: error.message,
        });
        serviceResults.push({
          ...service,
          status: 'error',
          error: error.message,
        });
      }
    }

    // Resumo dos serviços
    const activeServices = serviceResults.filter(s => s.status === 'active').length;
    const totalServices = serviceResults.length;

    this.logger.log(
      'info',
      'SYSTEM',
      `Verificação de serviços concluída: ${activeServices}/${totalServices} ativos`,
      {
        services: serviceResults,
      }
    );

    // Definir comportamento baseado em serviços ativos
    if (activeServices === 0) {
      this.logger.log(
        'warn',
        'SYSTEM',
        'Nenhum serviço ativo detectado. Alguns testes podem falhar.'
      );
    }

    return serviceResults;
  }

  async runUnitTests() {
    this.logger.log('info', 'UNIT_TESTS', 'Executando testes unitários...');

    const testResults = [];

    // Testes da API
    try {
      this.logger.log('info', 'UNIT_TESTS', 'Executando testes da API...');
      const apiResult = await this.executor.runCommand('npm run test:ci', {
        cwd: path.join(rootDir, 'apps', 'api'),
        testType: 'unit',
        timeout: 120000, // 2 minutos
      });

      if (!apiResult.failed) {
        this.logger.log('success', 'UNIT_TESTS', 'Testes da API concluídos');
        testResults.push({ component: 'api', success: true, ...apiResult });
      } else {
        this.logger.log('warn', 'UNIT_TESTS', 'Testes da API falharam, mas continuando...', {
          exitCode: apiResult.code,
        });
        testResults.push({ component: 'api', success: false, ...apiResult });
      }
    } catch (error) {
      this.logger.log('error', 'UNIT_TESTS', 'Erro ao executar testes da API', {
        error: error.message,
      });
      testResults.push({ component: 'api', success: false, error: error.message });
    }

    // Testes do Frontend
    try {
      this.logger.log('info', 'UNIT_TESTS', 'Executando testes do Frontend...');
      const webResult = await this.executor.runCommand('npm run test -- --watchAll=false --ci', {
        cwd: path.join(rootDir, 'apps', 'web'),
        testType: 'unit',
        timeout: 120000, // 2 minutos
      });

      if (!webResult.failed) {
        this.logger.log('success', 'UNIT_TESTS', 'Testes do Frontend concluídos');
        testResults.push({ component: 'web', success: true, ...webResult });
      } else {
        this.logger.log('warn', 'UNIT_TESTS', 'Testes do Frontend falharam, mas continuando...', {
          exitCode: webResult.code,
        });
        testResults.push({ component: 'web', success: false, ...webResult });
      }
    } catch (error) {
      this.logger.log('error', 'UNIT_TESTS', 'Erro ao executar testes do Frontend', {
        error: error.message,
      });
      testResults.push({ component: 'web', success: false, error: error.message });
    }

    // Resumo dos testes unitários
    const successCount = testResults.filter(r => r.success).length;
    const totalCount = testResults.length;

    this.logger.log(
      'info',
      'UNIT_TESTS',
      `Testes unitários finalizados: ${successCount}/${totalCount} componentes passaram`,
      {
        results: testResults,
        successRate: ((successCount / totalCount) * 100).toFixed(2) + '%',
      }
    );

    return testResults;
  }

  async runIntegrationTests() {
    this.logger.log('info', 'INTEGRATION_TESTS', 'Executando testes de integração...');

    try {
      // Testes específicos de integração
      await this.executor.runCommand(
        'npm run test -- --testNamePattern="integration|Integration" --ci',
        {
          cwd: path.join(rootDir, 'apps', 'api'),
          testType: 'integration',
        }
      );
    } catch (error) {
      this.logger.log('error', 'INTEGRATION_TESTS', 'Falha nos testes de integração', {
        error: error.message,
      });
    }
  }

  async runPerformanceTests() {
    this.logger.log('info', 'PERFORMANCE_TESTS', 'Executando testes de performance...');

    try {
      // Testes de performance focados
      await this.executor.runCommand(
        'npm run test -- --testNamePattern="performance|Performance|timing|load" --ci',
        {
          cwd: path.join(rootDir, 'apps', 'api'),
          testType: 'performance',
        }
      );

      // Benchmark básico de endpoints
      await this.runPerformanceBenchmarks();
    } catch (error) {
      this.logger.log('error', 'PERFORMANCE_TESTS', 'Falha nos testes de performance', {
        error: error.message,
      });
    }
  }

  async runSecurityTests() {
    this.logger.log('info', 'SECURITY_TESTS', 'Executando testes de segurança...');

    try {
      // Testes de segurança
      await this.executor.runCommand(
        'npm run test -- --testNamePattern="security|Security|auth|Auth|validation" --ci',
        {
          cwd: path.join(rootDir, 'apps', 'api'),
          testType: 'security',
        }
      );
    } catch (error) {
      this.logger.log('error', 'SECURITY_TESTS', 'Falha nos testes de segurança', {
        error: error.message,
      });
    }
  }

  async runE2ETests() {
    this.logger.log('info', 'E2E_TESTS', 'Executando testes End-to-End...');

    try {
      // Verificar se existe configuração de E2E
      const e2eConfig = path.join(rootDir, 'e2e');

      try {
        await fs.access(e2eConfig);
        await this.executor.runCommand('npm run test:e2e', {
          testType: 'e2e',
        });
      } catch {
        this.logger.log('warn', 'E2E_TESTS', 'Configuração E2E não encontrada, pulando...');
      }
    } catch (error) {
      this.logger.log('error', 'E2E_TESTS', 'Falha nos testes E2E', { error: error.message });
    }
  }

  async generateCoverage() {
    this.logger.log('info', 'COVERAGE', 'Gerando relatório de cobertura...');

    try {
      const result = await this.executor.runCommand('npm run test:coverage', {
        cwd: path.join(rootDir, 'apps', 'api'),
      });

      // Parse básico do coverage
      const coverageMatch = result.stdout.match(/All files\s*\|\s*([\d.]+)/);
      if (coverageMatch) {
        testState.coverage = parseFloat(coverageMatch[1]);
        this.logger.log('success', 'COVERAGE', `Cobertura: ${testState.coverage}%`);
      }
    } catch (error) {
      this.logger.log('error', 'COVERAGE', 'Falha ao gerar cobertura', { error: error.message });
    }
  }

  async runPerformanceBenchmarks() {
    this.logger.log('info', 'PERFORMANCE', 'Executando benchmarks de performance...');

    const endpoints = ['http://localhost:3000/health', 'http://localhost:3000/api/dashboard/stats'];

    for (const endpoint of endpoints) {
      try {
        const results = [];
        const iterations = 5;

        for (let i = 0; i < iterations; i++) {
          const healthCheck = await this.executor.runHealthCheck(endpoint);
          if (healthCheck.success) {
            results.push(healthCheck.responseTime);
          }
        }

        if (results.length > 0) {
          const avg = results.reduce((a, b) => a + b, 0) / results.length;
          const min = Math.min(...results);
          const max = Math.max(...results);

          this.logger.log('performance', 'BENCHMARK', `Performance do endpoint: ${endpoint}`, {
            average: avg.toFixed(2) + 'ms',
            min: min.toFixed(2) + 'ms',
            max: max.toFixed(2) + 'ms',
            iterations,
            results,
          });
        }
      } catch (error) {
        this.logger.log('error', 'BENCHMARK', `Erro no benchmark: ${endpoint}`, {
          error: error.message,
        });
      }
    }
  }

  async runHealthChecks() {
    this.logger.log('info', 'HEALTH_CHECKS', 'Executando health checks finais...');

    const endpoints = [
      'http://localhost:3000/health',
      'http://localhost:3000/health/live',
      'http://localhost:3000/health/ready',
      'http://localhost:3000/api/dashboard/stats',
    ];

    for (const endpoint of endpoints) {
      await this.executor.runHealthCheck(endpoint);
      // Pequena pausa entre checks
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async generateFinalReport() {
    this.logger.log('info', 'REPORT', 'Gerando relatório final...');

    const results = await this.logger.saveResults();

    // Display do resumo no console
    this.displaySummary(results.summary);

    return results;
  }

  displaySummary(summary) {
    console.log('\n' + '='.repeat(80));
    console.log(`${colors.bright}${colors.cyan}RELATÓRIO FINAL DE TESTES${colors.reset}`);
    console.log('='.repeat(80));

    console.log(`${colors.bright}📊 Resumo Geral:${colors.reset}`);
    console.log(`  • Total de Testes: ${colors.bright}${summary.totalTests}${colors.reset}`);
    console.log(`  • Passou: ${colors.green}${summary.totalPassed}${colors.reset}`);
    console.log(`  • Falhou: ${colors.red}${summary.totalFailed}${colors.reset}`);
    console.log(`  • Pulados: ${colors.yellow}${summary.totalSkipped}${colors.reset}`);
    console.log(`  • Taxa de Sucesso: ${colors.bright}${summary.successRate}%${colors.reset}`);
    console.log(
      `  • Duração Total: ${colors.bright}${(summary.totalDuration / 1000).toFixed(2)}s${colors.reset}`
    );

    if (testState.coverage) {
      console.log(`  • Cobertura: ${colors.bright}${testState.coverage}%${colors.reset}`);
    }

    console.log(`\n${colors.bright}🔍 Detalhes por Categoria:${colors.reset}`);
    Object.entries(testState.results).forEach(([category, result]) => {
      const total = result.passed + result.failed + result.skipped;
      if (total > 0) {
        console.log(
          `  ${category.toUpperCase()}: ${colors.green}${result.passed}✓${colors.reset} ${colors.red}${result.failed}✗${colors.reset} ${colors.yellow}${result.skipped}⊘${colors.reset} (${(result.duration / 1000).toFixed(2)}s)`
        );
      }
    });

    console.log(`\n${colors.bright}🏥 Health Checks:${colors.reset}`);
    const healthSuccess = testState.healthChecks.filter(h => h.success).length;
    const healthTotal = testState.healthChecks.length;
    console.log(`  • Realizados: ${colors.bright}${healthTotal}${colors.reset}`);
    console.log(`  • Sucessos: ${colors.green}${healthSuccess}${colors.reset}`);
    console.log(`  • Falhas: ${colors.red}${healthTotal - healthSuccess}${colors.reset}`);

    console.log(`\n${colors.bright}📋 Logs e Relatórios:${colors.reset}`);
    console.log(`  • Erros: ${colors.red}${testState.logs.errors.length}${colors.reset}`);
    console.log(`  • Avisos: ${colors.yellow}${testState.logs.warnings.length}${colors.reset}`);
    console.log(
      `  • Performance: ${colors.magenta}${testState.logs.performance.length}${colors.reset}`
    );
    console.log(`  • Segurança: ${colors.cyan}${testState.logs.security.length}${colors.reset}`);

    const statusIcon = summary.totalFailed === 0 ? '✅' : '❌';
    const statusText = summary.totalFailed === 0 ? 'SUCESSO' : 'FALHAS DETECTADAS';
    const statusColor = summary.totalFailed === 0 ? colors.green : colors.red;

    console.log(
      `\n${colors.bright}🎯 Status Final: ${statusColor}${statusIcon} ${statusText}${colors.reset}`
    );
    console.log('='.repeat(80) + '\n');
  }
}

// Execução principal
async function main() {
  const args = process.argv.slice(2);
  const skipRestart = args.includes('--skip-restart');

  try {
    // Reinicializar sistema antes dos testes (se não explicitamente pulado)
    if (!skipRestart) {
      console.log(
        `${colors.bright}${colors.blue}🔄 Reinicializando sistema antes dos testes...${colors.reset}`
      );

      const restartSuccess = await restartSystem({
        skipHealthChecks: true, // Faremos nossos próprios health checks
        timeout: 45000,
      });

      if (!restartSuccess) {
        console.error(`${colors.red}❌ Falha na reinicialização do sistema${colors.reset}`);
        process.exit(1);
      }

      console.log(`${colors.green}✅ Sistema reinicializado com sucesso${colors.reset}\n`);

      // Aguardar um pouco mais para estabilização
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      console.log(`${colors.yellow}⏭️  Pulando reinicialização (--skip-restart)${colors.reset}\n`);
    }

    const runner = new TestRunner();
    const results = await runner.run();

    // Exit code baseado nos resultados
    const exitCode = results.summary.totalFailed > 0 ? 1 : 0;
    process.exit(exitCode);
  } catch (error) {
    console.error(`${colors.red}❌ Erro crítico:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Tratamento de sinais
process.on('SIGINT', async () => {
  console.log(
    `\n${colors.yellow}🔄 Interrompido pelo usuário. Salvando resultados...${colors.reset}`
  );

  try {
    const logger = new TestLogger();
    await logger.saveResults();
  } catch (error) {
    console.error('Erro ao salvar resultados:', error.message);
  }

  process.exit(130);
});

// Executar se chamado diretamente
const isMain = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMain) {
  console.log('🚀 Iniciando execução do sistema de testes...');
  main().catch(error => {
    console.error('❌ Erro fatal durante execução:', error);
    process.exit(1);
  });
}

export { TestRunner, TestLogger, CommandExecutor };
