const { cache } = require('../utils/redis');

// 创建速率限制器
const createRateLimiter = (windowMs, maxRequests, keyGenerator) => {
  return async (req, res, next) => {
    try {
      const key = keyGenerator ? keyGenerator(req) : `rate_limit:${req.ip}`;
      const window = Math.floor(Date.now() / windowMs);
      const cacheKey = `${key}:${window}`;

      const current = await cache.incr(cacheKey, Math.ceil(windowMs / 1000));

      if (current > maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      // 设置响应头
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': Math.max(0, maxRequests - current),
        'X-RateLimit-Reset': new Date(Date.now() + windowMs)
      });

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // 如果 Redis 出错，允许请求通过
      next();
    }
  };
};

// 访问统计 API 限制器 - 每分钟 1000 次
const trackingLimiter = createRateLimiter(
  60 * 1000, // 1 分钟
  1000, // 最大请求数
  (req) => `tracking:${req.ip}`
);

// 一般 API 限制器 - 每分钟 100 次
const apiLimiter = createRateLimiter(
  60 * 1000, // 1 分钟
  100, // 最大请求数
  (req) => `api:${req.ip}`
);

// 登录限制器 - 每 15 分钟 5 次
const loginLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 分钟
  5, // 最大请求数
  (req) => `login:${req.ip}`
);

module.exports = {
  trackingLimiter,
  apiLimiter,
  loginLimiter
};
