# 多阶段构建 - 优化镜像大小
FROM node:18-alpine AS base

# 安装必要的系统依赖
RUN apk add --no-cache \
    wget \
    curl \
    dumb-init

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 复制 package.json
COPY package*.json ./

# 安装生产依赖
RUN npm ci --omit=dev && \
    npm cache clean --force

# 复制应用文件
COPY --chown=nodejs:nodejs src ./src
COPY --chown=nodejs:nodejs migrations ./migrations
COPY --chown=nodejs:nodejs public ./public
COPY --chown=nodejs:nodejs server.js ./

# 创建日志目录
RUN mkdir -p logs && \
    chown -R nodejs:nodejs logs

# 切换到非 root 用户
USER nodejs

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 使用 dumb-init 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
