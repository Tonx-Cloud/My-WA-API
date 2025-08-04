import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_SIZE_IN_HOURS = 1; // Reduzir janela para 1 hora
const MAX_WINDOW_REQUEST_COUNT = 1000; // Aumentar limite para desenvolvimento
const WINDOW_LOG_INTERVAL_IN_HOURS = 1;

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Usar IP como identificador
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';

    const now = Date.now();
    const windowStart = now - WINDOW_SIZE_IN_HOURS * 60 * 60 * 1000;

    // Verificar se o cliente existe no store
    if (!store[clientId]) {
      store[clientId] = {
        count: 0,
        resetTime: now + WINDOW_SIZE_IN_HOURS * 60 * 60 * 1000,
      };
    }

    const clientData = store[clientId];

    // Reset do contador se a janela expirou
    if (now > clientData.resetTime) {
      clientData.count = 0;
      clientData.resetTime = now + WINDOW_SIZE_IN_HOURS * 60 * 60 * 1000;
    }

    // Incrementar contador
    clientData.count++;

    // Verificar limite
    if (clientData.count > MAX_WINDOW_REQUEST_COUNT) {
      return res.status(429).json({
        success: false,
        error: 'Muitas requisiÃ§Ãµes. Tente novamente mais tarde.',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
    }

    // Adicionar headers de rate limit
    res.set({
      'X-RateLimit-Limit': MAX_WINDOW_REQUEST_COUNT.toString(),
      'X-RateLimit-Remaining': (MAX_WINDOW_REQUEST_COUNT - clientData.count).toString(),
      'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString(),
    });

    next();
  } catch (error) {
    // Em caso de erro, permitir a requisiÃ§Ã£o
    next();
  }
};
