#!/usr/bin/env node

console.log('ðŸ” Iniciando validaÃ§Ã£o do sistema de testes...');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('âœ… Imports funcionando');
console.log('ðŸ“ DiretÃ³rio atual:', __dirname);

// Verificar arquivos bÃ¡sicos
const files = ['../package.json', '../test-config.json', 'run-full-tests.js'];

for (const file of files) {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? 'âœ…' : 'âŒ'} ${file}: ${exists ? 'OK' : 'MISSING'}`);
}

console.log('ðŸŽ‰ Teste bÃ¡sico concluÃ­do!');
