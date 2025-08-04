#!/usr/bin/env node

/**
 * Script de Validação Completa do Projeto my-wa-api
 * Implementa todas as validações e verificações necessárias
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
    this.log('🔍 Validando variáveis de ambiente...', 'blue');

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
          this.warnings.push(`Arquivo .env não encontrado para ${app}`);
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
          this.errors.push(`Variáveis faltantes em ${app}: ${missing.join(', ')}`);
        } else {
          this.successes.push(`✅ Variáveis de ambiente OK para ${app}`);
        }
      } catch (error) {
        this.errors.push(`Erro ao validar variáveis de ${app}: ${error.message}`);
      }
    }
  }

  async validateRoutes() {
    this.log('🛣️ Validando rotas...', 'blue');

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
        this.successes.push(`✅ Encontradas ${apiRoutes.length} rotas da API`);
      } catch (error) {
        this.warnings.push(`Não foi possível verificar rotas da API: ${error.message}`);
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
              // Verificar se há page.tsx ou page.js
              const pageFile = path.join(fullPath, 'page.tsx');
              try {
                await fs.access(pageFile);
                webRoutes.push(`/${base}${item}`);
              } catch {
                // Não há page.tsx, continuar
              }

              await scanDirectory(fullPath, `${base}${item}/`);
            }
          }
        } catch (error) {
          // Diretório não acessível
        }
      };

      await scanDirectory(webRoutesPath);
      this.successes.push(`✅ Encontradas ${webRoutes.length} rotas do Web`);
    } catch (error) {
      this.errors.push(`Erro ao validar rotas: ${error.message}`);
    }
  }

  async validateContainers() {
    this.log('🐳 Verificando containers Docker...', 'blue');

    try {
      const { stdout } = await execAsync('docker-compose ps --format json');
      const containers = JSON.parse(`[${stdout.trim().split('\n').join(',')}]`);

      const expectedServices = ['api', 'web', 'postgres', 'redis'];
      const runningServices = containers.map(c => c.Service);

      expectedServices.forEach(service => {
        const container = containers.find(c => c.Service === service);
        if (container) {
          if (container.State === 'running') {
            this.successes.push(`✅ Container ${service} rodando`);
          } else {
            this.errors.push(`❌ Container ${service} não está rodando: ${container.State}`);
          }
        } else {
          this.errors.push(`❌ Container ${service} não encontrado`);
        }
      });
    } catch (error) {
      this.warnings.push(`Não foi possível verificar containers: ${error.message}`);
    }
  }

  async validateWebSocketConnection() {
    this.log('🔌 Testando conexão WebSocket...', 'blue');

    try {
      // Verificar se o servidor está rodando
      const { stdout: apiStatus } = await execAsync(
        'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "000"'
      );

      if (apiStatus.trim() !== '200') {
        this.errors.push('❌ API não está respondendo na porta 3000');
        return;
      }

      // Testar WebSocket connection (simulado)
      this.successes.push('✅ API respondendo na porta 3000');
      this.warnings.push('⚠️ Teste de WebSocket requer implementação adicional');
    } catch (error) {
      this.errors.push(`Erro ao testar WebSocket: ${error.message}`);
    }
  }

  async validateDependencies() {
    this.log('📦 Verificando dependências...', 'blue');

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
          this.successes.push(`✅ Dependências instaladas para ${pkg}`);
        } catch {
          this.warnings.push(`⚠️ node_modules não encontrado para ${pkg}`);
        }
      } catch (error) {
        this.errors.push(`❌ package.json não encontrado para ${pkg}`);
      }
    }
  }

  async validateReactComponents() {
    this.log('⚛️ Validando componentes React...', 'blue');

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
        this.successes.push('✅ Dashboard component exporta default corretamente');
      } else {
        this.errors.push('❌ Dashboard component não tem export default');
      }

      // Verificar hooks necessários
      const requiredHooks = ['useSession', 'useRouter', 'useEffect'];
      const missingHooks = requiredHooks.filter(hook => !content.includes(hook));

      if (missingHooks.length === 0) {
        this.successes.push('✅ Hooks React implementados corretamente');
      } else {
        this.errors.push(`❌ Hooks faltantes: ${missingHooks.join(', ')}`);
      }
    } catch (error) {
      this.errors.push(`Erro ao validar componentes React: ${error.message}`);
    }
  }

  async validateDatabase() {
    this.log('🗄️ Verificando conexão com banco de dados...', 'blue');

    try {
      // Verificar se PostgreSQL está rodando
      const { stdout } = await execAsync(
        'docker-compose exec -T postgres pg_isready -U postgres || echo "not ready"'
      );

      if (stdout.includes('accepting connections')) {
        this.successes.push('✅ PostgreSQL conectado e funcionando');
      } else {
        this.errors.push('❌ PostgreSQL não está respondendo');
      }
    } catch (error) {
      this.warnings.push(`Não foi possível verificar PostgreSQL: ${error.message}`);
    }
  }

  async validateRedis() {
    this.log('📦 Verificando Redis...', 'blue');

    try {
      const { stdout } = await execAsync(
        'docker-compose exec -T redis redis-cli ping || echo "FAIL"'
      );

      if (stdout.trim() === 'PONG') {
        this.successes.push('✅ Redis conectado e funcionando');
      } else {
        this.errors.push('❌ Redis não está respondendo');
      }
    } catch (error) {
      this.warnings.push(`Não foi possível verificar Redis: ${error.message}`);
    }
  }

  async validateLogs() {
    this.log('📋 Verificando sistema de logs...', 'blue');

    try {
      const logsPath = path.join(process.cwd(), 'logs');
      await fs.access(logsPath);

      const logFiles = await fs.readdir(logsPath);
      if (logFiles.length > 0) {
        this.successes.push(`✅ Sistema de logs ativo (${logFiles.length} arquivos)`);
      } else {
        this.warnings.push('⚠️ Diretório de logs vazio');
      }
    } catch (error) {
      this.warnings.push('⚠️ Diretório de logs não encontrado');
    }
  }

  async validateSessions() {
    this.log('🔑 Verificando sessões WhatsApp...', 'blue');

    try {
      const sessionsPath = path.join(process.cwd(), 'sessions');

      try {
        await fs.access(sessionsPath);
        const sessions = await fs.readdir(sessionsPath);
        this.successes.push(`✅ Diretório de sessões encontrado (${sessions.length} sessões)`);
      } catch {
        this.warnings.push('⚠️ Diretório de sessões não encontrado - será criado automaticamente');
      }
    } catch (error) {
      this.warnings.push(`Erro ao verificar sessões: ${error.message}`);
    }
  }

  generateReport() {
    this.log('\n📊 RELATÓRIO DE VALIDAÇÃO', 'magenta');
    this.log('='.repeat(50), 'magenta');

    // Sucessos
    if (this.successes.length > 0) {
      this.log(`\n✅ SUCESSOS (${this.successes.length}):`, 'green');
      this.successes.forEach(success => this.log(`  ${success}`, 'green'));
    }

    // Avisos
    if (this.warnings.length > 0) {
      this.log(`\n⚠️ AVISOS (${this.warnings.length}):`, 'yellow');
      this.warnings.forEach(warning => this.log(`  ${warning}`, 'yellow'));
    }

    // Erros
    if (this.errors.length > 0) {
      this.log(`\n❌ ERROS (${this.errors.length}):`, 'red');
      this.errors.forEach(error => this.log(`  ${error}`, 'red'));
    }

    // Resumo
    this.log(`\n📈 RESUMO:`, 'cyan');
    this.log(`  Sucessos: ${this.successes.length}`, 'green');
    this.log(`  Avisos: ${this.warnings.length}`, 'yellow');
    this.log(`  Erros: ${this.errors.length}`, 'red');

    const score = Math.round(
      (this.successes.length / (this.successes.length + this.errors.length)) * 100
    );
    this.log(`  Score de Saúde: ${score}%`, score > 80 ? 'green' : score > 60 ? 'yellow' : 'red');

    return {
      score,
      errors: this.errors.length,
      warnings: this.warnings.length,
      successes: this.successes.length,
      hasErrors: this.errors.length > 0,
    };
  }

  async run() {
    this.log('🚀 Iniciando validação completa do projeto my-wa-api...', 'cyan');
    this.log('='.repeat(60), 'cyan');

    // Executar todas as validações
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
      this.log('\n❌ Validação concluída com erros!', 'red');
      process.exit(1);
    } else {
      this.log('\n🎉 Validação concluída com sucesso!', 'green');
    }

    return report;
  }
}

// Executar validação se chamado diretamente
if (require.main === module) {
  const validator = new ProjectValidator();
  validator.run().catch(error => {
    console.error('❌ Erro fatal na validação:', error);
    process.exit(1);
  });
}

module.exports = ProjectValidator;
