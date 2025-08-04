import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';

interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  // Em desenvolvimento, permitir acesso sem token para facilitar testes
  if (process.env.NODE_ENV === 'development') {
    // Simular usuÃ¡rio de desenvolvimento
    (req as any).user = {
      userId: 1,
      email: 'dev@example.com',
    };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Token de acesso requerido',
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret) as JWTPayload;

    (req as any).user = decoded;
    next();
  } catch (error) {
    logger.error('Token invÃ¡lido:', error);

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expirado',
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Token invÃ¡lido',
      });
    }

    return res.status(401).json({
      error: 'Falha na autenticaÃ§Ã£o',
    });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret) as JWTPayload;

    (req as any).user = decoded;
    next();
  } catch (error) {
    // Token invÃ¡lido ou expirado, mas nÃ£o vamos bloquear a requisiÃ§Ã£o
    logger.warn('Token opcional invÃ¡lido:', error);
    next();
  }
}
