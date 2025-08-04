import { BaseService } from './BaseService';
import { Request } from 'express';
import crypto from 'crypto';
import { performance } from 'perf_hooks';

interface SecurityEvent {
  type:
    | 'FAILED_AUTH'
    | 'SUSPICIOUS_ACTIVITY'
    | 'RATE_LIMIT_EXCEEDED'
    | 'INVALID_INPUT'
    | 'UNAUTHORIZED_ACCESS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ip: string;
  userAgent?: string;
  userId?: number;
  instanceId?: string;
  timestamp: number;
  details: Record<string, any>;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

export class SecurityService extends BaseService {
  private rateLimitStore = new Map<string, RateLimitEntry>();
  private securityEvents: SecurityEvent[] = [];
  private blockedIPs = new Set<string>();
  private suspiciousIPs = new Map<string, number>(); // IP -> count
  private readonly maxSecurityEvents = 1000;

  // Configurações de segurança
  private readonly config = {
    maxFailedAttempts: 5,
    blockDuration: 15 * 60 * 1000, // 15 minutos
    suspiciousThreshold: 10,
    rateLimitWindow: 60 * 1000, // 1 minuto
    defaultRateLimit: 100, // requests por minuto
    maxRequestSize: 10 * 1024 * 1024, // 10MB
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  };

