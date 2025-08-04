/**
 * Helper para alternar entre mocks e biblioteca real
 * Baseado na configuração de testes
 */

import testConfig from '../config/test-config';

// Função para importar a biblioteca apropriada
export async function getWhatsAppClient() {
  if (testConfig.useMocks) {
    // Importar mocks
    const mocks = (await import('../../__mocks__/whatsapp-web.js')) as any;
    return {
      Client: mocks.Client,
      LocalAuth: mocks.LocalAuth,
      MessageMedia: mocks.MessageMedia,
      WAState: mocks.WAState,
      Message: mocks.Message,
      Contact: mocks.Contact,
      Chat: mocks.Chat,
      isMocked: true,
    };
  } else {
    // Importar biblioteca real
    const real = await import('whatsapp-web.js');
    return {
      Client: real.Client,
      LocalAuth: real.LocalAuth,
      MessageMedia: real.MessageMedia,
      WAState: real.WAState,
      Message: (real as any).Message,
      Contact: (real as any).Contact,
      Chat: (real as any).Chat,
      isMocked: false,
    };
  }
}

// Helper para criar cliente configurado para testes
export async function createTestClient(options: any = {}) {
  const { Client, LocalAuth } = await getWhatsAppClient();

  const clientOptions = testConfig.useMocks
    ? {
        // Opções para mock
        authStrategy: new LocalAuth({
          clientId: testConfig.mockTests.mockData.contacts[0]?.id || 'mock-client',
        }),
        ...options,
      }
    : {
        // Opções para cliente real
        authStrategy: new LocalAuth({
          clientId: testConfig.realTests.whatsapp.clientId,
          dataPath: testConfig.realTests.whatsapp.sessionPath,
        }),
        puppeteer: {
          headless: testConfig.realTests.whatsapp.headless,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        ...options,
      };

  return new Client(clientOptions);
}

// Helper para configurar timeouts baseado no tipo de teste
export function getTestTimeout() {
  return testConfig.useMocks ? testConfig.mockTests.timeout : testConfig.realTests.timeout;
}

// Helper para aguardar inicialização do cliente
export async function waitForClientReady(client: any, timeout: number | null = null) {
  const timeoutMs = timeout || getTestTimeout();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Client initialization timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    client.on('ready', () => {
      clearTimeout(timer);
      resolve(true);
    });

    client.on('qr', (qr: string) => {
      if (!testConfig.useMocks) {
        console.log('QR Code para testes reais:');
        console.log(qr);
      }
    });

    client.on('auth_failure', (msg: string) => {
      clearTimeout(timer);
      reject(new Error(`Authentication failed: ${msg}`));
    });
  });
}

export default {
  getWhatsAppClient,
  createTestClient,
  getTestTimeout,
  waitForClientReady,
};
