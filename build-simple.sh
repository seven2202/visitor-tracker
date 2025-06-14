#!/bin/bash

set -e

echo "🚀 使用简化 Dockerfile 构建镜像"
echo ""

# 检测架构
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

# 停止现有服务
echo "🛑 停止现有服务..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# 删除旧镜像
echo "🗑️  清理旧镜像..."
docker rmi seven222/visit-tracker:latest 2>/dev/null || true

# 使用简化 Dockerfile 构建
echo "🔨 构建镜像..."
docker build --platform $PLATFORM -f Dockerfile.simple -t seven222/visit-tracker:latest .

echo ""
echo "✅ 镜像构建完成！"
echo ""
echo "🚀 启动服务:"
echo "docker-compose -f docker-compose.prod.yml up -d"
