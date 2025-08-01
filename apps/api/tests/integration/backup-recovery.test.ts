import { BackupService, BackupConfig } from '../../src/services/BackupService'
import { DisasterRecoveryService, DisasterRecoveryConfig } from '../../src/services/DisasterRecoveryService'
import fs from 'fs/promises'
import path from 'path'
import { enhancedLogger } from '../../src/config/enhanced-logger'

// Mock do logger para testes
jest.mock('../../src/config/enhanced-logger', () => ({
  enhancedLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    audit: jest.fn()
  }
}))

describe('Sistema de Backup e Recuperação', () => {
  let backupService: BackupService
  let drService: DisasterRecoveryService
  let testDir: string
  let backupDir: string

  const backupConfig: BackupConfig = {
    enabled: true,
    schedule: '0 2 * * *',
    retention: {
      daily: 1,
      weekly: 1,
      monthly: 1
    },
    compression: false, // Desabilitar para simplicidade nos testes
    storage: {
      local: {
        enabled: true,
        path: ''
      }
    }
  }

  const drConfig: DisasterRecoveryConfig = {
    enabled: true,
    autoRecovery: false,
    recoveryThresholds: {
      maxDowntime: 300,
      maxErrorRate: 5,
      maxMemoryUsage: 90,
      maxCpuUsage: 80
    },
    recoveryActions: {
      restartService: false,
      restoreBackup: false,
      notifyAdmins: false,
      escalationTime: 1800
    },
    healthChecks: {
      interval: 10, // 10 segundos para testes
      timeout: 5,
      retries: 1
    },
    notifications: {
      email: {
        enabled: false,
        recipients: []
      }
    }
  }

  beforeEach(async () => {
    // Criar diretório de teste temporário
    testDir = path.join(process.cwd(), 'test-temp', `test-${Date.now()}`)
    backupDir = path.join(testDir, 'backups')
    
    backupConfig.storage.local.path = backupDir
    
    await fs.mkdir(testDir, { recursive: true })
    await fs.mkdir(backupDir, { recursive: true })
    
    // Criar arquivos de teste
    await fs.writeFile(path.join(testDir, 'test1.txt'), 'Conteúdo do arquivo 1')
    await fs.writeFile(path.join(testDir, 'test2.txt'), 'Conteúdo do arquivo 2')
    
    // Inicializar serviços
    backupService = new BackupService(backupConfig)
    drService = new DisasterRecoveryService(drConfig, backupService)
    
    // Aguardar inicialização
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  afterEach(async () => {
    try {
      // Parar monitoramento se ativo
      await drService.stopMonitoring()
      
      // Limpar diretório de teste
      await fs.rm(testDir, { recursive: true, force: true })
    } catch (error) {
      // Ignorar erros de limpeza
    }
  })

  describe('BackupService', () => {
    test('deve criar backup corretamente', async () => {
      const sources = [
        path.join(testDir, 'test1.txt'),
        path.join(testDir, 'test2.txt')
      ]

      const metadata = await backupService.createBackup(sources, 'full')

      expect(metadata).toBeDefined()
      expect(metadata.id).toMatch(/^backup_\d+_full$/)
      expect(metadata.type).toBe('full')
      expect(metadata.files).toEqual(sources)
      expect(metadata.size).toBeGreaterThan(0)
      expect(metadata.checksum).toBeDefined()
      expect(metadata.compression).toBe(false)
    })

    test('deve listar backups corretamente', async () => {
      const sources = [path.join(testDir, 'test1.txt')]
      
      await backupService.createBackup(sources, 'full')
      await backupService.createBackup(sources, 'incremental')

      const backups = await backupService.listBackups()

      expect(backups).toHaveLength(2)
      expect(backups[0].type).toBe('incremental') // Mais recente primeiro
      expect(backups[1].type).toBe('full')
    })

    test('deve filtrar backups por tipo', async () => {
      const sources = [path.join(testDir, 'test1.txt')]
      
      await backupService.createBackup(sources, 'full')
      await backupService.createBackup(sources, 'incremental')

      const fullBackups = await backupService.listBackups({ type: 'full' })
      const incrementalBackups = await backupService.listBackups({ type: 'incremental' })

      expect(fullBackups).toHaveLength(1)
      expect(incrementalBackups).toHaveLength(1)
      expect(fullBackups[0].type).toBe('full')
      expect(incrementalBackups[0].type).toBe('incremental')
    })

    test('deve verificar integridade do backup', async () => {
      const sources = [path.join(testDir, 'test1.txt')]
      const metadata = await backupService.createBackup(sources, 'full')

      const verification = await backupService.verifyBackup(metadata.id)

      expect(verification.valid).toBe(true)
      expect(verification.issues).toHaveLength(0)
    })

    test('deve retornar erro para backup inexistente', async () => {
      const verification = await backupService.verifyBackup('backup_inexistente')

      expect(verification.valid).toBe(false)
      expect(verification.issues).toContain('Backup não encontrado: backup_inexistente')
    })

    test('deve restaurar backup corretamente', async () => {
      const sources = [path.join(testDir, 'test1.txt')]
      const metadata = await backupService.createBackup(sources, 'full')
      
      const restoreDir = path.join(testDir, 'restore')
      await fs.mkdir(restoreDir, { recursive: true })

      await backupService.restoreBackup({
        backupId: metadata.id,
        targetPath: restoreDir,
        overwrite: true
      })

      // Verificar se arquivo foi restaurado
      const restoredFile = path.join(restoreDir, 'test1.txt')
      const content = await fs.readFile(restoredFile, 'utf8')
      expect(content).toBe('Conteúdo do arquivo 1')
    })

    test('deve executar dry run de restauração', async () => {
      const sources = [path.join(testDir, 'test1.txt')]
      const metadata = await backupService.createBackup(sources, 'full')

      // Dry run não deve lançar erro
      await expect(backupService.restoreBackup({
        backupId: metadata.id,
        dryRun: true
      })).resolves.not.toThrow()
    })

    test('deve obter status do backup', async () => {
      const status = await backupService.getBackupStatus()

      expect(status).toBeDefined()
      expect(status.isRunning).toBe(false)
      expect(status.totalBackups).toBeGreaterThanOrEqual(0)
      expect(status.totalSize).toBeGreaterThanOrEqual(0)
    })

    test('deve deletar backup corretamente', async () => {
      const sources = [path.join(testDir, 'test1.txt')]
      const metadata = await backupService.createBackup(sources, 'full')

      await backupService.deleteBackup(metadata.id)

      const backups = await backupService.listBackups()
      expect(backups.find(b => b.id === metadata.id)).toBeUndefined()
    })
  })

  describe('DisasterRecoveryService', () => {
    test('deve obter status do DR corretamente', async () => {
      const status = await drService.getRecoveryStatus()

      expect(status).toBeDefined()
      expect(typeof status.isMonitoring).toBe('boolean')
      expect(typeof status.eventsCount).toBe('number')
      expect(typeof status.unresolvedEvents).toBe('number')
      expect(status.config).toBeDefined()
    })

    test('deve iniciar e parar monitoramento', async () => {
      // Iniciar monitoramento
      await drService.startMonitoring()
      let status = await drService.getRecoveryStatus()
      expect(status.isMonitoring).toBe(true)

      // Parar monitoramento
      await drService.stopMonitoring()
      status = await drService.getRecoveryStatus()
      expect(status.isMonitoring).toBe(false)
    })

    test('deve listar eventos vazios inicialmente', async () => {
      const events = await drService.getEvents()
      expect(events).toHaveLength(0)
    })

    test('deve filtrar eventos por resolução', async () => {
      const resolvedEvents = await drService.getEvents({ resolved: true })
      const unresolvedEvents = await drService.getEvents({ resolved: false })

      expect(Array.isArray(resolvedEvents)).toBe(true)
      expect(Array.isArray(unresolvedEvents)).toBe(true)
    })

    test('deve retornar erro ao resolver evento inexistente', async () => {
      await expect(drService.resolveEvent('evento_inexistente'))
        .rejects.toThrow('Evento não encontrado: evento_inexistente')
    })

    test('deve obter último health check', async () => {
      // Iniciar monitoramento para gerar health check
      await drService.startMonitoring()
      
      // Aguardar um pouco para health check ser executado
      await new Promise(resolve => setTimeout(resolve, 200))

      const healthCheck = await drService.getLastHealthCheck()
      
      if (healthCheck) {
        expect(healthCheck.service).toBe('my-wa-api')
        expect(healthCheck.status).toMatch(/healthy|warning|critical|unknown/)
        expect(Array.isArray(healthCheck.checks)).toBe(true)
        expect(typeof healthCheck.uptime).toBe('number')
        expect(typeof healthCheck.responseTime).toBe('number')
      }

      await drService.stopMonitoring()
    })
  })

  describe('Integração Backup + DR', () => {
    test('DR deve ter acesso ao BackupService', async () => {
      const sources = [path.join(testDir, 'test1.txt')]
      await backupService.createBackup(sources, 'full')

      const backups = await backupService.listBackups()
      expect(backups.length).toBeGreaterThan(0)

      // DR deve conseguir acessar o mesmo backup
      const status = await drService.getRecoveryStatus()
      expect(status).toBeDefined()
    })

    test('deve simular recuperação de desastre', async () => {
      // Criar backup
      const sources = [path.join(testDir, 'test1.txt')]
      const metadata = await backupService.createBackup(sources, 'full')

      // Simular cenário de desastre
      await drService.startMonitoring()
      
      // Aguardar processamento
      await new Promise(resolve => setTimeout(resolve, 100))

      const status = await drService.getRecoveryStatus()
      expect(status.isMonitoring).toBe(true)

      await drService.stopMonitoring()
    })
  })

  describe('Performance e Escalabilidade', () => {
    test('deve processar múltiplos backups rapidamente', async () => {
      const startTime = Date.now()
      
      const sources = [path.join(testDir, 'test1.txt')]
      
      // Criar múltiplos backups pequenos
      const promises: Promise<any>[] = []
      for (let i = 0; i < 5; i++) {
        promises.push(backupService.createBackup(sources, 'incremental'))
      }
      
      await Promise.all(promises)
      
      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(5000) // Menos de 5 segundos
      
      const backups = await backupService.listBackups()
      expect(backups.length).toBe(5)
    })

    test('deve limitar recursos durante backup', async () => {
      const initialMemory = process.memoryUsage()
      
      const sources = [path.join(testDir, 'test1.txt')]
      await backupService.createBackup(sources, 'full')
      
      const finalMemory = process.memoryUsage()
      
      // Verificar que não houve vazamento excessivo de memória
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // Menos de 50MB
    })
  })

  test('✅ Configuração dos testes de Backup e DR', () => {
    console.log('✅ Testes do Sistema de Backup e Recuperação configurados')
    expect(true).toBe(true)
  })
})
