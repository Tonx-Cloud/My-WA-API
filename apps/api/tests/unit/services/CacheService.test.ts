import { CacheService } from '../../../src/services/CacheService';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
  });

  afterEach(() => {
    // Clear cache after each test
    cacheService.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve a value', () => {
      const key = 'test-key';
      const value = { id: 1, name: 'Test' };

      cacheService.set(key, value);
      const result = cacheService.get(key);

      expect(result).toEqual(value);
    });

    it('should store and retrieve with custom TTL', () => {
      const key = 'test-key';
      const value = { id: 1, name: 'Test' };
      const ttl = 1000; // 1 second

      cacheService.set(key, value, ttl);
      const result = cacheService.get(key);

      expect(result).toEqual(value);
    });

    it('should return undefined for non-existent key', () => {
      const result = cacheService.get('non-existent-key');
      expect(result).toBeUndefined();
    });

    it('should return undefined for expired entries', (done) => {
      const key = 'test-key';
      const value = { id: 1, name: 'Test' };
      const ttl = 50; // 50ms

      cacheService.set(key, value, ttl);
      
      // Wait for expiration
      setTimeout(() => {
        const result = cacheService.get(key);
        expect(result).toBeUndefined();
        done();
      }, 100);
    });
  });

  describe('delete', () => {
    it('should delete an existing key', () => {
      const key = 'test-key';
      const value = { id: 1, name: 'Test' };

      cacheService.set(key, value);
      expect(cacheService.get(key)).toEqual(value);

      const deleted = cacheService.delete(key);
      expect(deleted).toBe(true);
      expect(cacheService.get(key)).toBeUndefined();
    });

    it('should return false for non-existent key', () => {
      const deleted = cacheService.delete('non-existent-key');
      expect(deleted).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return correct stats for existing keys', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');

      const stats = cacheService.getStats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
      expect(stats.keys).toHaveLength(2);
    });

    it('should return empty stats when cache is empty', () => {
      const stats = cacheService.getStats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.set('key3', 'value3');

      expect(cacheService.get('key1')).toBe('value1');
      expect(cacheService.get('key2')).toBe('value2');

      cacheService.clear();

      expect(cacheService.get('key1')).toBeUndefined();
      expect(cacheService.get('key2')).toBeUndefined();
      expect(cacheService.get('key3')).toBeUndefined();
    });
  });

  describe('getStats for size tracking', () => {
    it('should return correct cache size through stats', () => {
      expect(cacheService.getStats().size).toBe(0);

      cacheService.set('key1', 'value1');
      expect(cacheService.getStats().size).toBe(1);

      cacheService.set('key2', 'value2');
      expect(cacheService.getStats().size).toBe(2);

      cacheService.delete('key1');
      expect(cacheService.getStats().size).toBe(1);

      cacheService.clear();
      expect(cacheService.getStats().size).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', (done) => {
      const ttl = 50; // 50ms
      cacheService.set('key1', 'value1', ttl);
      cacheService.set('key2', 'value2'); // No expiration
      cacheService.set('key3', 'value3', ttl);

      expect(cacheService.getStats().size).toBe(3);

      setTimeout(() => {
        const removed = cacheService.cleanup();
        expect(removed).toBe(2); // key1 and key3 should be removed
        expect(cacheService.getStats().size).toBe(1);
        expect(cacheService.get('key2')).toBe('value2');
        done();
      }, 100);
    });

    it('should return 0 when no expired entries', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');

      const removed = cacheService.cleanup();
      expect(removed).toBe(0);
      expect(cacheService.getStats().size).toBe(2);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const key = 'test-key';
      const cachedValue = 'cached-value';
      const factory = jest.fn().mockResolvedValue('factory-value');

      cacheService.set(key, cachedValue);
      const result = await cacheService.getOrSet(key, factory);

      expect(result).toBe(cachedValue);
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result if not exists', async () => {
      const key = 'test-key';
      const factoryValue = 'factory-value';
      const factory = jest.fn().mockResolvedValue(factoryValue);

      const result = await cacheService.getOrSet(key, factory);

      expect(result).toBe(factoryValue);
      expect(factory).toHaveBeenCalledTimes(1);
      expect(cacheService.get(key)).toBe(factoryValue);
    });
  });

  describe('memoize', () => {
    it('should memoize function results', async () => {
      const originalFn = jest.fn().mockImplementation((x: number) => x * 2);
      const memoizedFn = cacheService.memoize(originalFn);

      const result1 = await memoizedFn(5);
      const result2 = await memoizedFn(5);

      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(originalFn).toHaveBeenCalledTimes(1);
    });

    it('should use custom key generator', async () => {
      const originalFn = jest.fn().mockImplementation((obj: any) => obj.value * 2);
      const keyGen = (obj: any) => `custom-${obj.id}`;
      const memoizedFn = cacheService.memoize(originalFn, keyGen);

      const result1 = await memoizedFn({ id: 1, value: 5 });
      const result2 = await memoizedFn({ id: 1, value: 10 }); // Different value, same id

      expect(result1).toBe(10);
      expect(result2).toBe(10); // Should return cached result
      expect(originalFn).toHaveBeenCalledTimes(1);
    });
  });
});
