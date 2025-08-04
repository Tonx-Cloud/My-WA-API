/**
 * Middleware de Limitação de Instâncias
 * Controla o número máximo de instâncias WhatsApp
 */

const rateLimit = require("express-rate-limit");

// Limitador de criação de instâncias por IP
const createInstanceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // 3 instâncias por IP a cada 15 minutos
  message: {
    error:
      "Limite de criação de instâncias atingido. Tente novamente mais tarde.",
    retryAfter: "15 minutos",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Pular limitação para usuários admin
    return req.user?.role === "admin";
  },
  keyGenerator: (req) => {
    // Usar user ID se autenticado, senão IP
    return req.user?.id || req.ip;
  },
});

// Limitador total de instâncias
const totalInstancesLimiter = async (req, res, next) => {
  try {
    // Simular contagem de instâncias (substituir pela lógica real)
    const currentInstances = 0; // TODO: Implementar contagem real
    const maxInstances = parseInt(process.env.MAX_INSTANCES) || 10;

    if (currentInstances >= maxInstances) {
      console.warn(
        `Limite total de instâncias atingido: ${currentInstances}/${maxInstances}`,
      );
      return res.status(429).json({
        error: "Número máximo de instâncias atingido",
        current: currentInstances,
        max: maxInstances,
        suggestion:
          "Remova instâncias inativas ou aguarde liberação automática",
      });
    }

    // Adicionar informações ao request
    req.instanceLimits = {
      current: currentInstances,
      max: maxInstances,
      available: maxInstances - currentInstances,
    };

    next();
  } catch (error) {
    console.error("Erro ao verificar limite de instâncias:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
      message: "Não foi possível verificar limites de instância",
    });
  }
};

// Monitor de memória
const memoryMonitor = (req, res, next) => {
  const used = process.memoryUsage();
  const memoryLimitMB = parseInt(process.env.MEMORY_LIMIT_MB) || 512;
  const memoryLimitBytes = memoryLimitMB * 1024 * 1024;

  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);

  // Log uso de memória se alto
  if (used.heapUsed > memoryLimitBytes * 0.8) {
    console.warn("⚠️ Uso de memória elevado:", {
      heapUsed: `${heapUsedMB}MB`,
      heapTotal: `${heapTotalMB}MB`,
      limit: `${memoryLimitMB}MB`,
      percentage: `${Math.round((used.heapUsed / memoryLimitBytes) * 100)}%`,
    });
  }

  // Adicionar informações de memória ao response headers
  res.set({
    "X-Memory-Used": `${heapUsedMB}MB`,
    "X-Memory-Total": `${heapTotalMB}MB`,
    "X-Memory-Limit": `${memoryLimitMB}MB`,
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

  // Rejeitar request se memória crítica
  if (used.heapUsed > memoryLimitBytes) {
    console.error("❌ Memória crítica atingida, rejeitando request");
    return res.status(503).json({
      error: "Servidor sobrecarregado",
      message: "Memória insuficiente para processar request",
      memoryUsage: `${heapUsedMB}MB/${memoryLimitMB}MB`,
    });
  }

  next();
};

// Middleware de limpeza automática
const autoCleanupMiddleware = async (req, res, next) => {
  try {
    // Executar limpeza periodicamente (a cada 100 requests)
    if (Math.random() < 0.01) {
      // 1% chance
      console.log("🧹 Executando limpeza automática...");

      // Forçar garbage collection se disponível
      if (global.gc) {
        global.gc();
        console.log("♻️ Garbage collection executado");
      }

      // TODO: Adicionar limpeza de instâncias inativas
      // TODO: Adicionar limpeza de sessões expiradas
      // TODO: Adicionar limpeza de logs antigos
    }

    next();
  } catch (error) {
    console.error("Erro na limpeza automática:", error);
    next(); // Continuar mesmo com erro na limpeza
  }
};

// Middleware combinado para todas as limitações
const instanceLimitationMiddleware = [
  memoryMonitor,
  totalInstancesLimiter,
  autoCleanupMiddleware,
];

// Middleware específico para criação de instâncias
const createInstanceMiddleware = [
  createInstanceLimiter,
  ...instanceLimitationMiddleware,
];

module.exports = {
  createInstanceLimiter,
  totalInstancesLimiter,
  memoryMonitor,
  autoCleanupMiddleware,
  instanceLimitationMiddleware,
  createInstanceMiddleware,
};
