import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Sistema de autenticaÃ§Ã£o
 */

// Rotas pÃºblicas
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/oauth', AuthController.oauth);
router.post('/forgot-password', AuthController.forgotPassword);

// Google OAuth Routes
router.get('/google', AuthController.googleAuth);
router.get('/google/callback', AuthController.googleCallback);

// Rotas protegidas
router.get('/me', authenticateToken, AuthController.me);

export default router;
