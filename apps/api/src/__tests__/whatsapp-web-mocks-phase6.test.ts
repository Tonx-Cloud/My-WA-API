import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";

// Importar os mocks diretamente
import {
  Client,
  LocalAuth,
  WAState,
  Message,
  Contact,
  Chat,
  GroupChat,
  MessageMedia,
} from "whatsapp-web.js";

describe("WhatsApp-Web.js Mocks - Phase 6", () => {
  let client: any;

  beforeEach(() => {
    // Criar cliente com autenticação local
    const authStrategy = new LocalAuth({ clientId: "test-client" });
    client = new Client({ authStrategy });
  });

  afterEach(async () => {
    if (client) {
      await client.destroy();
    }
  });

  describe("Client Initialization", () => {
    test("deve criar cliente com estratégia de auth", () => {
      expect(client).toBeDefined();
      expect(client.authStrategy).toBeDefined();
      expect(client.options.authStrategy).toBeInstanceOf(LocalAuth);
    });

    test("deve inicializar e emitir eventos corretos", async () => {
      const readyPromise = new Promise((resolve) => {
        client.on("ready", resolve);
      });

      const authenticatedPromise = new Promise((resolve) => {
        client.on("authenticated", resolve);
      });

      await client.initialize();

      await Promise.all([readyPromise, authenticatedPromise]);

      expect(await client.getState()).toBe(WAState.CONNECTED);
      expect(client.info).toBeDefined();
      expect(client.info.wid._serialized).toBe("mock-user@c.us");
    });

    test("deve emitir QR code quando não há auth strategy", async () => {
      const noAuthClient = new Client();

      const qrPromise = new Promise((resolve) => {
        noAuthClient.on("qr", resolve);
      });

      await noAuthClient.initialize();
      const qrCode = await qrPromise;

      expect(qrCode).toBe("mock-qr-code-data");

      await noAuthClient.destroy();
    });
  });

  describe("Message Operations", () => {
    beforeEach(async () => {
      await client.initialize();
      await new Promise((resolve) => client.on("ready", resolve));
    });

    test("deve enviar mensagem com sucesso", async () => {
      const messagePromise = new Promise((resolve) => {
        client.on("message_create", resolve);
      });

      const message = await client.sendMessage(
        "mock-contact-1@c.us",
        "Hello test message",
      );
      const createdMessage = await messagePromise;

      expect(message).toBeInstanceOf(Message);
      expect(message.body).toBe("Hello test message");
      expect(message.fromMe).toBe(true);
      expect(createdMessage).toBeDefined();
    });

    test("deve processar ACKs de mensagem", async () => {
      const ackPromises = [];
      let ackCount = 0;

      client.on("message_ack", (msg, ack) => {
        ackCount++;
        expect(ack).toBeGreaterThanOrEqual(1);
        expect(ack).toBeLessThanOrEqual(3);
      });

      await client.sendMessage("mock-contact-1@c.us", "Test ACK message");

      // Aguardar ACKs serem processados
      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(ackCount).toBeGreaterThan(0);
    });

    test("deve criar e processar mensagem com mídia", async () => {
      const media = MessageMedia.fromFilePath("./test-image.jpg");

      const message = await client.sendMessage("mock-contact-1@c.us", media);

      expect(message.hasMedia).toBe(true);
      expect(message).toBeInstanceOf(Message);
    });
  });

  describe("Contact Operations", () => {
    beforeEach(async () => {
      await client.initialize();
      await new Promise((resolve) => client.on("ready", resolve));
    });

    test("deve obter lista de contatos", async () => {
      const contacts = await client.getContacts();

      expect(Array.isArray(contacts)).toBe(true);
      expect(contacts.length).toBeGreaterThan(0);
      expect(contacts[0]).toBeInstanceOf(Contact);
    });

    test("deve obter contato por ID", async () => {
      const contact = await client.getContactById("mock-contact-1@c.us");

      expect(contact).toBeInstanceOf(Contact);
      expect(contact.id._serialized).toBe("mock-contact-1@c.us");
      expect(contact.name).toBe("Mock Contact 1");
    });

    test("deve verificar número registrado", async () => {
      const isRegistered = await client.isRegisteredUser("+5511999999999");

      expect(typeof isRegistered).toBe("boolean");
      expect(isRegistered).toBe(true);
    });

    test("deve obter ID do número", async () => {
      const numberId = await client.getNumberId("+55 11 99999-9999");

      expect(numberId).toBeDefined();
      expect(numberId._serialized).toBe("5511999999999@c.us");
    });
  });

  describe("Chat Operations", () => {
    beforeEach(async () => {
      await client.initialize();
      await new Promise((resolve) => client.on("ready", resolve));
    });

    test("deve obter lista de chats", async () => {
      const chats = await client.getChats();

      expect(Array.isArray(chats)).toBe(true);
      expect(chats.length).toBeGreaterThan(0);
      expect(chats[0]).toBeInstanceOf(Chat);
    });

    test("deve obter chat por ID", async () => {
      const chat = await client.getChatById("mock-contact-1@c.us");

      expect(chat).toBeInstanceOf(Chat);
      expect(chat.id._serialized).toBe("mock-contact-1@c.us");
    });

    test("deve arquivar e desarquivar chat", async () => {
      await client.archiveChat("mock-contact-1@c.us");
      let chat = await client.getChatById("mock-contact-1@c.us");
      expect(chat.archived).toBe(true);

      await client.unarchiveChat("mock-contact-1@c.us");
      chat = await client.getChatById("mock-contact-1@c.us");
      expect(chat.archived).toBe(false);
    });

    test("deve fixar e desfixar chat", async () => {
      await client.pinChat("mock-contact-1@c.us");
      let chat = await client.getChatById("mock-contact-1@c.us");
      expect(chat.pinned).toBe(true);

      await client.unpinChat("mock-contact-1@c.us");
      chat = await client.getChatById("mock-contact-1@c.us");
      expect(chat.pinned).toBe(false);
    });

    test("deve silenciar e desilenciar chat", async () => {
      const unmuteDate = Date.now() + 86400000; // 24h

      await client.muteChat("mock-contact-1@c.us", unmuteDate);
      let chat = await client.getChatById("mock-contact-1@c.us");
      expect(chat.isMuted).toBe(true);

      await client.unmuteChat("mock-contact-1@c.us");
      chat = await client.getChatById("mock-contact-1@c.us");
      expect(chat.isMuted).toBe(false);
    });
  });

  describe("Group Operations", () => {
    beforeEach(async () => {
      await client.initialize();
      await new Promise((resolve) => client.on("ready", resolve));
    });

    test("deve criar grupo com sucesso", async () => {
      const contacts = ["mock-contact-1@c.us", "mock-contact-2@c.us"];
      const group = await client.createGroup("Test Group", contacts);

      expect(group).toBeInstanceOf(GroupChat);
      expect(group.name).toBe("Test Group");
      expect(group.isGroup).toBe(true);
      expect(group.groupMetadata.participants.length).toBe(3); // owner + 2 members
    });

    test("deve gerenciar participantes do grupo", async () => {
      const group = await client.getChatById("mock-group@g.us");
      expect(group).toBeInstanceOf(GroupChat);

      // Adicionar participantes
      const added = await group.addParticipants(["new-member@c.us"]);
      expect(added).toContain("new-member@c.us");

      // Promover participantes
      const promoted = await group.promoteParticipants(["new-member@c.us"]);
      expect(promoted).toContain("new-member@c.us");

      // Rebaixar participantes
      const demoted = await group.demoteParticipants(["new-member@c.us"]);
      expect(demoted).toContain("new-member@c.us");

      // Remover participantes
      const removed = await group.removeParticipants(["new-member@c.us"]);
      expect(removed).toContain("new-member@c.us");
    });

    test("deve gerenciar convites de grupo", async () => {
      const inviteInfo = await client.getInviteInfo("mock-invite-code");

      expect(inviteInfo).toBeDefined();
      expect(inviteInfo.subject).toBe("Mock Group from Invite");
      expect(inviteInfo.size).toBe(10);

      const joinedGroup = await client.acceptInvite("mock-invite-code");
      expect(joinedGroup).toBeInstanceOf(GroupChat);
    });

    test("deve alterar configurações do grupo", async () => {
      const group = await client.getChatById("mock-group@g.us");

      await group.setSubject("New Group Name");
      expect(group.name).toBe("New Group Name");

      await group.setDescription("New group description");
      expect(group.groupMetadata.desc).toBe("New group description");

      const inviteCode = await group.getInviteCode();
      expect(typeof inviteCode).toBe("string");

      const newInviteCode = await group.revokeInvite();
      expect(newInviteCode).not.toBe(inviteCode);
    });
  });

  describe("Search and Utilities", () => {
    beforeEach(async () => {
      await client.initialize();
      await new Promise((resolve) => client.on("ready", resolve));
    });

    test("deve buscar mensagens", async () => {
      const messages = await client.searchMessages("test query", { limit: 5 });

      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(5);
      expect(messages[0]).toBeInstanceOf(Message);
      expect(messages[0].body).toContain("test query");
    });

    test("deve obter foto de perfil", async () => {
      const profilePicUrl = await client.getProfilePicUrl(
        "mock-contact-1@c.us",
      );

      expect(typeof profilePicUrl).toBe("string");
      expect(profilePicUrl).toMatch(/https?:\/\/.*/);
    });

    test("deve gerenciar status", async () => {
      await client.setStatus("New status message");
      const status = await client.getStatus();

      expect(typeof status).toBe("string");
      expect(status).toBe("Mock status message");
    });

    test("deve alterar nome de exibição", async () => {
      await client.setDisplayName("New Display Name");

      expect(client.info.pushname).toBe("New Display Name");
    });
  });

  describe("Error Handling", () => {
    test("deve falhar operações quando cliente não está pronto", async () => {
      const unreadyClient = new Client();

      await expect(
        unreadyClient.sendMessage("test@c.us", "message"),
      ).rejects.toThrow("Client not ready");

      await expect(unreadyClient.getContacts()).rejects.toThrow(
        "Client not ready",
      );
    });
  });

  describe("Cleanup Operations", () => {
    test("deve fazer logout corretamente", async () => {
      await client.initialize();
      await new Promise((resolve) => client.on("ready", resolve));

      const disconnectedPromise = new Promise((resolve) => {
        client.on("disconnected", resolve);
      });

      await client.logout();
      await disconnectedPromise;

      expect(await client.getState()).toBe(WAState.UNLAUNCHED);
    });

    test("deve destruir cliente corretamente", async () => {
      await client.initialize();
      await client.destroy();

      expect(client._eventListeners.size).toBe(0);
      expect(client._contacts.size).toBe(0);
      expect(client._chats.size).toBe(0);
    });
  });
});
