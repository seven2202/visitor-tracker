# Visit Tracker - 网站访问统计系统

一个轻量级、高性能的网站访问统计系统，支持实时数据收集和可视化分析。

## 🚀 功能特性

### 核心功能
- **轻量级 SDK** - 网站只需引入一行 JavaScript 代码
- **实时统计** - 实时收集和展示访问数据
- **多网站支持** - 支持管理多个网站的统计数据
- **详细分析** - 提供访客、页面、来源、地理位置等多维度分析
- **可视化仪表板** - 直观的图表和数据展示

### 统计指标
- 页面浏览量 (PV)
- 独立访客数 (UV)
- 会话数
- 跳出率
- 平均停留时间
- 流量来源分析
- 地理位置分布
- 设备和浏览器统计
- 实时在线用户数

## 🏗️ 技术架构

### 后端
- **Node.js + Express** - API 服务
- **PostgreSQL** - 数据存储
- **Redis** - 缓存和实时统计
- **Docker** - 容器化部署

### 前端
- **React + Vite** - 管理后台
- **Chart.js** - 数据可视化
- **Styled Components** - 样式管理

### 部署
- **Docker Compose** - 一键部署
- **Nginx** - 反向代理和静态文件服务

## 📦 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd visit-tracker
```

### 2. 启动服务
```bash
# 使用 Docker Compose 一键启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 3. 访问管理后台
打开浏览器访问：`http://localhost`

默认登录信息：
- 用户名：`admin`
- 密码：`password`

### 4. 添加网站
1. 登录管理后台
2. 进入"网站管理"页面
3. 点击"添加网站"
4. 填写网站名称和域名
5. 获取 API Key

### 5. 在网站中集成统计代码

在你的网站 HTML 页面的 `</head>` 标签前添加以下代码：

```html
<!-- Visit Tracker 统计代码 -->
<script>
  window.VISIT_TRACKER_API = 'http://your-domain.com/api/track';
  window.VISIT_TRACKER_KEY = 'your-api-key-here';
</script>
<script src="http://your-domain.com/sdk/tracker.js"></script>
```

或者手动初始化：

```html
<script src="http://your-domain.com/sdk/tracker.js"></script>
<script>
  VisitTracker.init('your-api-key-here', {
    apiUrl: 'http://your-domain.com/api/track',
    debug: false
  });
</script>
```

## 🔧 配置说明

### 环境变量

创建 `.env` 文件并配置以下变量：

```env
# 数据库配置
DB_HOST=postgres
DB_PORT=5432
DB_NAME=visit_tracker
DB_USER=postgres
DB_PASSWORD=postgres123

# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379

# JWT 密钥
JWT_SECRET=your-jwt-secret-key

# 服务端口
PORT=3000

# CORS 配置
CORS_ORIGIN=*
```

### 自定义配置

#### 修改数据库配置
编辑 `docker-compose.yml` 中的数据库环境变量：

```yaml
postgres:
  environment:
    POSTGRES_DB: your_db_name
    POSTGRES_USER: your_username
    POSTGRES_PASSWORD: your_password
```

#### 修改端口配置
在 `docker-compose.yml` 中修改端口映射：

```yaml
nginx:
  ports:
    - "8080:80"  # 将 80 改为你想要的端口
```

## 📊 API 文档

### 统计接口

#### 发送访问数据
```
POST /api/track
Content-Type: application/json

{
  "apiKey": "your-api-key",
  "url": "https://example.com/page",
  "title": "Page Title",
  "referrer": "https://google.com",
  "visitorId": "unique-visitor-id",
  "sessionId": "session-id",
  "userAgent": "Mozilla/5.0...",
  "language": "zh-CN",
  "timezone": "Asia/Shanghai",
  "screenResolution": "1920x1080"
}
```

#### 获取实时在线用户数
```
GET /api/track/online/{apiKey}
```

### 分析接口

#### 获取网站概览统计
```
GET /api/analytics/overview/{websiteId}?startDate=2023-01-01&endDate=2023-12-31
Authorization: Bearer {token}
```

#### 获取时间序列数据
```
GET /api/analytics/timeseries/{websiteId}?granularity=day
Authorization: Bearer {token}
```

## 🛠️ 开发指南

### 本地开发环境

#### 后端开发
```bash
cd backend
npm install
npm run dev
```

#### 前端开发
```bash
cd frontend
npm install
npm run dev
```

#### 数据库迁移
```bash
cd backend
npm run migrate
```

### 项目结构
```
visit-tracker/
├── backend/                 # 后端 API 服务
│   ├── src/
│   │   ├── routes/         # 路由定义
│   │   ├── middleware/     # 中间件
│   │   ├── utils/          # 工具函数
│   │   └── app.js          # 应用入口
│   ├── migrations/         # 数据库迁移文件
│   └── Dockerfile
├── frontend/               # 前端管理后台
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── pages/          # 页面组件
│   │   ├── stores/         # 状态管理
│   │   └── utils/          # 工具函数
│   └── Dockerfile
├── tracker-sdk/            # 统计 SDK
│   ├── tracker.js          # 源码
│   └── tracker.min.js      # 压缩版本
├── nginx/                  # Nginx 配置
└── docker-compose.yml      # Docker 编排文件
```

## 🔒 安全说明

1. **API Key 保护** - 每个网站都有独立的 API Key
2. **速率限制** - 防止恶意请求和 DDoS 攻击
3. **数据验证** - 严格的输入数据验证
4. **JWT 认证** - 管理后台使用 JWT 进行身份验证
5. **CORS 配置** - 合理的跨域资源共享配置

## 📈 性能优化

1. **Redis 缓存** - 实时统计数据缓存
2. **数据库索引** - 优化查询性能
3. **连接池** - 数据库连接池管理
4. **CDN 支持** - SDK 文件可部署到 CDN
5. **数据聚合** - 定期聚合历史数据

## 🚀 部署到生产环境

### 1. 服务器要求
- CPU: 2核心以上
- 内存: 4GB 以上
- 存储: 20GB 以上
- 操作系统: Linux (推荐 Ubuntu 20.04+)

### 2. 安装 Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER
```

### 3. 安装 Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 4. 部署应用
```bash
git clone <repository-url>
cd visit-tracker
cp .env.example .env
# 编辑 .env 文件，设置生产环境配置
docker-compose up -d
```

### 5. 配置域名和 SSL
使用 Nginx 或 Cloudflare 配置域名和 SSL 证书。

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请：
1. 查看 [FAQ](docs/FAQ.md)
2. 提交 [Issue](issues)
3. 发送邮件至：support@example.com

---

**Visit Tracker** - 让网站数据分析变得简单高效！
