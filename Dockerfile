# 多阶段构建 Dockerfile
# 阶段 1: 构建前端
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端依赖文件
COPY frontend/package*.json ./
COPY frontend/pnpm-lock.yaml* ./

# 安装依赖（优先使用 pnpm）
RUN if [ -f pnpm-lock.yaml ]; then \
        npm install -g pnpm && pnpm install; \
    else \
        npm install; \
    fi

# 复制前端源码
COPY frontend/ ./

# 构建前端
RUN if [ -f pnpm-lock.yaml ]; then \
        pnpm run build; \
    else \
        npm run build; \
    fi

# 阶段 2: 构建后端
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# 复制后端依赖文件
COPY backend/package*.json ./
COPY backend/pnpm-lock.yaml* ./

# 安装依赖（优先使用 pnpm）
RUN if [ -f pnpm-lock.yaml ]; then \
        npm install -g pnpm && pnpm install --prod; \
    else \
        npm install --only=production; \
    fi

# 阶段 3: 生产镜像
FROM node:18-alpine AS production

# 安装必要的系统包
RUN apk add --no-cache \
    curl \
    postgresql-client

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 复制后端代码和依赖
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY backend/src ./src
COPY backend/migrations ./migrations
COPY backend/package*.json ./

# 复制前端构建文件到后端 public 目录
COPY --from=frontend-builder /app/frontend/dist ./public

# 创建数据目录
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "src/app.js"]
