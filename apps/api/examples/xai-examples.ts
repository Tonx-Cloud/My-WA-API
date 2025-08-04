#!/usr/bin/env node

/**
 * Script de exemplo para testar a integração xAI/Grok
 *
 * Como usar:
 * npm run test:xai
 * ou
 * node tests/xai-test.js
 */

import { getXAIClient } from '../src/services/xai-client.js';
import { getWhatsAppXAIService } from '../src/services/whatsapp-xai.service.js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

async function runExamples() {
  console.log('🚀 Exemplos de uso da integração xAI/Grok\n');

  // Exemplo 1: Cliente básico
  console.log('📍 Exemplo 1: Cliente básico');
  try {
    const xaiClient = getXAIClient();
    const response = await xaiClient.sendMessage(
      'Explique em uma frase o que é inteligência artificial.'
    );
    console.log(`✅ Resposta: ${response}\n`);
  } catch (error) {
    console.log(`❌ Erro: ${error.message}\n`);
  }

  // Exemplo 2: Análise de sentimento
  console.log('📍 Exemplo 2: Análise de sentimento');
  try {
    const xaiClient = getXAIClient();
    const text = 'Adorei o produto! Chegou rapidinho e a qualidade é excepcional.';
    const analysis = await xaiClient.analyzeText(text, 'sentiment');
    console.log(`✅ Análise: ${analysis}\n`);
  } catch (error) {
    console.log(`❌ Erro: ${error.message}\n`);
  }

  // Exemplo 3: Análise WhatsApp completa
  console.log('📍 Exemplo 3: Análise WhatsApp completa');
  try {
    const whatsappService = getWhatsAppXAIService();
    const message =
      'Oi, gostaria de saber o preço do produto X e se tem desconto para pagamento à vista?';

    const analysis = await whatsappService.analyzeMessage(message, 'João Silva');
    console.log('✅ Análise completa:', JSON.stringify(analysis, null, 2));

    const autoResponse = await whatsappService.generateAutoResponse(
      message,
      analysis,
      'loja de eletrônicos'
    );
    console.log(`✅ Resposta automática: ${autoResponse}`);

    const purchaseIntent = await whatsappService.detectPurchaseIntent(message);
    console.log('✅ Intenção de compra:', JSON.stringify(purchaseIntent, null, 2));

    console.log();
  } catch (error) {
    console.log(`❌ Erro: ${error.message}\n`);
  }

  // Exemplo 4: Chat com contexto
  console.log('📍 Exemplo 4: Chat com contexto (assistente de vendas)');
  try {
    const xaiClient = getXAIClient();
    const chatResponse = await xaiClient.chatCompletion([
      {
        role: 'system',
        content:
          'Você é um assistente de vendas especializado em smartphones. Seja prestativo e sempre sugira produtos adequados ao perfil do cliente.',
      },
      {
        role: 'user',
        content: 'Estou procurando um celular bom e barato para minha mãe de 70 anos.',
      },
    ]);
    console.log(`✅ Assistente de vendas: ${chatResponse.choices[0]?.message?.content}\n`);
  } catch (error) {
    console.log(`❌ Erro: ${error.message}\n`);
  }

  // Exemplo 5: Extração de informações
  console.log('📍 Exemplo 5: Extração de informações');
  try {
    const whatsappService = getWhatsAppXAIService();
    const message =
      'Meu nome é Maria Silva, email maria@gmail.com, telefone (11) 99999-9999. Quero informações sobre o pedido #12345 que fiz no dia 15/01/2025.';

    const extracted = await whatsappService.extractInformation(message);
    console.log('✅ Informações extraídas:', JSON.stringify(extracted, null, 2));
    console.log();
  } catch (error) {
    console.log(`❌ Erro: ${error.message}\n`);
  }

  // Exemplo 6: Resumo de texto longo
  console.log('📍 Exemplo 6: Resumo de texto longo');
  try {
    const xaiClient = getXAIClient();
    const longText = `
      A evolução da tecnologia de inteligência artificial tem transformado radicalmente
      diversos setores da economia global. Desde a automatização de processos industriais
      até sistemas avançados de recomendação em plataformas digitais, a IA tem demonstrado
      capacidades extraordinárias. No setor de saúde, algoritmos de machine learning estão
      sendo utilizados para diagnósticos mais precisos e desenvolvimento de medicamentos.
      Na área financeira, sistemas inteligentes detectam fraudes em tempo real e otimizam
      investimentos. O varejo utiliza IA para personalização de experiências de compra e
      gestão de estoque. Contudo, questões éticas como privacidade de dados, viés
      algorítmico e impacto no mercado de trabalho requerem atenção cuidadosa. O futuro
      promete avanços ainda mais significativos, com potencial para revolucionar áreas
      como educação, transporte autônomo e sustentabilidade ambiental.
    `;

    const summary = await xaiClient.analyzeText(longText.trim(), 'summary');
    console.log(`✅ Resumo: ${summary}\n`);
  } catch (error) {
    console.log(`❌ Erro: ${error.message}\n`);
  }

  console.log('🎯 Exemplos concluídos!');
  console.log('\n💡 Dicas de uso:');
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
