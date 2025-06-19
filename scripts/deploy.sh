#!/bin/bash

# Visit Tracker 部署脚本
# 支持构建、打包和部署到服务器

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
DOCKER_HUB_USERNAME="seven222"
IMAGE_NAME="visit-tracker"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
VERSION_TAG="${TIMESTAMP}"
LATEST_TAG="latest"

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE_DIR="${PROJECT_ROOT}/release"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "Visit Tracker 部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help              显示帮助信息"
    echo "  -b, --build             构建前端和后端"
    echo "  -p, --package           打包 Docker 镜像"
    echo "  -u, --push              推送镜像到 Docker Hub"
    echo "  -a, --all               执行完整部署流程 (构建+打包+推送)"
    echo "  -c, --clean             清理构建文件"
    echo "  --version TAG           指定版本标签 (默认: 时间戳)"
    echo ""
    echo "示例:"
    echo "  $0 --all                # 完整部署流程"
    echo "  $0 -b -p                # 只构建和打包"
    echo "  $0 --push --version v1.0.0  # 推送指定版本"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装或不在 PATH 中"
        exit 1
    fi
    
    # 检查 Docker Buildx
    if ! docker buildx version &> /dev/null; then
        log_warning "Docker Buildx 不可用，将使用普通构建"
        USE_BUILDX=false
    else
        USE_BUILDX=true
    fi
    
    # 检查 pnpm (前端使用)
    if ! command -v pnpm &> /dev/null; then
        log_warning "pnpm 未安装，将使用 npm"
        PACKAGE_MANAGER="npm"
    else
        PACKAGE_MANAGER="pnpm"
    fi
    
    log_success "依赖检查完成"
}

# 清理构建文件
clean_build() {
    log_info "清理构建文件..."
    
    # 清理前端构建文件
    if [ -d "${PROJECT_ROOT}/frontend/dist" ]; then
        rm -rf "${PROJECT_ROOT}/frontend/dist"
        log_info "已清理前端构建文件"
    fi
    
    # 清理 release 目录
    if [ -d "${RELEASE_DIR}" ]; then
        rm -rf "${RELEASE_DIR}"
        log_info "已清理 release 目录"
    fi
    
    log_success "清理完成"
}

# 构建前端
build_frontend() {
    log_info "构建前端..."
    
    cd "${PROJECT_ROOT}/frontend"
    
    # 安装依赖
    log_info "安装前端依赖..."
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        pnpm install
    else
        npm install
    fi
    
    # 构建
    log_info "构建前端应用..."
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        pnpm run build
    else
        npm run build
    fi
    
    log_success "前端构建完成"
}

