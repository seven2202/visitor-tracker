#!/bin/bash

# Visit Tracker 构建和推送脚本
# 简化版本，专门用于构建镜像并推送到 Docker Hub

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
DOCKER_HUB_USERNAME="seven222"
IMAGE_NAME="visit-tracker"
VERSION_TAG="${1:-$(date +%Y%m%d_%H%M%S)}"
LATEST_TAG="latest"

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 检查 Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker 服务未运行"
        exit 1
    fi
}

# 检查登录状态
# check_docker_login() {
#     if ! docker info | grep -q "Username"; then
#         log_warning "请先登录 Docker Hub"
#         docker login
#     fi
# }

# 构建前端
build_frontend() {
    log_info "检查前端构建..."

    cd "${PROJECT_ROOT}/frontend"

    # 检查是否已有构建文件
    if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
        log_info "前端未构建，开始构建..."

        # 检查包管理器
        if [ -f "pnpm-lock.yaml" ]; then
            log_info "使用 pnpm 构建前端..."
            pnpm install
            pnpm run build
        else
            log_info "使用 npm 构建前端..."
            npm install
            npm run build
        fi
    else
        log_info "前端已构建，跳过构建步骤"
    fi

    cd "${PROJECT_ROOT}"
}

# 构建镜像
build_image() {
    log_info "开始构建 Docker 镜像..."

    cd "${PROJECT_ROOT}"

    # 先构建前端
    build_frontend

    # 检查是否支持 buildx
    if docker buildx version &> /dev/null; then
        log_info "使用 buildx 构建多架构镜像..."
        docker buildx build \
            --platform linux/amd64,linux/arm64 \
            -f Dockerfile.simple \
            -t "${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION_TAG}" \
            -t "${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${LATEST_TAG}" \
            --push \
            .
    else
        log_info "使用标准构建..."
        docker build \
            -f Dockerfile.simple \
            -t "${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION_TAG}" \
            -t "${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${LATEST_TAG}" \
            .

        # 推送镜像
        log_info "推送镜像到 Docker Hub..."
        docker push "${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION_TAG}"
        docker push "${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${LATEST_TAG}"
    fi

    log_success "镜像构建和推送完成!"
}

# 生成部署文件
generate_deploy_files() {
    log_info "生成部署文件..."
    
    # 创建部署目录
    DEPLOY_DIR="${PROJECT_ROOT}/deploy"
    mkdir -p "${DEPLOY_DIR}"
    
    # 复制必要文件
    cp "${PROJECT_ROOT}/docker-compose.prod.yml" "${DEPLOY_DIR}/"
    cp -r "${PROJECT_ROOT}/backend/migrations" "${DEPLOY_DIR}/"
    
    # 创建启动脚本
    cat > "${DEPLOY_DIR}/start.sh" << 'EOF'
#!/bin/bash

# Visit Tracker 启动脚本

set -e

echo "🚀 启动 Visit Tracker..."

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装"
    exit 1
fi

# 拉取最新镜像
echo "📥 拉取最新镜像..."
docker-compose -f docker-compose.prod.yml pull

# 启动服务
echo "🔄 启动服务..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Visit Tracker 启动完成!"
echo "🌐 访问地址: http://localhost:3000"
echo "👤 默认账户: admin / password"
echo ""
echo "📋 常用命令:"
echo "  查看日志: docker-compose -f docker-compose.prod.yml logs"
echo "  停止服务: docker-compose -f docker-compose.prod.yml down"
echo "  重启服务: docker-compose -f docker-compose.prod.yml restart"
EOF
    
    chmod +x "${DEPLOY_DIR}/start.sh"
    
    # 创建停止脚本
    cat > "${DEPLOY_DIR}/stop.sh" << 'EOF'
#!/bin/bash

echo "🛑 停止 Visit Tracker..."
docker-compose -f docker-compose.prod.yml down

echo "✅ 服务已停止"
EOF
    
    chmod +x "${DEPLOY_DIR}/stop.sh"
    
    # 创建更新脚本
    cat > "${DEPLOY_DIR}/update.sh" << 'EOF'
#!/bin/bash

echo "🔄 更新 Visit Tracker..."

# 拉取最新镜像
docker-compose -f docker-compose.prod.yml pull

# 重新创建容器
docker-compose -f docker-compose.prod.yml up -d

echo "✅ 更新完成"
EOF
    
    chmod +x "${DEPLOY_DIR}/update.sh"
    
    # 创建 README
    cat > "${DEPLOY_DIR}/README.md" << EOF
# Visit Tracker 部署包

## 快速启动

\`\`\`bash
# 启动服务
./start.sh

# 停止服务
./stop.sh

# 更新应用
./update.sh
\`\`\`

## 访问信息

- **应用地址**: http://localhost:3000
- **默认账户**: admin / password

## 配置修改

编辑 \`docker-compose.prod.yml\` 文件修改配置：
- 数据库密码
- Redis 密码  
- JWT 密钥
- CORS 设置

## 镜像信息

- **镜像**: ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION_TAG}
- **构建时间**: $(date)
EOF
    
    log_success "部署文件已生成到: ${DEPLOY_DIR}"
}

# 显示帮助
show_help() {
    echo "Visit Tracker 构建和推送工具"
    echo ""
    echo "用法: $0 [版本标签]"
    echo ""
    echo "参数:"
    echo "  版本标签    可选，默认使用时间戳"
    echo ""
    echo "选项:"
    echo "  -h, --help  显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0              # 使用时间戳作为版本"
    echo "  $0 v1.0.0       # 使用指定版本"
    echo ""
    echo "功能:"
    echo "  - 构建多架构 Docker 镜像"
    echo "  - 推送到 Docker Hub"
    echo "  - 生成部署文件包"
}

# 主函数
main() {
    # 检查帮助参数
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        show_help
        exit 0
    fi

    echo "🏗️  Visit Tracker 构建和推送工具"
    echo "📦 镜像: ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION_TAG}"
    echo ""

    check_docker
    build_image
    generate_deploy_files
    
    echo ""
    log_success "🎉 构建完成!"
    echo ""
    echo "📋 接下来的步骤:"
    echo "1. 将 deploy/ 目录复制到服务器"
    echo "2. 在服务器上运行: cd deploy && ./start.sh"
    echo "3. 访问 http://your-server:3000"
    echo ""
    echo "🔗 镜像地址:"
    echo "   docker pull ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION_TAG}"
    echo "   docker pull ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${LATEST_TAG}"
}

main "$@"
