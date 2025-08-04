#!/usr/bin/env node

/**
 * Script para verificar e reportar problemas de formataÃ§Ã£o
 * que podem estar aparecendo no painel Problems do VS Code
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('ðŸ” VERIFICAÃ‡ÃƒO DE PROBLEMAS DE FORMATAÃ‡ÃƒO');
console.log('==========================================');

try {
  // Verificar se ainda existem problemas de trailing whitespace
  console.log('\nðŸ“ Verificando trailing whitespace...');

  const gitDiffCheck = execSync('git diff --check HEAD', { encoding: 'utf8', stdio: 'pipe' });
  if (gitDiffCheck.trim()) {
    console.log('âš ï¸ Ainda existem problemas de trailing whitespace:');
    console.log(gitDiffCheck);
  } else {
    console.log('âœ… Nenhum trailing whitespace encontrado!');
  }
} catch (error) {
  if (error.status === 2) {
    console.log('âš ï¸ Problemas de whitespace encontrados via git diff --check');
  }
}

// Verificar se Prettier estÃ¡ funcionando
try {
  console.log('\nðŸŽ¨ Verificando Prettier...');
  const prettierCheck = execSync(
    'npx prettier --check "**/*.{ts,tsx,js,jsx,md,json}" --ignore-unknown 2>&1',
    {
      encoding: 'utf8',
      stdio: 'pipe',
    }
  );
  console.log('âœ… Prettier: Todos os arquivos estÃ£o formatados!');
} catch (error) {
  console.log('âš ï¸ Prettier encontrou arquivos nÃ£o formatados');
  const output = error.stdout || error.message;
  if (output) {
    const lines = output.split('\n').slice(0, 10); // Mostrar apenas as primeiras 10 linhas
    console.log(lines.join('\n'));
    if (output.split('\n').length > 10) {
      console.log('... (mais arquivos)');
    }
  }
}

// Verificar se ESLint estÃ¡ limpo
try {
  console.log('\nðŸ”§ Verificando ESLint...');
  execSync('npx turbo run lint', { encoding: 'utf8', stdio: 'pipe' });
  console.log('âœ… ESLint: Nenhum problema encontrado!');
} catch (error) {
  console.log('âš ï¸ ESLint encontrou problemas (alguns podem ser de formataÃ§Ã£o)');
}

// EstatÃ­sticas finais
console.log('\nðŸ“Š RESUMO DA VERIFICAÃ‡ÃƒO');
console.log('========================');

const modifiedFiles = execSync('git status --porcelain | wc -l', { encoding: 'utf8' }).trim();
console.log(`ðŸ“ Arquivos modificados pelo Prettier: ${modifiedFiles}`);

console.log('\nðŸ’¡ DICA: Se ainda existem problemas no painel Problems:');
console.log(
  '   1. Reinicie o VS Code Language Server: Ctrl+Shift+P â†’ "TypeScript: Restart TS Server"'
);
console.log('   2. Recarregue a janela: Ctrl+Shift+P â†’ "Developer: Reload Window"');
console.log('   3. Verifique se as extensÃµes de linting estÃ£o atualizadas');

console.log('\nðŸŽ‰ VerificaÃ§Ã£o concluÃ­da!');
