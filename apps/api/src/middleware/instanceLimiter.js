﻿/**
 * Middleware de LimitaÃ§Ã£o de InstÃ¢ncias
 * Controla o nÃºmero mÃ¡ximo de instÃ¢ncias WhatsApp
 */

const rateLimit = require('express-rate-limit');

// Limitador de criaÃ§Ã£o de instÃ¢ncias por IP
const createInstanceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // 3 instÃ¢ncias por IP a cada 15 minutos
  message: {
    error: 'Limite de criaÃ§Ã£o de instÃ¢ncias atingido. Tente novamente mais tarde.',
    retryAfter: '15 minutos',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => {
    // Pular limitaÃ§Ã£o para usuÃ¡rios admin
    return req.user?.role === 'admin';
  },
  keyGenerator: req => {
    // Usar user ID se autenticado, senÃ£o IP
    return req.user?.id || req.ip;
  },
});

// Limitador total de instÃ¢ncias
const totalInstancesLimiter = async (req, res, next) => {
  try {
    // Simular contagem de instÃ¢ncias (substituir pela lÃ³gica real)
    const currentInstances = 0; // TODO: Implementar contagem real
    const maxInstances = parseInt(process.env.MAX_INSTANCES) || 10;

    if (currentInstances >= maxInstances) {
      console.warn(`Limite total de instÃ¢ncias atingido: ${currentInstances}/${maxInstances}`);
      return res.status(429).json({
        error: 'NÃºmero mÃ¡ximo de instÃ¢ncias atingido',
        current: currentInstances,
        max: maxInstances,
        suggestion: 'Remova instÃ¢ncias inativas ou aguarde liberaÃ§Ã£o automÃ¡tica',
      });
    }

    // Adicionar informaÃ§Ãµes ao request
    req.instanceLimits = {
      current: currentInstances,
      max: maxInstances,
      available: maxInstances - currentInstances,
    };

    next();
  } catch (error) {
    console.error('Erro ao verificar limite de instÃ¢ncias:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'NÃ£o foi possÃ­vel verificar limites de instÃ¢ncia',
    });
  }
};

// Monitor de memÃ³ria
const memoryMonitor = (req, res, next) => {
  const used = process.memoryUsage();
  const memoryLimitMB = parseInt(process.env.MEMORY_LIMIT_MB) || 512;
  const memoryLimitBytes = memoryLimitMB * 1024 * 1024;

  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);

  // Log uso de memÃ³ria se alto
  if (used.heapUsed > memoryLimitBytes * 0.8) {
    console.warn('âš ï¸ Uso de memÃ³ria elevado:', {
      heapUsed: `${heapUsedMB}MB`,
      heapTotal: `${heapTotalMB}MB`,
      limit: `${memoryLimitMB}MB`,
      percentage: `${Math.round((used.heapUsed / memoryLimitBytes) * 100)}%`,
    });
  }

  // Adicionar informaÃ§Ãµes de memÃ³ria ao response headers
  res.set({
    'X-Memory-Used': `${heapUsedMB}MB`,
    'X-Memory-Total': `${heapTotalMB}MB`,
    'X-Memory-Limit': `${memoryLimitMB}MB`,
  });

  // Adicionar ao request para uso posterior
  req.memoryUsage = {
    heapUsed: used.heapUsed,
    heapTotal: used.heapTotal,
    heapUsedMB,
    heapTotalMB,
    limitMB: memoryLimitMB,
    percentage: Math.round((used.heapUsed / memoryLimitBytes) * 100),
  };

  // Rejeitar request se memÃ³ria crÃ­tica
  if (used.heapUsed > memoryLimitBytes) {
    console.error('âŒ MemÃ³ria crÃ­tica atingida, rejeitando request');
    return res.status(503).json({
      error: 'Servidor sobrecarregado',
      message: 'MemÃ³ria insuficiente para processar request',
      memoryUsage: `${heapUsedMB}MB/${memoryLimitMB}MB`,
    });
  }

  next();
};

// Middleware de limpeza automÃ¡tica
const autoCleanupMiddleware = async (req, res, next) => {
  try {
    // Executar limpeza periodicamente (a cada 100 requests)
    if (Math.random() < 0.01) {
      // 1% chance
      console.log('ðŸ§¹ Executando limpeza automÃ¡tica...');

      // ForÃ§ar garbage collection se disponÃ­vel
      if (global.gc) {
        global.gc();
        console.log('â™»ï¸ Garbage collection executado');
      }

      // TODO: Adicionar limpeza de instÃ¢ncias inativas
      // TODO: Adicionar limpeza de sessÃµes expiradas
      // TODO: Adicionar limpeza de logs antigos
    }

    next();
  } catch (error) {
    console.error('Erro na limpeza automÃ¡tica:', error);
    next(); // Continuar mesmo com erro na limpeza
  }
};

// Middleware combinado para todas as limitaÃ§Ãµes
const instanceLimitationMiddleware = [memoryMonitor, totalInstancesLimiter, autoCleanupMiddleware];

// Middleware especÃ­fico para criaÃ§Ã£o de instÃ¢ncias
const createInstanceMiddleware = [createInstanceLimiter, ...instanceLimitationMiddleware];

module.exports = {
  createInstanceLimiter,
  totalInstancesLimiter,
  memoryMonitor,
  autoCleanupMiddleware,
  instanceLimitationMiddleware,
  createInstanceMiddleware,
};
