import { Router } from 'express';
import XAIController from '../controllers/xai.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /api/xai/chat:
 *   post:
 *     summary: Chat completion usando Grok
 *     tags: [XAI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [system, user, assistant]
 *                     content:
 *                       type: string
 *               options:
 *                 type: object
 *                 properties:
 *                   model:
 *                     type: string
 *                     default: grok-4
 *                   temperature:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 2
 *                   max_tokens:
 *                     type: integer
 *     responses:
 *       200:
 *         description: Resposta do chat
 *       400:
 *         description: Dados invÃ¡lidos
 *       401:
 *         description: NÃ£o autorizado
 *       500:
 *         description: Erro interno
 */
router.post('/chat', authenticateToken, XAIController.chatCompletion);

/**
 * @swagger
 * /api/xai/message:
 *   post:
 *     summary: Enviar mensagem simples para Grok
 *     tags: [XAI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               systemPrompt:
 *                 type: string
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Resposta da mensagem
 *       400:
 *         description: Dados invÃ¡lidos
 *       401:
 *         description: NÃ£o autorizado
 */
router.post('/message', authenticateToken, XAIController.sendMessage);

/**
 * @swagger
 * /api/xai/analyze:
 *   post:
 *     summary: Analisar texto usando Grok
 *     tags: [XAI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - analysisType
 *             properties:
 *               text:
 *                 type: string
 *               analysisType:
 *                 type: string
 *                 enum: [sentiment, summary, keywords, custom]
 *               customPrompt:
 *                 type: string
 *     responses:
 *       200:
 *         description: AnÃ¡lise do texto
 *       400:
 *         description: Dados invÃ¡lidos
 */
router.post('/analyze', authenticateToken, XAIController.analyzeText);

/**
 * @swagger
 * /api/xai/whatsapp/analyze:
 *   post:
 *     summary: Analisar mensagem do WhatsApp
 *     tags: [XAI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               contact:
 *                 type: string
 *     responses:
 *       200:
 *         description: AnÃ¡lise da mensagem
 */
router.post('/whatsapp/analyze', authenticateToken, XAIController.analyzeWhatsAppMessage);

/**
 * @swagger
 * /api/xai/test:
 *   get:
 *     summary: Testar conexÃ£o com XAI
 *     tags: [XAI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status da conexÃ£o
 */
router.get('/test', authenticateToken, XAIController.testConnection);

/**
 * @swagger
 * /api/xai/models:
 *   get:
 *     summary: Obter modelos disponÃ­veis
 *     tags: [XAI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de modelos
 */
router.get('/models', authenticateToken, XAIController.getModels);

export default router;
