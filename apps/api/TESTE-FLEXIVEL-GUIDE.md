# ðŸ”„ Guia de Testes FlexÃ­veis - WhatsApp API

## ðŸ“‹ VisÃ£o Geral

Este projeto agora suporta **dois modos de teste**:

- **ðŸ”§ Modo Mock**: Testes rÃ¡pidos e isolados (padrÃ£o)
- **ðŸ“± Modo Real**: Testes com WhatsApp real para validaÃ§Ã£o completa

## ðŸš€ Como Usar

### **Modo 1: Testes com Mocks (PadrÃ£o)**

```bash
# Testes rÃ¡pidos - usando mocks
npm test

# Com cobertura
npm run test:coverage
```

**CaracterÃ­sticas:**

- âœ… ExecuÃ§Ã£o rÃ¡pida (segundos)
- âœ… NÃ£o precisa de conexÃ£o WhatsApp
- âœ… Ideal para desenvolvimento e CI/CD
- âœ… Testa lÃ³gica de negÃ³cio isoladamente

---

### **Modo 2: Testes Reais com WhatsApp**

```bash
# Configurar variÃ¡veis para testes reais
export TEST_USE_MOCKS=false
export TEST_WHATSAPP_INTERACTIVE=true
export TEST_WHATSAPP_NUMBER="+5511999999999"  # Seu nÃºmero de teste
export TEST_WHATSAPP_CLIENT_ID="test-real-client"

# Executar testes reais
npm test -- whatsapp-flexible.test.ts
```

**CaracterÃ­sticas:**

- ðŸ“± ConexÃ£o real com WhatsApp Web
- ðŸ”— ValidaÃ§Ã£o completa de integraÃ§Ã£o
- â±ï¸ ExecuÃ§Ã£o mais lenta (minutos)
- ðŸ“‹ Requer QR Code na primeira execuÃ§Ã£o

---

## ðŸ› ï¸ ConfiguraÃ§Ã£o de VariÃ¡veis

### **Arquivo .env para desenvolvimento:**

```env
# ConfiguraÃ§Ãµes de teste
NODE_ENV=development
TEST_USE_MOCKS=true

# Para testes reais (opcional)
TEST_WHATSAPP_INTERACTIVE=false
TEST_WHATSAPP_CLIENT_ID=dev-client
TEST_WHATSAPP_SESSION_PATH=./test-sessions
TEST_WHATSAPP_NUMBER=+5511999999999
TEST_WHATSAPP_HEADLESS=true
```

### **Arquivo .env.test para CI/CD:**

```env
NODE_ENV=test
TEST_USE_MOCKS=true
TEST_WHATSAPP_INTERACTIVE=false
```

### **Arquivo .env.integration para testes completos:**

```env
NODE_ENV=test
TEST_USE_MOCKS=false
TEST_WHATSAPP_INTERACTIVE=true
TEST_WHATSAPP_CLIENT_ID=integration-client
TEST_WHATSAPP_SESSION_PATH=./integration-sessions
TEST_WHATSAPP_NUMBER=+5511999999999
TEST_WHATSAPP_HEADLESS=false
```

---

## ðŸ“ Estrutura de Testes

```
src/
â”œâ”€â”€ __tests__/
â”‚   â”œâ”€â”€ whatsapp-flexible.test.ts    # Testes que funcionam em ambos os modos
â”‚   â”œâ”€â”€ whatsapp-mocks-only.test.ts  # Testes apenas com mocks
â”‚   â””â”€â”€ whatsapp-real-only.test.ts   # Testes apenas reais
â”œâ”€â”€ config/
â”‚   â””â”€â”€ test-config.ts               # ConfiguraÃ§Ã£o central
â””â”€â”€ utils/
    â””â”€â”€ test-helpers.ts              # Helpers para ambos os modos
```

---

## ðŸŽ¯ EstratÃ©gias de Teste por Fase

### **Fase 1: Desenvolvimento Inicial**

```bash
# Usar apenas mocks
export TEST_USE_MOCKS=true
npm test
```

### **Fase 2: IntegraÃ§Ã£o Local**

```bash
# Testar com WhatsApp real localmente
export TEST_USE_MOCKS=false
export TEST_WHATSAPP_INTERACTIVE=true
npm test -- whatsapp-flexible.test.ts
```

### **Fase 3: CI/CD Pipeline**

```bash
# Pipeline usa mocks por padrÃ£o
npm test
npm run test:coverage
```

### **Fase 4: Testes de AceitaÃ§Ã£o**

```bash
# Testes completos com WhatsApp real
npm run test:integration
```

---

## ðŸ”§ Scripts npm Sugeridos

Adicione ao `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:mocks": "TEST_USE_MOCKS=true jest",
    "test:real": "TEST_USE_MOCKS=false TEST_WHATSAPP_INTERACTIVE=true jest --testNamePattern='whatsapp-flexible'",
    "test:integration": "TEST_USE_MOCKS=false TEST_WHATSAPP_INTERACTIVE=true jest",
    "test:watch": "jest --watch",
    "test:debug": "jest --verbose --no-cache"
  }
}
```

---

## ðŸ“Š Exemplo de Uso

### **Durante desenvolvimento:**

```bash
# Desenvolvimento rÃ¡pido com mocks
npm run test:mocks

# ValidaÃ§Ã£o ocasional com WhatsApp real
npm run test:real
```

### **Antes de commit:**

```bash
# Executar todos os testes mock
npm test

# Se tudo passou, testar integraÃ§Ã£o
npm run test:integration
```

### **Pipeline CI/CD:**

```bash
# Apenas mocks no CI (rÃ¡pido e confiÃ¡vel)
npm test
npm run test:coverage
```

---

## ðŸŽ¯ Vantagens desta Abordagem

1. **ðŸš€ Desenvolvimento RÃ¡pido**: Mocks permitem iteraÃ§Ã£o rÃ¡pida
2. **âœ… ValidaÃ§Ã£o Real**: Testes reais garantem funcionamento correto
3. **ðŸ”„ Flexibilidade**: FÃ¡cil alternÃ¢ncia entre modos
4. **âš¡ CI/CD Eficiente**: Pipeline rÃ¡pido com mocks
5. **ðŸ§ª Qualidade**: Melhor cobertura com ambos os tipos

---

## ðŸŽ® Como Testar Agora

1. **Testar com mocks (recomendado para comeÃ§ar):**

```bash
npm test -- whatsapp-flexible.test.ts
```

2. **Testar com WhatsApp real (quando quiser validar):**

```bash
TEST_USE_MOCKS=false TEST_WHATSAPP_INTERACTIVE=true npm test -- whatsapp-flexible.test.ts
```

O sistema irÃ¡:

- ðŸ”§ Usar mocks por padrÃ£o (rÃ¡pido)
- ðŸ“± Solicitar QR Code quando em modo real
- ðŸ“Š Mostrar claramente qual modo estÃ¡ sendo usado
- âœ… Funcionar em ambos os cenÃ¡rios

**Esta abordagem permite que vocÃª desenvolva rapidamente com mocks e valide com testes reais quando necessÃ¡rio!** ðŸŽ‰