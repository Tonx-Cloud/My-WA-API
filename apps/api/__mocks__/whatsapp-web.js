/**
 * Mock completo da biblioteca whatsapp-web.js
 * Simula todas as funcionalidades principais do WhatsApp Web Client
 * @fileoverview Este arquivo fornece mocks isolados para testes
 */

// EventEmitter mock simples
class MockEventEmitter {
  constructor() {
    this._events = new Map();
  }

  on(event, listener) {
    if (!this._events.has(event)) {
      this._events.set(event, []);
    }
    this._events.get(event).push(listener);
    return this;
  }

  emit(event, ...args) {
    if (this._events.has(event)) {
      this._events.get(event).forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.warn('Event listener error:', error);
        }
      });
    }
    return true;
  }

  removeAllListeners(event) {
    if (event) {
      this._events.delete(event);
    } else {
      this._events.clear();
    }
    return this;
  }
}

// Enum para estados de autenticaÃ§Ã£o
const WAState = {
  CONFLICT: 'CONFLICT',
  CONNECTED: 'CONNECTED',
  DEPRECATED_VERSION: 'DEPRECATED_VERSION',
  OPENING: 'OPENING',
  PAIRING: 'PAIRING',
  SMB_TOS_BLOCK: 'SMB_TOS_BLOCK',
  TIMEOUT: 'TIMEOUT',
  TOS_BLOCK: 'TOS_BLOCK',
  UNLAUNCHED: 'UNLAUNCHED',
  UNPAIRED: 'UNPAIRED',
  UNPAIRED_IDLE: 'UNPAIRED_IDLE',
};

// Enum para tipos de chat
const ChatTypes = {
  SOLO: 'SOLO',
  GROUP: 'GROUP',
  UNKNOWN: 'UNKNOWN',
};

// Mock da classe Message
class Message {
  constructor(data = {}) {
    this.id = data.id || {
      id: 'mock-message-id',
      remote: 'mock-remote@c.us',
      fromMe: false,
    };
    this.ack = data.ack || 1;
    this.hasMedia = data.hasMedia || false;
    this.body = data.body || 'Mock message body';
    this.type = data.type || 'chat';
    this.timestamp = data.timestamp || Math.floor(Date.now() / 1000);
    this.from = data.from || 'mock-sender@c.us';
    this.to = data.to || 'mock-receiver@c.us';
    this.author = data.author || null;
    this.deviceType = data.deviceType || 'web';
    this.isForwarded = data.isForwarded || false;
    this.forwardingScore = data.forwardingScore || 0;
    this.isStatus = data.isStatus || false;
    this.isStarred = data.isStarred || false;
    this.broadcast = data.broadcast || false;
    this.fromMe = data.fromMe || false;
    this.hasQuotedMsg = data.hasQuotedMsg || false;
    this.location = data.location || null;
    this.vCards = data.vCards || [];
    this.inviteV4 = data.inviteV4 || null;
    this.mentionedIds = data.mentionedIds || [];
    this.isGif = data.isGif || false;
    this.isEphemeral = data.isEphemeral || false;
  }

  async getChat() {
    return new Chat({ id: { _serialized: this.from } });
  }

  async getContact() {
    return new Contact({ id: { _serialized: this.from } });
  }

  async getQuotedMessage() {
    if (!this.hasQuotedMsg) return null;
    return new Message({ body: 'Quoted message content' });
  }

  async downloadMedia() {
    if (!this.hasMedia) return null;
    return {
      data: Buffer.from('mock-media-data'),
      mimetype: 'image/jpeg',
      filename: 'mock-image.jpg',
    };
  }

  async reply(content, chatId, options = {}) {
    return new Message({
      body: content,
      from: chatId || this.from,
      to: this.from,
      fromMe: true,
    });
  }

  async forward(chat) {
    return new Message({
      body: this.body,
      from: chat,
      to: this.from,
      isForwarded: true,
      forwardingScore: this.forwardingScore + 1,
    });
  }

  async star() {
    this.isStarred = true;
    return true;
  }

  async unstar() {
    this.isStarred = false;
    return true;
  }

  async delete(everyone = false) {
    return true;
  }
}

