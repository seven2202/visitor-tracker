#!/bin/bash

# Visit Tracker 部署脚本
# 支持本地开发和生产环境打包部署

set -e

# 配置
DOCKER_USERNAME=${DOCKER_USERNAME:-"seven222"}
IMAGE_NAME="visit-tracker"
DEFAULT_TAG="latest"

# 显示帮助信息
show_help() {
    echo "🚀 Visit Tracker 部署脚本"
    echo ""
    echo "用法:"
    echo "  $0 [模式] [选项]"
    echo ""
    echo "模式:"
    echo "  dev     - 本地开发环境部署 (默认)"
    echo "  prod    - 生产环境打包并推送到 Docker Hub"
    echo ""
    echo "选项:"
    echo "  -t, --tag TAG        Docker 镜像标签 (默认: latest)"
    echo "  -u, --username USER  Docker Hub 用户名 (默认: seven222)"
    echo "  -h, --help          显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 dev              # 本地开发部署"
    echo "  $0 prod             # 生产环境打包推送"
    echo "  $0 prod -t v1.0.0   # 指定版本标签"
    echo "  $0 prod -u myuser   # 指定 Docker Hub 用户名"
    echo ""
}

# 解析命令行参数
MODE="dev"
TAG="$DEFAULT_TAG"

while [[ $# -gt 0 ]]; do
    case $1 in
        dev|prod)
            MODE="$1"
            shift
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -u|--username)
            DOCKER_USERNAME="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "❌ 未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

echo "🚀 Visit Tracker 部署脚本"
echo "📋 模式: $MODE"
echo "🏷️  标签: $TAG"
echo "👤 用户: $DOCKER_USERNAME"
echo ""

