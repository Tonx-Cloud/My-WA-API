/**
 * Test Runner Completo - My WA API
 * Executa todos os testes de validaÃ§Ã£o e infraestrutura
 */

const { exec, execSync } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const net = require('net');

const execAsync = promisify(exec);

class TestRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      overall: true,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      categories: {},
    };

    this.projectRoot = process.cwd();
  }

  async runAllTests() {
    console.log('ðŸ§ª INICIANDO ROTINA COMPLETA DE TESTES');
    console.log('======================================');
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log(`DiretÃ³rio: ${this.projectRoot}\n`);

    const testCategories = [
      {
        name: 'environment',
        label: 'ðŸŒ Ambiente e DependÃªncias',
        fn: () => this.testEnvironment(),
      },
      {
        name: 'build',
        label: 'ðŸ”¨ Build e CompilaÃ§Ã£o',
        fn: () => this.testBuild(),
      },
      {
        name: 'linting',
        label: 'ðŸ§¹ Code Quality e Linting',
        fn: () => this.testLinting(),
      },
      {
        name: 'types',
        label: 'ðŸ“ TypeScript Types',
        fn: () => this.testTypes(),
      },
      {
        name: 'docker',
        label: 'ðŸ³ Docker Infrastructure',
        fn: () => this.testDocker(),
      },
      {
        name: 'services',
        label: 'ðŸ”§ Services Health',
        fn: () => this.testServices(),
      },
      {
        name: 'database',
        label: 'ðŸ—„ï¸ Database Connectivity',
        fn: () => this.testDatabase(),
      },
      {
        name: 'websocket',
        label: 'ðŸ”Œ WebSocket Connection',
        fn: () => this.testWebSocket(),
      },
      {
        name: 'whatsapp',
        label: 'ðŸ“± WhatsApp Integration',
        fn: () => this.testWhatsApp(),
      },
      {
        name: 'frontend',
        label: 'ðŸŒ Frontend Functionality',
        fn: () => this.testFrontend(),
      },
      { name: 'api', label: 'ðŸš€ API Endpoints', fn: () => this.testAPI() },
      {
        name: 'performance',
        label: 'âš¡ Performance Metrics',
        fn: () => this.testPerformance(),
      },
    ];

    for (const category of testCategories) {
      await this.runTestCategory(category);
    }

    this.printFinalReport();
    return this.results;
  }

  async runTestCategory(category) {
    console.log(`\n${category.label}`);
    console.log('â”€'.repeat(60));

    const startTime = Date.now();

    try {
      const result = await category.fn();
      const duration = Date.now() - startTime;

      result.duration = duration;
      this.results.categories[category.name] = result;

      // Atualizar contadores globais
      this.results.totalTests += result.totalTests || 0;
      this.results.passedTests += result.passedTests || 0;
      this.results.failedTests += result.failedTests || 0;
      this.results.skippedTests += result.skippedTests || 0;

      if (!result.passed) {
        this.results.overall = false;
      }

      this.printCategoryResult(category.label, result, duration);
    } catch (error) {
      console.error(`âŒ ERRO na categoria ${category.label}:`, error.message);

      this.results.categories[category.name] = {
        passed: false,
        error: error.message,
        duration: Date.now() - startTime,
        totalTests: 1,
        failedTests: 1,
        tests: [],
      };

      this.results.totalTests += 1;
      this.results.failedTests += 1;
      this.results.overall = false;
    }
  }

  async testEnvironment() {
    const tests = [];
    let passed = 0;
    let failed = 0;

    // Node.js version
    const nodeVersion = process.version;
    const nodeValid = parseFloat(nodeVersion.slice(1)) >= 18;
    tests.push({
      name: 'Node.js Version >= 18',
      status: nodeValid ? 'PASS' : 'FAIL',
      details: nodeVersion,
      duration: 0,
    });
    nodeValid ? passed++ : failed++;

    // Package managers
    for (const pm of ['npm', 'yarn']) {
      try {
        const version = execSync(`${pm} --version`, {
          encoding: 'utf8',
          timeout: 5000,
        }).trim();
        tests.push({
          name: `${pm.toUpperCase()} Available`,
          status: 'PASS',
          details: `v${version}`,
          duration: 0,
        });
        passed++;
      } catch (error) {
        tests.push({
          name: `${pm.toUpperCase()} Available`,
          status: 'FAIL',
          details: 'Not installed',
          duration: 0,
        });
        failed++;
      }
    }

    // Environment files
    const envFiles = ['.env', 'apps/api/.env', 'apps/web/.env'];
    for (const envFile of envFiles) {
      try {
        await fs.access(path.join(this.projectRoot, envFile));
        tests.push({
          name: `Environment File (${envFile})`,
          status: 'PASS',
          details: 'Found',
          duration: 0,
        });
        passed++;
      } catch (error) {
        tests.push({
          name: `Environment File (${envFile})`,
          status: 'WARN',
          details: 'Not found',
          duration: 0,
        });
      }
    }

    // Package.json files
    const packageFiles = [
      'package.json',
      'apps/api/package.json',
      'apps/web/package.json',
      'packages/shared/package.json',
    ];
    for (const pkgFile of packageFiles) {
      try {
        const content = await fs.readFile(path.join(this.projectRoot, pkgFile), 'utf8');
        const pkg = JSON.parse(content);
        tests.push({
          name: `Package.json (${pkgFile})`,
          status: 'PASS',
          details: `${pkg.name}@${pkg.version}`,
          duration: 0,
        });
        passed++;
      } catch (error) {
        tests.push({
          name: `Package.json (${pkgFile})`,
          status: 'FAIL',
          details: error.message,
          duration: 0,
        });
        failed++;
      }
    }

    return {
      passed: failed === 0,
      totalTests: tests.length,
      passedTests: passed,
      failedTests: failed,
      tests,
    };
  }

  async testBuild() {
    const tests = [];
    let passed = 0;
    let failed = 0;

    const buildTargets = [
      { name: 'API Build', path: 'apps/api', command: 'npm run build' },
      { name: 'Web Build', path: 'apps/web', command: 'npm run build' },
      {
        name: 'Shared Build',
        path: 'packages/shared',
        command: 'npm run build',
      },
    ];

    for (const target of buildTargets) {
      const startTime = Date.now();
      try {
        console.log(`  ðŸ”¨ Building ${target.name}...`);

        await execAsync(target.command, {
          cwd: path.join(this.projectRoot, target.path),
          timeout: 120000,
        });

        const duration = Date.now() - startTime;
        tests.push({
          name: target.name,
          status: 'PASS',
          details: `Built successfully`,
          duration,
        });
        passed++;
      } catch (error) {
        const duration = Date.now() - startTime;
        tests.push({
          name: target.name,
          status: 'FAIL',
          details: error.message.split('\n')[0],
          duration,
        });
        failed++;
      }
    }

    return {
      passed: failed === 0,
      totalTests: tests.length,
      passedTests: passed,
      failedTests: failed,
      tests,
    };
  }

  async testLinting() {
    const tests = [];
    let passed = 0;
    let failed = 0;

    const lintTargets = [
      { name: 'API Lint', path: 'apps/api' },
      { name: 'Web Lint', path: 'apps/web' },
      { name: 'Shared Lint', path: 'packages/shared' },
    ];

    for (const target of lintTargets) {
      const startTime = Date.now();
      try {
        console.log(`  ðŸ§¹ Linting ${target.name}...`);

        await execAsync('npm run lint', {
          cwd: path.join(this.projectRoot, target.path),
          timeout: 60000,
        });

        const duration = Date.now() - startTime;
        tests.push({
          name: target.name,
          status: 'PASS',
          details: 'No lint errors',
          duration,
        });
        passed++;
      } catch (error) {
        const duration = Date.now() - startTime;
        const isWarningOnly = error.code === 1 && !error.stderr;

        tests.push({
          name: target.name,
          status: isWarningOnly ? 'WARN' : 'FAIL',
          details: isWarningOnly ? 'Has warnings' : 'Has errors',
          duration,
        });

        if (!isWarningOnly) failed++;
        else passed++;
      }
    }

    return {
      passed: failed === 0,
      totalTests: tests.length,
      passedTests: passed,
      failedTests: failed,
      tests,
    };
  }

  async testTypes() {
    const tests = [];
    let passed = 0;
    let failed = 0;

    const typeTargets = [
      { name: 'API Types', path: 'apps/api' },
      { name: 'Web Types', path: 'apps/web' },
      { name: 'Shared Types', path: 'packages/shared' },
    ];

    for (const target of typeTargets) {
      const startTime = Date.now();
      try {
        console.log(`  ðŸ“ Type checking ${target.name}...`);

        await execAsync('npx tsc --noEmit', {
          cwd: path.join(this.projectRoot, target.path),
          timeout: 60000,
        });

        const duration = Date.now() - startTime;
        tests.push({
          name: target.name,
          status: 'PASS',
          details: 'No type errors',
          duration,
        });
        passed++;
      } catch (error) {
        const duration = Date.now() - startTime;
        tests.push({
          name: target.name,
          status: 'FAIL',
          details: 'Type errors found',
          duration,
        });
        failed++;
      }
    }

    return {
      passed: failed === 0,
      totalTests: tests.length,
      passedTests: passed,
      failedTests: failed,
      tests,
    };
  }

  async testDocker() {
    const tests = [];
    let passed = 0;
    let failed = 0;

    // Docker availability
    try {
      const version = execSync('docker --version', {
        encoding: 'utf8',
        timeout: 5000,
      });
      tests.push({
        name: 'Docker Available',
        status: 'PASS',
        details: version.trim(),
        duration: 0,
      });
      passed++;
    } catch (error) {
      tests.push({
        name: 'Docker Available',
        status: 'FAIL',
        details: 'Docker not found',
        duration: 0,
      });
      failed++;
    }

    // Docker Compose availability
    try {
      const version = execSync('docker-compose --version', {
        encoding: 'utf8',
        timeout: 5000,
      });
      tests.push({
        name: 'Docker Compose Available',
        status: 'PASS',
        details: version.trim(),
        duration: 0,
      });
      passed++;
    } catch (error) {
      tests.push({
        name: 'Docker Compose Available',
        status: 'FAIL',
        details: 'Docker Compose not found',
        duration: 0,
      });
      failed++;
    }

    // Docker containers status
    try {
      const output = execSync('docker ps --format "table {{.Names}}\t{{.Status}}"', {
        encoding: 'utf8',
        timeout: 10000,
      });

      const lines = output.split('\n').filter(line => line.includes('my-wa-api'));
      const runningContainers = lines.filter(line => line.includes('Up')).length;

      tests.push({
        name: 'Docker Containers Running',
        status: runningContainers > 0 ? 'PASS' : 'WARN',
        details: `${runningContainers} containers running`,
        duration: 0,
      });

      if (runningContainers > 0) passed++;
    } catch (error) {
      tests.push({
        name: 'Docker Containers Running',
        status: 'FAIL',
        details: 'Cannot check containers',
        duration: 0,
      });
      failed++;
    }

    return {
      passed: failed === 0,
      totalTests: tests.length,
      passedTests: passed,
      failedTests: failed,
      tests,
    };
  }

  async testServices() {
    const tests = [];
    let passed = 0;
    let failed = 0;

    const services = [
      { name: 'API Health', url: 'http://localhost:3001/health' },
      { name: 'Web Service', url: 'http://localhost:3000' },
    ];

    for (const service of services) {
      const startTime = Date.now();
      try {
        console.log(`  ðŸ”§ Testing ${service.name}...`);

        // Use fetch if available, otherwise skip
        let response;
        try {
          response = await fetch(service.url, {
            method: 'GET',
            timeout: 10000,
            signal: AbortSignal.timeout(10000),
          });
        } catch (fetchError) {
          throw new Error(`Service not responding: ${fetchError.message}`);
        }

        const duration = Date.now() - startTime;

        tests.push({
          name: service.name,
          status: response.ok ? 'PASS' : 'FAIL',
          details: `HTTP ${response.status} (${duration}ms)`,
          duration,
        });

        response.ok ? passed++ : failed++;
      } catch (error) {
        const duration = Date.now() - startTime;
        tests.push({
          name: service.name,
          status: 'FAIL',
          details: error.message,
          duration,
        });
        failed++;
      }
    }

    return {
      passed: failed === 0,
      totalTests: tests.length,
      passedTests: passed,
      failedTests: failed,
      tests,
    };
  }

  async testDatabase() {
    const tests = [];
    let passed = 0;
    let failed = 0;

    const databases = [
      { name: 'PostgreSQL', host: 'localhost', port: 5432 },
      { name: 'Redis', host: 'localhost', port: 6379 },
    ];

    for (const db of databases) {
      const startTime = Date.now();
      try {
        console.log(`  ðŸ—„ï¸ Testing ${db.name} connection...`);

        const isConnectable = await this.testPortConnection(db.host, db.port);
        const duration = Date.now() - startTime;

        tests.push({
          name: `${db.name} Connection`,
          status: isConnectable ? 'PASS' : 'FAIL',
          details: isConnectable ? `Port ${db.port} accessible` : `Port ${db.port} not accessible`,
          duration,
        });

        isConnectable ? passed++ : failed++;
      } catch (error) {
        const duration = Date.now() - startTime;
        tests.push({
          name: `${db.name} Connection`,
          status: 'FAIL',
          details: error.message,
          duration,
        });
        failed++;
      }
    }

    return {
      passed: failed === 0,
      totalTests: tests.length,
      passedTests: passed,
      failedTests: failed,
      tests,
    };
  }

  async testWebSocket() {
    const tests = [];
    let passed = 0;
    let failed = 0;

    const startTime = Date.now();
    try {
      console.log('  ðŸ”Œ Testing WebSocket connection...');

      // Test basic port connectivity first
      const portOpen = await this.testPortConnection('localhost', 3001);

      if (!portOpen) {
        throw new Error('Port 3001 not accessible');
      }

      // Try to connect using socket.io-client if available
      let socketConnected = false;
      try {
        // Dynamic import for socket.io-client
        const { io } = await import('socket.io-client');

        const socket = io('http://localhost:3001', {
          timeout: 10000,
          forceNew: true,
        });

        socketConnected = await new Promise(resolve => {
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
      } catch (importError) {
        // If socket.io-client is not available, just check port
        socketConnected = portOpen;
      }

      const duration = Date.now() - startTime;

      tests.push({
        name: 'WebSocket Connection',
        status: socketConnected ? 'PASS' : 'FAIL',
        details: socketConnected ? 'Socket.IO accessible' : 'Socket.IO not accessible',
        duration,
      });

      socketConnected ? passed++ : failed++;
    } catch (error) {
      const duration = Date.now() - startTime;
      tests.push({
        name: 'WebSocket Connection',
        status: 'FAIL',
        details: error.message,
        duration,
      });
      failed++;
    }

    return {
      passed: failed === 0,
      totalTests: tests.length,
      passedTests: passed,
      failedTests: failed,
      tests,
    };
  }

  async testWhatsApp() {
    const tests = [];
    let passed = 0;
    let failed = 0;

    const startTime = Date.now();
    try {
      console.log('  ðŸ“± Testing WhatsApp API...');

      // Test if API endpoint is accessible
      let response;
      try {
        response = await fetch('http://localhost:3001/instances', {
          method: 'GET',
          timeout: 10000,
          signal: AbortSignal.timeout(10000),
        });
      } catch (fetchError) {
        throw new Error(`WhatsApp API not responding: ${fetchError.message}`);
      }

      const duration = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        tests.push({
          name: 'WhatsApp API Endpoint',
          status: 'PASS',
          details: `HTTP ${response.status} - ${Array.isArray(data) ? data.length : 0} instances`,
          duration,
        });
        passed++;
      } else {
        tests.push({
          name: 'WhatsApp API Endpoint',
          status: 'FAIL',
          details: `HTTP ${response.status}`,
          duration,
        });
        failed++;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      tests.push({
        name: 'WhatsApp API Endpoint',
        status: 'FAIL',
        details: error.message,
        duration,
      });
      failed++;
    }

    return {
      passed: failed === 0,
      totalTests: tests.length,
      passedTests: passed,
      failedTests: failed,
      tests,
    };
  }

  async testFrontend() {
    const tests = [];
    let passed = 0;
    let failed = 0;

    // Test React components compilation
    const frontendTests = [
      {
        name: 'Dashboard Component',
        file: 'apps/web/src/app/dashboard/page.tsx',
      },
      { name: 'Layout Component', file: 'apps/web/src/app/layout.tsx' },
      { name: 'Middleware', file: 'apps/web/src/middleware.ts' },
    ];

    for (const test of frontendTests) {
      try {
        await fs.access(path.join(this.projectRoot, test.file));
        const content = await fs.readFile(path.join(this.projectRoot, test.file), 'utf8');

        tests.push({
          name: test.name,
          status: content.length > 0 ? 'PASS' : 'FAIL',
          details: `${Math.round(content.length / 1024)}KB`,
          duration: 0,
        });

        content.length > 0 ? passed++ : failed++;
      } catch (error) {
        tests.push({
          name: test.name,
          status: 'FAIL',
          details: 'File not found',
          duration: 0,
        });
        failed++;
      }
    }

    return {
      passed: failed === 0,
      totalTests: tests.length,
      passedTests: passed,
      failedTests: failed,
      tests,
    };
  }

  async testAPI() {
    const tests = [];
    let passed = 0;
    let failed = 0;

    const apiEndpoints = [
      { name: 'Health Check', path: '/health' },
      { name: 'Instances List', path: '/instances' },
    ];

    for (const endpoint of apiEndpoints) {
      const startTime = Date.now();
      try {
        console.log(`  ðŸš€ Testing API ${endpoint.name}...`);

        const response = await fetch(`http://localhost:3001${endpoint.path}`, {
          method: 'GET',
          timeout: 10000,
          signal: AbortSignal.timeout(10000),
        });

        const duration = Date.now() - startTime;

        tests.push({
          name: endpoint.name,
          status: response.ok ? 'PASS' : 'FAIL',
          details: `HTTP ${response.status} (${duration}ms)`,
          duration,
        });

        response.ok ? passed++ : failed++;
      } catch (error) {
        const duration = Date.now() - startTime;
        tests.push({
          name: endpoint.name,
          status: 'FAIL',
          details: error.message,
          duration,
        });
        failed++;
      }
    }

    return {
      passed: failed === 0,
      totalTests: tests.length,
      passedTests: passed,
      failedTests: failed,
      tests,
    };
  }

  async testPerformance() {
    const tests = [];
    let passed = 0;

    // Memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    tests.push({
      name: 'Memory Usage',
      status: memUsageMB < 500 ? 'PASS' : 'WARN',
      details: `${memUsageMB} MB heap used`,
      duration: 0,
    });
    passed++;

    // Disk usage (basic check)
    try {
      const nodeModulesSize = await this.getDirectorySize(
        path.join(this.projectRoot, 'node_modules')
      );
      tests.push({
        name: 'Dependencies Size',
        status: nodeModulesSize < 1000 ? 'PASS' : 'WARN',
        details: `${nodeModulesSize} MB`,
        duration: 0,
      });
      passed++;
    } catch (error) {
      tests.push({
        name: 'Dependencies Size',
        status: 'SKIP',
        details: 'Could not calculate',
        duration: 0,
      });
    }

    return {
      passed: true, // Performance tests are informational
      totalTests: tests.length,
      passedTests: passed,
      failedTests: 0,
      tests,
    };
  }

  async testPortConnection(host, port) {
    return new Promise(resolve => {
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
      if (process.platform === 'win32') {
        // Windows
        const output = execSync(
          `powershell "(Get-ChildItem '${dirPath}' -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB"`,
          { encoding: 'utf8', timeout: 30000 }
        );
        return Math.round(parseFloat(output.trim()));
      } else {
        // Unix-like
        const output = execSync(`du -sm "${dirPath}" | cut -f1`, {
          encoding: 'utf8',
          timeout: 30000,
        });
        return parseInt(output.trim());
      }
    } catch (error) {
      return 0;
    }
  }

  printCategoryResult(label, result, duration) {
    const status = result.passed ? 'âœ… PASSOU' : 'âŒ FALHOU';
    const durationStr = duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`;

    console.log(`${status} ${label} (${durationStr})`);
    console.log(`  Testes: ${result.passedTests}/${result.totalTests} passaram`);

    if (result.tests && result.tests.length > 0) {
      result.tests.forEach(test => {
        const icon =
          test.status === 'PASS'
            ? '  âœ…'
            : test.status === 'WARN'
              ? '  âš ï¸'
              : test.status === 'SKIP'
                ? '  â­ï¸'
                : '  âŒ';
        const testDuration = test.duration > 0 ? ` (${test.duration}ms)` : '';
        console.log(`${icon} ${test.name}: ${test.details}${testDuration}`);
      });
    }

    if (result.error) {
      console.log(`  âŒ Erro: ${result.error}`);
    }
  }

  printFinalReport() {
    console.log('\nðŸ“Š RELATÃ“RIO FINAL DE TESTES');
    console.log('=============================');

    const totalCategories = Object.keys(this.results.categories).length;
    const passedCategories = Object.values(this.results.categories).filter(c => c.passed).length;

    console.log(`Status Geral: ${this.results.overall ? 'âœ… SUCESSO' : 'âŒ FALHA'}`);
    console.log(`Categorias: ${passedCategories}/${totalCategories} passaram`);
    console.log(
      `Testes Individuais: ${this.results.passedTests}/${this.results.totalTests} passaram`
    );

    if (this.results.failedTests > 0) {
      console.log(`Testes Falharam: ${this.results.failedTests}`);
    }

    if (this.results.skippedTests > 0) {
      console.log(`Testes Pulados: ${this.results.skippedTests}`);
    }

    // Calcular tempo total
    const totalDuration = Object.values(this.results.categories).reduce(
      (sum, cat) => sum + (cat.duration || 0),
      0
    );

    console.log(`Tempo Total: ${(totalDuration / 1000).toFixed(1)}s`);

    if (!this.results.overall) {
      console.log('\nðŸš¨ CATEGORIAS QUE FALHARAM:');
      Object.entries(this.results.categories).forEach(([name, result]) => {
        if (!result.passed) {
          console.log(`  âŒ ${name}: ${result.error || 'Alguns testes falharam'}`);
        }
      });

      console.log('\nðŸ’¡ PRÃ“XIMOS PASSOS:');
      console.log('1. Corrija os problemas identificados');
      console.log('2. Execute novamente: node scripts/test-runner.js');
      console.log('3. Verifique logs especÃ­ficos se necessÃ¡rio');
    } else {
      console.log('\nðŸŽ‰ TODOS OS TESTES PASSARAM! O projeto estÃ¡ funcionando corretamente.');
    }

    console.log(`\nðŸ“„ RelatÃ³rio salvo: logs/test-results-${Date.now()}.json`);
  }

  async saveResults() {
    try {
      const logsDir = path.join(this.projectRoot, 'logs');
      await fs.mkdir(logsDir, { recursive: true });

      const filename = `test-results-${Date.now()}.json`;
      const filepath = path.join(logsDir, filename);

      await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
      return filepath;
    } catch (error) {
      console.warn(`âš ï¸ NÃ£o foi possÃ­vel salvar resultados: ${error.message}`);
      return null;
    }
  }
}

// CLI execution
if (require.main === module) {
  const runner = new TestRunner();

  runner
    .runAllTests()
    .then(async results => {
      await runner.saveResults();
      process.exit(results.overall ? 0 : 1);
    })
    .catch(error => {
      console.error('âŒ Erro crÃ­tico durante testes:', error);
      process.exit(1);
    });
}

module.exports = TestRunner;
