﻿const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ConfiguraÃ§Ã£o dos testes de regressÃ£o
const regressionTests = {
  api: {
    workspace: 'apps/api',
    tests: [
      'tests/services/whatsappService.test.js',
      'tests/services/backupService.test.js',
      'tests/services/performanceService.test.js',
      'tests/infrastructure/imports.test.js',
      'tests/middlewares/validation.test.js',
      'tests/integration/api.test.js',
    ],
    critical: ['tests/services/whatsappService.test.js', 'tests/services/backupService.test.js'],
  },
  web: {
    workspace: 'apps/web',
    tests: [
      'src/__tests__/components/ErrorBoundary.test.tsx',
      'src/__tests__/lib/logger.test.ts',
      'src/__tests__/pages/dashboard.test.tsx',
    ],
    critical: ['src/__tests__/components/ErrorBoundary.test.tsx'],
  },
  shared: {
    workspace: 'packages/shared',
    tests: ['tests/types.test.ts', 'tests/utils.test.ts'],
    critical: ['tests/types.test.ts'],
  },
};

// FunÃ§Ã£o para verificar saÃºde do projeto
function checkProjectHealth() {
  log('ðŸ¥ Verificando saÃºde do projeto...', 'blue');

  const healthChecks = [
    {
      name: 'Node.js Version',
      check: () => {
        const version = process.version;
        const major = parseInt(version.slice(1).split('.')[0]);
        return major >= 18;
      },
      info: `VersÃ£o atual: ${process.version}`,
    },
    {
      name: 'Package.json files',
      check: () => {
        return [
          'apps/api/package.json',
          'apps/web/package.json',
          'packages/shared/package.json',
        ].every(file => fs.existsSync(file));
      },
      info: 'Verificando estrutura de monorepo',
    },
    {
      name: 'Dependencies installed',
      check: () => {
        return ['apps/api/node_modules', 'apps/web/node_modules'].every(dir => fs.existsSync(dir));
      },
      info: 'Verificando node_modules',
    },
  ];

  let allHealthy = true;

  healthChecks.forEach(check => {
    const result = check.check();
    const status = result ? 'âœ…' : 'âŒ';
    log(`   ${status} ${check.name}: ${check.info}`, result ? 'green' : 'red');
    if (!result) allHealthy = false;
  });

  return allHealthy;
}

// FunÃ§Ã£o para executar testes em um workspace
async function runWorkspaceTests(workspaceName, config, mode = 'full') {
  log(`\nðŸ“¦ Executando testes: ${workspaceName.toUpperCase()}`, 'bold');

  const testsToRun = mode === 'critical' ? config.critical : config.tests;
  const existingTests = testsToRun.filter(test => {
    const testPath = path.join(config.workspace, test);
    return fs.existsSync(testPath);
  });

  if (existingTests.length === 0) {
    log(`   âš ï¸  Nenhum teste encontrado em ${workspaceName}`, 'yellow');
    return { passed: 0, failed: 0, skipped: testsToRun.length };
  }

  log(`   ðŸ§ª Executando ${existingTests.length} de ${testsToRun.length} testes...`, 'blue');

  try {
    // Preparar comando baseado no workspace
    let testCommand;
    if (workspaceName === 'api') {
      testCommand = 'npm test';
    } else if (workspaceName === 'web') {
      testCommand = 'npm test';
    } else if (workspaceName === 'shared') {
      testCommand = 'npm test';
    }

    log(`   ðŸš€ Comando: ${testCommand}`, 'cyan');

    // Executar testes
    const output = execSync(testCommand, {
      cwd: config.workspace,
      encoding: 'utf8',
      stdio: 'pipe',
    });

    // Processar output para extrair mÃ©tricas
    const metrics = parseTestOutput(output);

    log(`   âœ… Sucesso: ${metrics.passed} testes passaram`, 'green');
    if (metrics.failed > 0) {
      log(`   âŒ Falhas: ${metrics.failed} testes falharam`, 'red');
    }
    if (metrics.skipped > 0) {
      log(`   â­ï¸  Pulados: ${metrics.skipped} testes foram pulados`, 'yellow');
    }

    return metrics;
  } catch (error) {
    log(`   âŒ Erro na execuÃ§Ã£o dos testes de ${workspaceName}`, 'red');
    log(`   ðŸ“ CÃ³digo de saÃ­da: ${error.status}`, 'red');

    // Tentar extrair informaÃ§Ãµes do erro
    const errorOutput = error.stdout || error.stderr || '';
    const metrics = parseTestOutput(errorOutput);

    return {
      passed: metrics.passed,
      failed: metrics.failed || 1,
      skipped: metrics.skipped,
    };
  }
}

// FunÃ§Ã£o para fazer parse do output dos testes
function parseTestOutput(output) {
  const metrics = { passed: 0, failed: 0, skipped: 0 };

  // PadrÃµes para Jest
  const passedMatch = output.match(/(\d+) passed/);
  const failedMatch = output.match(/(\d+) failed/);
  const skippedMatch = output.match(/(\d+) skipped/);
  const todoMatch = output.match(/(\d+) todo/);

  if (passedMatch) metrics.passed = parseInt(passedMatch[1]);
  if (failedMatch) metrics.failed = parseInt(failedMatch[1]);
  if (skippedMatch) metrics.skipped = parseInt(skippedMatch[1]);
  if (todoMatch) metrics.skipped += parseInt(todoMatch[1]);

  return metrics;
}

