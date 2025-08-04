/**
 * Script PÃ³s-Commit
 * Executa validaÃ§Ãµes automÃ¡ticas apÃ³s cada commit
 */

import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const runCommand = async (command, options = {}) => {
  const { silent = false, continueOnError = false } = options;

  try {
    if (!silent) {
      log(`ðŸ”§ Executando: ${command}`, 'cyan');
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: path.join(__dirname, '..'),
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });

    if (stderr && !continueOnError) {
      throw new Error(stderr);
    }

    return { success: true, stdout, stderr };
  } catch (error) {
    if (continueOnError) {
      log(`âš ï¸ Comando falhou mas continuando: ${command}`, 'yellow');
      return { success: false, error: error.message };
    }
    throw error;
  }
};

const postCommit = async () => {
  log('ðŸš€ INICIANDO PROCEDIMENTOS PÃ“S-COMMIT', 'bright');
  log('='.repeat(50), 'blue');

  const startTime = Date.now();
  const results = {
    timestamp: new Date().toISOString(),
    steps: [],
    success: true,
    duration: 0,
  };

  try {
    // 1. Verificar variÃ¡veis de ambiente
    log('\nðŸ” 1. Verificando variÃ¡veis de ambiente...', 'blue');
    try {
      await runCommand('node scripts/verify-env.js');
      log('âœ… VariÃ¡veis de ambiente - OK', 'green');
      results.steps.push({ step: 'env-vars', status: 'success' });
    } catch (error) {
      log('âŒ VariÃ¡veis de ambiente - FALHA', 'red');
      results.steps.push({
        step: 'env-vars',
        status: 'error',
        error: error.message,
      });
      // NÃ£o abortar por variÃ¡veis de ambiente em desenvolvimento
    }

    // 2. Verificar rotas
    log('\nðŸ›£ï¸ 2. Verificando rotas...', 'blue');
    try {
      await runCommand('node scripts/verify-routes.js');
      log('âœ… VerificaÃ§Ã£o de rotas - OK', 'green');
      results.steps.push({ step: 'routes', status: 'success' });
    } catch (error) {
      log('âŒ VerificaÃ§Ã£o de rotas - FALHA', 'red');
      results.steps.push({
        step: 'routes',
        status: 'error',
        error: error.message,
      });
    }

    // 3. Rodar linting
    log('\nðŸ§¹ 3. Executando linting...', 'blue');
    try {
      // Linting da API
      await runCommand('npm run lint', { continueOnError: true });
      log('âœ… Linting - OK', 'green');
      results.steps.push({ step: 'linting', status: 'success' });
    } catch (error) {
      log('âš ï¸ Linting com avisos', 'yellow');
      results.steps.push({
        step: 'linting',
        status: 'warning',
        error: error.message,
      });
    }

    // 4. Executar testes rÃ¡pidos
    log('\nðŸ§ª 4. Executando testes rÃ¡pidos...', 'blue');
    try {
      await runCommand('node scripts/quick-test.mjs');
      log('âœ… Testes rÃ¡pidos - OK', 'green');
      results.steps.push({ step: 'quick-tests', status: 'success' });
    } catch (error) {
      log('âŒ Testes rÃ¡pidos - FALHA', 'red');
      results.steps.push({
        step: 'quick-tests',
        status: 'error',
        error: error.message,
      });
      results.success = false;
    }

    // 5. Verificar build (opcional em desenvolvimento)
    if (process.env.NODE_ENV === 'production') {
      log('\nðŸ“¦ 5. Verificando build...', 'blue');
      try {
        await runCommand('npm run build');
        log('âœ… Build - OK', 'green');
        results.steps.push({ step: 'build', status: 'success' });
      } catch (error) {
        log('âŒ Build - FALHA', 'red');
        results.steps.push({
          step: 'build',
          status: 'error',
          error: error.message,
        });
        results.success = false;
      }
    } else {
      log('\nðŸ“¦ 5. Build (pulado em desenvolvimento)', 'yellow');
      results.steps.push({ step: 'build', status: 'skipped' });
    }

    // Calcular duraÃ§Ã£o
    results.duration = Date.now() - startTime;

    // RelatÃ³rio final
    log('\nðŸ“Š RELATÃ“RIO PÃ“S-COMMIT', 'bright');
    log('='.repeat(30), 'blue');

    const successSteps = results.steps.filter(s => s.status === 'success').length;
    const totalSteps = results.steps.length;
    const warningSteps = results.steps.filter(s => s.status === 'warning').length;
    const errorSteps = results.steps.filter(s => s.status === 'error').length;

    log(`âœ… Sucesso: ${successSteps}/${totalSteps} etapas`, 'green');
    if (warningSteps > 0) {
      log(`âš ï¸ Avisos: ${warningSteps} etapas`, 'yellow');
    }
    if (errorSteps > 0) {
      log(`âŒ Erros: ${errorSteps} etapas`, 'red');
    }
    log(`â±ï¸ DuraÃ§Ã£o: ${Math.round(results.duration / 1000)}s`, 'cyan');

    // Salvar relatÃ³rio
    const logsDir = path.join(__dirname, '../logs');

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const reportPath = path.join(logsDir, `post-commit-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

    if (results.success) {
      log('\nðŸŽ‰ PROCEDIMENTOS PÃ“S-COMMIT CONCLUÃDOS COM SUCESSO!', 'green');
      log('ðŸš€ Projeto pronto para desenvolvimento/deploy', 'green');
    } else {
      log('\nâš ï¸ PROCEDIMENTOS PÃ“S-COMMIT CONCLUÃDOS COM PROBLEMAS', 'yellow');
      log('ðŸ”§ Corrija os erros antes de continuar', 'yellow');
    }

    log(`\nðŸ“„ RelatÃ³rio salvo em: ${reportPath}`, 'cyan');
  } catch (error) {
    results.success = false;
    results.duration = Date.now() - startTime;

    log('\nâŒ ERRO CRÃTICO NO PROCEDIMENTO PÃ“S-COMMIT', 'red');
    log(error.message, 'red');

    process.exit(1);
  }
};

// Executar se chamado diretamente
if (import.meta.url.startsWith('file:') && process.argv[1].endsWith('post-commit.js')) {
  postCommit().catch(error => {
    console.error('âŒ Erro crÃ­tico:', error);
    process.exit(1);
  });
}

export { postCommit, runCommand };