// Mock da classe Contact
class Contact {
  constructor(data = {}) {
    this.id = data.id || {
      _serialized: 'mock-contact@c.us',
      user: 'mock-contact',
      server: 'c.us',
    };
    this.number = data.number || '+5511999999999';
    this.isBusiness = data.isBusiness || false;
    this.isEnterprise = data.isEnterprise || false;
    this.labels = data.labels || [];
    this.name = data.name || 'Mock Contact';
    this.pushname = data.pushname || 'Mock Push Name';
    this.sectionHeader = data.sectionHeader || null;
    this.shortName = data.shortName || 'Mock';
    this.statusMute = data.statusMute || false;
    this.type = data.type || 'in';
    this.verifiedLevel = data.verifiedLevel || null;
    this.verifiedName = data.verifiedName || null;
    this.isGroup = data.isGroup || false;
    this.isUser = data.isUser || true;
    this.isWAContact = data.isWAContact || true;
    this.isMyContact = data.isMyContact || false;
    this.isBlocked = data.isBlocked || false;
  }

  async getAbout() {
    return 'Mock about status';
  }

  async getProfilePicUrl() {
    return 'https://mock-profile-pic.jpg';
  }

  async getCommonGroups() {
    return [new Chat({ id: { _serialized: 'mock-group@g.us' }, isGroup: true })];
  }

  async block() {
    this.isBlocked = true;
    return true;
  }

  async unblock() {
    this.isBlocked = false;
    return true;
  }

  async getChat() {
    return new Chat({ id: this.id });
  }
}

// Mock da classe Chat
class Chat {
  constructor(data = {}) {
    this.id = data.id || {
      _serialized: 'mock-chat@c.us',
      user: 'mock-chat',
      server: 'c.us',
    };
    this.name = data.name || 'Mock Chat';
    this.isGroup = data.isGroup || false;
    this.isReadOnly = data.isReadOnly || false;
    this.unreadCount = data.unreadCount || 0;
    this.timestamp = data.timestamp || Math.floor(Date.now() / 1000);
    this.archived = data.archived || false;
    this.pinned = data.pinned || false;
    this.isMuted = data.isMuted || false;
    this.muteExpiration = data.muteExpiration || 0;
    this.lastMessage = data.lastMessage || null;
    this.groupMetadata = data.groupMetadata || null;
  }

  async sendMessage(content, options = {}) {
    return new Message({
      body: content,
      from: this.id._serialized,
      to: this.id._serialized,
      fromMe: true,
      hasMedia: options.media ? true : false,
    });
  }

  async fetchMessages(searchOptions = {}) {
    const limit = searchOptions.limit || 50;
    const messages = [];

    for (let i = 0; i < Math.min(limit, 10); i++) {
      messages.push(
        new Message({
          body: `Mock message ${i + 1}`,
          from: this.id._serialized,
          timestamp: Math.floor(Date.now() / 1000) - i * 3600,
        })
      );
    }

    return messages;
  }

  async loadEarlierMessages(searchOptions = {}) {
    return this.fetchMessages(searchOptions);
  }

  async sendStateTyping() {
    return true;
  }

  async sendStateRecording() {
    return true;
  }

  async clearState() {
    return true;
  }

  async delete() {
    return true;
  }

  async archive() {
    this.archived = true;
    return true;
  }

  async unarchive() {
    this.archived = false;
    return true;
  }

  async pin() {
    this.pinned = true;
    return true;
  }

  async unpin() {
    this.pinned = false;
    return true;
  }

  async mute(unmuteDate) {
    this.isMuted = true;
    this.muteExpiration = unmuteDate || Date.now() + 86400000; // 24h
    return true;
  }

  async unmute() {
    this.isMuted = false;
    this.muteExpiration = 0;
    return true;
  }

  async markAsUnread() {
    this.unreadCount = Math.max(this.unreadCount, 1);
    return true;
  }

  async getContact() {
    return new Contact({ id: this.id });
  }
}

// Mock da classe GroupChat
class GroupChat extends Chat {
  constructor(data = {}) {
    super({ ...data, isGroup: true });
    this.groupMetadata = data.groupMetadata || {
      id: this.id,
      subject: data.name || 'Mock Group',
      subjectTime: Math.floor(Date.now() / 1000),
      subjectOwner: 'mock-owner@c.us',
      desc: 'Mock group description',
      descTime: Math.floor(Date.now() / 1000),
      descOwner: 'mock-owner@c.us',
      owner: 'mock-owner@c.us',
      creation: Math.floor(Date.now() / 1000),
      participants: [
        {
          id: { _serialized: 'mock-owner@c.us' },
          isAdmin: true,
          isSuperAdmin: true,
        },
        {
          id: { _serialized: 'mock-member@c.us' },
          isAdmin: false,
          isSuperAdmin: false,
        },
      ],
      ephemeralDuration: 0,
      inviteCode: 'mock-invite-code',
    };
  }

  async addParticipants(contacts) {
    const added = [];
    for (const contact of contacts) {
      this.groupMetadata.participants.push({
        id: { _serialized: contact },
        isAdmin: false,
        isSuperAdmin: false,
      });
      added.push(contact);
    }
    return added;
  }

