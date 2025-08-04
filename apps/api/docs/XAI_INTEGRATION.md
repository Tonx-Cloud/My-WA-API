# IntegraÃ§Ã£o xAI/Grok - DocumentaÃ§Ã£o

## VisÃ£o Geral

Esta implementaÃ§Ã£o integra o xAI (Grok) ao sistema My-WA-API, fornecendo capacidades avanÃ§adas de inteligÃªncia artificial para anÃ¡lise de mensagens, geraÃ§Ã£o de respostas automÃ¡ticas e insights sobre conversas do WhatsApp.

## ðŸš€ Funcionalidades

### 1. Cliente xAI (`XAIClient`)

- âœ… Chat completion com mÃºltiplas mensagens
- âœ… Envio de mensagens simples
- âœ… AnÃ¡lise de texto (sentimento, resumo, palavras-chave)
- âœ… ConfiguraÃ§Ã£o de parÃ¢metros (temperatura, max_tokens, etc.)
- âœ… Logs detalhados e tratamento de erros
- âœ… Teste de conectividade

### 2. ServiÃ§o WhatsApp + xAI (`WhatsAppXAIService`)

- âœ… AnÃ¡lise automÃ¡tica de mensagens do WhatsApp
- âœ… ClassificaÃ§Ã£o de sentimento, urgÃªncia e categoria
- âœ… GeraÃ§Ã£o de respostas automÃ¡ticas contextuais
- âœ… DetecÃ§Ã£o de intenÃ§Ã£o de compra
- âœ… ExtraÃ§Ã£o de informaÃ§Ãµes estruturadas
- âœ… AnÃ¡lise com fallback para casos de erro

### 3. API REST (`XAIController`)

- âœ… Endpoints para todas as funcionalidades
- âœ… AutenticaÃ§Ã£o via JWT
- âœ… DocumentaÃ§Ã£o Swagger
- âœ… ValidaÃ§Ã£o de dados
- âœ… Tratamento de erros HTTP

## ðŸ”§ ConfiguraÃ§Ã£o

### 1. VariÃ¡veis de Ambiente

Adicione ao arquivo `.env`:

```bash
# xAI Grok API
XAI_API_KEY=your_xai_api_key_here
```

### 2. InstalaÃ§Ã£o

```bash
# A dependÃªncia axios jÃ¡ foi instalada automaticamente
npm install
```

### 3. Teste de ConfiguraÃ§Ã£o

```bash
# Teste bÃ¡sico
npm run test:xai

# Exemplos prÃ¡ticos
npm run examples:xai
```

## ðŸ“¡ Endpoints da API

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
      "content": "VocÃª Ã© um assistente Ãºtil."
    },
    {
      "role": "user",
      "content": "OlÃ¡!"
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
  "message": "Explique inteligÃªncia artificial",
  "systemPrompt": "Seja conciso e didÃ¡tico",
  "options": {
    "temperature": 0.5
  }
}
```

### 3. AnÃ¡lise de Texto

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

### 4. AnÃ¡lise WhatsApp

```
POST /whatsapp/analyze
```

**Body:**

```json
{
  "message": "Preciso urgente de suporte!",
  "contact": "JoÃ£o Silva"
}
```

### 5. Teste de ConexÃ£o

```
GET /test
```

### 6. Modelos DisponÃ­veis

```
GET /models
```

## ðŸ’» Uso ProgramÃ¡tico

### Cliente BÃ¡sico

```typescript
import { getXAIClient } from './services/xai-client.js';

const client = getXAIClient();

// Mensagem simples
const response = await client.sendMessage('Como estÃ¡ o clima hoje?', 'Seja preciso e objetivo');

// Chat com contexto
const chatResponse = await client.chatCompletion([
  { role: 'system', content: 'VocÃª Ã© um meteorologista' },
  { role: 'user', content: 'Vai chover amanhÃ£?' },
]);

// AnÃ¡lise de texto
const sentiment = await client.analyzeText('Produto excelente!', 'sentiment');
```

### ServiÃ§o WhatsApp

```typescript
import { getWhatsAppXAIService } from './services/whatsapp-xai.service.js';

const service = getWhatsAppXAIService();

// AnÃ¡lise completa da mensagem
const analysis = await service.analyzeMessage(
  'Gostaria de comprar o produto X',
  'JoÃ£o Silva',
  '+5511999999999'
);

// Gerar resposta automÃ¡tica
const autoResponse = await service.generateAutoResponse(
  'Preciso de ajuda urgente!',
  analysis,
  'loja de eletrÃ´nicos'
);

