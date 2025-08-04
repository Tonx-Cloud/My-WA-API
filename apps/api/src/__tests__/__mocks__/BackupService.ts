// Mock do módulo fs/promises para teste do BackupService
export const mockFs = {
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue("mock file content"),
  readdir: jest.fn().mockResolvedValue(["file1.txt", "file2.txt"]),
  stat: jest.fn().mockResolvedValue({
    isFile: () => true,
    isDirectory: () => false,
    size: 1024,
    mtime: new Date(),
  }),
  mkdir: jest.fn().mockResolvedValue(undefined),
  rm: jest.fn().mockResolvedValue(undefined),
  access: jest.fn().mockResolvedValue(undefined),
  copyFile: jest.fn().mockResolvedValue(undefined),
};

// Mock do módulo path
export const mockPath = {
  join: jest.fn((...args) => args.join("/")),
  dirname: jest.fn((p) => p.split("/").slice(0, -1).join("/")),
  basename: jest.fn((p) => p.split("/").pop()),
  resolve: jest.fn((...args) => "/" + args.join("/")),
};

/**
 * Mock completo para BackupService
 * @fileoverview Este arquivo contém apenas mocks - não executa testes
 */
export const mockBackupService = {
  createBackup: jest.fn().mockResolvedValue({
    id: `backup-${Date.now()}`,
    type: "full",
    sources: ["default-source"],
    timestamp: new Date().toISOString(),
    size: 1024 * 1024, // 1MB
    status: "completed",
    checksum: "mock-checksum-hash",
  }),

  listBackups: jest.fn().mockResolvedValue([
    {
      id: "backup-1",
      type: "full",
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      size: 2048 * 1024,
      status: "completed",
    },
    {
      id: "backup-2",
      type: "incremental",
      timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
      size: 512 * 1024,
      status: "completed",
    },
  ]),

  verifyBackup: jest.fn().mockResolvedValue({
    valid: true,
    errors: [],
    checksum: "mock-checksum-hash",
    files: ["file1.txt", "file2.txt"],
    size: 1024 * 1024,
  }),

  restoreBackup: jest.fn().mockResolvedValue({
    success: true,
    restoredFiles: ["file1.txt", "file2.txt"],
    targetPath: "/mock/restore/path",
  }),

  deleteBackup: jest.fn().mockResolvedValue({
    success: true,
    deletedBackupId: "mock-backup-id",
  }),

  getBackupConfig: jest.fn().mockReturnValue({
    enabled: true,
    schedule: "0 2 * * *",
    retention: {
      daily: 7,
      weekly: 4,
      monthly: 12,
    },
    compression: true,
    storage: {
      local: {
        enabled: true,
        path: "/mock/backup/path",
      },
    },
  }),

  setBackupConfig: jest.fn().mockResolvedValue({
    success: true,
    config: {},
  }),

  // Método para resetar mocks
  __reset: jest.fn(),
};

// Mock do DisasterRecoveryService
export const mockDisasterRecoveryService = {
  startMonitoring: jest.fn().mockResolvedValue(undefined),
  stopMonitoring: jest.fn().mockResolvedValue(undefined),
  isMonitoring: jest.fn().mockReturnValue(false),

  getStatus: jest.fn().mockReturnValue({
    monitoring: false,
    lastCheck: new Date().toISOString(),
    health: "healthy",
    issues: [],
  }),

  triggerRecovery: jest.fn().mockResolvedValue({
    success: true,
    action: "restart",
    issue: "mock-issue",
    timestamp: new Date().toISOString(),
  }),

  __reset: jest.fn(),
};

export default {
  mockBackupService,
  mockDisasterRecoveryService,
  mockFs,
  mockPath,
};
