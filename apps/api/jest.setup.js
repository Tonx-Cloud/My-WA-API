// Mock WhatsApp Web.js
jest.mock('whatsapp-web.js', () => ({
  __esModule: true,
  default: {
    Client: jest.fn(() => ({
      on: jest.fn(),
      initialize: jest.fn(),
      destroy: jest.fn(),
      sendMessage: jest.fn(),
      getState: jest.fn(),
    })),
    LocalAuth: jest.fn(),
  },
}))

// Mock Socket.IO
jest.mock('socket.io', () => ({
  Server: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
  })),
}))

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key'
process.env.DATABASE_URL = ':memory:'
