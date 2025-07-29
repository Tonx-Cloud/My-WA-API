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
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Token de acesso requerido'
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    (req as any).user = decoded;
    next();
  } catch (error) {
    logger.error('Token inválido:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expirado'
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Token inválido'
      });
    }
    
    return res.status(401).json({
      error: 'Falha na autenticação'
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
    // Token inválido ou expirado, mas não vamos bloquear a requisição
    logger.warn('Token opcional inválido:', error);
    next();
  }
}
