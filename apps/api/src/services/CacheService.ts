import { BaseService } from './BaseService';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService extends BaseService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Set a value in cache with TTL
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, entry);
    this.logger.debug(`Cache set: ${key} (TTL: ${entry.ttl}ms)`);
  }

  /**
   * Get a value from cache, returns undefined if expired or not found
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.logger.debug(`Cache expired and removed: ${key}`);
      return undefined;
    }

    this.logger.debug(`Cache hit: ${key}`);
    return entry.data as T;
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug(`Cache deleted: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.info(`Cache cleared: ${size} entries removed`);
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Remove expired entries (cleanup)
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.logger.info(`Cache cleanup: ${removed} expired entries removed`);
    }

    return removed;
  }

  /**
   * Get or set pattern - if key exists and not expired, return it, otherwise set and return new value
   */
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T> | T, 
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Not in cache or expired, generate new value
    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Memoize a function with cache
   */
  memoize<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn> | TReturn,
    keyGenerator?: (...args: TArgs) => string,
    ttl?: number
  ) {
    return async (...args: TArgs): Promise<TReturn> => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      return this.getOrSet(key, () => fn(...args), ttl);
    };
  }

  /**
   * Start periodic cleanup
   */
  startPeriodicCleanup(intervalMs: number = 10 * 60 * 1000): NodeJS.Timeout {
    return setInterval(() => {
      this.cleanup();
    }, intervalMs);
  }
}

// Export singleton instance
export const cacheService = new CacheService();
