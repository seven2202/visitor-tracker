const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./utils/database');
const { connectRedis } = require('./utils/redis');
const { initDatabase } = require('./utils/initDatabase');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// 路由导入
const trackingRoutes = require('./routes/tracking');
const analyticsRoutes = require('./routes/analytics');
const websiteRoutes = require('./routes/websites');
const authRoutes = require('./routes/auth');

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

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API 路由
app.use('/api/track', trackingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/auth', authRoutes);

// 服务前端静态文件
app.use(express.static(path.join(__dirname, '../public')));

// 前端路由回退 - 对于非API路由，返回index.html
app.get('*', (req, res) => {
  // 如果是API路由，返回404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'API route not found',
      path: req.originalUrl
    });
  }

  // 对于前端路由，返回index.html
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 连接数据库
    await connectDB();
    console.log('✅ Database connected successfully');

    // 初始化数据库表结构
    await initDatabase();

    // 连接 Redis
    await connectRedis();
    console.log('✅ Redis connected successfully');

    // 启动服务器
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
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

module.exports = app;