# 创建 release 包
create_release() {
    log_info "创建 release 包..."
    
    # 创建 release 目录
    mkdir -p "${RELEASE_DIR}"
    
    # 复制后端文件
    cp -r "${PROJECT_ROOT}/backend/src" "${RELEASE_DIR}/"
    cp -r "${PROJECT_ROOT}/backend/migrations" "${RELEASE_DIR}/"
    cp "${PROJECT_ROOT}/backend/package.json" "${RELEASE_DIR}/"
    
    # 复制前端构建文件到 public 目录
    mkdir -p "${RELEASE_DIR}/public"
    cp -r "${PROJECT_ROOT}/frontend/dist/"* "${RELEASE_DIR}/public/"
    
    # 复制 SDK 文件
    mkdir -p "${RELEASE_DIR}/public/sdk"
    cp "${PROJECT_ROOT}/tracker-sdk/"* "${RELEASE_DIR}/public/sdk/"
    
    # 创建优化的 server.js
    cat > "${RELEASE_DIR}/server.js" << 'EOF'
const express = require('express');
const path = require('path');
require('dotenv').config();

// 导入应用模块
const { connectDB } = require('./src/utils/database');
const { connectRedis } = require('./src/utils/redis');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API 路由
app.use('/api/track', require('./src/routes/tracking'));
app.use('/api/analytics', require('./src/routes/analytics'));
app.use('/api/websites', require('./src/routes/websites'));
app.use('/api/auth', require('./src/routes/auth'));

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

// 启动服务器
async function startServer() {
  try {
    await connectDB();
    console.log('✅ Database connected successfully');

    await connectRedis();
    console.log('✅ Redis connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Visit Tracker server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
EOF

    log_success "Release 包创建完成"
}

# 构建 Docker 镜像
build_docker_image() {
    log_info "构建 Docker 镜像..."

    cd "${RELEASE_DIR}"

    # 创建优化的 Dockerfile
    cat > "${RELEASE_DIR}/Dockerfile" << 'EOF'
FROM node:18-alpine

# 安装必要的系统包
RUN apk add --no-cache curl

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 设置工作目录
WORKDIR /app

# 复制 package.json
COPY package.json ./

# 安装生产依赖
RUN npm ci --omit=dev && \
    npm cache clean --force

# 复制应用文件
COPY src ./src
COPY migrations ./migrations
COPY public ./public
COPY server.js ./

# 设置权限
RUN chown -R nodejs:nodejs /app
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 启动应用
CMD ["node", "server.js"]
EOF

    if [ "$USE_BUILDX" = true ]; then
        # 构建多架构镜像
        log_info "构建多架构镜像 (AMD64, ARM64)..."
        docker buildx build \
            --platform linux/amd64,linux/arm64 \
            -t "${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION_TAG}" \
            -t "${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${LATEST_TAG}" \
            --load \
            .
    else
        # 普通构建
        log_info "构建 Docker 镜像..."
        docker build \
            -t "${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION_TAG}" \
            -t "${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${LATEST_TAG}" \
            .
    fi

    log_success "Docker 镜像构建完成"
    log_info "镜像标签: ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION_TAG}"
    log_info "镜像标签: ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${LATEST_TAG}"
}

# 推送镜像到 Docker Hub
push_docker_image() {
    log_info "推送镜像到 Docker Hub..."

    # 检查是否已登录 Docker Hub
    if ! docker info | grep -q "Username"; then
        log_warning "请先登录 Docker Hub: docker login"
        read -p "是否现在登录? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker login
        else
            log_error "需要登录 Docker Hub 才能推送镜像"
            exit 1
        fi
    fi

    # 推送镜像
    docker push "${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION_TAG}"
    docker push "${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${LATEST_TAG}"

    log_success "镜像推送完成"
    log_info "可以使用以下命令拉取镜像:"
    log_info "docker pull ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION_TAG}"
    log_info "docker pull ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${LATEST_TAG}"
}

# 生成生产环境 docker-compose.yml
generate_production_compose() {
    log_info "生成生产环境 docker-compose.yml..."

    cat > "${PROJECT_ROOT}/docker-compose.prod.yml" << EOF
version: '3.8'

services:
  # Visit Tracker 应用
  app:
    image: ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${LATEST_TAG}
    container_name: visit-tracker-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=visit_tracker
      - DB_USER=postgres
      - DB_PASSWORD=postgres123
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=redis123
      - JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
      - CORS_ORIGIN=*
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # PostgreSQL 数据库
  postgres:
    image: postgres:15-alpine
    container_name: visit-tracker-postgres
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: postgres123
      POSTGRES_DB: visit_tracker
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d visit_tracker"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: visit-tracker-redis
    restart: unless-stopped
    command: redis-server --requirepass redis123 --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "redis123", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

# 数据卷
volumes:
  postgres_data:
    driver: local
    name: visit-tracker-postgres-data
  redis_data:
    driver: local
    name: visit-tracker-redis-data
EOF

    log_success "生产环境 docker-compose.yml 已生成: docker-compose.prod.yml"
}

# 主函数
main() {
    local build_flag=false
    local package_flag=false
    local push_flag=false
    local clean_flag=false
    local all_flag=false

    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -b|--build)
                build_flag=true
                shift
                ;;
            -p|--package)
                package_flag=true
                shift
                ;;
            -u|--push)
                push_flag=true
                shift
                ;;
            -c|--clean)
                clean_flag=true
                shift
                ;;
            -a|--all)
                all_flag=true
                shift
                ;;
            --version)
                VERSION_TAG="$2"
                shift 2
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # 如果没有指定任何选项，显示帮助
    if [ "$build_flag" = false ] && [ "$package_flag" = false ] && [ "$push_flag" = false ] && [ "$clean_flag" = false ] && [ "$all_flag" = false ]; then
        show_help
        exit 0
    fi

    # 检查依赖
    check_dependencies

    # 执行清理
    if [ "$clean_flag" = true ]; then
        clean_build
    fi

    # 执行完整流程
    if [ "$all_flag" = true ]; then
        log_info "开始完整部署流程..."
        clean_build
        build_frontend
        create_release
        build_docker_image
        push_docker_image
        generate_production_compose

        log_success "🎉 完整部署流程完成!"
        log_info "📋 接下来的步骤:"
        log_info "1. 将 docker-compose.prod.yml 和 backend/migrations 目录复制到服务器"
        log_info "2. 在服务器上运行: docker-compose -f docker-compose.prod.yml up -d"
        log_info "3. 访问 http://your-server:3000 查看应用"
        log_info "4. 默认管理员账户: admin / password"
        return
    fi

    # 执行单独的步骤
    if [ "$build_flag" = true ]; then
        build_frontend
        create_release
    fi

    if [ "$package_flag" = true ]; then
        if [ ! -d "${RELEASE_DIR}" ]; then
            log_warning "Release 目录不存在，先执行构建..."
            build_frontend
            create_release
        fi
        build_docker_image
    fi

    if [ "$push_flag" = true ]; then
        push_docker_image
        generate_production_compose
    fi

    log_success "✅ 操作完成!"
}

# 执行主函数
main "$@"