  async removeParticipants(contacts) {
    const removed = [];
    for (const contact of contacts) {
      const index = this.groupMetadata.participants.findIndex(p => p.id._serialized === contact);
      if (index !== -1) {
        this.groupMetadata.participants.splice(index, 1);
        removed.push(contact);
      }
    }
    return removed;
  }

  async promoteParticipants(contacts) {
    const promoted = [];
    for (const contact of contacts) {
      const participant = this.groupMetadata.participants.find(p => p.id._serialized === contact);
      if (participant) {
        participant.isAdmin = true;
        promoted.push(contact);
      }
    }
    return promoted;
  }

  async demoteParticipants(contacts) {
    const demoted = [];
    for (const contact of contacts) {
      const participant = this.groupMetadata.participants.find(p => p.id._serialized === contact);
      if (participant) {
        participant.isAdmin = false;
        participant.isSuperAdmin = false;
        demoted.push(contact);
      }
    }
    return demoted;
  }

  async setSubject(subject) {
    this.groupMetadata.subject = subject;
    this.name = subject;
    return true;
  }

  async setDescription(description) {
    this.groupMetadata.desc = description;
    return true;
  }

  async getInviteCode() {
    return this.groupMetadata.inviteCode;
  }

  async revokeInvite() {
    this.groupMetadata.inviteCode = `mock-new-invite-${Date.now()}`;
    return this.groupMetadata.inviteCode;
  }

  async leave() {
    return true;
  }
}

// Mock da classe Client (Principal)
class Client {
  constructor(options = {}) {
    this.options = options;
    this.info = null;
    this.pupPage = null;
    this.pupBrowser = null;
    this.authStrategy = options.authStrategy || null;

    // Estado interno
    this._state = WAState.UNLAUNCHED;
    this._isReady = false;
    this._contacts = new Map();
    this._chats = new Map();

    // Configurar eventos mock
    this._setupEventListeners();

    // Simular alguns contatos e chats padrÃ£o
    this._setupMockData();
  }

  _setupEventListeners() {
    this._eventListeners = new Map();
    this._eventListeners.set('qr', []);
    this._eventListeners.set('ready', []);
    this._eventListeners.set('authenticated', []);
    this._eventListeners.set('auth_failure', []);
    this._eventListeners.set('disconnected', []);
    this._eventListeners.set('message', []);
    this._eventListeners.set('message_create', []);
    this._eventListeners.set('message_revoke_everyone', []);
    this._eventListeners.set('message_revoke_me', []);
    this._eventListeners.set('message_ack', []);
    this._eventListeners.set('group_join', []);
    this._eventListeners.set('group_leave', []);
    this._eventListeners.set('group_update', []);
    this._eventListeners.set('contact_changed', []);
    this._eventListeners.set('change_state', []);
  }

  _setupMockData() {
    // Adicionar contatos mock
    const mockContact1 = new Contact({
      id: { _serialized: 'mock-contact-1@c.us' },
      name: 'Mock Contact 1',
      pushname: 'Contact 1',
    });

    const mockContact2 = new Contact({
      id: { _serialized: 'mock-contact-2@c.us' },
      name: 'Mock Contact 2',
      pushname: 'Contact 2',
    });

    this._contacts.set('mock-contact-1@c.us', mockContact1);
    this._contacts.set('mock-contact-2@c.us', mockContact2);

    // Adicionar chats mock
    const mockChat1 = new Chat({
      id: { _serialized: 'mock-contact-1@c.us' },
      name: 'Mock Contact 1',
    });

    const mockGroupChat = new GroupChat({
      id: { _serialized: 'mock-group@g.us' },
      name: 'Mock Group Chat',
    });

    this._chats.set('mock-contact-1@c.us', mockChat1);
    this._chats.set('mock-group@g.us', mockGroupChat);
  }

  // MÃ©todos de evento
  on(event, callback) {
    if (this._eventListeners.has(event)) {
      this._eventListeners.get(event).push(callback);
    }
    return this;
  }

