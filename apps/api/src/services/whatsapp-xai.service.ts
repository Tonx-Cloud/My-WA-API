import { getXAIClient } from "../services/xai-client.js";
import { logger } from "../utils/logger.js";

export interface WhatsAppMessageAnalysis {
  sentiment: "POSITIVO" | "NEGATIVO" | "NEUTRO";
  urgency: "ALTA" | "MÉDIA" | "BAIXA";
  category: "VENDAS" | "SUPORTE" | "RECLAMAÇÃO" | "INFORMAÇÃO" | "OUTROS";
  suggestedResponse?: string;
  keywords?: string[];
}

export class WhatsAppXAIService {
  private xaiClient = getXAIClient();

  /**
   * Analisa uma mensagem do WhatsApp usando IA
   */
  async analyzeMessage(
    message: string,
    contactName?: string,
    contactNumber?: string,
  ): Promise<WhatsAppMessageAnalysis> {
    try {
      const systemPrompt = `
        Você é um especialista em análise de mensagens de atendimento ao cliente.
        Analise a mensagem fornecida e retorne APENAS um JSON válido com a seguinte estrutura:
        {
          "sentiment": "POSITIVO|NEGATIVO|NEUTRO",
          "urgency": "ALTA|MÉDIA|BAIXA",
          "category": "VENDAS|SUPORTE|RECLAMAÇÃO|INFORMAÇÃO|OUTROS",
          "suggestedResponse": "resposta sugerida ou null",
          "keywords": ["palavra1", "palavra2", "palavra3"]
        }
        
        Critérios:
        - Sentimento: Baseado no tom emocional da mensagem
        - Urgência: ALTA para emergências/problemas graves, MÉDIA para questões importantes, BAIXA para informações gerais
        - Categoria: Classifique baseado no tipo de solicitação
        - Resposta sugerida: Máximo 2 frases, profissional e empática
        - Keywords: 3-5 palavras-chave mais relevantes
      `;

      const messageContent = `
        Mensagem: "${message}"
        ${contactName ? `Nome do contato: ${contactName}` : ""}
        ${contactNumber ? `Número: ${contactNumber}` : ""}
      `;

      const response = await this.xaiClient.sendMessage(
        messageContent,
        systemPrompt,
      );

      // Tentar extrair JSON da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        logger.info("Análise de mensagem WhatsApp realizada:", {
          message: message.substring(0, 100),
          analysis,
        });
        return analysis;
      }

      // Fallback: análise básica por palavras-chave
      return this.basicAnalysis(message);
    } catch (error: any) {
      logger.error("Erro na análise XAI:", error);
      return this.basicAnalysis(message);
    }
  }

  /**
   * Gera uma resposta automática baseada na análise
   */
  async generateAutoResponse(
    message: string,
    analysis: WhatsAppMessageAnalysis,
    businessContext?: string,
  ): Promise<string> {
    try {
      const systemPrompt = `
        Você é um assistente de atendimento ao cliente ${businessContext ? `para ${businessContext}` : ""}.
        Gere uma resposta profissional, empática e útil baseada na análise da mensagem.
        
        Análise da mensagem:
        - Sentimento: ${analysis.sentiment}
        - Urgência: ${analysis.urgency}
        - Categoria: ${analysis.category}
        
        Diretrizes:
        - Use tom respeitoso e profissional
        - Se for urgente, demonstre prioridade
        - Se for reclamação, seja empático
        - Se for vendas, seja informativo
        - Máximo 3 frases
        - Inclua próximos passos quando apropriado
      `;

      const response = await this.xaiClient.sendMessage(
        `Mensagem original: "${message}"`,
        systemPrompt,
      );

      return response;
    } catch (error: any) {
      logger.error("Erro ao gerar resposta automática:", error);
      return this.getDefaultResponse(analysis.category);
    }
  }

  /**
   * Detecta intenção de compra na mensagem
   */
  async detectPurchaseIntent(message: string): Promise<{
    hasPurchaseIntent: boolean;
    confidence: number;
    products?: string[];
    actions?: string[];
  }> {
    try {
      const systemPrompt = `
        Analise se a mensagem indica intenção de compra e retorne um JSON:
        {
          "hasPurchaseIntent": boolean,
          "confidence": number (0-1),
          "products": ["produto1", "produto2"] ou null,
          "actions": ["ação sugerida"] ou null
        }
        
        Considere intenção de compra quando houver:
        - Perguntas sobre preços
        - Interesse em produtos específicos
        - Solicitações de orçamento
        - Comparações de produtos
        - Perguntas sobre disponibilidade
      `;

      const response = await this.xaiClient.sendMessage(message, systemPrompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        hasPurchaseIntent: false,
        confidence: 0,
        products: undefined,
        actions: undefined,
      };
    } catch (error: any) {
      logger.error("Erro na detecção de intenção de compra:", error);
      return {
        hasPurchaseIntent: false,
        confidence: 0,
        products: undefined,
        actions: undefined,
      };
    }
  }

  /**
   * Extrai informações estruturadas da mensagem
   */
  async extractInformation(message: string): Promise<{
    email?: string;
    phone?: string;
    name?: string;
    product?: string;
    orderNumber?: string;
    date?: string;
  }> {
    try {
      const systemPrompt = `
        Extraia informações estruturadas da mensagem e retorne um JSON:
        {
          "email": "email@exemplo.com" ou null,
          "phone": "número" ou null,
          "name": "nome" ou null,
          "product": "produto mencionado" ou null,
          "orderNumber": "número do pedido" ou null,
          "date": "data mencionada" ou null
        }
      `;

      const response = await this.xaiClient.sendMessage(message, systemPrompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {};
    } catch (error: any) {
      logger.error("Erro na extração de informações:", error);
      return {};
    }
  }

  /**
   * Análise básica por palavras-chave (fallback)
   */
  private basicAnalysis(message: string): WhatsAppMessageAnalysis {
    const msg = message.toLowerCase();

    // Sentimento
    let sentiment: "POSITIVO" | "NEGATIVO" | "NEUTRO" = "NEUTRO";
    if (
      msg.includes("obrigad") ||
      msg.includes("parabéns") ||
      msg.includes("ótimo") ||
      msg.includes("excelente")
    ) {
      sentiment = "POSITIVO";
    } else if (
      msg.includes("problema") ||
      msg.includes("erro") ||
      msg.includes("ruim") ||
      msg.includes("reclamação")
    ) {
      sentiment = "NEGATIVO";
    }

    // Urgência
    let urgency: "ALTA" | "MÉDIA" | "BAIXA" = "BAIXA";
    if (
      msg.includes("urgente") ||
      msg.includes("emergência") ||
      msg.includes("já") ||
      msg.includes("agora")
    ) {
      urgency = "ALTA";
    } else if (
      msg.includes("importante") ||
      msg.includes("preciso") ||
      msg.includes("quando")
    ) {
      urgency = "MÉDIA";
    }

    // Categoria
    let category:
      | "VENDAS"
      | "SUPORTE"
      | "RECLAMAÇÃO"
      | "INFORMAÇÃO"
      | "OUTROS" = "OUTROS";
    if (
      msg.includes("preço") ||
      msg.includes("comprar") ||
      msg.includes("orçamento")
    ) {
      category = "VENDAS";
    } else if (
      msg.includes("problema") ||
      msg.includes("erro") ||
      msg.includes("não funciona")
    ) {
      category = "SUPORTE";
    } else if (
      msg.includes("reclamação") ||
      msg.includes("insatisfeito") ||
      sentiment === "NEGATIVO"
    ) {
      category = "RECLAMAÇÃO";
    } else if (
      msg.includes("?") ||
      msg.includes("como") ||
      msg.includes("quando")
    ) {
      category = "INFORMAÇÃO";
    }

    return {
      sentiment,
      urgency,
      category,
      suggestedResponse: this.getDefaultResponse(category),
      keywords: this.extractBasicKeywords(message),
    };
  }

  /**
   * Resposta padrão baseada na categoria
   */
  private getDefaultResponse(category: string): string {
    const responses: { [key: string]: string } = {
      VENDAS:
        "Obrigado pelo interesse! Vou verificar as informações sobre preços e disponibilidade para você.",
      SUPORTE:
        "Entendi sua situação. Vou analisar o problema e retornar com uma solução o mais breve possível.",
      RECLAMAÇÃO:
        "Lamento pela situação. Sua satisfação é importante para nós e vamos resolver isso rapidamente.",
      INFORMAÇÃO:
        "Obrigado pela pergunta! Vou buscar essas informações e retornar com detalhes completos.",
      OUTROS:
        "Recebi sua mensagem e retornarei em breve com as informações necessárias.",
    };

    return (
      responses[category] ||
      responses["OUTROS"] ||
      "Recebi sua mensagem e retornarei em breve."
    );
  }

  /**
   * Extrai palavras-chave básicas
   */
  private extractBasicKeywords(message: string): string[] {
    const words = message
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3);

    return [...new Set(words)].slice(0, 5);
  }
}

// Instância singleton
let whatsappXAIServiceInstance: WhatsAppXAIService | null = null;

export const getWhatsAppXAIService = (): WhatsAppXAIService => {
  if (!whatsappXAIServiceInstance) {
    whatsappXAIServiceInstance = new WhatsAppXAIService();
  }
  return whatsappXAIServiceInstance;
};

export default WhatsAppXAIService;
