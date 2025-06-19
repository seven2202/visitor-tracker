const redis = require('redis');

let client;

const connectRedis = async () => {
  try {
    const redisConfig = {
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error('Too many retries');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    };

    // 如果设置了 Redis 密码，添加认证
    if (process.env.REDIS_PASSWORD) {
      redisConfig.password = process.env.REDIS_PASSWORD;
      console.log('🔐 Redis password configured');
    } else {
      console.log('⚠️  No Redis password configured');
    }

    console.log('🔗 Connecting to Redis with config:', {
      host: redisConfig.socket.host,
      port: redisConfig.socket.port,
      hasPassword: !!redisConfig.password
    });

    client = redis.createClient(redisConfig);

    client.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('✅ Redis Client Connected');
    });

    client.on('ready', () => {
      console.log('🚀 Redis Client Ready');
    });

    await client.connect();
    console.log('✅ Redis connection established');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    throw error;
  }
};

const getRedis = () => {
  if (!client) {
    throw new Error('Redis not connected');
  }
  return client;
};

const closeRedis = async () => {
  if (client) {
    await client.quit();
    console.log('Redis connection closed');
  }
};

// 缓存工具函数
const cache = {
  async get(key) {
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    try {
      await client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  async del(key) {
    try {
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  async incr(key, ttl = 3600) {
    try {
      const value = await client.incr(key);
      if (value === 1) {
        await client.expire(key, ttl);
      }
      return value;
    } catch (error) {
      console.error('Cache incr error:', error);
      return 0;
    }
  }
};

module.exports = {
  connectRedis,
  getRedis,
  closeRedis,
  cache
};