  off(event, callback) {
    if (this._eventListeners.has(event)) {
      const listeners = this._eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
    return this;
  }

  emit(event, ...args) {
    if (this._eventListeners.has(event)) {
      this._eventListeners.get(event).forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
    return this;
  }

  // MÃ©todos principais
  async initialize() {
    this._state = WAState.OPENING;
    this.emit('change_state', WAState.OPENING);

    // Simular processo de inicializaÃ§Ã£o mais rÃ¡pido para testes
    await new Promise(resolve => setTimeout(resolve, 10));

    if (!this.authStrategy) {
      // Simular QR code se nÃ£o hÃ¡ estratÃ©gia de auth
      this._state = WAState.UNPAIRED;
      this.emit('change_state', WAState.UNPAIRED);

      setTimeout(() => {
        this.emit('qr', 'mock-qr-code-data');
      }, 10);

      // Simular autenticaÃ§Ã£o apÃ³s QR
      setTimeout(() => {
        this._state = WAState.CONNECTED;
        this.emit('change_state', WAState.CONNECTED);
        this.emit('authenticated', { session: 'mock-session-data' });

        this._isReady = true;
        this.info = {
          wid: { _serialized: 'mock-user@c.us' },
          pushname: 'Mock User',
          me: { _serialized: 'mock-user@c.us' },
        };

        this.emit('ready');
      }, 50);
    } else {
      // Simular auth com estratÃ©gia existente (ainda mais rÃ¡pido)
      setTimeout(() => {
        this._state = WAState.CONNECTED;
        this.emit('change_state', WAState.CONNECTED);
        this.emit('authenticated', { session: 'mock-session-data' });

        this._isReady = true;
        this.info = {
          wid: { _serialized: 'mock-user@c.us' },
          pushname: 'Mock User',
          me: { _serialized: 'mock-user@c.us' },
        };

        this.emit('ready');
      }, 20);
    }

    return this;
  }

  async getState() {
    return this._state;
  }

  getWWebVersion() {
    return '2.2412.54';
  }

  async sendMessage(chatId, content, options = {}) {
    if (!this._isReady) {
      throw new Error('Client not ready');
    }

    const message = new Message({
      body: content,
      from: this.info.wid._serialized,
      to: chatId,
      fromMe: true,
      hasMedia: options.media ? true : false,
      timestamp: Math.floor(Date.now() / 1000),
    });

    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 50));

    this.emit('message_create', message);

    // Simular ACK apÃ³s um tempo
    setTimeout(() => {
      message.ack = 1; // Enviado
      this.emit('message_ack', message, 1);

      setTimeout(() => {
        message.ack = 2; // Entregue
        this.emit('message_ack', message, 2);

        setTimeout(() => {
          message.ack = 3; // Lido
          this.emit('message_ack', message, 3);
        }, 100);
      }, 100);
    }, 100);

    return message;
  }

  async getContacts() {
    if (!this._isReady) {
      throw new Error('Client not ready');
    }
    return Array.from(this._contacts.values());
  }

  async getContactById(contactId) {
    if (!this._isReady) {
      throw new Error('Client not ready');
    }
    return this._contacts.get(contactId) || null;
  }

  async getChats() {
    if (!this._isReady) {
      throw new Error('Client not ready');
    }
    return Array.from(this._chats.values());
  }

  async getChatById(chatId) {
    if (!this._isReady) {
      throw new Error('Client not ready');
    }
    return this._chats.get(chatId) || null;
  }

  async getNumberId(number) {
    // Normalizar nÃºmero e retornar ID
    const normalized = number.replace(/\D/g, '');
    return { _serialized: `${normalized}@c.us` };
  }

  async isRegisteredUser(number) {
    // Simular verificaÃ§Ã£o se nÃºmero estÃ¡ registrado no WhatsApp
    return true;
  }

  async getProfilePicUrl(contactId) {
    return `https://mock-profile-pic-${contactId}.jpg`;
  }

  async setStatus(status) {
    if (!this._isReady) {
      throw new Error('Client not ready');
    }
    return true;
  }

  async getStatus() {
    if (!this._isReady) {
      throw new Error('Client not ready');
    }
    return 'Mock status message';
  }

  async setDisplayName(name) {
    if (!this._isReady) {
      throw new Error('Client not ready');
    }
    this.info.pushname = name;
    return true;
  }

  async logout() {
    this._isReady = false;
    this._state = WAState.UNLAUNCHED;
    this.emit('change_state', WAState.UNLAUNCHED);
    this.emit('disconnected', 'LOGOUT');
    return true;
  }

  async destroy() {
    this._isReady = false;
    this._state = WAState.UNLAUNCHED;
    this._eventListeners.clear();
    this._contacts.clear();
    this._chats.clear();
    return true;
  }

  async getInviteInfo(inviteCode) {
    return {
      id: { _serialized: 'mock-group@g.us' },
      subject: 'Mock Group from Invite',
      size: 10,
      owner: 'mock-owner@c.us',
      creation: Math.floor(Date.now() / 1000),
      desc: 'Mock group from invite link',
    };
  }

