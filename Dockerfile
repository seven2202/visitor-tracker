# Visit Tracker 生产环境 Dockerfile
FROM node:18-alpine

# 安装必要的系统包
RUN apk add --no-cache curl postgresql-client

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 设置工作目录
WORKDIR /app

# 复制后端代码和依赖
COPY backend/package*.json ./
COPY backend/src ./src
COPY backend/migrations ./migrations

# 复制前端构建文件（由部署脚本预先复制）
COPY backend/public ./public

# 安装生产依赖
RUN npm ci --only=production && \
    npm cache clean --force

# 创建必要的目录并设置权限
RUN mkdir -p /app/data /app/logs && \
    chown -R nodejs:nodejs /app && \
    chmod -R 755 /app

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "src/app.js"]
