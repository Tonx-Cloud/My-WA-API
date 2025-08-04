#!/usr/bin/env node

/**
 * Script de ValidaÃ§Ã£o do Sistema de Testes
 * Verifica se todos os componentes do sistema de testes estÃ£o funcionando corretamente
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TestSystemValidator {
  constructor() {
    this.results = {
      valid: true,
      errors: [],
      warnings: [],
      checks: [],
    };
  }

  async validate() {
    console.log('ðŸ” Validando Sistema de Testes...\n');

    await this.checkFileStructure();
    await this.checkDependencies();
    await this.checkConfiguration();
    await this.checkScripts();
    await this.checkTestFiles();

    this.printResults();

    if (!this.results.valid) {
      process.exit(1);
    }
  }

  async checkFileStructure() {
    console.log('ðŸ“ Verificando estrutura de arquivos...');

    const requiredFiles = [
      'test-config.json',
      'scripts/run-full-tests.js',
      '.github/workflows/full-test-suite.yml',
      'TESTING.md',
    ];

    const requiredDirs = ['logs', 'apps/api/src/__tests__', 'apps/web/src/__tests__'];

    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (!fs.existsSync(filePath)) {
        this.addError(`Arquivo obrigatÃ³rio nÃ£o encontrado: ${file}`);
      } else {
        this.addCheck(`âœ… ${file}`);
      }
    }

    for (const dir of requiredDirs) {
      const dirPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(dirPath)) {
        this.addWarning(`DiretÃ³rio recomendado nÃ£o encontrado: ${dir}`);
      } else {
        this.addCheck(`âœ… ${dir}/`);
      }
    }
  }

  async checkDependencies() {
    console.log('\nðŸ“¦ Verificando dependÃªncias...');

    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.addError('package.json nÃ£o encontrado');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const requiredDeps = ['winston', 'chalk', 'node-fetch'];

    const requiredDevDeps = ['jest', '@types/jest', 'turbo'];

    for (const dep of requiredDeps) {
      if (!packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]) {
        this.addError(`DependÃªncia obrigatÃ³ria nÃ£o encontrada: ${dep}`);
      } else {
        this.addCheck(`âœ… ${dep}`);
      }
    }

    for (const dep of requiredDevDeps) {
      if (!packageJson.devDependencies?.[dep]) {
        this.addWarning(`DependÃªncia de desenvolvimento recomendada: ${dep}`);
      } else {
        this.addCheck(`âœ… ${dep}`);
      }
    }
  }

  async checkConfiguration() {
    console.log('\nâš™ï¸ Verificando configuraÃ§Ãµes...');

    const configPath = path.join(__dirname, '..', 'test-config.json');
    if (!fs.existsSync(configPath)) {
      this.addError('test-config.json nÃ£o encontrado');
      return;
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      const requiredSections = ['testSuites', 'healthChecks', 'performance', 'reporting', 'ci'];

      for (const section of requiredSections) {
        if (!config[section]) {
          this.addError(`SeÃ§Ã£o obrigatÃ³ria na configuraÃ§Ã£o: ${section}`);
        } else {
          this.addCheck(`âœ… config.${section}`);
        }
      }

      // Verificar URLs de health check
      if (config.healthChecks?.endpoints) {
        for (const endpoint of config.healthChecks.endpoints) {
          if (!endpoint.url || !endpoint.name) {
            this.addWarning('Endpoint de health check mal configurado');
          }
        }
      }
    } catch (error) {
      this.addError(`Erro ao parsear test-config.json: ${error.message}`);
    }
  }

  async checkScripts() {
    console.log('\nðŸ“œ Verificando scripts...');

    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const requiredScripts = [
      'test',
      'test:unit',
      'test:integration',
      'test:ci',
      'full-test',
      'validate-tests',
    ];

    for (const script of requiredScripts) {
      if (!packageJson.scripts?.[script]) {
        this.addError(`Script obrigatÃ³rio nÃ£o encontrado: ${script}`);
      } else {
        this.addCheck(`âœ… npm run ${script}`);
      }
    }
  }

  async checkTestFiles() {
    console.log('\nðŸ§ª Verificando arquivos de teste...');

    const testDirs = ['apps/api/src/__tests__', 'apps/web/src/__tests__'];

    for (const testDir of testDirs) {
      const fullPath = path.join(__dirname, '..', testDir);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        const testFiles = files.filter(f => f.endsWith('.test.js') || f.endsWith('.test.ts'));

        if (testFiles.length === 0) {
          this.addWarning(`Nenhum arquivo de teste encontrado em ${testDir}`);
        } else {
          this.addCheck(`âœ… ${testFiles.length} arquivo(s) de teste em ${testDir}`);
        }
      }
    }
  }

  addError(message) {
    this.results.valid = false;
    this.results.errors.push(message);
  }

  addWarning(message) {
    this.results.warnings.push(message);
  }

  addCheck(message) {
    this.results.checks.push(message);
  }

  printResults() {
    console.log('\nðŸ“Š Resultados da ValidaÃ§Ã£o:\n');

    if (this.results.checks.length > 0) {
      console.log('âœ… VerificaÃ§Ãµes Bem-sucedidas:');
      this.results.checks.forEach(check => console.log(`   ${check}`));
      console.log('');
    }

    if (this.results.warnings.length > 0) {
      console.log('âš ï¸  Avisos:');
      this.results.warnings.forEach(warning => console.log(`   ${warning}`));
      console.log('');
    }

    if (this.results.errors.length > 0) {
      console.log('âŒ Erros:');
      this.results.errors.forEach(error => console.log(`   ${error}`));
      console.log('');
    }

    const status = this.results.valid ? 'âœ… VÃLIDO' : 'âŒ INVÃLIDO';
    const summary = `
â•­â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â•®
â”‚ Status do Sistema de Testes: ${status}    â”‚
â”‚ VerificaÃ§Ãµes: ${this.results.checks.length.toString().padStart(2)}                 â”‚
â”‚ Avisos: ${this.results.warnings.length.toString().padStart(7)}                   â”‚
â”‚ Erros: ${this.results.errors.length.toString().padStart(8)}                    â”‚
â•°â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â•¯
`;

    console.log(summary);

    if (this.results.valid) {
      console.log('ðŸŽ‰ Sistema de testes estÃ¡ funcionando corretamente!');
      console.log('ðŸ“– Execute "npm run full-test" para executar todos os testes.');
    } else {
      console.log('ðŸ”§ Corrija os erros acima antes de executar os testes.');
    }
  }
}

// Executar validaÃ§Ã£o sempre que o script for chamado diretamente
const validator = new TestSystemValidator();
validator.validate().catch(error => {
  console.error('âŒ Erro durante a validaÃ§Ã£o:', error);
  process.exit(1);
});

export default TestSystemValidator;
