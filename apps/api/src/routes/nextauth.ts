import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Rota para autenticação OAuth do NextAuth
router.post('/oauth', AuthController.oauth);

// Rota para verificar/validar usuário para NextAuth
router.get('/me', authenticateToken, AuthController.me);

// Rota para login tradicional (caso NextAuth precise)
router.post('/login', AuthController.login);

// Rota para registro tradicional (caso NextAuth precise)
router.post('/register', AuthController.register);

// Rota para atualizar perfil
router.put('/update-profile', AuthController.updateProfile);

export default router;
