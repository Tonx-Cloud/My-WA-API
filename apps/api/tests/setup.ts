// Global test setup
import { jest } from '@jest/globals';

// Mock environment variables
Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true });
Object.defineProperty(process.env, 'PORT', { value: '3001', writable: true });
Object.defineProperty(process.env, 'LOG_LEVEL', { value: 'error', writable: true });

// Mock Winston logger completely to prevent console spam during tests
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  add: jest.fn(),
};

jest.mock('winston', () => ({
  createLogger: jest.fn(() => mockLogger),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

// Mock the logger config file
jest.mock('../src/config/logger', () => mockLogger);

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
