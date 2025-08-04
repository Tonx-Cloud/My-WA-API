const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Mapeamento de arquivos para testes
const fileToTestMap = {
  'apps/api/src/services/whatsappService.js': 'apps/api/tests/services/whatsappService.test.js',
  'apps/api/src/services/backupService.js': 'apps/api/tests/services/backupService.test.js',
  'apps/api/src/services/performanceService.js':
    'apps/api/tests/services/performanceService.test.js',
  'apps/api/src/middlewares/': 'apps/api/tests/middlewares/',
  'apps/api/src/controllers/': 'apps/api/tests/integration/',
  'apps/api/src/routes/': 'apps/api/tests/integration/',
  'apps/web/src/': 'apps/web/src/__tests__/',
  'packages/shared/src/': 'packages/shared/tests/',
};

// Cores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// FunÃ§Ã£o para obter arquivos alterados
function getChangedFiles() {
  try {
    log('ðŸ” Verificando arquivos alterados...', 'blue');
    const output = execSync('git diff --name-only HEAD~1 HEAD', {
      encoding: 'utf8',
    });
    const files = output.split('\n').filter(file => file.trim() !== '');

    if (files.length === 0) {
      log('â„¹ï¸  Tentando comparar com staging area...', 'yellow');
      const stagedOutput = execSync('git diff --name-only --cached', {
        encoding: 'utf8',
      });
      return stagedOutput.split('\n').filter(file => file.trim() !== '');
    }

    return files;
  } catch (error) {
    log('âš ï¸  NÃ£o foi possÃ­vel obter arquivos alterados via Git', 'yellow');
    log('   Motivo: ' + error.message, 'red');
    return [];
  }
}

// FunÃ§Ã£o para mapear arquivos para testes
function mapFilesToTests(files) {
  const testsToRun = new Set();

  files.forEach(file => {
    log(`   ðŸ“„ Analisando: ${file}`, 'blue');

    for (const [pattern, testPath] of Object.entries(fileToTestMap)) {
      if (file.includes(pattern)) {
        testsToRun.add(testPath);
        log(`   âœ… Mapeado para: ${testPath}`, 'green');
      }
    }
  });

  return Array.from(testsToRun);
}

// FunÃ§Ã£o para verificar se arquivos de teste existem
function filterExistingTests(testPaths) {
  return testPaths.filter(testPath => {
    const exists = fs.existsSync(testPath) || fs.existsSync(path.dirname(testPath));
    if (!exists) {
      log(`   âš ï¸  Teste nÃ£o encontrado: ${testPath}`, 'yellow');
    }
    return exists;
  });
}

// FunÃ§Ã£o para executar testes
function runTests(testPaths = []) {
  try {
    if (testPaths.length === 0) {
      log('ðŸ§ª Executando todos os testes...', 'bold');
      execSync('npm test', { stdio: 'inherit', cwd: 'apps/api' });
    } else {
      log(`ðŸŽ¯ Executando testes especÃ­ficos (${testPaths.length} arquivos)...`, 'bold');
      testPaths.forEach(testPath => {
        log(`   ðŸ§ª ${testPath}`, 'blue');
      });

      // Executar testes por workspace
      const apiTests = testPaths.filter(p => p.includes('apps/api'));
      const webTests = testPaths.filter(p => p.includes('apps/web'));
      const sharedTests = testPaths.filter(p => p.includes('packages/shared'));

      if (apiTests.length > 0) {
        log('\nðŸ“¦ Executando testes da API...', 'green');
        const apiTestPattern = apiTests.map(t => t.replace('apps/api/', '')).join('|');
        execSync(`npm test -- --testPathPattern="${apiTestPattern}"`, {
          stdio: 'inherit',
          cwd: 'apps/api',
        });
      }

      if (webTests.length > 0) {
        log('\nðŸŒ Executando testes do Web...', 'green');
        const webTestPattern = webTests.map(t => t.replace('apps/web/', '')).join('|');
        execSync(`npm test -- --testPathPattern="${webTestPattern}"`, {
          stdio: 'inherit',
          cwd: 'apps/web',
        });
      }

      if (sharedTests.length > 0) {
        log('\nðŸ“š Executando testes do Shared...', 'green');
        execSync('npm test', { stdio: 'inherit', cwd: 'packages/shared' });
      }
    }

    log('\nâœ… Testes concluÃ­dos com sucesso!', 'green');
  } catch (error) {
    log('\nâŒ Falha na execuÃ§Ã£o dos testes!', 'red');
    log('   CÃ³digo de saÃ­da: ' + error.status, 'red');
    process.exit(error.status || 1);
  }
}

// FunÃ§Ã£o principal
function runChangedTests() {
  log('ðŸš€ Iniciando teste de arquivos alterados...', 'bold');

  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    log('\nðŸ“ Nenhum arquivo alterado detectado.', 'yellow');
    log('   Executando todos os testes...', 'yellow');
    runTests();
    return;
  }

  log(`\nðŸ“‹ Arquivos alterados detectados (${changedFiles.length}):`, 'green');
  changedFiles.forEach(file => {
    log(`   â€¢ ${file}`, 'blue');
  });

  log('\nðŸ”— Mapeando arquivos para testes...', 'blue');
  const testsToRun = mapFilesToTests(changedFiles);

  if (testsToRun.length === 0) {
    log('\nâš ï¸  Nenhum teste especÃ­fico mapeado para os arquivos alterados.', 'yellow');
    log('   Executando todos os testes por seguranÃ§a...', 'yellow');
    runTests();
    return;
  }

  log(`\nâœ… Testes mapeados (${testsToRun.length}):`, 'green');
  const existingTests = filterExistingTests(testsToRun);

  if (existingTests.length === 0) {
    log('\nâš ï¸  Nenhum arquivo de teste existe ainda.', 'yellow');
    log('   Executando todos os testes...', 'yellow');
    runTests();
  } else {
    runTests(existingTests);
  }
}

// Verificar se Ã© execuÃ§Ã£o direta
if (require.main === module) {
  runChangedTests();
}

module.exports = {
  runChangedTests,
  getChangedFiles,
  mapFilesToTests,
};