// FunÃ§Ã£o para gerar relatÃ³rio de cobertura
function generateCoverageReport() {
  log('\nðŸ“Š Gerando relatÃ³rio de cobertura...', 'blue');

  const workspaces = ['apps/api', 'apps/web'];
  const coverageData = [];

  workspaces.forEach(workspace => {
    try {
      log(`   ðŸ“ˆ Cobertura para ${workspace}...`, 'cyan');

      execSync('npm run test:coverage', {
        cwd: workspace,
        stdio: 'pipe',
      });

      // Verificar se arquivo de cobertura existe
      const coveragePath = path.join(workspace, 'coverage/coverage-summary.json');
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        coverageData.push({
          workspace,
          coverage: coverage.total,
        });
      }
    } catch (error) {
      log(`   âš ï¸  NÃ£o foi possÃ­vel gerar cobertura para ${workspace}`, 'yellow');
    }
  });

  // Exibir relatÃ³rio de cobertura
  if (coverageData.length > 0) {
    log('\nðŸ“‹ RelatÃ³rio de Cobertura:', 'bold');
    coverageData.forEach(({ workspace, coverage }) => {
      log(`\n   ðŸ“¦ ${workspace}:`, 'blue');
      log(`      Lines: ${coverage.lines.pct}%`, 'cyan');
      log(`      Functions: ${coverage.functions.pct}%`, 'cyan');
      log(`      Branches: ${coverage.branches.pct}%`, 'cyan');
      log(`      Statements: ${coverage.statements.pct}%`, 'cyan');
    });
  }

  return coverageData;
}

// FunÃ§Ã£o principal para executar testes de regressÃ£o
async function runRegressionTests(mode = 'full') {
  log('ðŸ§ª INICIANDO TESTES DE REGRESSÃƒO', 'bold');
  log(`ðŸ“‹ Modo: ${mode.toUpperCase()}`, 'blue');
  log(`ðŸ• HorÃ¡rio: ${new Date().toLocaleString('pt-BR')}`, 'cyan');

  // Verificar saÃºde do projeto
  if (!checkProjectHealth()) {
    log('\nâŒ Projeto nÃ£o estÃ¡ saudÃ¡vel. Abortando testes.', 'red');
    process.exit(1);
  }

  // Inicializar mÃ©tricas
  const overallMetrics = { passed: 0, failed: 0, skipped: 0 };
  const results = [];

  // Executar testes para cada workspace
  for (const [workspaceName, config] of Object.entries(regressionTests)) {
    try {
      const metrics = await runWorkspaceTests(workspaceName, config, mode);
      results.push({ workspace: workspaceName, ...metrics });

      // Acumular mÃ©tricas
      overallMetrics.passed += metrics.passed;
      overallMetrics.failed += metrics.failed;
      overallMetrics.skipped += metrics.skipped;
    } catch (error) {
      log(`\nâŒ Erro crÃ­tico no workspace ${workspaceName}: ${error.message}`, 'red');
      results.push({
        workspace: workspaceName,
        passed: 0,
        failed: 1,
        skipped: 0,
        error: error.message,
      });
      overallMetrics.failed += 1;
    }
  }

  // Gerar relatÃ³rio de cobertura se solicitado
  let coverageData = [];
  if (mode === 'full') {
    coverageData = generateCoverageReport();
  }

  // Exibir relatÃ³rio final
  log('\nðŸ“‹ RELATÃ“RIO FINAL DE REGRESSÃƒO', 'bold');
  log('â•'.repeat(50), 'blue');

  results.forEach(result => {
    const status = result.failed === 0 ? 'âœ…' : 'âŒ';
    log(
      `${status} ${result.workspace.toUpperCase()}: ${result.passed} âœ… | ${result.failed} âŒ | ${result.skipped} â­ï¸`,
      result.failed === 0 ? 'green' : 'red'
    );

    if (result.error) {
      log(`   âš ï¸  Erro: ${result.error}`, 'yellow');
    }
  });

  log('\nðŸ“Š RESUMO GERAL:', 'bold');
  log(`   Total de testes executados: ${overallMetrics.passed + overallMetrics.failed}`, 'blue');
  log(`   âœ… Sucessos: ${overallMetrics.passed}`, 'green');
  log(`   âŒ Falhas: ${overallMetrics.failed}`, overallMetrics.failed > 0 ? 'red' : 'green');
  log(`   â­ï¸  Pulados: ${overallMetrics.skipped}`, 'yellow');

  const successRate =
    (overallMetrics.passed / (overallMetrics.passed + overallMetrics.failed)) * 100;
  log(`   ðŸ“ˆ Taxa de sucesso: ${successRate.toFixed(1)}%`, successRate >= 90 ? 'green' : 'red');

  // Determinar cÃ³digo de saÃ­da
  const exitCode = overallMetrics.failed > 0 ? 1 : 0;

  if (exitCode === 0) {
    log('\nðŸŽ‰ TODOS OS TESTES DE REGRESSÃƒO PASSARAM!', 'green');
  } else {
    log('\nðŸ’¥ FALHAS DETECTADAS NOS TESTES DE REGRESSÃƒO!', 'red');
  }

  log(`\nðŸ Finalizado em ${new Date().toLocaleString('pt-BR')}`, 'cyan');

  return { exitCode, metrics: overallMetrics, results, coverage: coverageData };
}

// CLI
if (require.main === module) {
  const mode = process.argv[2] || 'full'; // full, critical

  runRegressionTests(mode)
    .then(({ exitCode }) => {
      process.exit(exitCode);
    })
    .catch(error => {
      log(`\nðŸ’¥ Erro fatal: ${error.message}`, 'red');
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  runRegressionTests,
  checkProjectHealth,
  generateCoverageReport,
};
