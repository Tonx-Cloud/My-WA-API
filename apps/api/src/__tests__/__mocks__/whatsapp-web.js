/**
 * Mock completo da biblioteca whatsapp-web.js
 * Para testes isolados sem dependÃªncias do Puppeteer/Chrome
 */

// Mock do Client principal
const mockClient = {
  initialize: jest.fn().mockResolvedValue(true),
  getState: jest.fn().mockReturnValue('CONNECTED'),
  sendMessage: jest.fn().mockResolvedValue({
    id: {
      fromMe: true,
      remote: '5511999999999@c.us',
      id: 'mock-message-id-' + Date.now(),
      _serialized: 'mock-serialized-id',
    },
    ack: 1,
    hasMedia: false,
    body: 'Mock message sent',
    type: 'chat',
    timestamp: Math.floor(Date.now() / 1000),
    from: 'mock-sender@c.us',
    to: '5511999999999@c.us',
  }),
  getQRCode: jest
    .fn()
    .mockResolvedValue(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    ),
  disconnect: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true),
  logout: jest.fn().mockResolvedValue(true),
  getChats: jest.fn().mockResolvedValue([
    {
      id: { _serialized: 'mock-chat-1@c.us' },
      name: 'Mock Chat 1',
      isGroup: false,
      isReadOnly: false,
      unreadCount: 0,
    },
  ]),
  getContacts: jest.fn().mockResolvedValue([
    {
      id: { _serialized: 'mock-contact-1@c.us' },
      name: 'Mock Contact 1',
      pushname: 'Mock User',
      number: '5511999999999',
      isUser: true,
      isGroup: false,
      isWAContact: true,
    },
  ]),
  getContactById: jest.fn().mockResolvedValue({
    id: { _serialized: 'mock-contact@c.us' },
    name: 'Mock Contact',
    pushname: 'Mock User',
    number: '5511999999999',
  }),
  getChatById: jest.fn().mockResolvedValue({
    id: { _serialized: 'mock-chat@c.us' },
    name: 'Mock Chat',
    isGroup: false,
  }),
  searchMessages: jest.fn().mockResolvedValue([]),
  getProfilePicUrl: jest.fn().mockResolvedValue('https://via.placeholder.com/150'),
  setStatus: jest.fn().mockResolvedValue(true),
  getStatus: jest.fn().mockResolvedValue('Available'),

  // Event handlers
  on: jest.fn(),
  off: jest.fn(),
  removeAllListeners: jest.fn(),

  // State management
  pupPage: null,
  pupBrowser: null,

  // Mock info
  info: {
    wid: { _serialized: 'mock-wid@c.us' },
    pushname: 'Mock WhatsApp Bot',
    me: { _serialized: 'mock-bot@c.us' },
    phone: {
      wa_version: '2.2409.2',
      mcc: '724',
      mnc: '010',
      os_version: 'Android 10',
      device_manufacturer: 'Samsung',
      device_model: 'SM-G973F',
      os_build_number: 'QP1A.190711.020',
    },
    platform: 'android',
  },
};

// Mock das classes de autenticaÃ§Ã£o
const MockLocalAuth = jest.fn().mockImplementation((options = {}) => ({
  clientId: options.clientId || 'mock-client',
  dataPath: options.dataPath || './.wwebjs_auth/session-mock',
  ...options,
}));

const MockNoAuth = jest.fn().mockImplementation(() => ({}));

// Mock da classe MessageMedia
const MockMessageMedia = {
  fromFilePath: jest.fn().mockImplementation(filePath => ({
    mimetype: 'image/png',
    data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    filename: filePath.split('/').pop() || 'mock-file.png',
  })),
  fromUrl: jest.fn().mockImplementation(url => ({
    mimetype: 'image/jpeg',
    data: 'mock-base64-data',
    filename: 'mock-image.jpg',
  })),
  fromBuffer: jest.fn().mockImplementation((buffer, mimetype, filename) => ({
    mimetype: mimetype || 'application/octet-stream',
    data: buffer.toString('base64'),
    filename: filename || 'mock-file',
  })),
};

