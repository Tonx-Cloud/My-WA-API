﻿import { getXAIClient } from '../src/services/xai-client.js';
import { config } from 'dotenv';

// Carregar variÃ¡veis de ambiente
config();

async function testXAI() {
  try {
    console.log('ðŸ¤– Testando integraÃ§Ã£o com xAI Grok...\n');

    // Verificar se a API key estÃ¡ configurada
    if (!process.env.XAI_API_KEY) {
      console.log('âŒ XAI_API_KEY nÃ£o configurada no arquivo .env');
      return;
    }

    console.log('âœ… API Key encontrada');

    // Criar cliente
    const xaiClient = getXAIClient();

    // 1. Teste bÃ¡sico
    console.log('\n1. Testando mensagem simples...');
    const simpleResponse = await xaiClient.sendMessage(
      'OlÃ¡! Responda apenas "OK" se vocÃª estiver funcionando.'
    );
    console.log(`âœ… Resposta: ${simpleResponse}`);

    console.log('\nðŸŽ‰ Teste bÃ¡sico concluÃ­do com sucesso!');
  } catch (error: any) {
    console.error('\nâŒ Erro durante o teste:', error.message);

    if (error.message.includes('API Key') || error.message.includes('401')) {
      console.log('\nðŸ’¡ Dica: Verifique se a API Key estÃ¡ correta');
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      console.log('\nðŸ’¡ Dica: Verifique sua conexÃ£o com a internet');
    }

    process.exit(1);
  }
}

// Executar teste
testXAI();
