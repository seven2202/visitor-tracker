#!/bin/bash

set -e

echo "🚀 构建双架构 Visit Tracker 镜像"
echo ""

# 配置
DOCKER_USERNAME="seven222"
IMAGE_NAME="visit-tracker"
TAG="v1.0.1"

echo "📋 配置信息:"
echo "  用户: $DOCKER_USERNAME"
echo "  镜像: $IMAGE_NAME"
echo "  标签: $TAG"
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker 未运行"
    exit 1
fi

# 准备构建
echo "📦 准备构建..."

# 安装前端依赖并构建
echo "  🔨 构建前端..."
cd frontend
if [ -f "pnpm-lock.yaml" ] && command -v pnpm &> /dev/null; then
    pnpm install --silent
    VITE_API_URL=/api pnpm run build
elif [ -f "yarn.lock" ] && command -v yarn &> /dev/null; then
    yarn install --silent
    VITE_API_URL=/api yarn build
else
    npm install --silent
    VITE_API_URL=/api npm run build
fi
cd ..

# 复制前端文件到后端
echo "  📁 复制前端文件..."
rm -rf backend/public
mkdir -p backend/public
cp -r frontend/dist/* backend/public/

# 构建 AMD64 镜像
echo "🔨 构建 AMD64 镜像..."
docker build --platform linux/amd64 -t ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}-amd64 .

# 构建 ARM64 镜像
echo "🔨 构建 ARM64 镜像..."
docker build --platform linux/arm64 -t ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}-arm64 .

# 推送单架构镜像
echo "📤 推送单架构镜像..."
docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}-amd64
docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}-arm64

# 创建并推送 manifest
echo "🔗 创建多架构 manifest..."

# 创建 manifest
docker manifest create ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG} \
    ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}-amd64 \
    ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}-arm64

# 注释架构信息
docker manifest annotate ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG} \
    ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}-amd64 --arch amd64

docker manifest annotate ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG} \
    ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}-arm64 --arch arm64

# 推送 manifest
docker manifest push ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}

# 创建 latest 标签
echo "🏷️  创建 latest 标签..."
docker manifest create ${DOCKER_USERNAME}/${IMAGE_NAME}:latest \
    ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}-amd64 \
    ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}-arm64

docker manifest annotate ${DOCKER_USERNAME}/${IMAGE_NAME}:latest \
    ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}-amd64 --arch amd64

docker manifest annotate ${DOCKER_USERNAME}/${IMAGE_NAME}:latest \
    ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}-arm64 --arch arm64

docker manifest push ${DOCKER_USERNAME}/${IMAGE_NAME}:latest

echo ""
echo "✅ 双架构镜像构建完成！"
echo ""
echo "📦 推送的镜像:"
echo "  ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG} (多架构)"
echo "  ${DOCKER_USERNAME}/${IMAGE_NAME}:latest (多架构)"
echo "  ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}-amd64 (AMD64)"
echo "  ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}-arm64 (ARM64)"
echo ""
echo "🚀 使用方法:"
echo "  docker run -d -p 3000:3000 ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}"
echo ""
echo "🎯 Docker 会自动选择适合当前架构的镜像！"