  async acceptInvite(inviteCode) {
    return new GroupChat({
      id: { _serialized: 'mock-new-group@g.us' },
      name: 'New Group from Invite',
    });
  }

  async createGroup(name, contacts, options = {}) {
    const groupId = `mock-group-${Date.now()}@g.us`;
    const group = new GroupChat({
      id: { _serialized: groupId },
      name: name,
      groupMetadata: {
        id: { _serialized: groupId },
        subject: name,
        participants: [
          {
            id: { _serialized: this.info.wid._serialized },
            isAdmin: true,
            isSuperAdmin: true,
          },
          ...contacts.map(contact => ({
            id: { _serialized: contact },
            isAdmin: false,
            isSuperAdmin: false,
          })),
        ],
      },
    });

    this._chats.set(groupId, group);
    return group;
  }

  async searchMessages(query, options = {}) {
    const messages = [];
    for (let i = 0; i < (options.limit || 10); i++) {
      messages.push(
        new Message({
          body: `Mock search result ${i + 1} containing: ${query}`,
          from: 'mock-sender@c.us',
          timestamp: Math.floor(Date.now() / 1000) - i * 3600,
        })
      );
    }
    return messages;
  }

  async markChatUnread(chatId) {
    const chat = this._chats.get(chatId);
    if (chat) {
      chat.unreadCount = Math.max(chat.unreadCount, 1);
      return true;
    }
    return false;
  }

  async archiveChat(chatId) {
    const chat = this._chats.get(chatId);
    if (chat) {
      chat.archived = true;
      return true;
    }
    return false;
  }

  async unarchiveChat(chatId) {
    const chat = this._chats.get(chatId);
    if (chat) {
      chat.archived = false;
      return true;
    }
    return false;
  }

  async pinChat(chatId) {
    const chat = this._chats.get(chatId);
    if (chat) {
      chat.pinned = true;
      return true;
    }
    return false;
  }

  async unpinChat(chatId) {
    const chat = this._chats.get(chatId);
    if (chat) {
      chat.pinned = false;
      return true;
    }
    return false;
  }

  async muteChat(chatId, unmuteDate) {
    const chat = this._chats.get(chatId);
    if (chat) {
      chat.isMuted = true;
      chat.muteExpiration = unmuteDate || Date.now() + 86400000;
      return true;
    }
    return false;
  }

  async unmuteChat(chatId) {
    const chat = this._chats.get(chatId);
    if (chat) {
      chat.isMuted = false;
      chat.muteExpiration = 0;
      return true;
    }
    return false;
  }
}

// Mock de estratÃ©gias de autenticaÃ§Ã£o
class LocalAuth {
  constructor(options = {}) {
    this.clientId = options.clientId || 'mock-client';
    this.dataPath = options.dataPath || './mock-auth';
  }
}

class NoAuth {
  constructor() {}
}

class RemoteAuth {
  constructor(options = {}) {
    this.clientId = options.clientId || 'mock-remote-client';
    this.store = options.store || null;
    this.backupSyncIntervalMs = options.backupSyncIntervalMs || 300000;
  }
}

// Mock de utilitÃ¡rios
class Location {
  constructor(latitude, longitude, description = '') {
    this.latitude = latitude;
    this.longitude = longitude;
    this.description = description;
  }
}

class List {
  constructor(body, buttonText, sections, title = '', footer = '') {
    this.body = body;
    this.buttonText = buttonText;
    this.sections = sections;
    this.title = title;
    this.footer = footer;
  }
}

class Buttons {
  constructor(body, buttons, title = '', footer = '') {
    this.body = body;
    this.buttons = buttons;
    this.title = title;
    this.footer = footer;
  }
}

// Mock de MessageMedia
class MessageMedia {
  constructor(mimetype, data, filename = '') {
    this.mimetype = mimetype;
    this.data = data;
    this.filename = filename;
  }

  static fromFilePath(filePath) {
    return new MessageMedia('image/jpeg', 'mock-base64-data', filePath);
  }

  static fromUrl(url, options = {}) {
    return new MessageMedia('image/jpeg', 'mock-base64-data', options.filename || 'download');
  }
}

// ExportaÃ§Ãµes CommonJS
module.exports = {
  // Classes principais
  Client,
  Message,
  Contact,
  Chat,
  GroupChat,

  // EstratÃ©gias de autenticaÃ§Ã£o
  LocalAuth,
  NoAuth,
  RemoteAuth,

  // UtilitÃ¡rios
  Location,
  List,
  Buttons,
  MessageMedia,

  // Enums
  WAState,
  ChatTypes,

  // Export padrÃ£o
  default: Client,
};