  /**
   * Validar e sanitizar entrada de usuário
   */
  sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potenciais tags HTML
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/data:/gi, '') // Remove data: URLs
      .slice(0, 1000); // Limitar tamanho
  }

  /**
   * Verificar se IP está bloqueado
   */
  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  /**
   * Bloquear IP temporariamente
   */
  blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip);

    // Remover bloqueio após duração configurada
    setTimeout(() => {
      this.blockedIPs.delete(ip);
      this.logger.info(`IP ${ip} desbloqueado após timeout`);
    }, this.config.blockDuration);

    this.recordSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'HIGH',
      ip,
      timestamp: Date.now(),
      details: { reason, action: 'IP_BLOCKED', duration: this.config.blockDuration },
    });

    this.logger.warn(`IP ${ip} bloqueado: ${reason}`);
  }

  /**
   * Verificar rate limiting
   */
  checkRateLimit(identifier: string, limit: number = this.config.defaultRateLimit): boolean {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindow;

    const entry = this.rateLimitStore.get(identifier);

    if (!entry) {
      // Primeira requisição
      this.rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow,
        firstRequest: now,
      });
      return true;
    }

    // Verificar se a janela expirou
    if (now >= entry.resetTime) {
      // Reset da janela
      this.rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow,
        firstRequest: now,
      });
      return true;
    }

    // Incrementar contador
    entry.count++;

    if (entry.count > limit) {
      this.recordSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'MEDIUM',
        ip: identifier.split(':')[0] || identifier,
        timestamp: now,
        details: {
          count: entry.count,
          limit,
          windowStart: entry.firstRequest,
          identifier,
        },
      });

      return false;
    }

    return true;
  }

  /**
   * Verificar origem da requisição
   */
  validateOrigin(origin: string | undefined): boolean {
    if (!origin) {
      return process.env.NODE_ENV === 'development';
    }

    return (
      this.config.allowedOrigins.includes(origin) ||
      (origin.includes('localhost') && process.env.NODE_ENV === 'development')
    );
  }

  /**
   * Validar token de autenticação
   */
  validateAuthToken(token: string): { valid: boolean; userId?: number; error?: string } {
    try {
      if (!token || !token.startsWith('Bearer ')) {
        return { valid: false, error: 'Token inválido ou ausente' };
      }

      const actualToken = token.substring(7); // Remove "Bearer "

      // Aqui você implementaria a validação real do JWT ou outro token
      // Por enquanto, uma validação básica para demonstração
      if (actualToken.length < 10) {
        return { valid: false, error: 'Token muito curto' };
      }

      // Simular extração de userId do token (em implementação real seria JWT decode)
      const userId = this.extractUserIdFromToken(actualToken);

      if (userId === undefined) {
        return { valid: false, error: 'Token não contém userId válido' };
      }

      return { valid: true, userId };
    } catch (error) {
      this.logger.error('Erro ao validar token:', error);
      return { valid: false, error: 'Token corrompido' };
    }
  }

  /**
   * Extrair informações de segurança da requisição
   */
  extractSecurityContext(req: Request): {
    ip: string;
    userAgent: string;
    fingerprint: string;
    isSecure: boolean;
  } {
    const ip = this.getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    const fingerprint = this.generateFingerprint(req);
    const isSecure = req.secure || req.get('X-Forwarded-Proto') === 'https';

    return { ip, userAgent, fingerprint, isSecure };
  }

  /**
   * Registrar evento de segurança
   */
  recordSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);

    // Manter apenas os eventos mais recentes
    if (this.securityEvents.length > this.maxSecurityEvents) {
      this.securityEvents.shift();
    }

    // Log baseado na severidade
    const logMessage = `Evento de Segurança [${event.severity}]: ${event.type} - IP: ${event.ip}`;

    switch (event.severity) {
      case 'CRITICAL':
        this.logger.error(logMessage, event);
        break;
      case 'HIGH':
        this.logger.warn(logMessage, event);
        break;
      default:
        this.logger.info(logMessage, event);
    }

    // Verificar se precisa bloquear IP por atividade suspeita
    this.checkSuspiciousActivity(event.ip, event.type);
  }

  /**
   * Verificar atividade suspeita
   */
  private checkSuspiciousActivity(ip: string, eventType: SecurityEvent['type']): void {
    const suspiciousCount = this.suspiciousIPs.get(ip) || 0;
    const newCount = suspiciousCount + 1;

    this.suspiciousIPs.set(ip, newCount);

    if (newCount >= this.config.suspiciousThreshold) {
      this.blockIP(ip, `Muitos eventos suspeitos (${newCount})`);
      this.suspiciousIPs.delete(ip);
    }

    // Limpar contadores antigos
    setTimeout(() => {
      const currentCount = this.suspiciousIPs.get(ip) || 0;
      if (currentCount <= 1) {
        this.suspiciousIPs.delete(ip);
      } else {
        this.suspiciousIPs.set(ip, currentCount - 1);
      }
    }, this.config.blockDuration);
  }

  /**
   * Obter IP real do cliente
   */
  private getClientIP(req: Request): string {
    return (
      req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      req.get('X-Real-IP') ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Gerar fingerprint da requisição
   */
  private generateFingerprint(req: Request): string {
    const components = [
      req.get('User-Agent') || '',
      req.get('Accept-Language') || '',
      req.get('Accept-Encoding') || '',
      this.getClientIP(req),
    ];

    return crypto.createHash('sha256').update(components.join('|')).digest('hex').substring(0, 16);
  }

  /**
   * Extrair userId do token (placeholder - implementar conforme seu sistema de auth)
   */
  private extractUserIdFromToken(token: string): number | undefined {
    // Esta é uma implementação de exemplo
    // Em um sistema real, você decodificaria um JWT aqui
    try {
      // Simular extração de userId
      const decoded = Buffer.from(token, 'base64').toString();
      const match = decoded.match(/userId:(\d+)/);
      return match && match[1] ? parseInt(match[1], 10) : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Obter estatísticas de segurança
   */
  getSecurityStats(): {
    totalEvents: number;
    blockedIPs: number;
    suspiciousIPs: number;
    recentEvents: SecurityEvent[];
    rateLimitEntries: number;
  } {
    return {
      totalEvents: this.securityEvents.length,
      blockedIPs: this.blockedIPs.size,
      suspiciousIPs: this.suspiciousIPs.size,
      recentEvents: this.securityEvents.slice(-10),
      rateLimitEntries: this.rateLimitStore.size,
    };
  }

  /**
   * Limpar dados de segurança antigos
   */
  cleanup(): void {
    const now = Date.now();
    const cutoff = now - 24 * 60 * 60 * 1000; // 24 horas

    // Limpar eventos antigos
    this.securityEvents = this.securityEvents.filter(event => event.timestamp > cutoff);

    // Limpar entradas de rate limit expiradas
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (now >= entry.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }

    this.logger.debug('Limpeza de dados de segurança concluída');
  }
}

// Exportar instância singleton
export const securityService = new SecurityService();
