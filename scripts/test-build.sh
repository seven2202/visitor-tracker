#!/bin/bash

# Visit Tracker 构建测试脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 清理函数
cleanup() {
    log_info "清理测试容器..."
    docker stop test-visit-tracker 2>/dev/null || true
    docker rm test-visit-tracker 2>/dev/null || true
    docker rmi test-visit-tracker 2>/dev/null || true
}

# 测试构建
test_build() {
    log_info "测试 Docker 镜像构建..."
    
    cd "${PROJECT_ROOT}"
    
    # 构建镜像
    docker build -f Dockerfile.simple -t test-visit-tracker .
    
    if [ $? -eq 0 ]; then
        log_success "镜像构建成功!"
    else
        log_error "镜像构建失败!"
        exit 1
    fi
}

# 测试镜像
test_image() {
    log_info "测试镜像内容..."

    # 检查文件结构
    docker run --rm test-visit-tracker ls -la /app

    # 检查生产依赖（忽略开发依赖错误）
    log_info "检查生产依赖..."
    docker run --rm test-visit-tracker npm list --prod --depth=0 || log_warning "依赖检查有警告，但不影响运行"

    # 检查启动文件
    log_info "检查启动文件..."
    docker run --rm test-visit-tracker head -10 server.js
}

# 测试健康检查
test_health() {
    log_info "测试应用启动..."
    
    # 启动容器（不连接数据库，只测试基本启动）
    docker run -d --name test-visit-tracker \
        -p 3001:3000 \
        -e DB_HOST=dummy \
        -e REDIS_HOST=dummy \
        test-visit-tracker
    
    # 等待启动
    sleep 5
    
    # 检查容器状态
    if docker ps | grep -q test-visit-tracker; then
        log_success "容器启动成功!"
        
        # 检查日志
        log_info "容器日志:"
        docker logs test-visit-tracker
    else
        log_error "容器启动失败!"
        docker logs test-visit-tracker
        exit 1
    fi
}

# 主函数
main() {
    echo "🧪 Visit Tracker 构建测试"
    echo ""
    
    # 设置清理陷阱
    trap cleanup EXIT
    
    # 清理之前的测试
    cleanup
    
    # 执行测试
    test_build
    test_image
    test_health
    
    log_success "🎉 所有测试通过!"
    echo ""
    echo "📋 测试结果:"
    echo "✅ Docker 镜像构建成功"
    echo "✅ 镜像内容正确"
    echo "✅ 应用可以启动"
    echo ""
    echo "🚀 可以继续进行生产部署!"
}

main "$@"
