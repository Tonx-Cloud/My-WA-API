# 🔄 Guia de Testes Flexíveis - WhatsApp API

## 📋 Visão Geral

Este projeto agora suporta **dois modos de teste**:

- **🔧 Modo Mock**: Testes rápidos e isolados (padrão)
- **📱 Modo Real**: Testes com WhatsApp real para validação completa

## 🚀 Como Usar

### **Modo 1: Testes com Mocks (Padrão)**

```bash
# Testes rápidos - usando mocks
npm test

# Com cobertura
npm run test:coverage
```

**Características:**

- ✅ Execução rápida (segundos)
- ✅ Não precisa de conexão WhatsApp
- ✅ Ideal para desenvolvimento e CI/CD
- ✅ Testa lógica de negócio isoladamente

---

### **Modo 2: Testes Reais com WhatsApp**

```bash
# Configurar variáveis para testes reais
export TEST_USE_MOCKS=false
export TEST_WHATSAPP_INTERACTIVE=true
export TEST_WHATSAPP_NUMBER="+5511999999999"  # Seu número de teste
export TEST_WHATSAPP_CLIENT_ID="test-real-client"

# Executar testes reais
npm test -- whatsapp-flexible.test.ts
```

**Características:**

- 📱 Conexão real com WhatsApp Web
- 🔗 Validação completa de integração
- ⏱️ Execução mais lenta (minutos)
- 📋 Requer QR Code na primeira execução

---

## 🛠️ Configuração de Variáveis

### **Arquivo .env para desenvolvimento:**

```env
# Configurações de teste
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

## 📁 Estrutura de Testes

```
src/
├── __tests__/
│   ├── whatsapp-flexible.test.ts    # Testes que funcionam em ambos os modos
│   ├── whatsapp-mocks-only.test.ts  # Testes apenas com mocks
│   └── whatsapp-real-only.test.ts   # Testes apenas reais
├── config/
│   └── test-config.ts               # Configuração central
└── utils/
    └── test-helpers.ts              # Helpers para ambos os modos
```

---

## 🎯 Estratégias de Teste por Fase

### **Fase 1: Desenvolvimento Inicial**

```bash
# Usar apenas mocks
export TEST_USE_MOCKS=true
npm test
```

### **Fase 2: Integração Local**

```bash
# Testar com WhatsApp real localmente
export TEST_USE_MOCKS=false
export TEST_WHATSAPP_INTERACTIVE=true
npm test -- whatsapp-flexible.test.ts
```

### **Fase 3: CI/CD Pipeline**

```bash
# Pipeline usa mocks por padrão
npm test
npm run test:coverage
```

### **Fase 4: Testes de Aceitação**

```bash
# Testes completos com WhatsApp real
npm run test:integration
```

---

## 🔧 Scripts npm Sugeridos

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

## 📊 Exemplo de Uso

### **Durante desenvolvimento:**

```bash
# Desenvolvimento rápido com mocks
npm run test:mocks

# Validação ocasional com WhatsApp real
npm run test:real
```

### **Antes de commit:**

```bash
# Executar todos os testes mock
npm test

# Se tudo passou, testar integração
npm run test:integration
```

### **Pipeline CI/CD:**

```bash
# Apenas mocks no CI (rápido e confiável)
npm test
npm run test:coverage
```

---

## 🎯 Vantagens desta Abordagem

1. **🚀 Desenvolvimento Rápido**: Mocks permitem iteração rápida
2. **✅ Validação Real**: Testes reais garantem funcionamento correto
3. **🔄 Flexibilidade**: Fácil alternância entre modos
4. **⚡ CI/CD Eficiente**: Pipeline rápido com mocks
5. **🧪 Qualidade**: Melhor cobertura com ambos os tipos

---

## 🎮 Como Testar Agora

1. **Testar com mocks (recomendado para começar):**

```bash
npm test -- whatsapp-flexible.test.ts
```

2. **Testar com WhatsApp real (quando quiser validar):**

```bash
TEST_USE_MOCKS=false TEST_WHATSAPP_INTERACTIVE=true npm test -- whatsapp-flexible.test.ts
```

O sistema irá:

- 🔧 Usar mocks por padrão (rápido)
- 📱 Solicitar QR Code quando em modo real
- 📊 Mostrar claramente qual modo está sendo usado
- ✅ Funcionar em ambos os cenários

**Esta abordagem permite que você desenvolva rapidamente com mocks e valide com testes reais quando necessário!** 🎉
