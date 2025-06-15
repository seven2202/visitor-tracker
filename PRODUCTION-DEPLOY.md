# 🚀 Visit Tracker 生产环境部署指南

## ✅ 镜像已推送到 Docker Hub

**镜像地址:**
- `seven222/visit-tracker:v1.0.1` (最新多架构版本)
- `seven222/visit-tracker:latest` (最新版本)
- `seven222/visit-tracker:v1.0.1-amd64` (AMD64 专用)
- `seven222/visit-tracker:v1.0.1-arm64` (ARM64 专用)

**镜像信息:**
- 大小: ~500MB
- 架构: **多架构支持** (linux/amd64 + linux/arm64)
- 自动选择: Docker 会根据运行环境自动选择合适的架构
- 包含: 前端 + 后端 + 所有依赖

## 🎯 快速部署

### 方案一：使用 docker-compose (推荐)

```bash
# 1. 下载部署文件
wget https://raw.githubusercontent.com/your-repo/visit-tracker/main/docker-compose.production.yml
wget https://raw.githubusercontent.com/your-repo/visit-tracker/main/.env.production

# 2. 配置环境变量
cp .env.production .env
nano .env  # 修改密码和密钥

# 3. 启动服务
docker-compose -f docker-compose.production.yml up -d

# 4. 检查状态
docker-compose -f docker-compose.production.yml ps
curl http://localhost:3000/health
```

### 方案二：单容器部署

```bash
# 1. 启动数据库
docker run -d --name visit-tracker-postgres \
  -e POSTGRES_DB=visit_tracker \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your-password \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine

# 2. 启动 Redis
docker run -d --name visit-tracker-redis \
  -v redis_data:/data \
  redis:7-alpine redis-server --requirepass your-redis-password --appendonly yes

# 3. 启动应用
docker run -d --name visit-tracker-app \
  -p 3000:3000 \
  -e DB_HOST=visit-tracker-postgres \
  -e DB_PASSWORD=your-password \
  -e REDIS_HOST=visit-tracker-redis \
  -e REDIS_PASSWORD=your-redis-password \
  -e JWT_SECRET=your-jwt-secret \
  --link visit-tracker-postgres \
  --link visit-tracker-redis \
  seven222/visit-tracker:v1.0.1
```

## 🔧 环境变量配置

### 必需配置
```bash
# 数据库
DB_PASSWORD=your-secure-database-password

# Redis
REDIS_PASSWORD=your-secure-redis-password

# JWT 密钥
JWT_SECRET=your-super-long-random-secret-key
```

### 可选配置
```bash
# CORS (生产环境建议指定域名)
CORS_ORIGIN=https://visitor.fllai.cn

# API 密钥前缀
API_KEY_PREFIX=sk-vt

# 日志级别
LOG_LEVEL=info
```

## 🌐 Nginx 配置

### 基础配置
```nginx
server {
    listen 80;
    server_name visitor.fllai.cn;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### HTTPS 配置
```nginx
server {
    listen 443 ssl http2;
    server_name visitor.fllai.cn;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📋 完整部署流程

### 1. 服务器准备
```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. 部署应用
```bash
# 创建项目目录
mkdir visit-tracker && cd visit-tracker

# 下载配置文件
curl -O https://raw.githubusercontent.com/your-repo/visit-tracker/main/docker-compose.production.yml
curl -O https://raw.githubusercontent.com/your-repo/visit-tracker/main/.env.production

# 配置环境变量
cp .env.production .env
nano .env  # 修改密码

# 启动服务
docker-compose -f docker-compose.production.yml up -d
```

### 3. 配置域名
```bash
# 安装 Nginx
sudo apt install nginx -y

# 配置站点
sudo nano /etc/nginx/sites-available/visitor.fllai.cn
sudo ln -s /etc/nginx/sites-available/visitor.fllai.cn /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 🔍 验证部署

```bash
# 检查容器状态
docker-compose -f docker-compose.production.yml ps

# 健康检查
curl http://localhost:3000/health
curl https://visitor.fllai.cn/health

# 查看日志
docker-compose -f docker-compose.production.yml logs -f app
```

## 🎉 访问应用

- **前端**: https://visitor.fllai.cn
- **管理后台**: 使用 admin/password 登录
- **API**: https://visitor.fllai.cn/api

## 🔒 安全建议

1. **修改默认密码**: 立即修改 admin 用户密码
2. **设置强密码**: 数据库、Redis、JWT 密钥
3. **配置 HTTPS**: 使用 SSL 证书
4. **限制 CORS**: 指定具体域名而不是 "*"
5. **定期备份**: 数据库和配置文件

## 📊 监控和维护

```bash
# 查看资源使用
docker stats

# 备份数据库
docker exec visit-tracker-postgres pg_dump -U postgres visit_tracker > backup.sql

# 更新镜像
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d
```

## 🏗️ 多架构支持

**✅ 支持的架构:**
- **AMD64** (Intel/AMD 服务器)
- **ARM64** (Apple Silicon, ARM 服务器)

**🔄 自动选择:**
Docker 会根据运行环境自动选择合适的架构镜像，无需手动指定。

**🚀 使用方法:**
```bash
# 自动选择架构（推荐）
docker run -d -p 3000:3000 seven222/visit-tracker:v1.0.1

# 手动指定架构（可选）
docker run -d -p 3000:3000 --platform linux/amd64 seven222/visit-tracker:v1.0.1
docker run -d -p 3000:3000 --platform linux/arm64 seven222/visit-tracker:v1.0.1
```

**🎯 现在你的 Visit Tracker 已经成功部署到生产环境！**
