/**
 * Exemplo de teste flexÃ­vel - WhatsApp Service
 * Demonstra como alternar entre mocks e biblioteca real
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { createTestClient, waitForClientReady, getTestTimeout } from '../utils/test-helpers';
import testConfig from '../config/test-config';

describe('WhatsApp Service - Testes FlexÃ­veis', () => {
  let client: any;
  const testTimeout = getTestTimeout();

  beforeEach(async () => {
    console.log(`ðŸ”§ Modo de teste: ${testConfig.useMocks ? 'MOCK' : 'REAL'}`);
    client = await createTestClient();
  }, testTimeout);

  afterEach(async () => {
    if (client) {
      try {
        await client.destroy();
      } catch (error) {
        console.warn('Erro ao destruir cliente:', error);
      }
    }
  }, testTimeout);

  describe('InicializaÃ§Ã£o do Cliente', () => {
    test(
      'deve inicializar cliente corretamente',
      async () => {
        expect(client).toBeDefined();

        if (testConfig.useMocks) {
          // Testes especÃ­ficos para mocks (rÃ¡pidos)
          expect(client.authStrategy).toBeDefined();

          await client.initialize();
          await waitForClientReady(client, 5000);

          const state = await client.getState();
          expect(state).toBeDefined();
        } else {
          // Testes especÃ­ficos para biblioteca real
          console.log('âš ï¸  Teste real - pode solicitar QR Code');

          // Inicializar apenas se tivermos sessÃ£o salva
          // ou se estivermos em modo interativo
          if (process.env.TEST_WHATSAPP_INTERACTIVE === 'true') {
            await client.initialize();
            await waitForClientReady(client, 30000);

            const state = await client.getState();
            expect(['CONNECTED', 'OPENING'].includes(state)).toBe(true);
          } else {
            console.log(
              'ðŸ”„ Pulando teste real - defina TEST_WHATSAPP_INTERACTIVE=true para executar'
            );
            expect(client).toBeDefined(); // Teste bÃ¡sico
          }
        }
      },
      testTimeout
    );
  });

  describe('OperaÃ§Ãµes de Mensagem', () => {
    beforeEach(async () => {
      if (testConfig.useMocks) {
        await client.initialize();
        await waitForClientReady(client, 5000);
      } else if (process.env.TEST_WHATSAPP_INTERACTIVE === 'true') {
        await client.initialize();
        await waitForClientReady(client, 30000);
      }
    }, testTimeout);

    test(
      'deve enviar mensagem',
      async () => {
        if (testConfig.useMocks) {
          // Teste com mock
          const result = await client.sendMessage('test@c.us', 'Mensagem de teste');
          expect(result).toBeDefined();
          expect(result.body).toBe('Mensagem de teste');
        } else if (process.env.TEST_WHATSAPP_INTERACTIVE === 'true') {
          // Teste real (apenas com nÃºmero de teste configurado)
          const testNumber = testConfig.realTests.whatsapp.testNumber;
          if (testNumber) {
            const result = await client.sendMessage(testNumber, 'Teste automatizado');
            expect(result).toBeDefined();
            expect(result.body).toContain('Teste automatizado');
          } else {
            console.log('ðŸ”„ Pulando teste real - defina TEST_WHATSAPP_NUMBER');
          }
        } else {
          console.log(
            'ðŸ”„ Pulando teste - modo mock desabilitado e teste interativo nÃ£o configurado'
          );
        }
      },
      testTimeout
    );

    test(
      'deve listar contatos',
      async () => {
        if (testConfig.useMocks) {
          // Teste com mock
          const contacts = await client.getContacts();
          expect(Array.isArray(contacts)).toBe(true);
          expect(contacts.length).toBeGreaterThan(0);
        } else if (process.env.TEST_WHATSAPP_INTERACTIVE === 'true') {
          // Teste real
          const contacts = await client.getContacts();
          expect(Array.isArray(contacts)).toBe(true);
          console.log(`ðŸ“ž Encontrados ${contacts.length} contatos`);
        } else {
          console.log(
            'ðŸ”„ Pulando teste - modo mock desabilitado e teste interativo nÃ£o configurado'
          );
        }
      },
      testTimeout
    );
  });

  describe('VerificaÃ§Ã£o de Funcionalidades', () => {
    test('deve ter mÃ©todos essenciais disponÃ­veis', () => {
      // Testes que funcionam tanto para mock quanto real
      expect(typeof client.initialize).toBe('function');
      expect(typeof client.sendMessage).toBe('function');
      expect(typeof client.getContacts).toBe('function');
      expect(typeof client.getChats).toBe('function');
      expect(typeof client.destroy).toBe('function');
    });

    test('deve configurar event listeners', done => {
      let eventReceived = false;

      client.on('ready', () => {
        eventReceived = true;
        if (testConfig.useMocks) {
          done(); // Para mocks, terminar imediatamente
        }
      });

      client.on('qr', (qr: string) => {
        if (!testConfig.useMocks) {
          console.log('ðŸ“± QR Code recebido para teste real');
          expect(typeof qr).toBe('string');
          done();
        }
      });

      if (testConfig.useMocks) {
        // Para mocks, simular inicializaÃ§Ã£o
        client.initialize();
      } else {
        // Para testes reais, apenas verificar que o listener foi configurado
        setTimeout(() => {
          if (!eventReceived) {
            done(); // Timeout aceitÃ¡vel para testes reais
          }
        }, 2000);
      }
    }, 10000);
  });
});

// Testes especÃ­ficos para modo de produÃ§Ã£o/desenvolvimento
describe('ConfiguraÃ§Ã£o de Ambiente', () => {
  test('deve usar configuraÃ§Ã£o correta baseada no ambiente', () => {
    if (process.env.NODE_ENV === 'test') {
      expect(testConfig.useMocks).toBe(true);
    }

    expect(testConfig.realTests.timeout).toBeGreaterThan(testConfig.mockTests.timeout);
    expect(testConfig.realTests.whatsapp.clientId).toBeDefined();
  });

  test('deve ter variÃ¡veis de ambiente configuradas corretamente', () => {
    // Verificar configuraÃ§Ãµes essenciais
    expect(testConfig.realTests.whatsapp.sessionPath).toBeDefined();

    if (process.env.TEST_WHATSAPP_INTERACTIVE === 'true') {
      console.log('âœ… Modo interativo ativado - testes reais habilitados');
    } else {
      console.log('â„¹ï¸  Modo interativo desativado - apenas mocks serÃ£o executados');
      console.log('   Para ativar testes reais: TEST_WHATSAPP_INTERACTIVE=true');
    }
  });
});
