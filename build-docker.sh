#!/bin/bash

set -e

# 配置
IMAGE_NAME="visit-tracker"
TAG=${1:-latest}
REGISTRY=${2:-"seven222"}  # 你的 Docker Hub 用户名

echo "🐳 构建 Visit Tracker Docker 镜像"
echo ""
echo "📋 构建信息:"
echo "  镜像名称: ${REGISTRY}/${IMAGE_NAME}:${TAG}"
echo "  平台: linux/amd64,linux/arm64"
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    exit 1
fi

# 检查 Docker Buildx
if ! docker buildx version &> /dev/null; then
    echo "❌ Docker Buildx 未安装，请升级 Docker"
    exit 1
fi

# 创建并使用 buildx builder
echo "🔧 设置 Docker Buildx..."
docker buildx create --name visit-tracker-builder --use 2>/dev/null || \
docker buildx use visit-tracker-builder 2>/dev/null || \
docker buildx create --name visit-tracker-builder --use

# 构建多架构镜像
echo "🔨 开始构建镜像..."
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag ${REGISTRY}/${IMAGE_NAME}:${TAG} \
    --tag ${REGISTRY}/${IMAGE_NAME}:latest \
    --push \
    .

echo ""
echo "✅ 镜像构建完成！"
echo ""
echo "📦 推送的镜像:"
echo "  ${REGISTRY}/${IMAGE_NAME}:${TAG}"
echo "  ${REGISTRY}/${IMAGE_NAME}:latest"
echo ""
echo "🚀 使用方法:"
echo "  docker run -d -p 3000:3000 \\"
echo "    -e DB_HOST=your-db-host \\"
echo "    -e DB_PASSWORD=your-password \\"
echo "    ${REGISTRY}/${IMAGE_NAME}:${TAG}"
echo ""
echo "📖 或使用 docker-compose:"
echo "  docker-compose up -d"
