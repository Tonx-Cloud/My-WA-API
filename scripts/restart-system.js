#!/usr/bin/env node

/**
 * Sistema de Restart Integrado - My WA API
 * Reinicia todos os serviÃ§os de forma coordenada
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { createLogger, format, transports } from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar logger
const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.colorize(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [new transports.Console(), new transports.File({ filename: 'logs/restart.log' })],
});

class SystemRestarter {
  constructor(options = {}) {
    this.options = {
      skipHealthChecks: false,
      timeout: 30000,
      retries: 3,
      ...options,
    };
  }

  async restart() {
    logger.info('ðŸ”„ Iniciando reinicializaÃ§Ã£o completa do sistema...\n');

    try {
      await this.stopAllServices();
      await this.waitForCleanup();
      await this.startAllServices();

      if (!this.options.skipHealthChecks) {
        await this.verifyServices();
      }

      logger.info('âœ… ReinicializaÃ§Ã£o completa bem-sucedida!');
      return true;
    } catch (error) {
      logger.error(`âŒ Erro durante reinicializaÃ§Ã£o: ${error.message}`);
      return false;
    }
  }

  async stopAllServices() {
    logger.info('ðŸ›‘ Parando todos os serviÃ§os...');

    await this.killProcesses();
    await this.freePorts();
  }

  async killProcesses() {
    const processesToKill = ['node', 'npm', 'turbo'];

    for (const processName of processesToKill) {
      try {
        if (process.platform === 'win32') {
          await execAsync(`taskkill /f /im ${processName}.exe 2>nul || exit 0`);
        } else {
          await execAsync(`pkill -f ${processName} || true`);
        }
        logger.info(`   âœ… Processos ${processName} finalizados`);
      } catch (error) {
        logger.warn(`   âš ï¸  Erro ao finalizar ${processName}: ${error.message}`);
      }
    }
  }

  async freePorts() {
    const portsToFree = [3000, 3001, 8080];

    for (const port of portsToFree) {
      try {
        if (process.platform === 'win32') {
          const result = await execAsync(`netstat -ano | findstr :${port}`);
          if (result.stdout) {
            const lines = result.stdout.split('\n');
            for (const line of lines) {
              const match = line.match(/\s+(\d+)$/);
              if (match) {
                const pid = match[1];
                await execAsync(`taskkill /f /pid ${pid} 2>nul || exit 0`);
              }
            }
          }
        } else {
          await execAsync(`lsof -ti:${port} | xargs kill -9 || true`);
        }
        logger.info(`   âœ… Porta ${port} liberada`);
      } catch (error) {
        // Porta jÃ¡ estava livre - comportamento esperado
        logger.debug(`   Porta ${port} jÃ¡ estava livre: ${error.message}`);
      }
    }
  }

  async waitForCleanup() {
    logger.info('â³ Aguardando limpeza completa...');

    await new Promise(resolve => setTimeout(resolve, 3000));
    await this.verifyPortsAreFree();

    logger.info('   âœ… Limpeza concluÃ­da');
  }

  async verifyPortsAreFree() {
    const portsToCheck = [3000, 3001];

    for (const port of portsToCheck) {
      await this.waitForPortToFree(port);
    }
  }

  async waitForPortToFree(port) {
    let retries = 0;

    while (retries < this.options.retries) {
      try {
        const isPortInUse = await this.checkPortInUse(port);
        if (!isPortInUse) break;

        retries++;
        if (retries < this.options.retries) {
          logger.warn(
            `   Porta ${port} ainda em uso, tentativa ${retries}/${this.options.retries}`
          );
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        // Porta livre - comportamento esperado
        logger.debug(`   VerificaÃ§Ã£o de porta ${port}: ${error.message}`);
        break;
      }
    }
  }

  async checkPortInUse(port) {
    if (process.platform === 'win32') {
      const result = await execAsync(`netstat -ano | findstr :${port}`);
      return !!result.stdout;
    } else {
      await execAsync(`lsof -ti:${port}`);
      return true;
    }
  }

  async startAllServices() {
    logger.info('ðŸš€ Iniciando todos os serviÃ§os...');

    try {
      // Usar o script PowerShell existente para iniciar os serviÃ§os
      const scriptPath = path.join(__dirname, 'start-all.ps1');

      if (process.platform === 'win32') {
        await new Promise((resolve, reject) => {
          const child = spawn(
            'powershell.exe',
            ['-ExecutionPolicy', 'Bypass', '-File', scriptPath],
            {
              stdio: 'pipe',
            }
          );

          let output = '';
          child.stdout.on('data', data => {
            output += data.toString();
            logger.info(`   ${data.toString().trim()}`);
          });

          child.stderr.on('data', data => {
            logger.warn(`   ${data.toString().trim()}`);
          });

          child.on('close', code => {
            if (code === 0) {
              resolve(output);
            } else {
              reject(new Error(`Script de inicializaÃ§Ã£o falhou com cÃ³digo ${code}`));
            }
          });

          // Timeout de seguranÃ§a
          setTimeout(() => {
            child.kill();
            reject(new Error('Timeout ao iniciar serviÃ§os'));
          }, this.options.timeout);
        });
      } else {
        // Para sistemas Unix, usar npm diretamente
        logger.info('   ðŸ”„ Iniciando API...');
        spawn('npm', ['run', 'start:api'], {
          detached: true,
          stdio: 'ignore',
          cwd: path.join(__dirname, '..'),
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        logger.info('   ðŸ”„ Iniciando Web...');
        spawn('npm', ['run', 'start:web'], {
          detached: true,
          stdio: 'ignore',
          cwd: path.join(__dirname, '..'),
        });
      }

      logger.info('   âœ… ServiÃ§os iniciados');
    } catch (error) {
      throw new Error(`Falha ao iniciar serviÃ§os: ${error.message}`);
    }
  }

  async verifyServices() {
    logger.info('ðŸ” Verificando serviÃ§os...');

    // Aguardar um tempo para os serviÃ§os iniciarem
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Verificar se fetch estÃ¡ disponÃ­vel
    let fetch;
    try {
      fetch = globalThis.fetch;
      if (!fetch) {
        const { default: nodeFetch } = await import('node-fetch');
        fetch = nodeFetch;
      }
    } catch (error) {
      logger.warn(`   NÃ£o foi possÃ­vel verificar serviÃ§os via HTTP: ${error.message}`);
      return;
    }

    const endpoints = [
      { name: 'API', url: 'http://localhost:3000/health' },
      { name: 'Web', url: 'http://localhost:3001' },
    ];

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(endpoint.url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'SystemRestarter/1.0' },
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          logger.info(`   âœ… ${endpoint.name}: OK`);
        } else {
          logger.warn(`   âš ï¸  ${endpoint.name}: HTTP ${response.status}`);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          logger.warn(`   âš ï¸  ${endpoint.name}: Timeout`);
        } else {
          logger.warn(`   âš ï¸  ${endpoint.name}: ${error.message}`);
        }
      }
    }
  }
}

// FunÃ§Ã£o utilitÃ¡ria para usar em outros scripts
export async function restartSystem(options = {}) {
  const restarter = new SystemRestarter(options);
  return await restarter.restart();
}

// Executar se chamado diretamente
if (import.meta.url.endsWith(process.argv[1])) {
  const args = process.argv.slice(2);
  const options = {
    skipHealthChecks: args.includes('--skip-health-checks'),
    timeout: args.includes('--timeout')
      ? parseInt(args[args.indexOf('--timeout') + 1]) || 30000
      : 30000,
  };

  const restarter = new SystemRestarter(options);
  restarter
    .restart()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error('âŒ Erro crÃ­tico durante reinicializaÃ§Ã£o:', error);
      process.exit(1);
    });
}

export default SystemRestarter;
