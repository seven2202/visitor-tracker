const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

// 导入应用模块
const { connectDB } = require('./src/utils/database');
const { connectRedis } = require('./src/utils/redis');

// 尝试导入中间件，如果失败则使用默认值
let errorHandler, rateLimiter;
try {
  errorHandler = require('./src/middleware/errorHandler');
  rateLimiter = require('./src/middleware/rateLimiter');
  console.log('✅ Middleware loaded successfully');
} catch (error) {
  console.error('⚠️ Middleware loading error:', error);
  // 提供默认的错误处理中间件
  errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  };
  // 提供默认的速率限制中间件（无操作）
  rateLimiter = {
    trackingLimiter: (req, res, next) => next(),
    apiLimiter: (req, res, next) => next()
  };
}

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件设置
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 速率限制
app.use('/api/track', rateLimiter.trackingLimiter);
app.use('/api', rateLimiter.apiLimiter);

// API 路由
try {
  console.log('📍 Loading API routes...');
  app.use('/api/track', require('./src/routes/tracking'));
  console.log('✅ /api/track route loaded');

  app.use('/api/analytics', require('./src/routes/analytics'));
  console.log('✅ /api/analytics route loaded');

  app.use('/api/websites', require('./src/routes/websites'));
  console.log('✅ /api/websites route loaded');

  app.use('/api/auth', require('./src/routes/auth'));
  console.log('✅ /api/auth route loaded');

  console.log('✅ All API routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading API routes:', error);
}

// 服务静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// SPA 路由支持 - 对于非API路由，返回index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'API route not found',
      path: req.originalUrl
    });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    await connectDB();
    console.log('✅ Database connected successfully');
    
    await connectRedis();
    console.log('✅ Redis connected successfully');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Visit Tracker server running on port ${PORT}`);
      console.log(`📊 Visit Tracker API is ready!`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
