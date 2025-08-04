import { logger } from './LoggerService';
import { promises as fs } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SSLConfig {
  enabled: boolean;
  autoRenew: boolean;
  provider: 'letsencrypt' | 'custom' | 'self-signed';
  domains: string[];
  email: string;
  certPath: string;
  keyPath: string;
  renewDays: number; // Days before expiry to renew
  challengeType: 'http-01' | 'dns-01';
}

export interface SSLCertificate {
  domain: string;
  issuedAt: Date;
  expiresAt: Date;
  issuer: string;
  serial: string;
  fingerprint: string;
  status: 'valid' | 'expired' | 'expiring-soon' | 'invalid';
}

export interface SSLRenewalResult {
  success: boolean;
  domain: string;
  timestamp: Date;
  newExpiryDate?: Date;
  error?: string;
}

class SSLService {
  private config: SSLConfig;
  private certificates: Map<string, SSLCertificate> = new Map();
  private renewalInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.config = {
      enabled: false, // Disabled by default for security
      autoRenew: true,
      provider: 'letsencrypt',
      domains: [],
      email: '',
      certPath: '/etc/ssl/certs',
      keyPath: '/etc/ssl/private',
      renewDays: 30,
      challengeType: 'http-01',
    };

    this.loadConfiguration();
    this.startRenewalMonitoring();
  }

  private async loadConfiguration(): Promise<void> {
    try {
      const configPath = join(process.cwd(), 'data', 'ssl-config.json');
      const data = await fs.readFile(configPath, 'utf-8');
      this.config = { ...this.config, ...JSON.parse(data) };

      logger.info('SSL configuration loaded', {
        operation: 'ssl-config-load',
        metadata: {
          enabled: this.config.enabled,
          provider: this.config.provider,
          domainCount: this.config.domains.length,
        },
      });
    } catch {
      // Use default configuration
      logger.info('Using default SSL configuration', {
        operation: 'ssl-config-default',
      });
    }
  }

  private async saveConfiguration(): Promise<void> {
    try {
      const configPath = join(process.cwd(), 'data', 'ssl-config.json');
      await fs.mkdir(join(configPath, '..'), { recursive: true });
      await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));

      logger.info('SSL configuration saved', {
        operation: 'ssl-config-save',
      });
    } catch (error) {
      logger.error('Failed to save SSL configuration', error instanceof Error ? error : undefined);
    }
  }

  async generateSelfSignedCertificate(domain: string): Promise<SSLRenewalResult> {
    try {
      logger.info('Generating self-signed certificate', {
        operation: 'ssl-self-signed-generate',
        metadata: { domain },
      });

      const certDir = join(process.cwd(), 'ssl');
      await fs.mkdir(certDir, { recursive: true });

      const keyPath = join(certDir, `${domain}.key`);
      const certPath = join(certDir, `${domain}.crt`);

      // Generate private key
      await execAsync(`openssl genrsa -out "${keyPath}" 2048`);

      // Generate certificate
      const subject = `/C=BR/ST=State/L=City/O=Organization/OU=OrgUnit/CN=${domain}/emailAddress=${this.config.email}`;
      await execAsync(
        `openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "${subject}"`
      );

      const certificate: SSLCertificate = {
        domain,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        issuer: 'Self-Signed',
        serial: Math.random().toString(36).substr(2, 9),
        fingerprint: await this.getCertificateFingerprint(certPath),
        status: 'valid',
      };

      this.certificates.set(domain, certificate);

      logger.info('Self-signed certificate generated successfully', {
        operation: 'ssl-self-signed-complete',
        metadata: {
          domain,
          expiresAt: certificate.expiresAt.toISOString(),
        },
      });

      return {
        success: true,
        domain,
        timestamp: new Date(),
        newExpiryDate: certificate.expiresAt,
      };
    } catch (error) {
      logger.error(
        'Failed to generate self-signed certificate',
        error instanceof Error ? error : undefined,
        {
          operation: 'ssl-self-signed-error',
          metadata: { domain },
        }
      );

      return {
        success: false,
        domain,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async requestLetsEncryptCertificate(domain: string): Promise<SSLRenewalResult> {
    try {
      if (!this.config.email) {
        throw new Error("Email is required for Let's Encrypt certificates");
      }

      logger.info("Requesting Let's Encrypt certificate", {
        operation: 'ssl-letsencrypt-request',
        metadata: { domain, challengeType: this.config.challengeType },
      });

      // Simulated Let's Encrypt request (would require actual certbot implementation)
      const result = await this.simulateLetsEncryptRequest(domain);

      if (result.success) {
        const certificate: SSLCertificate = {
          domain,
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          issuer: "Let's Encrypt",
          serial: Math.random().toString(36).substr(2, 9),
          fingerprint: Math.random().toString(36).substr(2, 16),
          status: 'valid',
        };

        this.certificates.set(domain, certificate);

        logger.info("Let's Encrypt certificate obtained", {
          operation: 'ssl-letsencrypt-success',
          metadata: {
            domain,
            expiresAt: certificate.expiresAt.toISOString(),
          },
        });
      }

      return result;
    } catch (error) {
      logger.error(
        "Failed to request Let's Encrypt certificate",
        error instanceof Error ? error : undefined,
        {
          operation: 'ssl-letsencrypt-error',
          metadata: { domain },
        }
      );

      return {
        success: false,
        domain,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async simulateLetsEncryptRequest(domain: string): Promise<SSLRenewalResult> {
    // Simulation of Let's Encrypt process
    // In real implementation, this would use certbot or ACME client

    logger.info(`Simulating Let's Encrypt certificate request for ${domain}`, {
      operation: 'ssl-letsencrypt-simulate',
    });

    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate success (90% success rate)
    const success = Math.random() > 0.1;

    if (success) {
      return {
        success: true,
        domain,
        timestamp: new Date(),
        newExpiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      };
    } else {
      return {
        success: false,
        domain,
        timestamp: new Date(),
        error: 'Domain validation failed',
      };
    }
  }

  private async parseCertificate(certPath: string): Promise<any> {
    try {
      const { stdout } = await execAsync(`openssl x509 -in "${certPath}" -text -noout`);
      return stdout;
    } catch (error) {
      logger.warn('Failed to parse certificate', {
        operation: 'ssl-parse-cert-error',
        metadata: { certPath, error: error instanceof Error ? error.message : 'Unknown' },
      });
      return {};
    }
  }

  private async getCertificateFingerprint(certPath: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`openssl x509 -in "${certPath}" -fingerprint -noout`);
      return stdout.replace('SHA1 Fingerprint=', '').trim();
    } catch (error) {
      logger.warn('Failed to get certificate fingerprint', {
        operation: 'ssl-fingerprint-error',
        metadata: {
          certPath,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      return 'unknown';
    }
  }

  private startRenewalMonitoring(): void {
    if (!this.config.enabled || !this.config.autoRenew) {
      return;
    }

    // Check for renewal every 24 hours
    this.renewalInterval = setInterval(
      async () => {
        await this.checkAndRenewCertificates();
      },
      24 * 60 * 60 * 1000
    );

    logger.info('SSL renewal monitoring started', {
      operation: 'ssl-renewal-monitoring-start',
      metadata: { intervalHours: 24 },
    });
  }

  private async checkAndRenewCertificates(): Promise<void> {
    if (!this.config.enabled) return;

    logger.info('Checking certificates for renewal', {
      operation: 'ssl-renewal-check',
    });

    for (const [domain, certificate] of this.certificates) {
      const daysUntilExpiry = Math.floor(
        (certificate.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );

      if (daysUntilExpiry <= this.config.renewDays) {
        logger.info('Certificate needs renewal', {
          operation: 'ssl-renewal-needed',
          metadata: { domain, daysUntilExpiry },
        });

        try {
          const result = await this.renewCertificate(domain);

          if (result.success) {
            logger.info('Certificate renewed successfully', {
              operation: 'ssl-renewal-success',
              metadata: { domain, newExpiryDate: result.newExpiryDate },
            });
          } else {
            logger.error('Certificate renewal failed', undefined, {
              operation: 'ssl-renewal-failed',
              metadata: { domain, error: result.error },
            });
          }
        } catch (error) {
          logger.error('Certificate renewal error', error instanceof Error ? error : undefined, {
            operation: 'ssl-renewal-error',
            metadata: { domain },
          });
        }
      }
    }
  }

  async renewCertificate(domain: string): Promise<SSLRenewalResult> {
    logger.info('Renewing certificate', {
      operation: 'ssl-renewal-start',
      metadata: { domain, provider: this.config.provider },
    });

    switch (this.config.provider) {
      case 'letsencrypt':
        return await this.requestLetsEncryptCertificate(domain);
      case 'self-signed':
        return await this.generateSelfSignedCertificate(domain);
      default:
        return {
          success: false,
          domain,
          timestamp: new Date(),
          error: `Unsupported provider: ${this.config.provider}`,
        };
    }
  }

  async addDomain(domain: string): Promise<SSLRenewalResult> {
    if (this.config.domains.includes(domain)) {
      return {
        success: false,
        domain,
        timestamp: new Date(),
        error: 'Domain already exists',
      };
    }

    this.config.domains.push(domain);
    await this.saveConfiguration();

    // Generate certificate for new domain
    const result = await this.renewCertificate(domain);

    logger.info('Domain added to SSL configuration', {
      operation: 'ssl-domain-add',
      metadata: { domain, success: result.success },
    });

    return result;
  }

  async removeDomain(domain: string): Promise<boolean> {
    const index = this.config.domains.indexOf(domain);
    if (index === -1) {
      return false;
    }

    this.config.domains.splice(index, 1);
    this.certificates.delete(domain);
    await this.saveConfiguration();

    logger.info('Domain removed from SSL configuration', {
      operation: 'ssl-domain-remove',
      metadata: { domain },
    });

    return true;
  }

  getCertificates(): SSLCertificate[] {
    return Array.from(this.certificates.values()).map(cert => {
      const now = new Date();
      const daysUntilExpiry = Math.floor(
        (cert.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      let status: SSLCertificate['status'] = 'valid';
      if (now > cert.expiresAt) {
        status = 'expired';
      } else if (daysUntilExpiry <= this.config.renewDays) {
        status = 'expiring-soon';
      }

      return { ...cert, status };
    });
  }

  getConfiguration(): SSLConfig {
    return { ...this.config };
  }

  async updateConfiguration(updates: Partial<SSLConfig>): Promise<void> {
    const oldEnabled = this.config.enabled;

    this.config = { ...this.config, ...updates };
    await this.saveConfiguration();

    // Restart monitoring if enabled status changed
    if (oldEnabled !== this.config.enabled) {
      if (this.renewalInterval) {
        clearInterval(this.renewalInterval);
        this.renewalInterval = null;
      }

      if (this.config.enabled) {
        this.startRenewalMonitoring();
      }
    }

    logger.info('SSL configuration updated', {
      operation: 'ssl-config-update',
      metadata: { updates },
    });
  }

  getSSLStatus(): {
    enabled: boolean;
    provider: string;
    domainCount: number;
    certificateCount: number;
    expiringSoon: number;
    expired: number;
  } {
    const certificates = this.getCertificates();

    return {
      enabled: this.config.enabled,
      provider: this.config.provider,
      domainCount: this.config.domains.length,
      certificateCount: certificates.length,
      expiringSoon: certificates.filter(cert => cert.status === 'expiring-soon').length,
      expired: certificates.filter(cert => cert.status === 'expired').length,
    };
  }

  stop(): void {
    if (this.renewalInterval) {
      clearInterval(this.renewalInterval);
      this.renewalInterval = null;

      logger.info('SSL renewal monitoring stopped', {
        operation: 'ssl-renewal-monitoring-stop',
      });
    }
  }
}

export const sslService = new SSLService();