# 检查必要工具
check_requirements() {
    echo "🔍 检查环境..."

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装，请先安装 Node.js (https://nodejs.org)"
        exit 1
    fi

    # 检查 npm
    if ! command -v npm &> /dev/null; then
        echo "❌ npm 未安装，请先安装 npm"
        exit 1
    fi

    # 生产模式需要检查 Docker
    if [[ "$MODE" == "prod" ]]; then
        if ! command -v docker &> /dev/null; then
            echo "❌ Docker 未安装，请先安装 Docker"
            exit 1
        fi

        if ! docker info &> /dev/null; then
            echo "❌ Docker 未运行，请启动 Docker"
            exit 1
        fi
    fi

    echo "✅ 环境检查通过"
}

# 安装依赖
install_dependencies() {
    echo "📦 安装依赖..."

    # 安装前端依赖
    echo "  📦 安装前端依赖..."
    cd frontend
    if [ -f "pnpm-lock.yaml" ] && command -v pnpm &> /dev/null; then
        pnpm install --silent
    elif [ -f "yarn.lock" ] && command -v yarn &> /dev/null; then
        yarn install --silent
    else
        npm install --silent
    fi
    cd ..

    # 安装后端依赖
    echo "  📦 安装后端依赖..."
    cd backend
    if [ -f "pnpm-lock.yaml" ] && command -v pnpm &> /dev/null; then
        pnpm install --silent
    elif [ -f "yarn.lock" ] && command -v yarn &> /dev/null; then
        yarn install --silent
    else
        npm install --silent
    fi
    cd ..

    echo "✅ 依赖安装完成"
}

# 构建前端
build_frontend() {
    echo "🔨 构建前端..."
    cd frontend

    # 设置生产环境变量
    export VITE_API_URL=/api

    if [ -f "pnpm-lock.yaml" ] && command -v pnpm &> /dev/null; then
        pnpm run build
    elif [ -f "yarn.lock" ] && command -v yarn &> /dev/null; then
        yarn build
    else
        npm run build
    fi
    cd ..

    echo "✅ 前端构建完成"
}

# 复制前端文件到后端
copy_frontend_to_backend() {
    echo "📁 复制前端文件到后端..."

    # 清理旧文件
    rm -rf backend/public

    # 创建目录并复制文件
    mkdir -p backend/public
    cp -r frontend/dist/* backend/public/

    echo "✅ 前端文件复制完成"
}

# 本地开发部署
deploy_dev() {
    echo "🚀 本地开发环境部署"

    check_requirements
    install_dependencies
    build_frontend
    copy_frontend_to_backend

    # 启动数据库
    if ! docker ps | grep -q visit-tracker-db; then
        echo "📦 启动数据库..."
        docker run -d --name visit-tracker-db -p 5432:5432 \
            -e POSTGRES_PASSWORD=123456 \
            -e POSTGRES_DB=visit_tracker \
            postgres:15
        sleep 10
    else
        echo "✅ 数据库已运行"
    fi

    # 配置环境
    echo "⚙️  配置环境变量..."
    cat > backend/.env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=visit_tracker
DB_USER=postgres
DB_PASSWORD=123456
PORT=3000
JWT_SECRET=secret123
CORS_ORIGIN=*
EOF

    # 启动后端
    echo "🚀 启动后端服务..."
    cd backend && npm start &
    cd ..

    echo ""
    echo "✅ 本地部署完成！"
    echo "🌐 访问地址: http://localhost:3000"
    echo "👤 用户名: admin"
    echo "🔑 密码: password"
}

# 生产环境打包部署
deploy_prod() {
    echo "🚀 生产环境打包部署"

    check_requirements
    install_dependencies
    build_frontend
    copy_frontend_to_backend

    # 构建 Docker 镜像
    echo "🐳 构建 Docker 镜像..."

    # 检测当前架构
    ARCH=$(uname -m)
    case $ARCH in
        x86_64)
            PLATFORM="linux/amd64"
            ;;
        arm64|aarch64)
            PLATFORM="linux/arm64"
            ;;
        *)
            PLATFORM="linux/amd64"  # 默认使用 amd64
            ;;
    esac

    echo "🔍 目标平台: $PLATFORM"

    # 检查 Dockerfile 是否存在
    if [ -f "Dockerfile.simple" ]; then
        DOCKERFILE="Dockerfile.simple"
    elif [ -f "Dockerfile" ]; then
        DOCKERFILE="Dockerfile"
    else
        echo "❌ 未找到 Dockerfile"
        exit 1
    fi

    echo "📄 使用 Dockerfile: $DOCKERFILE"
    docker build --platform $PLATFORM -f $DOCKERFILE -t ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG} .

    # 如果不是 latest，也打上 latest 标签
    if [[ "$TAG" != "latest" ]]; then
        docker tag ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG} ${DOCKER_USERNAME}/${IMAGE_NAME}:latest
    fi

    # 登录 Docker Hub
    echo "🔐 登录 Docker Hub..."
    if ! docker info | grep -q "Username:"; then
        echo "请输入 Docker Hub 凭据:"
        docker login
    fi

    # 推送镜像
    echo "📤 推送镜像到 Docker Hub..."
    docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}

    if [[ "$TAG" != "latest" ]]; then
        docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:latest
    fi

    # 生成部署文件
    echo "📝 生成部署文件..."
    generate_deployment_files

    echo ""
    echo "✅ 生产环境打包完成！"
    echo ""
    echo "📦 推送的镜像:"
    echo "  ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}"
    if [[ "$TAG" != "latest" ]]; then
        echo "  ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
    fi
    echo ""
    echo "🚀 部署命令:"
    echo "  docker run -d -p 3000:3000 ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}"
    echo ""
    echo "📖 或使用 docker-compose:"
    echo "  docker-compose -f docker-compose.production.yml up -d"
}

# 生成部署文件
generate_deployment_files() {
    # 生成生产环境 docker-compose 文件
    cat > docker-compose.production.yml << EOF
version: '3.8'

services:
  app:
    image: ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}
    container_name: visit-tracker-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: visit_tracker
      DB_USER: postgres
      DB_PASSWORD: \${DB_PASSWORD:-postgres123}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: \${REDIS_PASSWORD:-redis123}
      JWT_SECRET: \${JWT_SECRET:-your-super-secret-jwt-key}
      API_KEY_PREFIX: sk-vt
      CORS_ORIGIN: "*"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - visit-tracker-network

  postgres:
    image: postgres:15-alpine
    container_name: visit-tracker-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: visit_tracker
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: \${DB_PASSWORD:-postgres123}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d visit_tracker"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - visit-tracker-network

  redis:
    image: redis:7-alpine
    container_name: visit-tracker-redis
    restart: unless-stopped
    command: redis-server --requirepass \${REDIS_PASSWORD:-redis123} --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "\${REDIS_PASSWORD:-redis123}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - visit-tracker-network

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  visit-tracker-network:
    driver: bridge
EOF

    # 生成环境变量模板
    cat > .env.production << EOF
# Visit Tracker 生产环境配置

# 数据库密码（必须修改）
DB_PASSWORD=your-secure-database-password

# Redis 密码（必须修改）
REDIS_PASSWORD=your-secure-redis-password

# JWT 密钥（必须修改）
JWT_SECRET=your-super-long-random-secret-key-change-this-in-production

# CORS 设置（建议指定具体域名）
# CORS_ORIGIN=https://yourdomain.com
EOF

    echo "📁 生成的文件:"
    echo "  docker-compose.production.yml - 生产环境编排文件"
    echo "  .env.production - 环境变量模板"
}

# 主函数
main() {
    case $MODE in
        dev)
            deploy_dev
            ;;
        prod)
            deploy_prod
            ;;
        *)
            echo "❌ 未知模式: $MODE"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main
