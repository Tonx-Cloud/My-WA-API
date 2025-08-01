import { Request, Response, NextFunction } from 'express';
import { securityService } from '../services/SecurityService';
import { 
  validateCreateInstance, 
  validateUpdateInstance, 
  validateUserId, 
  validateInstanceId,
  validatePagination,
  validateAuthHeader
} from '../schemas/validation';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Tipos para requisições autenticadas
export interface AuthenticatedRequest extends Request {
  userId?: number;
  securityContext?: {
    ip: string;
    userAgent: string;
    fingerprint: string;
    isSecure: boolean;
  };
}

/**
 * Middleware principal de segurança
 */
export const securityMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    // Extrair contexto de segurança
    const securityContext = securityService.extractSecurityContext(req);
    req.securityContext = securityContext;

    // Verificar se IP está bloqueado
    if (securityService.isIPBlocked(securityContext.ip)) {
      securityService.recordSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS',
        severity: 'HIGH',
        ip: securityContext.ip,
        userAgent: securityContext.userAgent,
        timestamp: Date.now(),
        details: { reason: 'IP_BLOCKED', path: req.path }
      });

      res.status(403).json({
        success: false,
        error: 'Acesso bloqueado temporariamente'
      });
      return;
    }

    // Verificar rate limiting
    const rateLimitKey = `${securityContext.ip}:${securityContext.fingerprint}`;
    if (!securityService.checkRateLimit(rateLimitKey)) {
      res.status(429).json({
        success: false,
        error: 'Muitas requisições. Tente novamente em alguns minutos.'
      });
      return;
    }

    // Verificar origem (CORS manual se necessário)
    const origin = req.get('Origin');
    if (origin && !securityService.validateOrigin(origin)) {
      securityService.recordSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS',
        severity: 'MEDIUM',
        ip: securityContext.ip,
        timestamp: Date.now(),
        details: { reason: 'INVALID_ORIGIN', origin, path: req.path }
      });

      res.status(403).json({
        success: false,
        error: 'Origem não autorizada'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Erro no middleware de segurança:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno de segurança'
    });
  }
};

/**
 * Middleware de autenticação
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.get('Authorization');
    
    if (!authHeader) {
      securityService.recordSecurityEvent({
        type: 'FAILED_AUTH',
        severity: 'LOW',
        ip: req.securityContext?.ip || 'unknown',
        timestamp: Date.now(),
        details: { reason: 'MISSING_AUTH_HEADER', path: req.path }
      });

      res.status(401).json({
        success: false,
        error: 'Token de autenticação necessário'
      });
      return;
    }

    // Validar formato do header
    const headerValidation = validateAuthHeader(authHeader);
    if (!headerValidation.success) {
      securityService.recordSecurityEvent({
        type: 'FAILED_AUTH',
        severity: 'MEDIUM',
        ip: req.securityContext?.ip || 'unknown',
        timestamp: Date.now(),
        details: { 
          reason: 'INVALID_AUTH_FORMAT', 
          errors: headerValidation.error.errors,
          path: req.path 
        }
      });

      res.status(401).json({
        success: false,
        error: 'Formato de autenticação inválido',
        details: headerValidation.error.errors
      });
      return;
    }

    // Validar token
    const tokenValidation = securityService.validateAuthToken(authHeader);
    if (!tokenValidation.valid) {
      securityService.recordSecurityEvent({
        type: 'FAILED_AUTH',
        severity: 'MEDIUM',
        ip: req.securityContext?.ip || 'unknown',
        timestamp: Date.now(),
        details: { 
          reason: 'INVALID_TOKEN', 
          error: tokenValidation.error,
          path: req.path 
        }
      });

      res.status(401).json({
        success: false,
        error: tokenValidation.error || 'Token inválido'
      });
      return;
    }

    // Adicionar userId à requisição
    if (tokenValidation.userId !== undefined) {
      req.userId = tokenValidation.userId;
    }
    next();
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno de autenticação'
    });
  }
};

/**
 * Middleware de validação de entrada usando Zod
 */
export const validateInput = (schema: 'createInstance' | 'updateInstance' | 'userId' | 'instanceId' | 'pagination') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      let validation;

      switch (schema) {
        case 'createInstance': {
          validation = validateCreateInstance(req.body);
          break;
        }
        case 'updateInstance': {
          validation = validateUpdateInstance(req.body);
          break;
        }
        case 'userId': {
          const userIdParam = req.params.userId || req.body.userId || req.query.userId;
          validation = validateUserId(userIdParam ? parseInt(userIdParam as string, 10) : undefined);
          break;
        }
        case 'instanceId': {
          const instanceIdParam = req.params.id || req.params.instanceId || req.body.instanceId;
          validation = validateInstanceId(instanceIdParam);
          break;
        }
        case 'pagination': {
          validation = validatePagination({
            page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
          });
          break;
        }
        default:
          throw new Error(`Schema de validação desconhecido: ${schema}`);
      }

      if (!validation.success) {
        securityService.recordSecurityEvent({
          type: 'INVALID_INPUT',
          severity: 'LOW',
          ip: req.securityContext?.ip || 'unknown',
          ...(req.userId && { userId: req.userId }),
          timestamp: Date.now(),
          details: { 
            schema,
            errors: validation.error.errors,
            path: req.path,
            method: req.method
          }
        });

        res.status(400).json({
          success: false,
          error: 'Dados de entrada inválidos',
          details: validation.error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Erro na validação de entrada:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno na validação'
      });
    }
  };
};

/**
 * Middleware para sanitizar entradas de texto
 */
export const sanitizeInputs = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    // Sanitizar campos do body
    if (req.body && typeof req.body === 'object') {
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === 'string') {
          req.body[key] = securityService.sanitizeInput(value);
        }
      }
    }

    // Sanitizar query parameters
    if (req.query && typeof req.query === 'object') {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          req.query[key] = securityService.sanitizeInput(value);
        }
      }
    }

    next();
  } catch (error) {
    console.error('Erro na sanitização:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno na sanitização'
    });
  }
};

/**
 * Configuração do Helmet para cabeçalhos de segurança
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});

/**
 * Rate limiter configurável por endpoint
 */
export const createRateLimit = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: 'Muitas requisições. Tente novamente mais tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: AuthenticatedRequest, res: Response) => {
      securityService.recordSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'MEDIUM',
        ip: req.securityContext?.ip || req.ip || 'unknown',
        ...(req.userId && { userId: req.userId }),
        timestamp: Date.now(),
        details: { 
          path: req.path,
          method: req.method,
          limit: max,
          window: windowMs
        }
      });

      res.status(429).json({
        success: false,
        error: 'Limite de requisições excedido'
      });
    }
  });
};

// Rate limiters específicos para diferentes endpoints
export const authRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 tentativas por 15 min
export const apiRateLimit = createRateLimit(60 * 1000, 100); // 100 req por minuto
export const instanceRateLimit = createRateLimit(60 * 1000, 50); // 50 req por minuto
export const messageRateLimit = createRateLimit(60 * 1000, 200); // 200 msg por minuto
