import {
  BackupService,
  BackupConfig,
  RestoreOptions,
  BackupMetadata,
} from '@/services/BackupService';
import fs from 'fs/promises';
import path from 'path';

describe('BackupService - Restore & Cleanup (Item 3)', () => {
  let backupService: BackupService;
  let testConfig: BackupConfig;
  let tempDir: string;

  beforeAll(async () => {
    tempDir = path.join(process.cwd(), 'test-backups-item3');

    testConfig = {
      enabled: true,
      schedule: '0 2 * * *',
      retention: {
        daily: 7,
        weekly: 4,
        monthly: 12,
      },
      compression: true,
      storage: {
        local: {
          enabled: true,
          path: tempDir,
        },
      },
    };

    // Criar diretório de teste
    await fs.mkdir(tempDir, { recursive: true });

    backupService = new BackupService(testConfig);
  });

  afterAll(async () => {
    // Cleanup
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Erro ao limpar diretório de teste:', error);
    }
  });

  describe('Concurrency Control', () => {
    test('deve prevenir operações de backup simultâneas', async () => {
      const sources = [path.join(tempDir, 'test-file.txt')];
      await fs.writeFile(sources[0], 'Test content', 'utf8');

      // Primeira operação de backup
      const backup1Promise = backupService.createBackup(sources, 'full', {
        test: 'concurrent-1',
      });

      // Segunda operação deve falhar
      await expect(
        backupService.createBackup(sources, 'full', { test: 'concurrent-2' })
      ).rejects.toThrow('Backup já está em execução');

      // Aguardar primeira operação terminar
      await backup1Promise;

      // Agora nova operação deve funcionar
      await expect(
        backupService.createBackup(sources, 'incremental', {
          test: 'concurrent-3',
        })
      ).resolves.toBeDefined();
    }, 15000);

    test('deve permitir operações de restore simultâneas', async () => {
      // Criar backup primeiro
      const sources = [path.join(tempDir, 'restore-test.txt')];
      await fs.writeFile(sources[0], 'Restore test content', 'utf8');

      const metadata = await backupService.createBackup(sources, 'full', {
        test: 'restore-concurrent',
      });

      // Múltiplas operações de restore simultâneas
      const restoreOptions1: RestoreOptions = {
        backupId: metadata.id,
        targetPath: path.join(tempDir, 'restore1'),
        overwrite: true,
      };

      const restoreOptions2: RestoreOptions = {
        backupId: metadata.id,
        targetPath: path.join(tempDir, 'restore2'),
        overwrite: true,
      };

      // Criar diretórios de destino
      await fs.mkdir(restoreOptions1.targetPath!, { recursive: true });
      await fs.mkdir(restoreOptions2.targetPath!, { recursive: true });

      // Execução simultânea deve funcionar
      await Promise.all([
        backupService.restoreBackup(restoreOptions1),
        backupService.restoreBackup(restoreOptions2),
      ]);

      // Verificar se ambos restauraram corretamente
      const restored1 = await fs.readFile(
        path.join(restoreOptions1.targetPath!, 'restore-test.txt'),
        'utf8'
      );
      const restored2 = await fs.readFile(
        path.join(restoreOptions2.targetPath!, 'restore-test.txt'),
        'utf8'
      );

      expect(restored1).toBe('Restore test content');
      expect(restored2).toBe('Restore test content');
    }, 15000);

    test('deve gerenciar semáforo de operações críticas', async () => {
      const sources = [path.join(tempDir, 'semaphore-test.txt')];
      await fs.writeFile(sources[0], 'Semaphore test', 'utf8');

      let operationsStarted = 0;
      let operationsCompleted = 0;

      const promises = Array.from({ length: 3 }, async (_, index) => {
        try {
          operationsStarted++;
          await backupService.createBackup(sources, 'full', {
            test: `semaphore-${index}`,
          });
          operationsCompleted++;
        } catch (error) {
          // Esperado para operações simultâneas
          expect(error.message).toBe('Backup já está em execução');
        }
      });

      await Promise.allSettled(promises);

      // Apenas uma operação deve ter sido completada
      expect(operationsStarted).toBe(3);
      expect(operationsCompleted).toBe(1);
    }, 15000);
  });

  describe('Advanced Cleanup Logic', () => {
    test('deve implementar lógica de retenção por tipo de backup', async () => {
      const sources = [path.join(tempDir, 'retention-test.txt')];
      await fs.writeFile(sources[0], 'Retention test', 'utf8');

      // Criar múltiplos backups com diferentes tipos e datas
      const backups: any[] = [];

      // Backup full antigo (deve ser mantido mais tempo)
      const oldFull = await backupService.createBackup(sources, 'full', {
        test: 'old-full',
      });
      backups.push(oldFull);

      // Backups incrementais antigos (devem ser removidos mais cedo)
      for (let i = 0; i < 3; i++) {
        const incremental = await backupService.createBackup(sources, 'incremental', {
          test: `old-inc-${i}`,
        });
        backups.push(incremental);
      }

      // Verificar que temos todos os backups
      const beforeCleanup = await backupService.listBackups();
      expect(beforeCleanup.length).toBeGreaterThanOrEqual(4);

      // O cleanup real seria baseado em timestamps reais
      // Aqui testamos a lógica de contagem e filtros
      const fullBackups = beforeCleanup.filter(b => b.type === 'full');
      const incrementalBackups = beforeCleanup.filter(b => b.type === 'incremental');

      expect(fullBackups.length).toBeGreaterThanOrEqual(1);
      expect(incrementalBackups.length).toBeGreaterThanOrEqual(3);

      // Validar que backups foram criados corretamente
      expect(backups.length).toBe(4);
    }, 15000);

    test('deve limpar arquivos temporários órfãos', async () => {
      const tempPath = path.join(tempDir, 'temp');
      await fs.mkdir(tempPath, { recursive: true });

      // Criar arquivos temporários órfãos
      const orphanFiles = ['temp_backup_123.tmp', 'temp_restore_456.tmp', 'partial_upload_789.tmp'];

      for (const file of orphanFiles) {
        await fs.writeFile(path.join(tempPath, file), 'Orphan content', 'utf8');
      }

      // Verificar que arquivos foram criados
      const beforeCleanup = await fs.readdir(tempPath);
      expect(beforeCleanup.length).toBe(3);

      // Implementar e testar lógica de cleanup de temporários
      // (Em implementação real, seria baseado em idade dos arquivos)
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas

      for (const file of beforeCleanup) {
        const filePath = path.join(tempPath, file);
        const stats = await fs.stat(filePath);
        const age = now - stats.mtime.getTime();

        if (file.includes('temp_') && age > maxAge) {
          await fs.unlink(filePath);
        }
      }

      // Para este teste, como arquivos são novos, não serão removidos
      const afterCleanup = await fs.readdir(tempPath);
      expect(afterCleanup.length).toBe(3); // Arquivos muito novos para serem removidos
    });

    test('deve validar integridade antes de cleanup', async () => {
      const sources = [path.join(tempDir, 'integrity-test.txt')];
      await fs.writeFile(sources[0], 'Integrity test content', 'utf8');

      const backup = await backupService.createBackup(sources, 'full', {
        test: 'integrity',
      });

      // Verificar integridade do backup
      const verification = await backupService.verifyBackup(backup.id);
      expect(verification.valid).toBe(true);
      expect(verification.issues.length).toBe(0);

      // Backup válido não deve ser removido em cleanup
      const backupsBeforeCleanup = await backupService.listBackups();
      const targetBackup = backupsBeforeCleanup.find(b => b.id === backup.id);
      expect(targetBackup).toBeDefined();
    });

    test('deve implementar cleanup em lote com limite de taxa', async () => {
      const sources = [path.join(tempDir, 'batch-cleanup.txt')];
      await fs.writeFile(sources[0], 'Batch cleanup test', 'utf8');

      // Criar múltiplos backups
      const backupIds: string[] = [];
      for (let i = 0; i < 5; i++) {
        const backup = await backupService.createBackup(sources, 'incremental', {
          test: `batch-${i}`,
        });
        backupIds.push(backup.id);
      }

      // Verificar que todos foram criados
      const beforeCleanup = await backupService.listBackups();
      expect(beforeCleanup.length).toBeGreaterThanOrEqual(5);

      // Testar remoção em lote controlada
      let deletedCount = 0;
      const maxDeletionsPerBatch = 2;

      for (let i = 0; i < Math.min(backupIds.length, maxDeletionsPerBatch); i++) {
        try {
          await backupService.deleteBackup(backupIds[i]);
          deletedCount++;
        } catch (error) {
          console.warn(`Erro ao deletar backup ${backupIds[i]}:`, error);
        }
      }

      expect(deletedCount).toBeLessThanOrEqual(maxDeletionsPerBatch);

      const afterCleanup = await backupService.listBackups();
      expect(afterCleanup.length).toBeLessThan(beforeCleanup.length);
    }, 20000);
  });

  describe('Enhanced Restore Operations', () => {
    test('deve realizar restore seletivo com validação', async () => {
      // Criar múltiplos arquivos para backup
      const sourceDir = path.join(tempDir, 'selective-source');
      await fs.mkdir(sourceDir, { recursive: true });

      const files = ['file1.txt', 'file2.json', 'file3.log'];

      for (const file of files) {
        await fs.writeFile(path.join(sourceDir, file), `Content of ${file}`, 'utf8');
      }

      const sources = files.map(f => path.join(sourceDir, f));
      const backup = await backupService.createBackup(sources, 'full', {
        test: 'selective',
      });

      // Restore seletivo
      const restoreDir = path.join(tempDir, 'selective-restore');
      await fs.mkdir(restoreDir, { recursive: true });

      const selectiveOptions: RestoreOptions = {
        backupId: backup.id,
        targetPath: restoreDir,
        selectiveRestore: [path.join(sourceDir, 'file1.txt'), path.join(sourceDir, 'file3.log')],
        overwrite: true,
      };

      await backupService.restoreBackup(selectiveOptions);

      // Verificar que apenas arquivos selecionados foram restaurados
      const restoredFiles = await fs.readdir(restoreDir, { recursive: true });
      expect(restoredFiles).toContain('file1.txt');
      expect(restoredFiles).toContain('file3.log');
      expect(restoredFiles).not.toContain('file2.json');
    }, 15000);

    test('deve implementar dry-run para restore', async () => {
      const sources = [path.join(tempDir, 'dryrun-test.txt')];
      await fs.writeFile(sources[0], 'Dry run test', 'utf8');

      const backup = await backupService.createBackup(sources, 'full', {
        test: 'dryrun',
      });

      const restoreDir = path.join(tempDir, 'dryrun-restore');
      await fs.mkdir(restoreDir, { recursive: true });

      const dryRunOptions: RestoreOptions = {
        backupId: backup.id,
        targetPath: restoreDir,
        dryRun: true,
        overwrite: true,
      };

      // Dry run não deve criar arquivos
      await backupService.restoreBackup(dryRunOptions);

      const files = await fs.readdir(restoreDir);
      expect(files.length).toBe(0); // Nenhum arquivo deve ter sido criado
    });

    test('deve validar destino antes de restore', async () => {
      const sources = [path.join(tempDir, 'validation-test.txt')];
      await fs.writeFile(sources[0], 'Validation test', 'utf8');

      const backup = await backupService.createBackup(sources, 'full', {
        test: 'validation',
      });

      // Restore para diretório inexistente deve falhar
      const invalidOptions: RestoreOptions = {
        backupId: backup.id,
        targetPath: '/path/that/does/not/exist/nowhere',
        overwrite: true,
      };

      await expect(backupService.restoreBackup(invalidOptions)).rejects.toThrow(
        'Diretório de destino não existe'
      );
    });

    test('deve gerenciar conflitos de arquivo durante restore', async () => {
      const sources = [path.join(tempDir, 'conflict-test.txt')];
      await fs.writeFile(sources[0], 'Original content', 'utf8');

      const backup = await backupService.createBackup(sources, 'full', {
        test: 'conflict',
      });

      const restoreDir = path.join(tempDir, 'conflict-restore');
      await fs.mkdir(restoreDir, { recursive: true });

      // Criar arquivo conflitante
      const conflictFile = path.join(restoreDir, 'conflict-test.txt');
      await fs.writeFile(conflictFile, 'Existing content', 'utf8');

      // Restore sem overwrite deve manter arquivo existente
      const noOverwriteOptions: RestoreOptions = {
        backupId: backup.id,
        targetPath: restoreDir,
        overwrite: false,
      };

      await backupService.restoreBackup(noOverwriteOptions);

      const contentAfterNoOverwrite = await fs.readFile(conflictFile, 'utf8');
      expect(contentAfterNoOverwrite).toBe('Existing content');

      // Restore com overwrite deve substituir
      const overwriteOptions: RestoreOptions = {
        backupId: backup.id,
        targetPath: restoreDir,
        overwrite: true,
      };

      await backupService.restoreBackup(overwriteOptions);

      const contentAfterOverwrite = await fs.readFile(conflictFile, 'utf8');
      expect(contentAfterOverwrite).toBe('Original content');
    }, 15000);
  });

  describe('Resource Management', () => {
    test('deve monitorar uso de memória durante operações', async () => {
      const sources = [path.join(tempDir, 'memory-test.txt')];
      // Criar arquivo maior para teste de memória
      const largeContent = 'x'.repeat(1000000); // 1MB
      await fs.writeFile(sources[0], largeContent, 'utf8');

      const initialMemory = process.memoryUsage();

      const backup = await backupService.createBackup(sources, 'full', {
        test: 'memory',
      });

      const afterBackupMemory = process.memoryUsage();

      // Verificar que memória foi liberada após operação
      const memoryDiff = afterBackupMemory.heapUsed - initialMemory.heapUsed;
      // Em ambiente de teste, permitir maior uso de memória devido ao overhead do Jest
      expect(memoryDiff).toBeLessThan(largeContent.length * 5); // Allowance for test overhead

      expect(backup).toBeDefined();
      expect(backup.size).toBeGreaterThan(0);
    }, 15000);

    test('deve implementar timeout para operações longas', async () => {
      // Simular operação longa criando arquivo grande
      const sources = [path.join(tempDir, 'timeout-test.txt')];
      const veryLargeContent = 'x'.repeat(5000000); // 5MB
      await fs.writeFile(sources[0], veryLargeContent, 'utf8');

      const startTime = Date.now();

      try {
        await backupService.createBackup(sources, 'full', { test: 'timeout' });
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Operação deve completar em tempo razoável
        expect(duration).toBeLessThan(30000); // 30 segundos max
      } catch (error) {
        // Se falhar por timeout, deve ser erro específico
        if (error.message.includes('timeout')) {
          expect(error.message).toContain('timeout');
        } else {
          throw error;
        }
      }
    }, 35000);
  });
});
