#!/usr/bin/env node

/**
 * Script para verificar e reportar problemas de formatação
 * que podem estar aparecendo no painel Problems do VS Code
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔍 VERIFICAÇÃO DE PROBLEMAS DE FORMATAÇÃO');
console.log('==========================================');

try {
  // Verificar se ainda existem problemas de trailing whitespace
  console.log('\n📝 Verificando trailing whitespace...');

  const gitDiffCheck = execSync('git diff --check HEAD', { encoding: 'utf8', stdio: 'pipe' });
  if (gitDiffCheck.trim()) {
    console.log('⚠️ Ainda existem problemas de trailing whitespace:');
    console.log(gitDiffCheck);
  } else {
    console.log('✅ Nenhum trailing whitespace encontrado!');
  }
} catch (error) {
  if (error.status === 2) {
    console.log('⚠️ Problemas de whitespace encontrados via git diff --check');
  }
}

// Verificar se Prettier está funcionando
try {
  console.log('\n🎨 Verificando Prettier...');
  const prettierCheck = execSync(
    'npx prettier --check "**/*.{ts,tsx,js,jsx,md,json}" --ignore-unknown 2>&1',
    {
      encoding: 'utf8',
      stdio: 'pipe',
    }
  );
  console.log('✅ Prettier: Todos os arquivos estão formatados!');
} catch (error) {
  console.log('⚠️ Prettier encontrou arquivos não formatados');
  const output = error.stdout || error.message;
  if (output) {
    const lines = output.split('\n').slice(0, 10); // Mostrar apenas as primeiras 10 linhas
    console.log(lines.join('\n'));
    if (output.split('\n').length > 10) {
      console.log('... (mais arquivos)');
    }
  }
}

// Verificar se ESLint está limpo
try {
  console.log('\n🔧 Verificando ESLint...');
  execSync('npx turbo run lint', { encoding: 'utf8', stdio: 'pipe' });
  console.log('✅ ESLint: Nenhum problema encontrado!');
} catch (error) {
  console.log('⚠️ ESLint encontrou problemas (alguns podem ser de formatação)');
}

// Estatísticas finais
console.log('\n📊 RESUMO DA VERIFICAÇÃO');
console.log('========================');

const modifiedFiles = execSync('git status --porcelain | wc -l', { encoding: 'utf8' }).trim();
console.log(`📁 Arquivos modificados pelo Prettier: ${modifiedFiles}`);

console.log('\n💡 DICA: Se ainda existem problemas no painel Problems:');
console.log(
  '   1. Reinicie o VS Code Language Server: Ctrl+Shift+P → "TypeScript: Restart TS Server"'
);
console.log('   2. Recarregue a janela: Ctrl+Shift+P → "Developer: Reload Window"');
console.log('   3. Verifique se as extensões de linting estão atualizadas');

console.log('\n🎉 Verificação concluída!');
