#!/usr/bin/env node

/**
 * Monitor de Testes em Tempo Real
 * Monitora a execução dos testes e exibe atualizações em tempo real
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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

class TestMonitor {
  constructor() {
    this.logDir = path.join(rootDir, 'logs');
    this.isRunning = true;
    this.lastSize = 0;
    this.stats = {
      testsRun: 0,
      testsPassed: 0,
      testsFailed: 0,
      healthChecks: 0,
      startTime: Date.now(),
    };
  }

  async start() {
    console.log(`${colors.cyan}🔍 Monitor de Testes em Tempo Real${colors.reset}`);
    console.log(`${colors.blue}Monitorando diretório: ${this.logDir}${colors.reset}\n`);

    // Configurar manipulador de interrupção
    process.on('SIGINT', () => {
      this.stop();
    });

    // Loop principal de monitoramento
    while (this.isRunning) {
      try {
        await this.checkForUpdates();
        await this.sleep(1000); // Verificar a cada segundo
      } catch (error) {
        console.error(`${colors.red}Erro no monitor: ${error.message}${colors.reset}`);
      }
    }
  }

  async checkForUpdates() {
    try {
      // Verificar arquivos de log recentes
      const files = await fs.readdir(this.logDir);
      const logFiles = files.filter(
        file => file.endsWith('.log') && file.includes(new Date().toISOString().split('T')[0])
      );

      for (const logFile of logFiles) {
        await this.monitorLogFile(path.join(this.logDir, logFile));
      }

      // Verificar arquivos JSON de resultados
      const jsonFiles = files.filter(
        file => file.endsWith('.json') && file.includes('test-results')
      );

      if (jsonFiles.length > 0) {
        const latestJson = jsonFiles.sort().pop();
        await this.displayResults(path.join(this.logDir, latestJson));
      }
    } catch (error) {
      // Diretório pode não existir ainda
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async monitorLogFile(filePath) {
    try {
      const stats = await fs.stat(filePath);

      if (stats.size > this.lastSize) {
        const content = await fs.readFile(filePath, 'utf-8');
        const newContent = content.slice(this.lastSize);

        // Parse de eventos interessantes
        this.parseLogContent(newContent);

        this.lastSize = stats.size;
      }
    } catch (error) {
      // Arquivo pode ter sido removido
      if (error.code !== 'ENOENT') {
        console.error(`Erro ao monitorar ${filePath}: ${error.message}`);
      }
    }
  }

  parseLogContent(content) {
    const lines = content.split('\n').filter(line => line.trim());

    for (const line of lines) {
      this.parseLogLine(line);
      this.updateStatsFromLine(line);
    }

    // Exibir estatísticas atualizadas
    this.displayLiveStats();
  }

  parseLogLine(line) {
    const logPatterns = [
      { pattern: '[UNIT_TESTS]', prefix: '📝', color: colors.blue },
      { pattern: '[INTEGRATION_TESTS]', prefix: '🔗', color: colors.magenta },
      { pattern: '[PERFORMANCE_TESTS]', prefix: '⚡', color: colors.yellow },
      { pattern: '[SECURITY_TESTS]', prefix: '🔒', color: colors.cyan },
      { pattern: '[HEALTH]', prefix: '🏥', color: colors.green },
      { pattern: '[ERROR]', prefix: '❌', color: colors.red },
      { pattern: '[SUCCESS]', prefix: '✅', color: colors.green },
    ];

    for (const { pattern, prefix, color } of logPatterns) {
      if (line.includes(pattern)) {
        const message = line.split(pattern)[1]?.trim() || '';
        console.log(`${color}${prefix} ${message}${colors.reset}`);

        if (pattern === '[HEALTH]') {
          this.stats.healthChecks++;
        }
        break;
      }
    }
  }

  updateStatsFromLine(line) {
    const passedMatch = line.match(/(\d+) passed/);
    if (passedMatch) {
      this.stats.testsPassed += parseInt(passedMatch[1]);
    }

    const failedMatch = line.match(/(\d+) failed/);
    if (failedMatch) {
      this.stats.testsFailed += parseInt(failedMatch[1]);
    }
  }

  displayLiveStats() {
    const duration = Date.now() - this.stats.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    // Limpar linha anterior e exibir estatísticas
    process.stdout.write('\r\x1b[K'); // Limpar linha
    process.stdout.write(
      `${colors.bright}⏱️  ${minutes}:${seconds.toString().padStart(2, '0')} | ` +
        `✅ ${this.stats.testsPassed} | ❌ ${this.stats.testsFailed} | ` +
        `🏥 ${this.stats.healthChecks}${colors.reset}`
    );
  }

  async displayResults(jsonPath) {
    try {
      const content = await fs.readFile(jsonPath, 'utf-8');
      const results = JSON.parse(content);

      if (results.summary) {
        console.log(`\n\n${colors.bright}${colors.cyan}📊 RESUMO FINAL${colors.reset}`);
        console.log(
          `${colors.green}Testes Passaram: ${results.summary.totalPassed}${colors.reset}`
        );
        console.log(`${colors.red}Testes Falharam: ${results.summary.totalFailed}${colors.reset}`);
        console.log(
          `${colors.yellow}Taxa de Sucesso: ${results.summary.successRate}%${colors.reset}`
        );
        console.log(
          `${colors.blue}Duração: ${(results.summary.totalDuration / 1000).toFixed(2)}s${colors.reset}`
        );

        if (results.summary.coverageGenerated) {
          console.log(`${colors.magenta}Cobertura: Disponível${colors.reset}`);
        }

        this.stop();
      }
    } catch (error) {
      // Arquivo pode estar sendo escrito ainda, ignorar silenciosamente
      if (error.code !== 'ENOENT' && !error.message.includes('JSON')) {
        console.error(`${colors.yellow}Aviso: ${error.message}${colors.reset}`);
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.isRunning = false;
    console.log(`\n\n${colors.cyan}🔍 Monitor finalizado${colors.reset}`);
    process.exit(0);
  }
}

// Execução
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new TestMonitor();
  monitor.start().catch(error => {
    console.error(`${colors.red}Erro crítico no monitor: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

export { TestMonitor };
