#!/usr/bin/env node

/**
 * Script de exemplo para testar a integraÃ§Ã£o xAI/Grok
 *
 * Como usar:
 * npm run test:xai
 * ou
 * node tests/xai-test.js
 */

import { getXAIClient } from '../src/services/xai-client.js';
import { getWhatsAppXAIService } from '../src/services/whatsapp-xai.service.js';
import { config } from 'dotenv';

// Carregar variÃ¡veis de ambiente
config();

async function runExamples() {
  console.log('ðŸš€ Exemplos de uso da integraÃ§Ã£o xAI/Grok\n');

  // Exemplo 1: Cliente bÃ¡sico
  console.log('ðŸ“ Exemplo 1: Cliente bÃ¡sico');
  try {
    const xaiClient = getXAIClient();
    const response = await xaiClient.sendMessage(
      'Explique em uma frase o que Ã© inteligÃªncia artificial.'
    );
    console.log(`âœ… Resposta: ${response}\n`);
  } catch (error) {
    console.log(`âŒ Erro: ${error.message}\n`);
  }

  // Exemplo 2: AnÃ¡lise de sentimento
  console.log('ðŸ“ Exemplo 2: AnÃ¡lise de sentimento');
  try {
    const xaiClient = getXAIClient();
    const text = 'Adorei o produto! Chegou rapidinho e a qualidade Ã© excepcional.';
    const analysis = await xaiClient.analyzeText(text, 'sentiment');
    console.log(`âœ… AnÃ¡lise: ${analysis}\n`);
  } catch (error) {
    console.log(`âŒ Erro: ${error.message}\n`);
  }

  // Exemplo 3: AnÃ¡lise WhatsApp completa
  console.log('ðŸ“ Exemplo 3: AnÃ¡lise WhatsApp completa');
  try {
    const whatsappService = getWhatsAppXAIService();
    const message =
      'Oi, gostaria de saber o preÃ§o do produto X e se tem desconto para pagamento Ã  vista?';

    const analysis = await whatsappService.analyzeMessage(message, 'JoÃ£o Silva');
    console.log('âœ… AnÃ¡lise completa:', JSON.stringify(analysis, null, 2));

    const autoResponse = await whatsappService.generateAutoResponse(
      message,
      analysis,
      'loja de eletrÃ´nicos'
    );
    console.log(`âœ… Resposta automÃ¡tica: ${autoResponse}`);

    const purchaseIntent = await whatsappService.detectPurchaseIntent(message);
    console.log('âœ… IntenÃ§Ã£o de compra:', JSON.stringify(purchaseIntent, null, 2));

    console.log();
  } catch (error) {
    console.log(`âŒ Erro: ${error.message}\n`);
  }

  // Exemplo 4: Chat com contexto
  console.log('ðŸ“ Exemplo 4: Chat com contexto (assistente de vendas)');
  try {
    const xaiClient = getXAIClient();
    const chatResponse = await xaiClient.chatCompletion([
      {
        role: 'system',
        content:
          'VocÃª Ã© um assistente de vendas especializado em smartphones. Seja prestativo e sempre sugira produtos adequados ao perfil do cliente.',
      },
      {
        role: 'user',
        content: 'Estou procurando um celular bom e barato para minha mÃ£e de 70 anos.',
      },
    ]);
    console.log(`âœ… Assistente de vendas: ${chatResponse.choices[0]?.message?.content}\n`);
  } catch (error) {
    console.log(`âŒ Erro: ${error.message}\n`);
  }

  // Exemplo 5: ExtraÃ§Ã£o de informaÃ§Ãµes
  console.log('ðŸ“ Exemplo 5: ExtraÃ§Ã£o de informaÃ§Ãµes');
  try {
    const whatsappService = getWhatsAppXAIService();
    const message =
      'Meu nome Ã© Maria Silva, email maria@gmail.com, telefone (11) 99999-9999. Quero informaÃ§Ãµes sobre o pedido #12345 que fiz no dia 15/01/2025.';

    const extracted = await whatsappService.extractInformation(message);
    console.log('âœ… InformaÃ§Ãµes extraÃ­das:', JSON.stringify(extracted, null, 2));
    console.log();
  } catch (error) {
    console.log(`âŒ Erro: ${error.message}\n`);
  }

  // Exemplo 6: Resumo de texto longo
  console.log('ðŸ“ Exemplo 6: Resumo de texto longo');
  try {
    const xaiClient = getXAIClient();
    const longText = `
      A evoluÃ§Ã£o da tecnologia de inteligÃªncia artificial tem transformado radicalmente
      diversos setores da economia global. Desde a automatizaÃ§Ã£o de processos industriais
      atÃ© sistemas avanÃ§ados de recomendaÃ§Ã£o em plataformas digitais, a IA tem demonstrado
      capacidades extraordinÃ¡rias. No setor de saÃºde, algoritmos de machine learning estÃ£o
      sendo utilizados para diagnÃ³sticos mais precisos e desenvolvimento de medicamentos.
      Na Ã¡rea financeira, sistemas inteligentes detectam fraudes em tempo real e otimizam
      investimentos. O varejo utiliza IA para personalizaÃ§Ã£o de experiÃªncias de compra e
      gestÃ£o de estoque. Contudo, questÃµes Ã©ticas como privacidade de dados, viÃ©s
      algorÃ­tmico e impacto no mercado de trabalho requerem atenÃ§Ã£o cuidadosa. O futuro
      promete avanÃ§os ainda mais significativos, com potencial para revolucionar Ã¡reas
      como educaÃ§Ã£o, transporte autÃ´nomo e sustentabilidade ambiental.
    `;

    const summary = await xaiClient.analyzeText(longText.trim(), 'summary');
    console.log(`âœ… Resumo: ${summary}\n`);
  } catch (error) {
    console.log(`âŒ Erro: ${error.message}\n`);
  }

  console.log('ðŸŽ¯ Exemplos concluÃ­dos!');
  console.log('\nðŸ’¡ Dicas de uso:');
  console.log('- Configure a XAI_API_KEY no arquivo .env');
  console.log('- Use o endpoint /api/xai/test para verificar conectividade');
  console.log('- Monitore os logs para debugar problemas');
  console.log(
    '- Ajuste temperature para respostas mais criativas (0.8-1.0) ou conservadoras (0.1-0.3)'
  );
}

// Executar exemplos
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}

export default runExamples;
