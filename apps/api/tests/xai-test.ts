import { getXAIClient } from '../src/services/xai-client.js';
import { config } from 'dotenv';

// Carregar variÃ¡veis de ambiente
config();

async function testXAI() {
  try {
    console.log('ðŸ¤– Testando integraÃ§Ã£o com xAI Grok...\n');

    // Criar cliente
    const xaiClient = getXAIClient();

    // 1. Teste de conectividade
    console.log('1. Testando conectividade...');
    const isConnected = await xaiClient.testConnection();
    console.log(`âœ… Conectividade: ${isConnected ? 'OK' : 'FALHOU'}\n`);

    if (!isConnected) {
      console.log('âŒ Teste falhou. Verifique sua API key.');
      return;
    }

    // 2. Teste de mensagem simples
    console.log('2. Testando mensagem simples...');
    const simpleResponse = await xaiClient.sendMessage(
      'OlÃ¡! VocÃª pode me ajudar com uma anÃ¡lise de texto?'
    );
    console.log(`âœ… Resposta: ${simpleResponse}\n`);

    // 3. Teste de anÃ¡lise de sentimento
    console.log('3. Testando anÃ¡lise de sentimento...');
    const sentimentText =
      'Estou muito feliz com o atendimento da empresa! O suporte foi excepcional.';
    const sentimentAnalysis = await xaiClient.analyzeText(sentimentText, 'sentiment');
    console.log(`âœ… AnÃ¡lise de sentimento: ${sentimentAnalysis}\n`);

    // 4. Teste de resumo
    console.log('4. Testando resumo de texto...');
    const longText = `
      A inteligÃªncia artificial estÃ¡ revolucionando diversos setores da economia mundial.
      Desde automaÃ§Ã£o de processos atÃ© anÃ¡lise preditiva, as aplicaÃ§Ãµes sÃ£o vastas.
      Empresas estÃ£o investindo pesadamente em IA para melhorar eficiÃªncia e competitividade.
      No entanto, questÃµes Ã©ticas e de seguranÃ§a precisam ser consideradas na implementaÃ§Ã£o.
      O futuro promete ainda mais avanÃ§os, com potencial para transformar completamente
      a forma como trabalhamos e vivemos.
    `;
    const summary = await xaiClient.analyzeText(longText, 'summary');
    console.log(`âœ… Resumo: ${summary}\n`);

    // 5. Teste de anÃ¡lise de WhatsApp
    console.log('5. Testando anÃ¡lise de mensagem WhatsApp...');
    const whatsappMessage =
      'Preciso urgente de suporte! Meu pedido ainda nÃ£o chegou e jÃ¡ se passaram 2 semanas!';
    const whatsappAnalysis = await xaiClient.analyzeText(
      whatsappMessage,
      'custom',
      `Analise esta mensagem do WhatsApp e classifique:
       - Sentimento: POSITIVO/NEGATIVO/NEUTRO
       - UrgÃªncia: ALTA/MÃ‰DIA/BAIXA
       - Categoria: VENDAS/SUPORTE/RECLAMAÃ‡ÃƒO/INFORMAÃ‡ÃƒO
       - Resposta sugerida`
    );
    console.log(`âœ… AnÃ¡lise WhatsApp: ${whatsappAnalysis}\n`);

    // 6. Teste de chat com contexto
    console.log('6. Testando chat com contexto...');
    const chatResponse = await xaiClient.chatCompletion([
      {
        role: 'system',
        content: 'VocÃª Ã© um assistente de atendimento ao cliente especializado em e-commerce.',
      },
      {
        role: 'user',
        content: 'Como posso rastrear meu pedido?',
      },
    ]);
    console.log(`âœ… Chat com contexto: ${chatResponse.choices[0]?.message?.content}\n`);

    // 7. Teste de modelos disponÃ­veis
    console.log('7. Obtendo modelos disponÃ­veis...');
    try {
      const models = await xaiClient.getModels();
      console.log(`âœ… Modelos disponÃ­veis: ${JSON.stringify(models, null, 2)}\n`);
    } catch (error) {
      console.log(`âš ï¸ Erro ao obter modelos: ${error.message}\n`);
    }

    console.log('ðŸŽ‰ Todos os testes concluÃ­dos com sucesso!');
  } catch (error) {
    console.error('âŒ Erro durante os testes:', error.message);

    if (error.message.includes('API Key')) {
      console.log(
        '\nðŸ’¡ Dica: Verifique se a variÃ¡vel XAI_API_KEY estÃ¡ configurada corretamente no arquivo .env'
      );
    }
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testXAI();
}

export default testXAI;
