import { getXAIClient } from '../services/xai-client.js';
import { logger } from '../utils/logger.js';

export interface WhatsAppMessageAnalysis {
  sentiment: 'POSITIVO' | 'NEGATIVO' | 'NEUTRO';
  urgency: 'ALTA' | 'MÃ‰DIA' | 'BAIXA';
  category: 'VENDAS' | 'SUPORTE' | 'RECLAMAÃ‡ÃƒO' | 'INFORMAÃ‡ÃƒO' | 'OUTROS';
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
    contactNumber?: string
  ): Promise<WhatsAppMessageAnalysis> {
    try {
      const systemPrompt = `
        VocÃª Ã© um especialista em anÃ¡lise de mensagens de atendimento ao cliente.
        Analise a mensagem fornecida e retorne APENAS um JSON vÃ¡lido com a seguinte estrutura:
        {
          "sentiment": "POSITIVO|NEGATIVO|NEUTRO",
          "urgency": "ALTA|MÃ‰DIA|BAIXA",
          "category": "VENDAS|SUPORTE|RECLAMAÃ‡ÃƒO|INFORMAÃ‡ÃƒO|OUTROS",
          "suggestedResponse": "resposta sugerida ou null",
          "keywords": ["palavra1", "palavra2", "palavra3"]
        }

        CritÃ©rios:
        - Sentimento: Baseado no tom emocional da mensagem
        - UrgÃªncia: ALTA para emergÃªncias/problemas graves, MÃ‰DIA para questÃµes importantes, BAIXA para informaÃ§Ãµes gerais
        - Categoria: Classifique baseado no tipo de solicitaÃ§Ã£o
        - Resposta sugerida: MÃ¡ximo 2 frases, profissional e empÃ¡tica
        - Keywords: 3-5 palavras-chave mais relevantes
      `;

      const messageContent = `
        Mensagem: "${message}"
        ${contactName ? `Nome do contato: ${contactName}` : ''}
        ${contactNumber ? `NÃºmero: ${contactNumber}` : ''}
      `;

      const response = await this.xaiClient.sendMessage(messageContent, systemPrompt);

      // Tentar extrair JSON da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        logger.info('AnÃ¡lise de mensagem WhatsApp realizada:', {
          message: message.substring(0, 100),
          analysis,
        });
        return analysis;
      }

      // Fallback: anÃ¡lise bÃ¡sica por palavras-chave
      return this.basicAnalysis(message);
    } catch (error: any) {
      logger.error('Erro na anÃ¡lise XAI:', error);
      return this.basicAnalysis(message);
    }
  }

  /**
   * Gera uma resposta automÃ¡tica baseada na anÃ¡lise
   */
  async generateAutoResponse(
    message: string,
    analysis: WhatsAppMessageAnalysis,
    businessContext?: string
  ): Promise<string> {
    try {
      const systemPrompt = `
        VocÃª Ã© um assistente de atendimento ao cliente ${businessContext ? `para ${businessContext}` : ''}.
        Gere uma resposta profissional, empÃ¡tica e Ãºtil baseada na anÃ¡lise da mensagem.

        AnÃ¡lise da mensagem:
        - Sentimento: ${analysis.sentiment}
        - UrgÃªncia: ${analysis.urgency}
        - Categoria: ${analysis.category}

        Diretrizes:
        - Use tom respeitoso e profissional
        - Se for urgente, demonstre prioridade
        - Se for reclamaÃ§Ã£o, seja empÃ¡tico
        - Se for vendas, seja informativo
        - MÃ¡ximo 3 frases
        - Inclua prÃ³ximos passos quando apropriado
      `;

      const response = await this.xaiClient.sendMessage(
        `Mensagem original: "${message}"`,
        systemPrompt
      );

      return response;
    } catch (error: any) {
      logger.error('Erro ao gerar resposta automÃ¡tica:', error);
      return this.getDefaultResponse(analysis.category);
    }
  }

  /**
   * Detecta intenÃ§Ã£o de compra na mensagem
   */
  async detectPurchaseIntent(message: string): Promise<{
    hasPurchaseIntent: boolean;
    confidence: number;
    products?: string[];
    actions?: string[];
  }> {
    try {
      const systemPrompt = `
        Analise se a mensagem indica intenÃ§Ã£o de compra e retorne um JSON:
        {
          "hasPurchaseIntent": boolean,
          "confidence": number (0-1),
          "products": ["produto1", "produto2"] ou null,
          "actions": ["aÃ§Ã£o sugerida"] ou null
        }

        Considere intenÃ§Ã£o de compra quando houver:
        - Perguntas sobre preÃ§os
        - Interesse em produtos especÃ­ficos
        - SolicitaÃ§Ãµes de orÃ§amento
        - ComparaÃ§Ãµes de produtos
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
      logger.error('Erro na detecÃ§Ã£o de intenÃ§Ã£o de compra:', error);
      return {
        hasPurchaseIntent: false,
        confidence: 0,
        products: undefined,
        actions: undefined,
      };
    }
  }

  /**
   * Extrai informaÃ§Ãµes estruturadas da mensagem
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
        Extraia informaÃ§Ãµes estruturadas da mensagem e retorne um JSON:
        {
          "email": "email@exemplo.com" ou null,
          "phone": "nÃºmero" ou null,
          "name": "nome" ou null,
          "product": "produto mencionado" ou null,
          "orderNumber": "nÃºmero do pedido" ou null,
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
      logger.error('Erro na extraÃ§Ã£o de informaÃ§Ãµes:', error);
      return {};
    }
  }

  /**
   * AnÃ¡lise bÃ¡sica por palavras-chave (fallback)
   */
  private basicAnalysis(message: string): WhatsAppMessageAnalysis {
    const msg = message.toLowerCase();

    // Sentimento
    let sentiment: 'POSITIVO' | 'NEGATIVO' | 'NEUTRO' = 'NEUTRO';
    if (
      msg.includes('obrigad') ||
      msg.includes('parabÃ©ns') ||
      msg.includes('Ã³timo') ||
      msg.includes('excelente')
    ) {
      sentiment = 'POSITIVO';
    } else if (
      msg.includes('problema') ||
      msg.includes('erro') ||
      msg.includes('ruim') ||
      msg.includes('reclamaÃ§Ã£o')
    ) {
      sentiment = 'NEGATIVO';
    }

    // UrgÃªncia
    let urgency: 'ALTA' | 'MÃ‰DIA' | 'BAIXA' = 'BAIXA';
    if (
      msg.includes('urgente') ||
      msg.includes('emergÃªncia') ||
      msg.includes('jÃ¡') ||
      msg.includes('agora')
    ) {
      urgency = 'ALTA';
    } else if (msg.includes('importante') || msg.includes('preciso') || msg.includes('quando')) {
      urgency = 'MÃ‰DIA';
    }

    // Categoria
    let category: 'VENDAS' | 'SUPORTE' | 'RECLAMAÃ‡ÃƒO' | 'INFORMAÃ‡ÃƒO' | 'OUTROS' = 'OUTROS';
    if (msg.includes('preÃ§o') || msg.includes('comprar') || msg.includes('orÃ§amento')) {
      category = 'VENDAS';
    } else if (msg.includes('problema') || msg.includes('erro') || msg.includes('nÃ£o funciona')) {
      category = 'SUPORTE';
    } else if (
      msg.includes('reclamaÃ§Ã£o') ||
      msg.includes('insatisfeito') ||
      sentiment === 'NEGATIVO'
    ) {
      category = 'RECLAMAÃ‡ÃƒO';
    } else if (msg.includes('?') || msg.includes('como') || msg.includes('quando')) {
      category = 'INFORMAÃ‡ÃƒO';
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
   * Resposta padrÃ£o baseada na categoria
   */
  private getDefaultResponse(category: string): string {
    const responses: { [key: string]: string } = {
      VENDAS:
        'Obrigado pelo interesse! Vou verificar as informações sobre preços e disponibilidade para você.',
      SUPORTE:
        'Entendi sua situação. Vou analisar o problema e retornar com uma solução o mais breve possível.',
      RECLAMACAO:
        'Lamento pela situação. Sua satisfação é importante para nós e vamos resolver isso rapidamente.',
      INFORMACAO:
        'Obrigado pela pergunta! Vou buscar essas informações e retornar com detalhes completos.',
      OUTROS: 'Recebi sua mensagem e retornarei em breve com as informações necessárias.',
    };

    return (
      responses[category] || responses['OUTROS'] || 'Recebi sua mensagem e retornarei em breve.'
    );
  }

  /**
   * Extrai palavras-chave bÃ¡sicas
   */
  private extractBasicKeywords(message: string): string[] {
    const words = message
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    return [...new Set(words)].slice(0, 5);
  }
}

// InstÃ¢ncia singleton
let whatsappXAIServiceInstance: WhatsAppXAIService | null = null;

export const getWhatsAppXAIService = (): WhatsAppXAIService => {
  if (!whatsappXAIServiceInstance) {
    whatsappXAIServiceInstance = new WhatsAppXAIService();
  }
  return whatsappXAIServiceInstance;
};

export default WhatsAppXAIService;
