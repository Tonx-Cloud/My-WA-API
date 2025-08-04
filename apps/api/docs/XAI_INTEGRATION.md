# Integração xAI/Grok - Documentação

## Visão Geral

Esta implementação integra o xAI (Grok) ao sistema My-WA-API, fornecendo capacidades avançadas de inteligência artificial para análise de mensagens, geração de respostas automáticas e insights sobre conversas do WhatsApp.

## 🚀 Funcionalidades

### 1. Cliente xAI (`XAIClient`)

- ✅ Chat completion com múltiplas mensagens
- ✅ Envio de mensagens simples
- ✅ Análise de texto (sentimento, resumo, palavras-chave)
- ✅ Configuração de parâmetros (temperatura, max_tokens, etc.)
- ✅ Logs detalhados e tratamento de erros
- ✅ Teste de conectividade

### 2. Serviço WhatsApp + xAI (`WhatsAppXAIService`)

- ✅ Análise automática de mensagens do WhatsApp
- ✅ Classificação de sentimento, urgência e categoria
- ✅ Geração de respostas automáticas contextuais
- ✅ Detecção de intenção de compra
- ✅ Extração de informações estruturadas
- ✅ Análise com fallback para casos de erro

### 3. API REST (`XAIController`)

- ✅ Endpoints para todas as funcionalidades
- ✅ Autenticação via JWT
- ✅ Documentação Swagger
- ✅ Validação de dados
- ✅ Tratamento de erros HTTP

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione ao arquivo `.env`:

```bash
# xAI Grok API
XAI_API_KEY=your_xai_api_key_here
```

### 2. Instalação

```bash
# A dependência axios já foi instalada automaticamente
npm install
```

### 3. Teste de Configuração

```bash
# Teste básico
npm run test:xai

# Exemplos práticos
npm run examples:xai
```

## 📡 Endpoints da API

Base URL: `http://localhost:3000/api/xai`

### 1. Chat Completion

```
POST /chat
```

**Body:**

```json
{
  "messages": [
    {
      "role": "system",
      "content": "Você é um assistente útil."
    },
    {
      "role": "user",
      "content": "Olá!"
    }
  ],
  "options": {
    "model": "grok-4",
    "temperature": 0.7,
    "max_tokens": 1000
  }
}
```

### 2. Mensagem Simples

```
POST /message
```

**Body:**

```json
{
  "message": "Explique inteligência artificial",
  "systemPrompt": "Seja conciso e didático",
  "options": {
    "temperature": 0.5
  }
}
```

### 3. Análise de Texto

```
POST /analyze
```

**Body:**

```json
{
  "text": "Adorei o produto! Recomendo muito.",
  "analysisType": "sentiment", // sentiment, summary, keywords, custom
  "customPrompt": "Analise o sentimento..." // apenas para type: custom
}
```

### 4. Análise WhatsApp

```
POST /whatsapp/analyze
```

**Body:**

```json
{
  "message": "Preciso urgente de suporte!",
  "contact": "João Silva"
}
```

### 5. Teste de Conexão

```
GET /test
```

### 6. Modelos Disponíveis

```
GET /models
```

## 💻 Uso Programático

### Cliente Básico

```typescript
import { getXAIClient } from './services/xai-client.js';

const client = getXAIClient();

// Mensagem simples
const response = await client.sendMessage('Como está o clima hoje?', 'Seja preciso e objetivo');

// Chat com contexto
const chatResponse = await client.chatCompletion([
  { role: 'system', content: 'Você é um meteorologista' },
  { role: 'user', content: 'Vai chover amanhã?' },
]);

// Análise de texto
const sentiment = await client.analyzeText('Produto excelente!', 'sentiment');
```

### Serviço WhatsApp

