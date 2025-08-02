import { Router } from 'express'
import { BackupService, BackupConfig } from '../services/BackupService'
import { authMiddleware } from '../middleware/securityMiddleware'
import { rateLimiter } from '../middleware/rateLimiter'
import { enhancedLogger } from '../config/enhanced-logger'
import path from 'path'
import { z } from 'zod'

// Schema de validação para criação de backup
const createBackupSchema = z.object({
  sources: z.array(z.string()).min(1, 'Pelo menos uma fonte deve ser especificada'),
  type: z.enum(['full', 'incremental', 'differential']).default('full'),
  tags: z.record(z.string()).optional()
})

// Schema de validação para restauração
const restoreBackupSchema = z.object({
  backupId: z.string().min(1, 'ID do backup é obrigatório'),
  targetPath: z.string().optional(),
  overwrite: z.boolean().default(false),
  selectiveRestore: z.array(z.string()).optional(),
  dryRun: z.boolean().default(false)
})

// Schema de validação para filtros de listagem
const listBackupsSchema = z.object({
  type: z.enum(['full', 'incremental', 'differential']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  tags: z.record(z.string()).optional()
})

const router = Router()

// Configuração padrão do backup
const defaultBackupConfig: BackupConfig = {
  enabled: true,
  schedule: '0 2 * * *', // Todo dia às 2:00
  retention: {
    daily: 7,    // 7 dias
    weekly: 4,   // 4 semanas
    monthly: 12  // 12 meses
  },
  compression: true,
  storage: {
    local: {
      enabled: true,
      path: path.join(process.cwd(), 'backups')
    }
  }
}

// Inicializar serviço de backup
const backupService = new BackupService(defaultBackupConfig)

// Aplicar middleware de autenticação e rate limiting a todas as rotas
router.use(authMiddleware)
router.use(rateLimiter)

/**
 * @swagger
 * /backup/create:
 *   post:
 *     summary: Criar novo backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sources
 *             properties:
 *               sources:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Caminhos dos arquivos/diretórios para backup
 *               type:
 *                 type: string
 *                 enum: [full, incremental, differential]
 *                 default: full
 *               tags:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 description: Tags para organização do backup
 *     responses:
 *       201:
 *         description: Backup criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/create', async (req, res) => {
  try {
    // Validar entrada
    const validatedData = createBackupSchema.parse(req.body)
    
    // Criar backup
    const metadata = await backupService.createBackup(
      validatedData.sources,
      validatedData.type,
      validatedData.tags
    )

    enhancedLogger.audit('backup_created', (req as any).user?.userId?.toString(), {
      backupId: metadata.id,
      sources: validatedData.sources,
      type: validatedData.type
    })

    res.status(201).json({
      success: true,
      message: 'Backup criado com sucesso',
      data: metadata
    })
  } catch (error) {
    const backupError = error instanceof Error ? error : new Error('Erro ao criar backup')
    enhancedLogger.error(backupError, { 
      context: 'Erro ao criar backup',
      userId: (req as any).user?.userId,
      error: error 
    })
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      })
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
})

/**
 * @swagger
 * /backup/restore:
 *   post:
 *     summary: Restaurar backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - backupId
 *             properties:
 *               backupId:
 *                 type: string
 *                 description: ID do backup a ser restaurado
 *               targetPath:
 *                 type: string
 *                 description: Caminho de destino para restauração
 *               overwrite:
 *                 type: boolean
 *                 default: false
 *                 description: Sobrescrever arquivos existentes
 *               selectiveRestore:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Arquivos específicos para restaurar
 *               dryRun:
 *                 type: boolean
 *                 default: false
 *                 description: Simular restauração sem executar
 *     responses:
 *       200:
 *         description: Restauração concluída com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Backup não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/restore', async (req, res) => {
  try {
    // Validar entrada
    const validatedData = restoreBackupSchema.parse(req.body)
    
    // Restaurar backup
    await backupService.restoreBackup(validatedData)

    enhancedLogger.audit('backup_restored', (req as any).user?.userId?.toString(), {
      backupId: validatedData.backupId,
      targetPath: validatedData.targetPath,
      dryRun: validatedData.dryRun
    })

    res.json({
      success: true,
      message: validatedData.dryRun 
        ? 'Simulação de restauração concluída' 
        : 'Restauração concluída com sucesso'
    })
  } catch (error) {
    const restoreError = error instanceof Error ? error : new Error('Erro ao restaurar backup')
    enhancedLogger.error(restoreError, { 
      context: 'Erro ao restaurar backup',
      userId: (req as any).user?.userId,
      error: error 
    })
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      })
    }

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    if (errorMessage.includes('não encontrado')) {
      return res.status(404).json({
        success: false,
        message: errorMessage
      })
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
})

/**
 * @swagger
 * /backup/list:
 *   get:
 *     summary: Listar backups
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [full, incremental, differential]
 *         description: Filtrar por tipo de backup
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data inicial para filtro
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data final para filtro
 *     responses:
 *       200:
 *         description: Lista de backups
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/list', async (req, res) => {
  try {
    // Validar query parameters
    const filters = listBackupsSchema.parse(req.query)
    
    // Converter strings de data para Date objects
    const processedFilters: {
      type?: string;
      dateFrom?: Date;
      dateTo?: Date;
      tags?: Record<string, string>;
    } = {
      type: filters.type,
      tags: filters.tags
    }
    
    if (filters.dateFrom) {
      processedFilters.dateFrom = new Date(filters.dateFrom)
    }
    
    if (filters.dateTo) {
      processedFilters.dateTo = new Date(filters.dateTo)
    }
    
    // Listar backups
    const backups = await backupService.listBackups(processedFilters)

    res.json({
      success: true,
      data: backups,
      count: backups.length
    })
  } catch (error) {
    const listError = error instanceof Error ? error : new Error('Erro ao listar backups')
    enhancedLogger.error(listError, { 
      context: 'Erro ao listar backups',
      userId: (req as any).user?.userId,
      error: error 
    })
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros inválidos',
        errors: error.errors
      })
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
})

/**
 * @swagger
 * /backup/status:
 *   get:
 *     summary: Obter status do sistema de backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status do sistema de backup
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/status', async (req, res) => {
  try {
    const status = await backupService.getBackupStatus()

    res.json({
      success: true,
      data: status
    })
  } catch (error) {
    const statusError = error instanceof Error ? error : new Error('Erro ao obter status do backup')
    enhancedLogger.error(statusError, { 
      context: 'Erro ao obter status do backup',
      userId: (req as any).user?.userId,
      error: error 
    })
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
})

/**
 * @swagger
 * /backup/verify/{backupId}:
 *   get:
 *     summary: Verificar integridade de backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: backupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do backup a ser verificado
 *     responses:
 *       200:
 *         description: Resultado da verificação
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Backup não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/verify/:backupId', async (req, res) => {
  try {
    const { backupId } = req.params
    
    if (!backupId) {
      return res.status(400).json({
        success: false,
        message: 'ID do backup é obrigatório'
      })
    }

    const verification = await backupService.verifyBackup(backupId)

    enhancedLogger.audit('backup_verified', (req as any).user?.userId?.toString(), {
      backupId,
      valid: verification.valid,
      issues: verification.issues.length
    })

    res.json({
      success: true,
      data: verification
    })
  } catch (error) {
    const verifyError = error instanceof Error ? error : new Error('Erro ao verificar backup')
    enhancedLogger.error(verifyError, { 
      context: 'Erro ao verificar backup',
      userId: (req as any).user?.userId,
      error: error 
    })
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
})

/**
 * @swagger
 * /backup/delete/{backupId}:
 *   delete:
 *     summary: Excluir backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: backupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do backup a ser excluído
 *     responses:
 *       200:
 *         description: Backup excluído com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Backup não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/delete/:backupId', async (req, res) => {
  try {
    const { backupId } = req.params
    
    if (!backupId) {
      return res.status(400).json({
        success: false,
        message: 'ID do backup é obrigatório'
      })
    }

    await backupService.deleteBackup(backupId)

    enhancedLogger.audit('backup_deleted', (req as any).user?.userId?.toString(), {
      backupId
    })

    res.json({
      success: true,
      message: 'Backup excluído com sucesso'
    })
  } catch (error) {
    const deleteError = error instanceof Error ? error : new Error('Erro ao excluir backup')
    enhancedLogger.error(deleteError, { 
      context: 'Erro ao excluir backup',
      userId: (req as any).user?.userId,
      error: error 
    })
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    if (errorMessage.includes('não encontrado')) {
      return res.status(404).json({
        success: false,
        message: errorMessage
      })
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
})

export default router