// Mock da classe Location
const MockLocation = jest.fn().mockImplementation((latitude, longitude, description) => ({
  latitude: latitude || -23.5505,
  longitude: longitude || -46.6333,
  description: description || 'Mock Location',
}));

// Mock dos tipos de mensagem
const MessageTypes = {
  TEXT: 'chat',
  AUDIO: 'audio',
  VOICE: 'ptt',
  IMAGE: 'image',
  VIDEO: 'video',
  DOCUMENT: 'document',
  STICKER: 'sticker',
  LOCATION: 'location',
  CONTACT_CARD: 'vcard',
  CONTACT_CARD_MULTI: 'multi_vcard',
  REVOKED: 'revoked',
  ORDER: 'order',
  PRODUCT: 'product',
  UNKNOWN: 'unknown',
};

// Mock dos eventos
const Events = {
  AUTHENTICATED: 'authenticated',
  AUTHENTICATION_FAILURE: 'auth_failure',
  READY: 'ready',
  MESSAGE_RECEIVED: 'message',
  MESSAGE_CREATE: 'message_create',
  MESSAGE_REVOKED_EVERYONE: 'message_revoked_everyone',
  MESSAGE_REVOKED_ME: 'message_revoked_me',
  MESSAGE_ACK: 'message_ack',
  MEDIA_UPLOADED: 'media_uploaded',
  GROUP_JOIN: 'group_join',
  GROUP_LEAVE: 'group_leave',
  GROUP_UPDATE: 'group_update',
  QR_RECEIVED: 'qr',
  LOADING_SCREEN: 'loading_screen',
  DISCONNECTED: 'disconnected',
  STATE_CHANGED: 'change_state',
  BATTERY_CHANGED: 'change_battery',
  REMOTE_SESSION_SAVED: 'remote_session_saved',
};

// Mock do Client constructor
const MockClient = jest.fn().mockImplementation((options = {}) => {
  const client = { ...mockClient };

  // Simular configuraÃ§Ãµes
  client.options = {
    authStrategy: options.authStrategy || new MockLocalAuth(),
    puppeteer: options.puppeteer || {},
    session: options.session || null,
    qrMaxRetries: options.qrMaxRetries || 0,
    takeoverOnConflict: options.takeoverOnConflict || false,
    takeoverTimeoutMs: options.takeoverTimeoutMs || 0,
    userAgent: options.userAgent || 'WhatsApp/2.2409.2 Mozilla/5.0',
    ffmpegPath: options.ffmpegPath || null,
    bypassCSP: options.bypassCSP || false,
    ...options,
  };

  // Simular eventos assÃ­ncronos
  setTimeout(() => {
    if (client.on.mock.calls.length > 0) {
      // Simular evento QR recebido
      const qrHandlers = client.on.mock.calls
        .filter(call => call[0] === Events.QR_RECEIVED)
        .map(call => call[1]);
      qrHandlers.forEach(handler => handler('mock-qr-code'));

      // Simular autenticaÃ§Ã£o
      const authHandlers = client.on.mock.calls
        .filter(call => call[0] === Events.AUTHENTICATED)
        .map(call => call[1]);
      authHandlers.forEach(handler => handler());

      // Simular ready
      const readyHandlers = client.on.mock.calls
        .filter(call => call[0] === Events.READY)
        .map(call => call[1]);
      readyHandlers.forEach(handler => handler());
    }
  }, 100);

  return client;
});

// Exportar mocks
module.exports = {
  Client: MockClient,
  LocalAuth: MockLocalAuth,
  NoAuth: MockNoAuth,
  MessageMedia: MockMessageMedia,
  Location: MockLocation,
  MessageTypes,
  Events,
};

// Para compatibilidade com imports ES6
module.exports.default = {
  Client: MockClient,
  LocalAuth: MockLocalAuth,
  NoAuth: MockNoAuth,
  MessageMedia: MockMessageMedia,
  Location: MockLocation,
  MessageTypes,
  Events,
};
