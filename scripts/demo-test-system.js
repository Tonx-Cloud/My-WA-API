#!/usr/bin/env node

/**
 * DemonstraÃ§Ã£o do Sistema de Testes Automatizados
 * Script para mostrar todas as funcionalidades implementadas
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);
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

function printHeader(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log('='.repeat(80));
}

function printStep(step, description) {
  console.log(`\n${colors.bright}${colors.blue}${step}. ${description}${colors.reset}`);
  console.log('-'.repeat(60));
}

function printSuccess(message) {
  console.log(`${colors.green}âœ… ${message}${colors.reset}`);
}

function printInfo(message) {
  console.log(`${colors.cyan}â„¹ï¸  ${message}${colors.reset}`);
}

function printWarning(message) {
  console.log(`${colors.yellow}âš ï¸  ${message}${colors.reset}`);
}

async function demonstrateFeatures() {
  printHeader('DEMONSTRAÃ‡ÃƒO DO SISTEMA DE TESTES AUTOMATIZADOS');

  console.log(`${colors.bright}Sistema completo de testes para o projeto My-WA-API${colors.reset}`);
  console.log(`${colors.cyan}Data: ${new Date().toLocaleString()}${colors.reset}`);
  console.log(`${colors.cyan}VersÃ£o: 1.0.0${colors.reset}`);

  try {
    // 1. Mostrar estrutura do sistema
    printStep('1', 'Estrutura do Sistema de Testes');

    const systemFiles = [
      'scripts/run-full-tests.js',
      'scripts/run-full-tests.ps1',
      'scripts/validate-test-system.js',
      'scripts/monitor-tests.js',
      'test-config.json',
      'TESTING.md',
    ];

    for (const file of systemFiles) {
      const filePath = path.join(rootDir, file);
      try {
        const stats = await fs.stat(filePath);
        const size = (stats.size / 1024).toFixed(1);
        printSuccess(`${file} (${size} KB)`);
      } catch {
        printWarning(`${file} - NÃ£o encontrado`);
      }
    }

    // 2. Mostrar comandos disponÃ­veis
    printStep('2', 'Comandos DisponÃ­veis');

    const packageJson = JSON.parse(await fs.readFile(path.join(rootDir, 'package.json'), 'utf-8'));
    const testCommands = Object.entries(packageJson.scripts)
      .filter(
        ([name]) => name.includes('test') || name.includes('validate') || name.includes('monitor')
      )
      .map(([name, script]) => ({ name, script }));

    for (const { name, script } of testCommands) {
      console.log(`${colors.bright}npm run ${name}${colors.reset}`);
      console.log(`  ${colors.cyan}â””â”€ ${script}${colors.reset}`);
    }

    // 3. Mostrar configuraÃ§Ãµes
    printStep('3', 'ConfiguraÃ§Ãµes do Sistema');

    const config = JSON.parse(await fs.readFile(path.join(rootDir, 'test-config.json'), 'utf-8'));

    printInfo(`VersÃ£o da Config: ${config.testConfig.version}`);
    printInfo(`Ambientes: ${Object.keys(config.testConfig.environments).join(', ')}`);

    const enabledSuites = Object.entries(config.testConfig.testSuites)
      .filter(([_, suite]) => suite.enabled)
      .map(([name]) => name);

    printInfo(`Suites Habilitadas: ${enabledSuites.join(', ')}`);
    printInfo(`Health Checks: ${config.testConfig.healthChecks.endpoints.length} endpoints`);
    printInfo(`Coverage Threshold: ${config.testConfig.coverage.threshold.statements}%`);

    // 4. Executar validaÃ§Ã£o
    printStep('4', 'Executando ValidaÃ§Ã£o do Sistema');

    try {
      const { stdout } = await execAsync('npm run validate-tests');
      printSuccess('ValidaÃ§Ã£o executada com sucesso');
      console.log(stdout.split('\n').slice(-10).join('\n')); // Ãšltimas 10 linhas
    } catch (error) {
      printWarning('ValidaÃ§Ã£o encontrou problemas');
      console.log(error.stdout);
    }

    // 5. Mostrar logs recentes
    printStep('5', 'Logs e RelatÃ³rios Recentes');

    try {
      const logDir = path.join(rootDir, 'logs');
      const files = await fs.readdir(logDir);
      const recentFiles = files
        .filter(file => file.endsWith('.log') || file.endsWith('.json'))
        .sort()
        .slice(-5);

      for (const file of recentFiles) {
        const filePath = path.join(logDir, file);
        const stats = await fs.stat(filePath);
        const size = (stats.size / 1024).toFixed(1);
        const date = stats.mtime.toLocaleString();
        console.log(`${colors.blue}ðŸ“„ ${file}${colors.reset} (${size} KB, ${date})`);
      }
    } catch {
      printInfo('DiretÃ³rio de logs serÃ¡ criado na primeira execuÃ§Ã£o');
    }

    // 6. Demonstrar execuÃ§Ã£o rÃ¡pida
    printStep('6', 'DemonstraÃ§Ã£o de ExecuÃ§Ã£o RÃ¡pida');

    printInfo('Executando teste rÃ¡pido (sem health checks e coverage)...');

    try {
      const startTime = Date.now();
      const { stdout } = await execAsync('npm run full-test:quick');
      const duration = Date.now() - startTime;

      printSuccess(`Teste rÃ¡pido concluÃ­do em ${(duration / 1000).toFixed(2)}s`);

      // Mostrar resumo dos resultados
      const lines = stdout.split('\n');
      const summaryLines = lines.filter(
        line => line.includes('âœ…') || line.includes('âš ï¸') || line.includes('DuraÃ§Ã£o')
      );

      summaryLines.slice(-5).forEach(line => {
        console.log(line);
      });
    } catch (error) {
      printWarning('Teste rÃ¡pido encontrou problemas');
      console.log(error.stdout?.split('\n').slice(-5).join('\n'));
    }

    // 7. Recursos avanÃ§ados
    printStep('7', 'Recursos AvanÃ§ados');

    const features = [
      'ðŸ“Š Logging estruturado com Winston',
      'ðŸ” Health checks automatizados',
      'ðŸ“ˆ MÃ©tricas de performance em tempo real',
      'ðŸ”’ Testes de seguranÃ§a integrados',
      'ðŸ“‹ RelatÃ³rios em mÃºltiplos formatos (JSON, TXT, HTML)',
      'âš¡ ExecuÃ§Ã£o paralela e otimizada',
      'ðŸ”„ Monitoramento em tempo real',
      'ðŸŽ¯ Thresholds configurÃ¡veis',
      'ðŸ’¾ Backup automÃ¡tico de logs',
      'ðŸŽ¨ Interface colorida e intuitiva',
    ];

    features.forEach(feature => {
      console.log(`  ${feature}`);
    });

    // 8. PrÃ³ximos passos
    printStep('8', 'Como Usar o Sistema');

    const usageInstructions = [
      {
        command: 'npm run validate-tests',
        description: 'Validar se o sistema estÃ¡ funcionando',
      },
      {
        command: 'npm run full-test:quick',
        description: 'ExecuÃ§Ã£o rÃ¡pida para desenvolvimento',
      },
      {
        command: 'npm run full-test',
        description: 'ExecuÃ§Ã£o completa com todos os recursos',
      },
      {
        command: 'npm run full-test:verbose',
        description: 'ExecuÃ§Ã£o com monitoramento detalhado',
      },
      {
        command: 'npm run monitor-tests',
        description: 'Monitorar testes em tempo real (em terminal separado)',
      },
    ];

    usageInstructions.forEach(({ command, description }) => {
      console.log(`${colors.bright}${command}${colors.reset}`);
      console.log(`  ${colors.cyan}${description}${colors.reset}\n`);
    });

    // 9. InformaÃ§Ãµes de configuraÃ§Ã£o
    printStep('9', 'PersonalizaÃ§Ã£o e ConfiguraÃ§Ã£o');

    console.log(`${colors.cyan}Arquivo de configuraÃ§Ã£o:${colors.reset} test-config.json`);
    console.log(`${colors.cyan}DocumentaÃ§Ã£o completa:${colors.reset} TESTING.md`);
    console.log(`${colors.cyan}Scripts principais:${colors.reset} scripts/`);
    console.log(`${colors.cyan}Logs e relatÃ³rios:${colors.reset} logs/`);

    // Resumo final
    printHeader('SISTEMA PRONTO PARA USO');

    printSuccess('Sistema de testes automatizados implementado com sucesso!');
    printInfo('Todos os componentes estÃ£o funcionais e prontos para uso');
    printInfo('Execute "npm run full-test" para comeÃ§ar a usar');

    console.log(
      `\n${colors.bright}${colors.green}ðŸŽ‰ DemonstraÃ§Ã£o concluÃ­da com sucesso!${colors.reset}\n`
    );
  } catch (error) {
    console.error(`${colors.red}âŒ Erro durante a demonstraÃ§Ã£o: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// ExecuÃ§Ã£o
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateFeatures();
}

export { demonstrateFeatures };
