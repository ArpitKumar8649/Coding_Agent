const Redis = require('ioredis');
const NodeCache = require('node-cache');
const crypto = require('crypto');

class CacheService {
  constructor() {
    this.redisEnabled = process.env.REDIS_URL && process.env.NODE_ENV === 'production';
    
    if (this.redisEnabled) {
      try {
        this.redisClient = new Redis(process.env.REDIS_URL, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          enableOfflineQueue: false
        });
        
        this.redisClient.on('error', (err) => {
          console.warn('Redis connection error, falling back to memory cache:', err.message);
          this.redisEnabled = false;
        });
        
        console.log('✅ Redis cache initialized');
      } catch (error) {
        console.warn('Redis initialization failed, using memory cache:', error.message);
        this.redisEnabled = false;
      }
    }
    
    // Fallback to in-memory cache
    this.memoryCache = new NodeCache({
      stdTTL: 3600, // 1 hour default
      checkperiod: 600, // Check for expired keys every 10 minutes
      maxKeys: 1000 // Limit memory usage
    });
    
    console.log(`📦 Cache service initialized (${this.redisEnabled ? 'Redis' : 'Memory'})`);
  }

  /**
   * Generate cache key from request parameters
   */
  generateKey(prefix, data) {
    const normalized = {
      prompt: data.prompt?.trim().toLowerCase(),
      options: this.normalizeOptions(data.options || {}),
      type: data.type || 'generate'
    };
    
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex')
      .substring(0, 16);
    
    return `${prefix}:${hash}`;
  }

  /**
   * Normalize options for consistent caching
   */
  normalizeOptions(options) {
    const normalized = {};
    
    // Only include cacheable options
    const cacheableKeys = ['provider', 'model', 'language', 'style', 'temperature'];
    
    for (const key of cacheableKeys) {
      if (options[key] !== undefined) {
        normalized[key] = options[key];
      }
    }
    
    return normalized;
  }

  /**
   * Get cached result
   */
  async get(key) {
    try {
      if (this.redisEnabled) {
        const cached = await this.redisClient.get(key);
        if (cached) {
          const result = JSON.parse(cached);
          result.fromCache = true;
          result.cacheType = 'redis';
          return result;
        }
      }
      
      // Try memory cache
      const memCached = this.memoryCache.get(key);
      if (memCached) {
        memCached.fromCache = true;
        memCached.cacheType = 'memory';
        return memCached;
      }
      
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cache value
   */
  async set(key, value, ttlSeconds = 3600) {
    try {
      // Don't cache errors or failed requests (but allow context objects without success field)
      if (value.hasOwnProperty('success') && !value.success) {
        return false;
      }
      
      const cacheValue = { ...value };
      delete cacheValue.fromCache; // Remove cache flags before storing
      delete cacheValue.cacheType;
      
      if (this.redisEnabled) {
        await this.redisClient.setex(key, ttlSeconds, JSON.stringify(cacheValue));
      }
      
      // Also cache in memory for faster access
      this.memoryCache.set(key, cacheValue, ttlSeconds);
      
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Check if request is cacheable
   */
  isCacheable(request) {
    // Don't cache if explicitly disabled
    if (request.options?.noCache === true) {
      return false;
    }
    
    // Don't cache edit operations (they're contextual)
    if (request.type === 'edit') {
      return false;
    }
    
    // Don't cache if prompt is too short (likely not useful)
    if (!request.prompt || request.prompt.trim().length < 10) {
      return false;
    }
    
    return true;
  }

  /**
   * Get cache stats
   */
  getStats() {
    const memStats = this.memoryCache.getStats();
    
    return {
      enabled: true,
      redis: {
        enabled: this.redisEnabled,
        connected: this.redisEnabled && this.redisClient?.status === 'ready'
      },
      memory: {
        keys: memStats.keys,
        hits: memStats.hits,
        misses: memStats.misses,
        hitRate: memStats.hits / (memStats.hits + memStats.misses) || 0
      }
    };
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      if (this.redisEnabled) {
        await this.redisClient.flushdb();
      }
      this.memoryCache.flushAll();
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }
}

module.exports = CacheService;