```typescript
import { getWhatsAppXAIService } from './services/whatsapp-xai.service.js';

const service = getWhatsAppXAIService();

// Análise completa da mensagem
const analysis = await service.analyzeMessage(
  'Gostaria de comprar o produto X',
  'João Silva',
  '+5511999999999'
);

// Gerar resposta automática
const autoResponse = await service.generateAutoResponse(
  'Preciso de ajuda urgente!',
  analysis,
  'loja de eletrônicos'
);

// Detectar intenção de compra
const purchaseIntent = await service.detectPurchaseIntent('Quanto custa esse produto?');

// Extrair informações
const extracted = await service.extractInformation(
  'Meu email é joao@email.com e meu pedido é #12345'
);
```

## 🎯 Casos de Uso

### 1. Atendimento Automatizado

```typescript
// Análise automática de mensagens recebidas
const analysis = await service.analyzeMessage(message);

if (analysis.urgency === 'ALTA') {
  // Escalate para atendente humano
  await notifyHumanAgent(message, analysis);
} else {
  // Resposta automática
  const response = await service.generateAutoResponse(message, analysis);
  await sendWhatsAppMessage(response);
}
```

### 2. Classificação de Leads

```typescript
const purchaseIntent = await service.detectPurchaseIntent(message);

if (purchaseIntent.hasPurchaseIntent && purchaseIntent.confidence > 0.7) {
  await addToSalesQueue(contact, purchaseIntent.products);
}
```

### 3. Análise de Sentimento em Massa

```typescript
const messages = await getRecentMessages();

for (const msg of messages) {
  const sentiment = await client.analyzeText(msg.content, 'sentiment');
  await saveSentimentAnalysis(msg.id, sentiment);
}
```

## ⚙️ Configurações Avançadas

### Parâmetros do Modelo

```typescript
const options = {
  model: 'grok-4', // Modelo a usar
  temperature: 0.7, // Criatividade (0.0-2.0)
  max_tokens: 1000, // Máximo de tokens na resposta
  top_p: 0.9, // Nucleus sampling
  frequency_penalty: 0.0, // Penalidade por repetição
  presence_penalty: 0.0, // Penalidade por presença
};
```

### Configuração de Logs

O sistema registra automaticamente:

- Todas as requisições para xAI
- Respostas e erros
- Análises realizadas
- Performance dos endpoints

### Tratamento de Erros

```typescript
try {
  const response = await client.sendMessage('Olá');
} catch (error) {
  if (error.message.includes('API Key')) {
    // Problema de autenticação
  } else if (error.message.includes('429')) {
    // Rate limit excedido
  } else {
    // Outros erros
  }
}
```

## 🔒 Segurança

- ✅ API Key armazenada em variável de ambiente
- ✅ Autenticação JWT obrigatória nos endpoints
- ✅ Rate limiting aplicado
- ✅ Logs sem exposição de dados sensíveis
- ✅ Validação de entrada em todos os endpoints

## 📊 Monitoramento

- Logs estruturados com Winston
- Métricas de performance
- Rastreamento de erros
- Contagem de tokens utilizados

## 🚨 Troubleshooting

### Problema: "API Key inválida"

**Solução:** Verifique se `XAI_API_KEY` está configurada corretamente no `.env`

### Problema: "Rate limit excedido"

**Solução:** Implemente retry com backoff ou reduza frequência de chamadas

### Problema: "Timeout na requisição"

**Solução:** Aumente o timeout ou verifique conectividade

### Problema: "Resposta malformada"

**Solução:** O sistema tem fallback automático para análise básica

## 📈 Próximos Passos

- [ ] Cache de respostas frequentes
- [ ] Métricas de qualidade das respostas
- [ ] Integração com banco de dados para histórico
- [ ] Interface web para gerenciar configurações
- [ ] Treinamento de modelo personalizado
- [ ] Integração com outros LLMs (fallback)

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique os logs em `logs/`
2. Execute `npm run test:xai` para diagnosticar
3. Consulte a documentação da API xAI
4. Verifique issues conhecidas no repositório

---

**Versão:** 1.0.0
**Última atualização:** 04/08/2025
**Mantido por:** Equipe My-WA-API
