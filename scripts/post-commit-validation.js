/**
 * Procedimentos Pós-Commit e Validação
 * Script completo para validar mudanças após commits
 */

const { exec, execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class PostCommitValidator {
  constructor() {
    this.projectRoot = process.cwd();
    this.validationResults = {
      timestamp: new Date().toISOString(),
      overall: true,
      categories: {},
    };
  }

  async runAllValidations() {
    console.log('🚀 INICIANDO VALIDAÇÕES PÓS-COMMIT');
    console.log('=====================================\n');

    const validations = [
      {
        name: 'environment',
        label: '🌍 Ambiente',
        fn: () => this.validateEnvironment(),
      },
      {
        name: 'dependencies',
        label: '📦 Dependências',
        fn: () => this.validateDependencies(),
      },
      { name: 'build', label: '🔨 Build', fn: () => this.validateBuild() },
      {
        name: 'linting',
        label: '🧹 Linting',
        fn: () => this.validateLinting(),
      },
      { name: 'types', label: '📝 TypeScript', fn: () => this.validateTypes() },
      { name: 'docker', label: '🐳 Docker', fn: () => this.validateDocker() },
      {
        name: 'services',
        label: '🔧 Serviços',
        fn: () => this.validateServices(),
      },
      {
        name: 'database',
        label: '🗄️ Database',
        fn: () => this.validateDatabase(),
      },
      {
        name: 'websocket',
        label: '🔌 WebSocket',
        fn: () => this.validateWebSocket(),
      },
      {
        name: 'whatsapp',
        label: '📱 WhatsApp',
        fn: () => this.validateWhatsApp(),
      },
      {
        name: 'performance',
        label: '⚡ Performance',
        fn: () => this.validatePerformance(),
      },
    ];

    for (const validation of validations) {
      console.log(`\n${validation.label} Validação...`);
      console.log('─'.repeat(50));

      try {
        const result = await validation.fn();
        this.validationResults.categories[validation.name] = result;

        if (!result.passed) {
          this.validationResults.overall = false;
        }

        this.printValidationResult(validation.label, result);
      } catch (error) {
        console.error(`❌ Erro na validação ${validation.label}:`, error.message);
        this.validationResults.categories[validation.name] = {
          passed: false,
          error: error.message,
          checks: [],
        };
        this.validationResults.overall = false;
      }
    }

    // Resultado final
    console.log('\n📊 RESULTADO FINAL');
    console.log('==================');
    this.printFinalSummary();

    return this.validationResults;
  }

  async validateEnvironment() {
    const checks = [];
    let passed = true;

    // Node.js version
    try {
      const nodeVersion = process.version;
      const isValidNode = parseFloat(nodeVersion.slice(1)) >= 18;
      checks.push({
        name: 'Node.js Version',
        status: isValidNode ? 'PASS' : 'FAIL',
        details: `${nodeVersion} ${isValidNode ? '(>= 18.0)' : '(< 18.0 - Update required)'}`,
      });
      if (!isValidNode) passed = false;
    } catch (error) {
      checks.push({
        name: 'Node.js Version',
        status: 'ERROR',
        details: error.message,
      });
      passed = false;
    }

    // Package managers
    const packageManagers = ['npm', 'yarn'];
    for (const pm of packageManagers) {
      try {
        const version = execSync(`${pm} --version`, {
          encoding: 'utf8',
          timeout: 5000,
        }).trim();
        checks.push({
          name: `${pm.toUpperCase()} Available`,
          status: 'PASS',
          details: `v${version}`,
        });
      } catch (error) {
        checks.push({
          name: `${pm.toUpperCase()} Available`,
          status: 'FAIL',
          details: 'Not installed',
        });
      }
    }

    // Environment files
    const envFiles = ['.env', '.env.local', '.env.development'];
    for (const envFile of envFiles) {
      try {
        await fs.access(path.join(this.projectRoot, envFile));
        checks.push({
          name: `Environment File (${envFile})`,
          status: 'PASS',
          details: 'Exists',
        });
      } catch (error) {
        checks.push({
          name: `Environment File (${envFile})`,
          status: 'WARN',
          details: 'Not found',
        });
      }
    }

    return { passed, checks };
  }

  async validateDependencies() {
    const checks = [];
    let passed = true;

    // Root dependencies
    try {
      console.log('  📋 Verificando dependências do workspace...');
      execSync('npm ls --depth=0', { encoding: 'utf8', timeout: 30000 });
      checks.push({
        name: 'Root Dependencies',
        status: 'PASS',
        details: 'All dependencies resolved',
      });
    } catch (error) {
      checks.push({
        name: 'Root Dependencies',
        status: 'FAIL',
        details: 'Dependency issues found',
      });
      passed = false;
    }

    // Check each workspace
    const workspaces = ['apps/api', 'apps/web', 'packages/shared'];
    for (const workspace of workspaces) {
      const workspacePath = path.join(this.projectRoot, workspace);

      try {
        await fs.access(path.join(workspacePath, 'package.json'));

        console.log(`  📋 Verificando ${workspace}...`);
        execSync('npm ls --depth=0', {
          cwd: workspacePath,
          encoding: 'utf8',
          timeout: 30000,
        });

        checks.push({
          name: `${workspace} Dependencies`,
          status: 'PASS',
          details: 'Dependencies OK',
        });
      } catch (error) {
        checks.push({
          name: `${workspace} Dependencies`,
          status: 'FAIL',
          details: error.message.split('\n')[0],
        });
        passed = false;
      }
    }

    return { passed, checks };
  }

  async validateBuild() {
    const checks = [];
    let passed = true;

    // Build API
    try {
      console.log('  🔨 Building API...');
      execSync('npm run build', {
        cwd: path.join(this.projectRoot, 'apps/api'),
        encoding: 'utf8',
        timeout: 60000,
      });
      checks.push({
        name: 'API Build',
        status: 'PASS',
        details: 'Build successful',
      });
    } catch (error) {
      checks.push({
        name: 'API Build',
        status: 'FAIL',
        details: 'Build failed',
      });
      passed = false;
    }

    // Build Web
    try {
      console.log('  🔨 Building Web...');
      execSync('npm run build', {
        cwd: path.join(this.projectRoot, 'apps/web'),
        encoding: 'utf8',
        timeout: 120000,
      });
      checks.push({
        name: 'Web Build',
        status: 'PASS',
        details: 'Build successful',
      });
    } catch (error) {
      checks.push({
        name: 'Web Build',
        status: 'FAIL',
        details: 'Build failed',
      });
      passed = false;
    }

    // Build Shared
    try {
      console.log('  🔨 Building Shared...');
      execSync('npm run build', {
        cwd: path.join(this.projectRoot, 'packages/shared'),
        encoding: 'utf8',
        timeout: 60000,
      });
      checks.push({
        name: 'Shared Build',
        status: 'PASS',
        details: 'Build successful',
      });
    } catch (error) {
      checks.push({
        name: 'Shared Build',
        status: 'FAIL',
        details: 'Build failed',
      });
      passed = false;
    }

    return { passed, checks };
  }

  async validateLinting() {
    const checks = [];
    let passed = true;

    const workspaces = [
      { name: 'API', path: 'apps/api' },
      { name: 'Web', path: 'apps/web' },
      { name: 'Shared', path: 'packages/shared' },
    ];

    for (const workspace of workspaces) {
      try {
        console.log(`  🧹 Linting ${workspace.name}...`);
        execSync('npm run lint', {
          cwd: path.join(this.projectRoot, workspace.path),
          encoding: 'utf8',
          timeout: 60000,
        });
        checks.push({
          name: `${workspace.name} Linting`,
          status: 'PASS',
          details: 'No lint errors',
        });
      } catch (error) {
        const isWarningOnly = error.status === 1 && !error.stderr;
        checks.push({
          name: `${workspace.name} Linting`,
          status: isWarningOnly ? 'WARN' : 'FAIL',
          details: isWarningOnly ? 'Has warnings' : 'Has errors',
        });
        if (!isWarningOnly) passed = false;
      }
    }

    return { passed, checks };
  }

  async validateTypes() {
    const checks = [];
    let passed = true;

    const typeCheckPaths = [
      { name: 'API', path: 'apps/api' },
      { name: 'Web', path: 'apps/web' },
      { name: 'Shared', path: 'packages/shared' },
    ];

    for (const item of typeCheckPaths) {
      try {
        console.log(`  📝 Type checking ${item.name}...`);
        execSync('npx tsc --noEmit', {
          cwd: path.join(this.projectRoot, item.path),
          encoding: 'utf8',
          timeout: 60000,
        });
        checks.push({
          name: `${item.name} TypeScript`,
          status: 'PASS',
          details: 'No type errors',
        });
      } catch (error) {
        checks.push({
          name: `${item.name} TypeScript`,
          status: 'FAIL',
          details: 'Type errors found',
        });
        passed = false;
      }
    }

    return { passed, checks };
  }

  async validateDocker() {
    const checks = [];
    let passed = true;

    // Docker disponível
    try {
      const version = execSync('docker --version', {
        encoding: 'utf8',
        timeout: 5000,
      });
      checks.push({
        name: 'Docker Available',
        status: 'PASS',
        details: version.trim(),
      });
    } catch (error) {
      checks.push({
        name: 'Docker Available',
        status: 'FAIL',
        details: 'Docker not installed',
      });
      passed = false;
    }

    // Docker Compose disponível
    try {
      const version = execSync('docker-compose --version', {
        encoding: 'utf8',
        timeout: 5000,
      });
      checks.push({
        name: 'Docker Compose Available',
        status: 'PASS',
        details: version.trim(),
      });
    } catch (error) {
      checks.push({
        name: 'Docker Compose Available',
        status: 'FAIL',
        details: 'Docker Compose not installed',
      });
      passed = false;
    }

    // Containers status
    try {
      const output = execSync('docker ps', {
        encoding: 'utf8',
        timeout: 10000,
      });
      const containerCount = output.split('\n').length - 2; // subtract header and empty line
      checks.push({
        name: 'Docker Containers',
        status: containerCount > 0 ? 'PASS' : 'WARN',
        details: `${containerCount} containers running`,
      });
    } catch (error) {
      checks.push({
        name: 'Docker Containers',
        status: 'FAIL',
        details: 'Cannot check containers',
      });
      passed = false;
    }

    return { passed, checks };
  }

  async validateServices() {
    const checks = [];
    let passed = true;

    const services = [
      { name: 'API', url: 'http://localhost:3001/health', port: 3001 },
      { name: 'Web', url: 'http://localhost:3000', port: 3000 },
    ];

    for (const service of services) {
      try {
        console.log(`  🔧 Checking ${service.name} service...`);
        const response = await axios.get(service.url, { timeout: 10000 });
        checks.push({
          name: `${service.name} Service`,
          status: 'PASS',
          details: `HTTP ${response.status}`,
        });
      } catch (error) {
        checks.push({
          name: `${service.name} Service`,
          status: 'FAIL',
          details: error.code || error.message,
        });
        passed = false;
      }
    }

    return { passed, checks };
  }

  async validateDatabase() {
    const checks = [];
    let passed = true;

    // PostgreSQL
    try {
      console.log('  🗄️ Testing PostgreSQL connection...');
      const isOpen = await this.checkPort('localhost', 5432);
      checks.push({
        name: 'PostgreSQL Connection',
        status: isOpen ? 'PASS' : 'FAIL',
        details: isOpen ? 'Port 5432 accessible' : 'Port 5432 not accessible',
      });
      if (!isOpen) passed = false;
    } catch (error) {
      checks.push({
        name: 'PostgreSQL Connection',
        status: 'FAIL',
        details: error.message,
      });
      passed = false;
    }

    // Redis
    try {
      console.log('  📦 Testing Redis connection...');
      const isOpen = await this.checkPort('localhost', 6379);
      checks.push({
        name: 'Redis Connection',
        status: isOpen ? 'PASS' : 'FAIL',
        details: isOpen ? 'Port 6379 accessible' : 'Port 6379 not accessible',
      });
      if (!isOpen) passed = false;
    } catch (error) {
      checks.push({
        name: 'Redis Connection',
        status: 'FAIL',
        details: error.message,
      });
      passed = false;
    }

    return { passed, checks };
  }

  async validateWebSocket() {
    const checks = [];
    let passed = true;

    try {
      console.log('  🔌 Testing WebSocket connection...');

      // Usar socket.io-client para testar
      const io = require('socket.io-client');
      const socket = io('http://localhost:3001', {
        timeout: 10000,
        forceNew: true,
      });

      const connected = await new Promise(resolve => {
        const timeout = setTimeout(() => {
          socket.disconnect();
          resolve(false);
        }, 10000);

        socket.on('connect', () => {
          clearTimeout(timeout);
          socket.disconnect();
          resolve(true);
        });

        socket.on('connect_error', () => {
          clearTimeout(timeout);
          socket.disconnect();
          resolve(false);
        });
      });

      checks.push({
        name: 'WebSocket Connection',
        status: connected ? 'PASS' : 'FAIL',
        details: connected ? 'Socket.IO accessible' : 'Socket.IO not accessible',
      });

      if (!connected) passed = false;
    } catch (error) {
      checks.push({
        name: 'WebSocket Connection',
        status: 'FAIL',
        details: error.message,
      });
      passed = false;
    }

    return { passed, checks };
  }

  async validateWhatsApp() {
    const checks = [];
    let passed = true;

    try {
      console.log('  📱 Testing WhatsApp API...');

      const response = await axios.get('http://localhost:3001/instances', {
        timeout: 10000,
      });

      checks.push({
        name: 'WhatsApp API',
        status: 'PASS',
        details: `HTTP ${response.status} - ${response.data?.length || 0} instances`,
      });
    } catch (error) {
      checks.push({
        name: 'WhatsApp API',
        status: 'FAIL',
        details: error.code || error.message,
      });
      passed = false;
    }

    return { passed, checks };
  }

  async validatePerformance() {
    const checks = [];
    let passed = true;

    // Memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    checks.push({
      name: 'Memory Usage',
      status: memUsageMB < 500 ? 'PASS' : 'WARN',
      details: `${memUsageMB} MB`,
    });

    // Build sizes (approximate)
    try {
      const apiDistSize = await this.getDirectorySize(path.join(this.projectRoot, 'apps/api/dist'));
      checks.push({
        name: 'API Build Size',
        status: apiDistSize < 50 ? 'PASS' : 'WARN',
        details: `${apiDistSize} MB`,
      });
    } catch (error) {
      checks.push({
        name: 'API Build Size',
        status: 'SKIP',
        details: 'No build found',
      });
    }

    try {
      const webBuildSize = await this.getDirectorySize(
        path.join(this.projectRoot, 'apps/web/.next')
      );
      checks.push({
        name: 'Web Build Size',
        status: webBuildSize < 100 ? 'PASS' : 'WARN',
        details: `${webBuildSize} MB`,
      });
    } catch (error) {
      checks.push({
        name: 'Web Build Size',
        status: 'SKIP',
        details: 'No build found',
      });
    }

    return { passed, checks };
  }

  async checkPort(host, port) {
    return new Promise(resolve => {
      const net = require('net');
      const socket = new net.Socket();

      const timeout = setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, 5000);

      socket.connect(port, host, () => {
        clearTimeout(timeout);
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
  }

  async getDirectorySize(dirPath) {
    try {
      const { execSync } = require('child_process');
      if (process.platform === 'win32') {
        // Windows
        const output = execSync(
          `powershell "(Get-ChildItem '${dirPath}' -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB"`,
          { encoding: 'utf8' }
        );
        return parseFloat(output.trim());
      } else {
        // Unix-like
        const output = execSync(`du -sm "${dirPath}" | cut -f1`, {
          encoding: 'utf8',
        });
        return parseInt(output.trim());
      }
    } catch (error) {
      return 0;
    }
  }

  printValidationResult(label, result) {
    const status = result.passed ? '✅ PASSOU' : '❌ FALHOU';
    console.log(`${status} ${label}`);

    if (result.checks && result.checks.length > 0) {
      result.checks.forEach(check => {
        const icon =
          check.status === 'PASS'
            ? '  ✅'
            : check.status === 'WARN'
              ? '  ⚠️'
              : check.status === 'SKIP'
                ? '  ⏭️'
                : '  ❌';
        console.log(`${icon} ${check.name}: ${check.details}`);
      });
    }

    if (result.error) {
      console.log(`  ❌ Erro: ${result.error}`);
    }
  }

  printFinalSummary() {
    const totalCategories = Object.keys(this.validationResults.categories).length;
    const passedCategories = Object.values(this.validationResults.categories).filter(
      c => c.passed
    ).length;
    const failedCategories = totalCategories - passedCategories;

    console.log(`Status Geral: ${this.validationResults.overall ? '✅ SUCESSO' : '❌ FALHA'}`);
    console.log(`Categorias: ${passedCategories}/${totalCategories} passaram`);

    if (failedCategories > 0) {
      console.log('\n🚨 CATEGORIAS QUE FALHARAM:');
      Object.entries(this.validationResults.categories).forEach(([name, result]) => {
        if (!result.passed) {
          console.log(`  ❌ ${name}`);
        }
      });

      console.log('\n💡 PRÓXIMOS PASSOS:');
      console.log('1. Corrija os problemas identificados');
      console.log('2. Execute novamente: node scripts/post-commit-validation.js');
      console.log('3. Verifique logs detalhados se necessário');
    } else {
      console.log('\n🎉 Todas as validações passaram! O projeto está pronto.');
    }
  }
}

// CLI execution
if (require.main === module) {
  const validator = new PostCommitValidator();

  validator
    .runAllValidations()
    .then(results => {
      // Salvar resultados
      const resultFile = path.join(__dirname, '..', 'logs', 'validation-results.json');
      fs.writeFile(resultFile, JSON.stringify(results, null, 2))
        .then(() => console.log(`\n📄 Resultados salvos em: ${resultFile}`))
        .catch(err => console.log(`⚠️ Não foi possível salvar resultados: ${err.message}`));

      process.exit(results.overall ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erro durante validação:', error);
      process.exit(1);
    });
}

module.exports = PostCommitValidator;
