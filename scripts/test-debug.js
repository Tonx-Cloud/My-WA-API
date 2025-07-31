#!/usr/bin/env node

console.log('🔍 Iniciando validação do sistema de testes...');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('✅ Imports funcionando');
console.log('📁 Diretório atual:', __dirname);

// Verificar arquivos básicos
const files = [
  '../package.json',
  '../test-config.json',
  'run-full-tests.js'
];

for (const file of files) {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${file}: ${exists ? 'OK' : 'MISSING'}`);
}

console.log('🎉 Teste básico concluído!');
