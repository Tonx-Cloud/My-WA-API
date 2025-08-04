/**
 * Logger utilitário para importações em utils/
 * Re-exporta o logger principal do config/
 */

import configLogger from "../config/logger";

// Logger básico para compatibilidade
export const logger = {
  info: (message: string, meta?: any) => configLogger.info(message, meta),
  error: (message: string, meta?: any) => configLogger.error(message, meta),
  warn: (message: string, meta?: any) => configLogger.warn(message, meta),
  debug: (message: string, meta?: any) => configLogger.debug(message, meta),
  verbose: (message: string, meta?: any) => configLogger.verbose(message, meta),
};

// Exportações específicas para compatibilidade
export const logInfo = logger.info;
export const logError = logger.error;
export const logWarn = logger.warn;
export const logDebug = logger.debug;

export default logger;
