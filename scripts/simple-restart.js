#!/usr/bin/env node

/**
 * Script simples para executar apenas o restart do sistema
 */

import { restartSystem } from './restart-system.js';

console.log('🔄 Iniciando reinicialização do sistema...');

async function main() {
  try {
    const success = await restartSystem({
      timeout: 45000,
      skipHealthChecks: false
    });
    
    if (success) {
      console.log('✅ Sistema reinicializado com sucesso!');
      process.exit(0);
    } else {
      console.error('❌ Falha na reinicialização do sistema');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
    process.exit(1);
  }
}

main();
