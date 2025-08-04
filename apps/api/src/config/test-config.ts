/**
 * Configuração flexível para testes
 * Permite alternar entre mocks e biblioteca real
 */

export const testConfig = {
  // Se true, usa mocks para testes unitários
  // Se false, usa biblioteca real para testes de integração
  useMocks:
    process.env.TEST_USE_MOCKS === "true" || process.env.NODE_ENV === "test",

  // Configurações para testes reais
  realTests: {
    // Timeout maior para operações reais
    timeout: 30000,

    // Configurações do WhatsApp real
    whatsapp: {
      clientId: process.env.TEST_WHATSAPP_CLIENT_ID || "test-client",
      headless: process.env.TEST_WHATSAPP_HEADLESS !== "false",

      // Configurações de sessão para testes
      sessionPath: process.env.TEST_WHATSAPP_SESSION_PATH || "./test-sessions",

      // Número de teste (se disponível)
      testNumber: process.env.TEST_WHATSAPP_NUMBER,
    },
  },

  // Configurações para mocks
  mockTests: {
    timeout: 10000,

    // Dados simulados
    mockData: {
      contacts: [
        { id: "test-contact-1@c.us", name: "Test Contact 1" },
        { id: "test-contact-2@c.us", name: "Test Contact 2" },
      ],

      messages: [
        { body: "Test message 1", from: "test-contact-1@c.us" },
        { body: "Test message 2", from: "test-contact-2@c.us" },
      ],
    },
  },
};

export default testConfig;
