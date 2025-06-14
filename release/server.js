const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 服务静态文件
app.use(express.static(path.join(__dirname, 'public')));

// API 路由
app.use('/api', require('./src/routes'));

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).send('healthy');
});

// SPA 路由支持 - 所有其他路由返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Visit Tracker server running on port ${PORT}`);
});
