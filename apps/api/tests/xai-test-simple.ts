import { getXAIClient } from '../src/services/xai-client.js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

async function testXAI() {
  try {
    console.log('🤖 Testando integração com xAI Grok...\n');

    // Verificar se a API key está configurada
    if (!process.env.XAI_API_KEY) {
      console.log('❌ XAI_API_KEY não configurada no arquivo .env');
      return;
    }

    console.log('✅ API Key encontrada');

    // Criar cliente
    const xaiClient = getXAIClient();

    // 1. Teste básico
    console.log('\n1. Testando mensagem simples...');
    const simpleResponse = await xaiClient.sendMessage(
      'Olá! Responda apenas "OK" se você estiver funcionando.'
    );
    console.log(`✅ Resposta: ${simpleResponse}`);

    console.log('\n🎉 Teste básico concluído com sucesso!');
  } catch (error: any) {
    console.error('\n❌ Erro durante o teste:', error.message);

    if (error.message.includes('API Key') || error.message.includes('401')) {
      console.log('\n💡 Dica: Verifique se a API Key está correta');
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      console.log('\n💡 Dica: Verifique sua conexão com a internet');
    }

    process.exit(1);
  }
}

// Executar teste
testXAI();