// Detectar intenÃ§Ã£o de compra
const purchaseIntent = await service.detectPurchaseIntent('Quanto custa esse produto?');

// Extrair informaÃ§Ãµes
const extracted = await service.extractInformation(
  'Meu email Ã© joao@email.com e meu pedido Ã© #12345'
);
```

## ðŸŽ¯ Casos de Uso

### 1. Atendimento Automatizado

```typescript
// AnÃ¡lise automÃ¡tica de mensagens recebidas
const analysis = await service.analyzeMessage(message);

if (analysis.urgency === 'ALTA') {
  // Escalate para atendente humano
  await notifyHumanAgent(message, analysis);
} else {
  // Resposta automÃ¡tica
  const response = await service.generateAutoResponse(message, analysis);
  await sendWhatsAppMessage(response);
}
```

### 2. ClassificaÃ§Ã£o de Leads

```typescript
const purchaseIntent = await service.detectPurchaseIntent(message);

if (purchaseIntent.hasPurchaseIntent && purchaseIntent.confidence > 0.7) {
  await addToSalesQueue(contact, purchaseIntent.products);
}
```

### 3. AnÃ¡lise de Sentimento em Massa

```typescript
const messages = await getRecentMessages();

for (const msg of messages) {
  const sentiment = await client.analyzeText(msg.content, 'sentiment');
  await saveSentimentAnalysis(msg.id, sentiment);
}
```

## âš™ï¸ ConfiguraÃ§Ãµes AvanÃ§adas

### ParÃ¢metros do Modelo

```typescript
const options = {
  model: 'grok-4', // Modelo a usar
  temperature: 0.7, // Criatividade (0.0-2.0)
  max_tokens: 1000, // MÃ¡ximo de tokens na resposta
  top_p: 0.9, // Nucleus sampling
  frequency_penalty: 0.0, // Penalidade por repetiÃ§Ã£o
  presence_penalty: 0.0, // Penalidade por presenÃ§a
};
```

### ConfiguraÃ§Ã£o de Logs

O sistema registra automaticamente:

- Todas as requisiÃ§Ãµes para xAI
- Respostas e erros
- AnÃ¡lises realizadas
- Performance dos endpoints

### Tratamento de Erros

```typescript
try {
  const response = await client.sendMessage('OlÃ¡');
} catch (error) {
  if (error.message.includes('API Key')) {
    // Problema de autenticaÃ§Ã£o
  } else if (error.message.includes('429')) {
    // Rate limit excedido
  } else {
    // Outros erros
  }
}
```

## ðŸ”’ SeguranÃ§a

- âœ… API Key armazenada em variÃ¡vel de ambiente
- âœ… AutenticaÃ§Ã£o JWT obrigatÃ³ria nos endpoints
- âœ… Rate limiting aplicado
- âœ… Logs sem exposiÃ§Ã£o de dados sensÃ­veis
- âœ… ValidaÃ§Ã£o de entrada em todos os endpoints

## ðŸ“Š Monitoramento

- Logs estruturados com Winston
- MÃ©tricas de performance
- Rastreamento de erros
- Contagem de tokens utilizados

## ðŸš¨ Troubleshooting

### Problema: "API Key invÃ¡lida"

**SoluÃ§Ã£o:** Verifique se `XAI_API_KEY` estÃ¡ configurada corretamente no `.env`

### Problema: "Rate limit excedido"

**SoluÃ§Ã£o:** Implemente retry com backoff ou reduza frequÃªncia de chamadas

### Problema: "Timeout na requisiÃ§Ã£o"

**SoluÃ§Ã£o:** Aumente o timeout ou verifique conectividade

### Problema: "Resposta malformada"

**SoluÃ§Ã£o:** O sistema tem fallback automÃ¡tico para anÃ¡lise bÃ¡sica

## ðŸ“ˆ PrÃ³ximos Passos

- [ ] Cache de respostas frequentes
- [ ] MÃ©tricas de qualidade das respostas
- [ ] IntegraÃ§Ã£o com banco de dados para histÃ³rico
- [ ] Interface web para gerenciar configuraÃ§Ãµes
- [ ] Treinamento de modelo personalizado
- [ ] IntegraÃ§Ã£o com outros LLMs (fallback)

## ðŸ“ž Suporte

Para dÃºvidas ou problemas:

1. Verifique os logs em `logs/`
2. Execute `npm run test:xai` para diagnosticar
3. Consulte a documentaÃ§Ã£o da API xAI
4. Verifique issues conhecidas no repositÃ³rio

---

**VersÃ£o:** 1.0.0
**Ãšltima atualizaÃ§Ã£o:** 04/08/2025
**Mantido por:** Equipe My-WA-API