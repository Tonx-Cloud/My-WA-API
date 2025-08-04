#!/usr/bin/env node

/**
 * Health check script para container Docker
 * Verifica se a aplicaÃ§Ã£o estÃ¡ respondendo corretamente
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const HEALTH_ENDPOINT = '/health';
const TIMEOUT = 5000; // 5 segundos

// ConfiguraÃ§Ã£o de health check
const healthCheck = {
  timeout: TIMEOUT,
  retries: 3,
  interval: 1000,
};

/**
 * Realiza uma requisiÃ§Ã£o HTTP para o endpoint de health
 */
function makeHealthRequest() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: HEALTH_ENDPOINT,
      method: 'GET',
      timeout: healthCheck.timeout,
      headers: {
        'User-Agent': 'Docker-Healthcheck/1.0',
        Accept: 'application/json',
      },
    };

    const req = http.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (res.statusCode === 200 && response.status === 'ok') {
            console.log('âœ… Health check passou:', response);
            resolve(response);
          } else {
            console.error('âŒ Health check falhou:', {
              status: res.statusCode,
              response,
            });
            reject(new Error(`Health check falhou: ${res.statusCode}`));
          }
        } catch (error) {
          console.error('âŒ Erro ao parsear resposta:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', error => {
      console.error('âŒ Erro na requisiÃ§Ã£o de health check:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('âŒ Timeout na requisiÃ§Ã£o de health check');
      reject(new Error('Timeout na requisiÃ§Ã£o'));
    });

    req.end();
  });
}

/**
 * Verifica arquivos crÃ­ticos do sistema
 */
function checkCriticalFiles() {
  const criticalFiles = ['./apps/api/dist/index.js', './package.json'];

  for (const file of criticalFiles) {
    if (!fs.existsSync(file)) {
      console.error(`âŒ Arquivo crÃ­tico nÃ£o encontrado: ${file}`);
      return false;
    }
  }

  console.log('âœ… Todos os arquivos crÃ­ticos estÃ£o presentes');
  return true;
}

/**
 * Verifica diretÃ³rios necessÃ¡rios
 */
function checkDirectories() {
  const requiredDirs = ['./logs', './data', './sessions'];

  for (const dir of requiredDirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`ðŸ“ DiretÃ³rio criado: ${dir}`);
      }
    } catch (error) {
      console.error(`âŒ Erro ao verificar/criar diretÃ³rio ${dir}:`, error.message);
      return false;
    }
  }

  console.log('âœ… Todos os diretÃ³rios necessÃ¡rios estÃ£o disponÃ­veis');
  return true;
}

/**
 * Executa health check com tentativas
 */
async function performHealthCheck() {
  let lastError;

  for (let attempt = 1; attempt <= healthCheck.retries; attempt++) {
    try {
      console.log(`ðŸ” Health check - Tentativa ${attempt}/${healthCheck.retries}`);

      // Verificar arquivos e diretÃ³rios crÃ­ticos
      if (!checkCriticalFiles() || !checkDirectories()) {
        throw new Error('VerificaÃ§Ã£o de arquivos/diretÃ³rios falhou');
      }

      // Fazer requisiÃ§Ã£o HTTP
      await makeHealthRequest();

      console.log('ðŸŽ‰ Health check concluÃ­do com sucesso!');
      process.exit(0);
    } catch (error) {
      lastError = error;
      console.error(`âŒ Tentativa ${attempt} falhou:`, error.message);

      if (attempt < healthCheck.retries) {
        console.log(`â³ Aguardando ${healthCheck.interval}ms antes da prÃ³xima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, healthCheck.interval));
      }
    }
  }

  console.error('ðŸ’¥ Health check falhou apÃ³s todas as tentativas!');
  console.error('Ãšltimo erro:', lastError?.message || 'Erro desconhecido');
  process.exit(1);
}

/**
 * Verifica se o processo estÃ¡ rodando em container
 */
function isRunningInContainer() {
  try {
    return (
      fs.existsSync('/.dockerenv') || fs.readFileSync('/proc/1/cgroup', 'utf8').includes('docker')
    );
  } catch {
    return false;
  }
}

// VerificaÃ§Ãµes iniciais
console.log('ðŸš€ Iniciando health check do container...');
console.log('ðŸ“Š ConfiguraÃ§Ã£o:', {
  host: HOST,
  port: PORT,
  endpoint: HEALTH_ENDPOINT,
  timeout: healthCheck.timeout,
  retries: healthCheck.retries,
  container: isRunningInContainer(),
});

// Executar health check
performHealthCheck().catch(error => {
  console.error('ðŸ’¥ Erro crÃ­tico no health check:', error);
  process.exit(1);
});
