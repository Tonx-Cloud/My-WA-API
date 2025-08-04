import { Request, Response } from 'express';
import { getXAIClient, ChatMessage, ChatCompletionOptions } from '../services/xai-client.js';
import { logger } from '../utils/logger.js';

export class XAIController {
  /**
   * Endpoint para chat completion
   */
  static async chatCompletion(req: Request, res: Response) {
    try {
      const { messages, options } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          success: false,
          error: 'Mensagens sÃ£o obrigatÃ³rias e devem ser um array',
        });
      }

      const xaiClient = getXAIClient();
      const response = await xaiClient.chatCompletion(messages, options);

      res.json({
        success: true,
        data: response,
      });
    } catch (error: any) {
      logger.error('Erro no chat completion:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Endpoint para enviar mensagem simples
   */
  static async sendMessage(req: Request, res: Response) {
    try {
      const { message, systemPrompt, options } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Mensagem Ã© obrigatÃ³ria',
        });
      }

      const xaiClient = getXAIClient();
      const response = await xaiClient.sendMessage(message, systemPrompt, options);

      res.json({
        success: true,
        data: { response },
      });
    } catch (error: any) {
      logger.error('Erro ao enviar mensagem:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Endpoint para anÃ¡lise de texto
   */
  static async analyzeText(req: Request, res: Response) {
    try {
      const { text, analysisType, customPrompt } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          error: 'Texto Ã© obrigatÃ³rio',
        });
      }

      if (!analysisType || !['sentiment', 'summary', 'keywords', 'custom'].includes(analysisType)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de anÃ¡lise deve ser: sentiment, summary, keywords ou custom',
        });
      }

      if (analysisType === 'custom' && !customPrompt) {
        return res.status(400).json({
          success: false,
          error: 'Prompt customizado Ã© obrigatÃ³rio para anÃ¡lise custom',
        });
      }

      const xaiClient = getXAIClient();
      const response = await xaiClient.analyzeText(text, analysisType, customPrompt);

      res.json({
        success: true,
        data: { analysis: response },
      });
    } catch (error: any) {
      logger.error('Erro na anÃ¡lise de texto:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Endpoint para testar conexÃ£o
   */
  static async testConnection(req: Request, res: Response) {
    try {
      const xaiClient = getXAIClient();
      const isConnected = await xaiClient.testConnection();

      res.json({
        success: true,
        data: { connected: isConnected },
      });
    } catch (error: any) {
      logger.error('Erro no teste de conexÃ£o:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Endpoint para obter modelos disponÃ­veis
   */
  static async getModels(req: Request, res: Response) {
    try {
      const xaiClient = getXAIClient();
      const models = await xaiClient.getModels();

      res.json({
        success: true,
        data: models,
      });
    } catch (error: any) {
      logger.error('Erro ao obter modelos:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Endpoint para anÃ¡lise de sentimento de mensagens do WhatsApp
   */
  static async analyzeWhatsAppMessage(req: Request, res: Response) {
    try {
      const { message, contact } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Mensagem Ã© obrigatÃ³ria',
        });
      }

      const systemPrompt = `
        Analise esta mensagem do WhatsApp e forneÃ§a:
        1. Sentimento (POSITIVO/NEGATIVO/NEUTRO)
        2. UrgÃªncia (ALTA/MÃ‰DIA/BAIXA)
        3. Categoria (VENDAS/SUPORTE/INFORMAÃ‡ÃƒO/RECLAMAÃ‡ÃƒO/OUTROS)
        4. Resposta sugerida (opcional)

        Formato da resposta:
        SENTIMENTO: [sentimento]
        URGÃŠNCIA: [urgÃªncia]
        CATEGORIA: [categoria]
        RESPOSTA_SUGERIDA: [resposta ou "N/A"]
      `;

      const xaiClient = getXAIClient();
      const analysis = await xaiClient.sendMessage(
        `Mensagem: "${message}"${contact ? `\nContato: ${contact}` : ''}`,
        systemPrompt
      );

      res.json({
        success: true,
        data: { analysis },
      });
    } catch (error: any) {
      logger.error('Erro na anÃ¡lise de mensagem WhatsApp:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export default XAIController;
