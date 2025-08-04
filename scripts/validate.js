#!/usr/bin/env node

/**
 * Script de ValidaÃ§Ã£o Completa do Projeto my-wa-api
 * Implementa todas as validaÃ§Ãµes e verificaÃ§Ãµes necessÃ¡rias
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// Cores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

class ProjectValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const color = colors[type] || colors.reset;
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
  }

  async validateEnvironmentVariables() {
    this.log('ðŸ” Validando variÃ¡veis de ambiente...', 'blue');

    const requiredEnvVars = {
      api: ['NODE_ENV', 'PORT', 'JWT_SECRET', 'DOCKER_ENV'],
      web: ['NEXT_PUBLIC_API_URL', 'NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'DOCKER_ENV'],
    };

    for (const [app, vars] of Object.entries(requiredEnvVars)) {
      try {
        const envPath = path.join(process.cwd(), 'apps', app, '.env');

        // Verificar se arquivo .env existe
        try {
          await fs.access(envPath);
        } catch {
          this.warnings.push(`Arquivo .env nÃ£o encontrado para ${app}`);
          continue;
        }

        const envContent = await fs.readFile(envPath, 'utf8');
        const envLines = envContent.split('\n');
        const envObj = {};

        envLines.forEach(line => {
          const [key, value] = line.split('=');
          if (key && value) {
            envObj[key.trim()] = value.trim();
          }
        });

        const missing = vars.filter(varName => !envObj[varName] && !process.env[varName]);

        if (missing.length > 0) {
          this.errors.push(`VariÃ¡veis faltantes em ${app}: ${missing.join(', ')}`);
        } else {
          this.successes.push(`âœ… VariÃ¡veis de ambiente OK para ${app}`);
        }
      } catch (error) {
        this.errors.push(`Erro ao validar variÃ¡veis de ${app}: ${error.message}`);
      }
    }
  }

  async validateRoutes() {
    this.log('ðŸ›£ï¸ Validando rotas...', 'blue');

    try {
      // Verificar rotas da API
      const apiRoutesPath = path.join(process.cwd(), 'apps', 'api', 'src', 'routes');
      const apiRoutes = [];

      try {
        const files = await fs.readdir(apiRoutesPath);
        files.forEach(file => {
          if (file.endsWith('.ts') || file.endsWith('.js')) {
            const routeName = file.replace(/\.(ts|js)$/, '');
            apiRoutes.push(`/api/${routeName}`);
          }
        });
        this.successes.push(`âœ… Encontradas ${apiRoutes.length} rotas da API`);
      } catch (error) {
        this.warnings.push(`NÃ£o foi possÃ­vel verificar rotas da API: ${error.message}`);
      }

      // Verificar rotas do Web (Next.js App Router)
      const webRoutesPath = path.join(process.cwd(), 'apps', 'web', 'src', 'app');
      const webRoutes = [];

      const scanDirectory = async (dir, base = '') => {
        try {
          const items = await fs.readdir(dir);

          for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = await fs.stat(fullPath);

            if (stat.isDirectory()) {
              // Verificar se hÃ¡ page.tsx ou page.js
              const pageFile = path.join(fullPath, 'page.tsx');
              try {
                await fs.access(pageFile);
                webRoutes.push(`/${base}${item}`);
              } catch {
                // NÃ£o hÃ¡ page.tsx, continuar
              }

              await scanDirectory(fullPath, `${base}${item}/`);
            }
          }
        } catch (error) {
          // DiretÃ³rio nÃ£o acessÃ­vel
        }
      };

      await scanDirectory(webRoutesPath);
      this.successes.push(`âœ… Encontradas ${webRoutes.length} rotas do Web`);
    } catch (error) {
      this.errors.push(`Erro ao validar rotas: ${error.message}`);
    }
  }

  async validateContainers() {
    this.log('ðŸ³ Verificando containers Docker...', 'blue');

    try {
      const { stdout } = await execAsync('docker-compose ps --format json');
      const containers = JSON.parse(`[${stdout.trim().split('\n').join(',')}]`);

      const expectedServices = ['api', 'web', 'postgres', 'redis'];
      const runningServices = containers.map(c => c.Service);

      expectedServices.forEach(service => {
        const container = containers.find(c => c.Service === service);
        if (container) {
          if (container.State === 'running') {
            this.successes.push(`âœ… Container ${service} rodando`);
          } else {
            this.errors.push(`âŒ Container ${service} nÃ£o estÃ¡ rodando: ${container.State}`);
          }
        } else {
          this.errors.push(`âŒ Container ${service} nÃ£o encontrado`);
        }
      });
    } catch (error) {
      this.warnings.push(`NÃ£o foi possÃ­vel verificar containers: ${error.message}`);
    }
  }

  async validateWebSocketConnection() {
    this.log('ðŸ”Œ Testando conexÃ£o WebSocket...', 'blue');

    try {
      // Verificar se o servidor estÃ¡ rodando
      const { stdout: apiStatus } = await execAsync(
        'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "000"'
      );

      if (apiStatus.trim() !== '200') {
        this.errors.push('âŒ API nÃ£o estÃ¡ respondendo na porta 3000');
        return;
      }

      // Testar WebSocket connection (simulado)
      this.successes.push('âœ… API respondendo na porta 3000');
      this.warnings.push('âš ï¸ Teste de WebSocket requer implementaÃ§Ã£o adicional');
    } catch (error) {
      this.errors.push(`Erro ao testar WebSocket: ${error.message}`);
    }
  }

  async validateDependencies() {
    this.log('ðŸ“¦ Verificando dependÃªncias...', 'blue');

    const packages = ['apps/api', 'apps/web', 'packages/shared'];

    for (const pkg of packages) {
      try {
        const packagePath = path.join(process.cwd(), pkg);
        const packageJsonPath = path.join(packagePath, 'package.json');

        await fs.access(packageJsonPath);

        // Verificar se node_modules existe
        const nodeModulesPath = path.join(packagePath, 'node_modules');
        try {
          await fs.access(nodeModulesPath);
          this.successes.push(`âœ… DependÃªncias instaladas para ${pkg}`);
        } catch {
          this.warnings.push(`âš ï¸ node_modules nÃ£o encontrado para ${pkg}`);
        }
      } catch (error) {
        this.errors.push(`âŒ package.json nÃ£o encontrado para ${pkg}`);
      }
    }
  }

  async validateReactComponents() {
    this.log('âš›ï¸ Validando componentes React...', 'blue');

    try {
      const dashboardPath = path.join(
        process.cwd(),
        'apps',
        'web',
        'src',
        'app',
        'dashboard',
        'page.tsx'
      );
      const content = await fs.readFile(dashboardPath, 'utf8');

      // Verificar se o componente exporta default
      if (content.includes('export default function') || content.includes('export default')) {
        this.successes.push('âœ… Dashboard component exporta default corretamente');
      } else {
        this.errors.push('âŒ Dashboard component nÃ£o tem export default');
      }

      // Verificar hooks necessÃ¡rios
      const requiredHooks = ['useSession', 'useRouter', 'useEffect'];
      const missingHooks = requiredHooks.filter(hook => !content.includes(hook));

      if (missingHooks.length === 0) {
        this.successes.push('âœ… Hooks React implementados corretamente');
      } else {
        this.errors.push(`âŒ Hooks faltantes: ${missingHooks.join(', ')}`);
      }
    } catch (error) {
      this.errors.push(`Erro ao validar componentes React: ${error.message}`);
    }
  }

  async validateDatabase() {
    this.log('ðŸ—„ï¸ Verificando conexÃ£o com banco de dados...', 'blue');

    try {
      // Verificar se PostgreSQL estÃ¡ rodando
      const { stdout } = await execAsync(
        'docker-compose exec -T postgres pg_isready -U postgres || echo "not ready"'
      );

      if (stdout.includes('accepting connections')) {
        this.successes.push('âœ… PostgreSQL conectado e funcionando');
      } else {
        this.errors.push('âŒ PostgreSQL nÃ£o estÃ¡ respondendo');
      }
    } catch (error) {
      this.warnings.push(`NÃ£o foi possÃ­vel verificar PostgreSQL: ${error.message}`);
    }
  }

  async validateRedis() {
    this.log('ðŸ“¦ Verificando Redis...', 'blue');

    try {
      const { stdout } = await execAsync(
        'docker-compose exec -T redis redis-cli ping || echo "FAIL"'
      );

      if (stdout.trim() === 'PONG') {
        this.successes.push('âœ… Redis conectado e funcionando');
      } else {
        this.errors.push('âŒ Redis nÃ£o estÃ¡ respondendo');
      }
    } catch (error) {
      this.warnings.push(`NÃ£o foi possÃ­vel verificar Redis: ${error.message}`);
    }
  }

  async validateLogs() {
    this.log('ðŸ“‹ Verificando sistema de logs...', 'blue');

    try {
      const logsPath = path.join(process.cwd(), 'logs');
      await fs.access(logsPath);

      const logFiles = await fs.readdir(logsPath);
      if (logFiles.length > 0) {
        this.successes.push(`âœ… Sistema de logs ativo (${logFiles.length} arquivos)`);
      } else {
        this.warnings.push('âš ï¸ DiretÃ³rio de logs vazio');
      }
    } catch (error) {
      this.warnings.push('âš ï¸ DiretÃ³rio de logs nÃ£o encontrado');
    }
  }

  async validateSessions() {
    this.log('ðŸ”‘ Verificando sessÃµes WhatsApp...', 'blue');

    try {
      const sessionsPath = path.join(process.cwd(), 'sessions');

      try {
        await fs.access(sessionsPath);
        const sessions = await fs.readdir(sessionsPath);
        this.successes.push(`âœ… DiretÃ³rio de sessÃµes encontrado (${sessions.length} sessÃµes)`);
      } catch {
        this.warnings.push(
          'âš ï¸ DiretÃ³rio de sessÃµes nÃ£o encontrado - serÃ¡ criado automaticamente'
        );
      }
    } catch (error) {
      this.warnings.push(`Erro ao verificar sessÃµes: ${error.message}`);
    }
  }

  generateReport() {
    this.log('\nðŸ“Š RELATÃ“RIO DE VALIDAÃ‡ÃƒO', 'magenta');
    this.log('='.repeat(50), 'magenta');

    // Sucessos
    if (this.successes.length > 0) {
      this.log(`\nâœ… SUCESSOS (${this.successes.length}):`, 'green');
      this.successes.forEach(success => this.log(`  ${success}`, 'green'));
    }

    // Avisos
    if (this.warnings.length > 0) {
      this.log(`\nâš ï¸ AVISOS (${this.warnings.length}):`, 'yellow');
      this.warnings.forEach(warning => this.log(`  ${warning}`, 'yellow'));
    }

    // Erros
    if (this.errors.length > 0) {
      this.log(`\nâŒ ERROS (${this.errors.length}):`, 'red');
      this.errors.forEach(error => this.log(`  ${error}`, 'red'));
    }

    // Resumo
    this.log(`\nðŸ“ˆ RESUMO:`, 'cyan');
    this.log(`  Sucessos: ${this.successes.length}`, 'green');
    this.log(`  Avisos: ${this.warnings.length}`, 'yellow');
    this.log(`  Erros: ${this.errors.length}`, 'red');

    const score = Math.round(
      (this.successes.length / (this.successes.length + this.errors.length)) * 100
    );
    this.log(`  Score de SaÃºde: ${score}%`, score > 80 ? 'green' : score > 60 ? 'yellow' : 'red');

    return {
      score,
      errors: this.errors.length,
      warnings: this.warnings.length,
      successes: this.successes.length,
      hasErrors: this.errors.length > 0,
    };
  }

  async run() {
    this.log('ðŸš€ Iniciando validaÃ§Ã£o completa do projeto my-wa-api...', 'cyan');
    this.log('='.repeat(60), 'cyan');

    // Executar todas as validaÃ§Ãµes
    await this.validateEnvironmentVariables();
    await this.validateRoutes();
    await this.validateContainers();
    await this.validateDependencies();
    await this.validateReactComponents();
    await this.validateDatabase();
    await this.validateRedis();
    await this.validateWebSocketConnection();
    await this.validateLogs();
    await this.validateSessions();

    const report = this.generateReport();

    if (report.hasErrors) {
      this.log('\nâŒ ValidaÃ§Ã£o concluÃ­da com erros!', 'red');
      process.exit(1);
    } else {
      this.log('\nðŸŽ‰ ValidaÃ§Ã£o concluÃ­da com sucesso!', 'green');
    }

    return report;
  }
}

// Executar validaÃ§Ã£o se chamado diretamente
if (require.main === module) {
  const validator = new ProjectValidator();
  validator.run().catch(error => {
    console.error('âŒ Erro fatal na validaÃ§Ã£o:', error);
    process.exit(1);
  });
}

module.exports = ProjectValidator;
