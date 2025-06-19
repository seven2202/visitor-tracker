# Visit Tracker 部署指南

## 🚀 快速部署

### 方式一：使用构建脚本（推荐）

1. **构建并推送到 Docker Hub**
```bash
# 执行完整部署流程
./scripts/deploy.sh --all

# 或者分步执行
./scripts/deploy.sh --build --package --push
```

2. **在服务器上部署**
```bash
# 复制必要文件到服务器
scp docker-compose.prod.yml your-server:/path/to/deploy/
scp -r backend/migrations your-server:/path/to/deploy/

# 在服务器上启动
docker-compose -f docker-compose.prod.yml up -d
```

### 方式二：直接使用 Docker Hub 镜像

如果镜像已经推送到 Docker Hub，可以直接使用：

1. **下载配置文件**
```bash
# 下载 docker-compose.prod.yml 和 migrations 目录
wget https://raw.githubusercontent.com/your-repo/visit-tracker/main/docker-compose.prod.yml
git clone --depth 1 --filter=blob:none --sparse https://github.com/your-repo/visit-tracker.git
cd visit-tracker
git sparse-checkout set backend/migrations
```

2. **启动服务**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📋 部署要求

### 系统要求
- Docker 20.10+
- Docker Compose 2.0+
- 至少 2GB RAM
- 至少 10GB 磁盘空间

### 端口要求
- `3000`: 应用主端口
- `5432`: PostgreSQL（可选，仅开发时需要）
- `6379`: Redis（可选，仅开发时需要）

## ⚙️ 环境配置

### 生产环境变量

在 `docker-compose.prod.yml` 中修改以下环境变量：

```yaml
environment:
  - NODE_ENV=production
  - DB_PASSWORD=your-secure-db-password      # 修改数据库密码
  - REDIS_PASSWORD=your-secure-redis-password # 修改 Redis 密码
  - JWT_SECRET=your-super-secret-jwt-key     # 修改 JWT 密钥
  - CORS_ORIGIN=https://your-domain.com      # 设置允许的域名
```

### 安全建议

1. **修改默认密码**
   - 数据库密码：`POSTGRES_PASSWORD`
   - Redis 密码：`REDIS_PASSWORD`
   - JWT 密钥：`JWT_SECRET`

2. **网络安全**
   - 使用 HTTPS
   - 配置防火墙
   - 限制数据库和 Redis 端口访问

3. **数据备份**
   - 定期备份 PostgreSQL 数据
   - 备份 Redis 数据（可选）

## 🔧 常用命令

### 查看服务状态
```bash
docker-compose -f docker-compose.prod.yml ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose -f docker-compose.prod.yml logs

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs app
docker-compose -f docker-compose.prod.yml logs postgres
```

### 重启服务
```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 重启特定服务
docker-compose -f docker-compose.prod.yml restart app
```

### 更新应用
```bash
# 拉取最新镜像
docker-compose -f docker-compose.prod.yml pull app

# 重新创建容器
docker-compose -f docker-compose.prod.yml up -d app
```

### 数据库操作
```bash
# 连接到数据库
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d visit_tracker

# 备份数据库
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres visit_tracker > backup.sql

# 恢复数据库
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres visit_tracker < backup.sql
```

## 🌐 访问应用

部署完成后：

1. **管理后台**: `http://your-server:3000`
2. **API 接口**: `http://your-server:3000/api`
3. **健康检查**: `http://your-server:3000/health`

### 默认账户
- **用户名**: `admin`
- **密码**: `password`
- **邮箱**: `admin@example.com`

⚠️ **请立即修改默认密码！**

## 📊 监控和维护

### 健康检查
所有服务都配置了健康检查，可以通过以下方式监控：

```bash
# 检查容器健康状态
docker ps

# 查看详细健康检查信息
docker inspect visit-tracker-app | grep -A 10 Health
```

### 日志管理
建议配置日志轮转以避免磁盘空间不足：

```yaml
# 在 docker-compose.prod.yml 中添加
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 🔍 故障排除

### 常见问题

1. **应用无法启动**
   - 检查数据库连接
   - 查看应用日志
   - 确认端口未被占用

2. **数据库连接失败**
   - 检查数据库容器状态
   - 验证连接参数
   - 查看数据库日志

3. **Redis 连接失败**
   - 检查 Redis 容器状态
   - 验证密码配置
   - 查看 Redis 日志

### 获取帮助
如果遇到问题，请提供以下信息：
- 系统信息（OS、Docker 版本）
- 错误日志
- 配置文件内容
