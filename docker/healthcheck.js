#!/usr/bin/env node

/**
 * Health check script para container Docker
 * Verifica se a aplicação está respondendo corretamente
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const HEALTH_ENDPOINT = '/health';
const TIMEOUT = 5000; // 5 segundos

// Configuração de health check
const healthCheck = {
  timeout: TIMEOUT,
  retries: 3,
  interval: 1000,
};

/**
 * Realiza uma requisição HTTP para o endpoint de health
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
            console.log('✅ Health check passou:', response);
            resolve(response);
          } else {
            console.error('❌ Health check falhou:', {
              status: res.statusCode,
              response,
            });
            reject(new Error(`Health check falhou: ${res.statusCode}`));
          }
        } catch (error) {
          console.error('❌ Erro ao parsear resposta:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', error => {
      console.error('❌ Erro na requisição de health check:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('❌ Timeout na requisição de health check');
      reject(new Error('Timeout na requisição'));
    });

    req.end();
  });
}

/**
 * Verifica arquivos críticos do sistema
 */
function checkCriticalFiles() {
  const criticalFiles = ['./apps/api/dist/index.js', './package.json'];

  for (const file of criticalFiles) {
    if (!fs.existsSync(file)) {
      console.error(`❌ Arquivo crítico não encontrado: ${file}`);
      return false;
    }
  }

  console.log('✅ Todos os arquivos críticos estão presentes');
  return true;
}

/**
 * Verifica diretórios necessários
 */
function checkDirectories() {
  const requiredDirs = ['./logs', './data', './sessions'];

  for (const dir of requiredDirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Diretório criado: ${dir}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao verificar/criar diretório ${dir}:`, error.message);
      return false;
    }
  }

  console.log('✅ Todos os diretórios necessários estão disponíveis');
  return true;
}

/**
 * Executa health check com tentativas
 */
async function performHealthCheck() {
  let lastError;

  for (let attempt = 1; attempt <= healthCheck.retries; attempt++) {
    try {
      console.log(`🔍 Health check - Tentativa ${attempt}/${healthCheck.retries}`);

      // Verificar arquivos e diretórios críticos
      if (!checkCriticalFiles() || !checkDirectories()) {
        throw new Error('Verificação de arquivos/diretórios falhou');
      }

      // Fazer requisição HTTP
      await makeHealthRequest();

      console.log('🎉 Health check concluído com sucesso!');
      process.exit(0);
    } catch (error) {
      lastError = error;
      console.error(`❌ Tentativa ${attempt} falhou:`, error.message);

      if (attempt < healthCheck.retries) {
        console.log(`⏳ Aguardando ${healthCheck.interval}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, healthCheck.interval));
      }
    }
  }

  console.error('💥 Health check falhou após todas as tentativas!');
  console.error('Último erro:', lastError?.message || 'Erro desconhecido');
  process.exit(1);
}

/**
 * Verifica se o processo está rodando em container
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

// Verificações iniciais
console.log('🚀 Iniciando health check do container...');
console.log('📊 Configuração:', {
  host: HOST,
  port: PORT,
  endpoint: HEALTH_ENDPOINT,
  timeout: healthCheck.timeout,
  retries: healthCheck.retries,
  container: isRunningInContainer(),
});

// Executar health check
performHealthCheck().catch(error => {
  console.error('💥 Erro crítico no health check:', error);
  process.exit(1);
});
