#!/usr/bin/env node

/**
 * Script de Validação do Sistema de Testes
 * Verifica se todos os componentes do sistema de testes estão funcionando corretamente
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
      checks: []
    };
  }

  async validate() {
    console.log('🔍 Validando Sistema de Testes...\n');

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
    console.log('📁 Verificando estrutura de arquivos...');
    
    const requiredFiles = [
      'test-config.json',
      'scripts/run-full-tests.js',
      '.github/workflows/full-test-suite.yml',
      'TESTING.md'
    ];

    const requiredDirs = [
      'logs',
      'apps/api/src/__tests__',
      'apps/web/src/__tests__'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (!fs.existsSync(filePath)) {
        this.addError(`Arquivo obrigatório não encontrado: ${file}`);
      } else {
        this.addCheck(`✅ ${file}`);
      }
    }

    for (const dir of requiredDirs) {
      const dirPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(dirPath)) {
        this.addWarning(`Diretório recomendado não encontrado: ${dir}`);
      } else {
        this.addCheck(`✅ ${dir}/`);
      }
    }
  }

  async checkDependencies() {
    console.log('\n📦 Verificando dependências...');
    
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.addError('package.json não encontrado');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredDeps = [
      'winston',
      'chalk',
      'node-fetch'
    ];

    const requiredDevDeps = [
      'jest',
      '@types/jest',
      'turbo'
    ];

    for (const dep of requiredDeps) {
      if (!packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]) {
        this.addError(`Dependência obrigatória não encontrada: ${dep}`);
      } else {
        this.addCheck(`✅ ${dep}`);
      }
    }

    for (const dep of requiredDevDeps) {
      if (!packageJson.devDependencies?.[dep]) {
        this.addWarning(`Dependência de desenvolvimento recomendada: ${dep}`);
      } else {
        this.addCheck(`✅ ${dep}`);
      }
    }
  }

  async checkConfiguration() {
    console.log('\n⚙️ Verificando configurações...');
    
    const configPath = path.join(__dirname, '..', 'test-config.json');
    if (!fs.existsSync(configPath)) {
      this.addError('test-config.json não encontrado');
      return;
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      const requiredSections = [
        'testSuites',
        'healthChecks',
        'performance',
        'reporting',
        'ci'
      ];

      for (const section of requiredSections) {
        if (!config[section]) {
          this.addError(`Seção obrigatória na configuração: ${section}`);
        } else {
          this.addCheck(`✅ config.${section}`);
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
    console.log('\n📜 Verificando scripts...');
    
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredScripts = [
      'test',
      'test:unit',
      'test:integration',
      'test:ci',
      'full-test',
      'validate-tests'
    ];

    for (const script of requiredScripts) {
      if (!packageJson.scripts?.[script]) {
        this.addError(`Script obrigatório não encontrado: ${script}`);
      } else {
        this.addCheck(`✅ npm run ${script}`);
      }
    }
  }

  async checkTestFiles() {
    console.log('\n🧪 Verificando arquivos de teste...');
    
    const testDirs = [
      'apps/api/src/__tests__',
      'apps/web/src/__tests__'
    ];

    for (const testDir of testDirs) {
      const fullPath = path.join(__dirname, '..', testDir);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        const testFiles = files.filter(f => f.endsWith('.test.js') || f.endsWith('.test.ts'));
        
        if (testFiles.length === 0) {
          this.addWarning(`Nenhum arquivo de teste encontrado em ${testDir}`);
        } else {
          this.addCheck(`✅ ${testFiles.length} arquivo(s) de teste em ${testDir}`);
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
    console.log('\n📊 Resultados da Validação:\n');

    if (this.results.checks.length > 0) {
      console.log('✅ Verificações Bem-sucedidas:');
      this.results.checks.forEach(check => console.log(`   ${check}`));
      console.log('');
    }

    if (this.results.warnings.length > 0) {
      console.log('⚠️  Avisos:');
      this.results.warnings.forEach(warning => console.log(`   ${warning}`));
      console.log('');
    }

    if (this.results.errors.length > 0) {
      console.log('❌ Erros:');
      this.results.errors.forEach(error => console.log(`   ${error}`));
      console.log('');
    }

    const status = this.results.valid ? '✅ VÁLIDO' : '❌ INVÁLIDO';
    const summary = `
╭─────────────────────────────────────╮
│ Status do Sistema de Testes: ${status}    │
│ Verificações: ${this.results.checks.length.toString().padStart(2)}                 │
│ Avisos: ${this.results.warnings.length.toString().padStart(7)}                   │
│ Erros: ${this.results.errors.length.toString().padStart(8)}                    │
╰─────────────────────────────────────╯
`;

    console.log(summary);

    if (this.results.valid) {
      console.log('🎉 Sistema de testes está funcionando corretamente!');
      console.log('📖 Execute "npm run full-test" para executar todos os testes.');
    } else {
      console.log('🔧 Corrija os erros acima antes de executar os testes.');
    }
  }
}

// Executar validação sempre que o script for chamado diretamente
const validator = new TestSystemValidator();
validator.validate().catch(error => {
  console.error('❌ Erro durante a validação:', error);
  process.exit(1);
});

export default TestSystemValidator;
