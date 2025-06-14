# 🐳 Visit Tracker Docker 部署

## 🚀 快速开始

### 方案一：使用预构建镜像（推荐）

```bash
# 1. 下载配置文件
curl -O https://raw.githubusercontent.com/your-repo/visit-tracker/main/docker-compose.prod.yml
curl -O https://raw.githubusercontent.com/your-repo/visit-tracker/main/.env.example

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，修改密码等配置

# 3. 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

### 方案二：本地构建镜像

```bash
# 1. 克隆项目
git clone <your-repository>
cd visit-tracker

# 2. 构建镜像
./build-docker.sh

# 3. 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

## 📦 构建自定义镜像

```bash
# 构建并推送到 Docker Hub
./build-docker.sh [tag] [registry]

# 示例
./build-docker.sh v1.0.0 myusername
```

## 🔧 配置说明

### 环境变量

复制 `.env.example` 到 `.env` 并修改以下配置：

```bash
# 数据库密码（必须修改）
DB_PASSWORD=your-secure-password

# Redis 密码（必须修改）
REDIS_PASSWORD=your-redis-password

# JWT 密钥（必须修改）
JWT_SECRET=your-super-long-random-secret-key

# CORS 设置（生产环境建议指定域名）
CORS_ORIGIN=https://yourdomain.com
```

### 端口配置

默认端口映射：
- **应用**: 3000 → 3000
- **数据库**: 内部网络（不暴露）
- **Redis**: 内部网络（不暴露）

修改应用端口：
```yaml
ports:
  - "8080:3000"  # 映射到 8080 端口
```

## 🗄️ 数据持久化

数据自动保存在 Docker 卷中：
- `visit-tracker-postgres-data`: PostgreSQL 数据
- `visit-tracker-redis-data`: Redis 数据

### 备份数据

```bash
# 备份数据库
docker exec visit-tracker-postgres pg_dump -U postgres visit_tracker > backup.sql

# 恢复数据库
docker exec -i visit-tracker-postgres psql -U postgres visit_tracker < backup.sql
```

## 🔍 监控和日志

```bash
# 查看所有服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看应用日志
docker-compose -f docker-compose.prod.yml logs -f app

# 查看数据库日志
docker-compose -f docker-compose.prod.yml logs -f postgres

# 健康检查
curl http://localhost:3000/health
```

## 🔄 更新部署

```bash
# 拉取最新镜像
docker-compose -f docker-compose.prod.yml pull

# 重启服务
docker-compose -f docker-compose.prod.yml up -d
```

## 🛑 停止服务

```bash
# 停止服务（保留数据）
docker-compose -f docker-compose.prod.yml down

# 停止服务并删除数据
docker-compose -f docker-compose.prod.yml down -v
```

## 🌐 生产环境建议

1. **使用反向代理**（Nginx/Traefik）
2. **启用 HTTPS**
3. **设置防火墙规则**
4. **定期备份数据**
5. **监控资源使用**
6. **设置日志轮转**

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🎯 访问应用

- **管理后台**: http://localhost:3000
- **API 文档**: http://localhost:3000/api
- **健康检查**: http://localhost:3000/health

**默认登录**: admin / password

## 🆘 故障排除

### 常见问题

1. **架构不匹配错误** `exec format error`
   ```bash
   # 方案一：使用修复脚本
   ./fix-docker.sh

   # 方案二：使用简化构建
   ./build-simple.sh
   docker-compose -f docker-compose.prod.yml up -d

   # 方案三：手动指定架构
   docker build --platform linux/amd64 -t seven222/visit-tracker:latest .
   ```

2. **端口被占用**
   ```bash
   # 修改 docker-compose.prod.yml 中的端口映射
   ports:
     - "8080:3000"
   ```

3. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker-compose -f docker-compose.prod.yml logs postgres
   ```

4. **内存不足**
   ```bash
   # 增加 Docker 内存限制或清理无用镜像
   docker system prune -a
   ```

**🎉 享受你的 Visit Tracker 系统！**
