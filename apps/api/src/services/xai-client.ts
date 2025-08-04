import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger } from '../utils/logger.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class XAIClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseURL: string = 'https://api.x.ai/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.XAI_API_KEY || '';

    if (!this.apiKey) {
      throw new Error(
        'XAI API Key não fornecida. Configure XAI_API_KEY nas variáveis de ambiente.'
      );
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      timeout: 60000, // 60 segundos
    });

    // Interceptor para logs
    this.client.interceptors.request.use(
      config => {
        logger.info('XAI Request:', {
          method: config.method,
          url: config.url,
          data: config.data ? 'Request body present' : 'No request body',
        });
        return config;
      },
      error => {
        logger.error('XAI Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      response => {
        logger.info('XAI Response:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data ? 'Response data present' : 'No response data',
        });
        return response;
      },
      error => {
        logger.error('XAI Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Cria uma completion de chat usando o modelo Grok
   */
  async chatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResponse> {
    try {
      const requestData = {
        messages,
        model: options.model || 'grok-4',
        stream: options.stream || false,
        temperature: options.temperature ?? 0.7,
        ...(options.max_tokens && { max_tokens: options.max_tokens }),
        ...(options.top_p && { top_p: options.top_p }),
        ...(options.frequency_penalty && {
          frequency_penalty: options.frequency_penalty,
        }),
        ...(options.presence_penalty && {
          presence_penalty: options.presence_penalty,
        }),
      };

      const response: AxiosResponse<ChatCompletionResponse> = await this.client.post(
        '/chat/completions',
        requestData
      );

      return response.data;
    } catch (error: any) {
      logger.error('Erro na XAI Chat Completion:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      if (error.response?.status === 401) {
        throw new Error('API Key inválida ou não autorizada');
      } else if (error.response?.status === 429) {
        throw new Error('Limite de requisições excedido. Tente novamente mais tarde.');
      } else if (error.response?.status === 500) {
        throw new Error('Erro interno do servidor XAI');
      }

      throw new Error(`Erro na API XAI: ${error.message}`);
    }
  }

  /**
   * Método de conveniência para enviar uma mensagem simples
   */
  async sendMessage(
    content: string,
    systemPrompt?: string,
    options: ChatCompletionOptions = {}
  ): Promise<string> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content });

    const response = await this.chatCompletion(messages, options);

    return response.choices[0]?.message?.content || '';
  }

  /**
   * Método para análise de texto usando Grok
   */
  async analyzeText(
    text: string,
    analysisType: 'sentiment' | 'summary' | 'keywords' | 'custom',
    customPrompt?: string
  ): Promise<string> {
    let systemPrompt = '';

    switch (analysisType) {
      case 'sentiment':
        systemPrompt =
          'Analise o sentimento do texto fornecido. Responda apenas com: POSITIVO, NEGATIVO ou NEUTRO, seguido de uma breve explicação.';
        break;
      case 'summary':
        systemPrompt =
          'Faça um resumo conciso e objetivo do texto fornecido, mantendo os pontos principais.';
        break;
      case 'keywords':
        systemPrompt =
          'Extraia as palavras-chave mais importantes do texto fornecido. Liste apenas as palavras, separadas por vírgulas.';
        break;
      case 'custom':
        systemPrompt = customPrompt || 'Analise o texto fornecido.';
        break;
    }

    return await this.sendMessage(text, systemPrompt);
  }

  /**
   * Teste de conectividade com a API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.sendMessage('Olá, você está funcionando?');
      return response.length > 0;
    } catch (error) {
      logger.error('Teste de conexão XAI falhou:', error);
      return false;
    }
  }

  /**
   * Obtém informações sobre os modelos disponíveis
   */
  async getModels(): Promise<any> {
    try {
      const response = await this.client.get('/models');
      return response.data;
    } catch (error: any) {
      logger.error('Erro ao obter modelos XAI:', error);
      throw new Error(`Erro ao obter modelos: ${error.message}`);
    }
  }
}

// Instância singleton
let xaiClientInstance: XAIClient | null = null;

export const getXAIClient = (): XAIClient => {
  if (!xaiClientInstance) {
    xaiClientInstance = new XAIClient();
  }
  return xaiClientInstance;
};

export default XAIClient;
