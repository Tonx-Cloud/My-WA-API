#!/usr/bin/env node

/**
 * Script simples para executar apenas o restart do sistema
 */

import { restartSystem } from './restart-system.js';

console.log('ðŸ”„ Iniciando reinicializaÃ§Ã£o do sistema...');

async function main() {
  try {
    const success = await restartSystem({
      timeout: 45000,
      skipHealthChecks: false,
    });

    if (success) {
      console.log('âœ… Sistema reinicializado com sucesso!');
      process.exit(0);
    } else {
      console.error('âŒ Falha na reinicializaÃ§Ã£o do sistema');
      process.exit(1);
    }
  } catch (error) {
    console.error('âŒ Erro crÃ­tico:', error.message);
    process.exit(1);
  }
}

main();
