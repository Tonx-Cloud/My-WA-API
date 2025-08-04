import { getXAIClient } from "../src/services/xai-client.js";
import { config } from "dotenv";

// Carregar variáveis de ambiente
config();

async function testXAI() {
  try {
    console.log("🤖 Testando integração com xAI Grok...\n");

    // Criar cliente
    const xaiClient = getXAIClient();

    // 1. Teste de conectividade
    console.log("1. Testando conectividade...");
    const isConnected = await xaiClient.testConnection();
    console.log(`✅ Conectividade: ${isConnected ? "OK" : "FALHOU"}\n`);

    if (!isConnected) {
      console.log("❌ Teste falhou. Verifique sua API key.");
      return;
    }

    // 2. Teste de mensagem simples
    console.log("2. Testando mensagem simples...");
    const simpleResponse = await xaiClient.sendMessage(
      "Olá! Você pode me ajudar com uma análise de texto?",
    );
    console.log(`✅ Resposta: ${simpleResponse}\n`);

    // 3. Teste de análise de sentimento
    console.log("3. Testando análise de sentimento...");
    const sentimentText =
      "Estou muito feliz com o atendimento da empresa! O suporte foi excepcional.";
    const sentimentAnalysis = await xaiClient.analyzeText(
      sentimentText,
      "sentiment",
    );
    console.log(`✅ Análise de sentimento: ${sentimentAnalysis}\n`);

    // 4. Teste de resumo
    console.log("4. Testando resumo de texto...");
    const longText = `
      A inteligência artificial está revolucionando diversos setores da economia mundial.
      Desde automação de processos até análise preditiva, as aplicações são vastas.
      Empresas estão investindo pesadamente em IA para melhorar eficiência e competitividade.
      No entanto, questões éticas e de segurança precisam ser consideradas na implementação.
      O futuro promete ainda mais avanços, com potencial para transformar completamente
      a forma como trabalhamos e vivemos.
    `;
    const summary = await xaiClient.analyzeText(longText, "summary");
    console.log(`✅ Resumo: ${summary}\n`);

    // 5. Teste de análise de WhatsApp
    console.log("5. Testando análise de mensagem WhatsApp...");
    const whatsappMessage =
      "Preciso urgente de suporte! Meu pedido ainda não chegou e já se passaram 2 semanas!";
    const whatsappAnalysis = await xaiClient.analyzeText(
      whatsappMessage,
      "custom",
      `Analise esta mensagem do WhatsApp e classifique:
       - Sentimento: POSITIVO/NEGATIVO/NEUTRO
       - Urgência: ALTA/MÉDIA/BAIXA
       - Categoria: VENDAS/SUPORTE/RECLAMAÇÃO/INFORMAÇÃO
       - Resposta sugerida`,
    );
    console.log(`✅ Análise WhatsApp: ${whatsappAnalysis}\n`);

    // 6. Teste de chat com contexto
    console.log("6. Testando chat com contexto...");
    const chatResponse = await xaiClient.chatCompletion([
      {
        role: "system",
        content:
          "Você é um assistente de atendimento ao cliente especializado em e-commerce.",
      },
      {
        role: "user",
        content: "Como posso rastrear meu pedido?",
      },
    ]);
    console.log(
      `✅ Chat com contexto: ${chatResponse.choices[0]?.message?.content}\n`,
    );

    // 7. Teste de modelos disponíveis
    console.log("7. Obtendo modelos disponíveis...");
    try {
      const models = await xaiClient.getModels();
      console.log(
        `✅ Modelos disponíveis: ${JSON.stringify(models, null, 2)}\n`,
      );
    } catch (error) {
      console.log(`⚠️ Erro ao obter modelos: ${error.message}\n`);
    }

    console.log("🎉 Todos os testes concluídos com sucesso!");
  } catch (error) {
    console.error("❌ Erro durante os testes:", error.message);

    if (error.message.includes("API Key")) {
      console.log(
        "\n💡 Dica: Verifique se a variável XAI_API_KEY está configurada corretamente no arquivo .env",
      );
    }
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testXAI();
}

export default testXAI;
