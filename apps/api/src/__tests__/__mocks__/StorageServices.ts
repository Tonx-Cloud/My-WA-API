/**
 * Mock completo para serviços de banco de dados e armazenamento
 * @fileoverview Este arquivo contém apenas mocks - não executa testes
 */

// Mock para database service
export const mockDatabaseService = {
  // Connection management
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  isConnected: jest.fn().mockReturnValue(true),

  // CRUD operations
  create: jest.fn().mockImplementation((table: string, data: any) => ({
    id: `mock-id-${Date.now()}`,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),

  findById: jest.fn().mockImplementation((table: string, id: string) => ({
    id,
    name: `Mock ${table} ${id}`,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  })),

  findMany: jest.fn().mockImplementation((table: string, filters?: any) => [
    {
      id: "mock-id-1",
      name: `Mock ${table} 1`,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "mock-id-2",
      name: `Mock ${table} 2`,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),

  update: jest
    .fn()
    .mockImplementation((table: string, id: string, data: any) => ({
      id,
      ...data,
      updatedAt: new Date(),
    })),

  delete: jest.fn().mockImplementation((table: string, id: string) => ({
    id,
    deleted: true,
    deletedAt: new Date(),
  })),

  // Query operations
  query: jest.fn().mockImplementation((sql: string, params?: any[]) => ({
    rows: [
      { id: 1, result: "mock result 1" },
      { id: 2, result: "mock result 2" },
    ],
    rowCount: 2,
  })),

  transaction: jest.fn().mockImplementation(async (callback: Function) => {
    return await callback({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      commit: jest.fn().mockResolvedValue(true),
      rollback: jest.fn().mockResolvedValue(true),
    });
  }),
};

// Mock para cache service (Redis)
export const mockCacheService = {
  // Basic operations
  get: jest.fn().mockImplementation((key: string) => {
    const mockData: Record<string, any> = {
      "session:user-1": { userId: "user-1", sessionId: "session-123" },
      "instance:test-instance": { id: "test-instance", status: "connected" },
      "config:app": { maxInstances: 10, timeout: 30000 },
    };
    return mockData[key] || null;
  }),

  set: jest.fn().mockImplementation((key: string, value: any, ttl?: number) => {
    return Promise.resolve("OK");
  }),

  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(1),

  // Hash operations
  hget: jest.fn().mockResolvedValue("mock-hash-value"),
  hset: jest.fn().mockResolvedValue(1),
  hdel: jest.fn().mockResolvedValue(1),
  hgetall: jest.fn().mockResolvedValue({
    field1: "value1",
    field2: "value2",
  }),

  // List operations
  lpush: jest.fn().mockResolvedValue(1),
  rpop: jest.fn().mockResolvedValue("mock-list-item"),
  lrange: jest.fn().mockResolvedValue(["item1", "item2", "item3"]),

  // Set operations
  sadd: jest.fn().mockResolvedValue(1),
  smembers: jest.fn().mockResolvedValue(["member1", "member2"]),
  sismember: jest.fn().mockResolvedValue(1),

  // Utility
  flushall: jest.fn().mockResolvedValue("OK"),
  keys: jest.fn().mockResolvedValue(["key1", "key2", "key3"]),
  ttl: jest.fn().mockResolvedValue(3600),
  expire: jest.fn().mockResolvedValue(1),
};

// Mock para file storage service
export const mockFileStorageService = {
  // File operations
  upload: jest.fn().mockImplementation((file: any, path?: string) => ({
    success: true,
    fileId: `file-${Date.now()}`,
    path: path || `/uploads/${file.name}`,
    url: `https://mock-storage.com/uploads/${file.name}`,
    size: file.size || 1024,
    mimeType: file.type || "application/octet-stream",
  })),

  download: jest.fn().mockImplementation((fileId: string) => ({
    success: true,
    fileId,
    buffer: Buffer.from("mock file content"),
    metadata: {
      name: `file-${fileId}.txt`,
      size: 1024,
      mimeType: "text/plain",
    },
  })),

  delete: jest.fn().mockImplementation((fileId: string) => ({
    success: true,
    fileId,
    deleted: true,
  })),

  exists: jest.fn().mockReturnValue(true),

  getMetadata: jest.fn().mockImplementation((fileId: string) => ({
    fileId,
    name: `file-${fileId}.txt`,
    size: 1024,
    mimeType: "text/plain",
    createdAt: new Date(),
    updatedAt: new Date(),
  })),

  // Directory operations
  listFiles: jest.fn().mockImplementation((path?: string) => [
    {
      fileId: "file-1",
      name: "document1.pdf",
      size: 2048,
      mimeType: "application/pdf",
      createdAt: new Date(),
    },
    {
      fileId: "file-2",
      name: "image1.jpg",
      size: 1536,
      mimeType: "image/jpeg",
      createdAt: new Date(),
    },
  ]),

  createDirectory: jest.fn().mockImplementation((path: string) => ({
    success: true,
    path,
    created: true,
  })),

  deleteDirectory: jest.fn().mockImplementation((path: string) => ({
    success: true,
    path,
    deleted: true,
  })),
};

// Mock para session service
export const mockSessionService = {
  create: jest.fn().mockImplementation((userId: string, sessionData?: any) => ({
    sessionId: `session-${Date.now()}`,
    userId,
    data: sessionData || {},
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000), // 1 hour
  })),

  get: jest.fn().mockImplementation((sessionId: string) => ({
    sessionId,
    userId: "mock-user-id",
    data: { lastActivity: new Date() },
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
  })),

  update: jest.fn().mockImplementation((sessionId: string, data: any) => ({
    sessionId,
    data,
    updatedAt: new Date(),
  })),

  destroy: jest.fn().mockImplementation((sessionId: string) => ({
    sessionId,
    destroyed: true,
  })),

  cleanup: jest.fn().mockImplementation(() => ({
    cleaned: 5,
    timestamp: new Date(),
  })),

  isValid: jest.fn().mockReturnValue(true),
  extend: jest
    .fn()
    .mockImplementation((sessionId: string, duration?: number) => ({
      sessionId,
      expiresAt: new Date(Date.now() + (duration || 3600000)),
    })),
};

// Export principal
export const mockStorageServices = {
  database: mockDatabaseService,
  cache: mockCacheService,
  fileStorage: mockFileStorageService,
  session: mockSessionService,

  // Reset function
  __resetAll: jest.fn().mockImplementation(() => {
    Object.values(mockDatabaseService).forEach((mock) => {
      if (typeof mock === "function" && mock.mockClear) {
        mock.mockClear();
      }
    });

    Object.values(mockCacheService).forEach((mock) => {
      if (typeof mock === "function" && mock.mockClear) {
        mock.mockClear();
      }
    });

    Object.values(mockFileStorageService).forEach((mock) => {
      if (typeof mock === "function" && mock.mockClear) {
        mock.mockClear();
      }
    });

    Object.values(mockSessionService).forEach((mock) => {
      if (typeof mock === "function" && mock.mockClear) {
        mock.mockClear();
      }
    });
  }),
};

export default mockStorageServices;
