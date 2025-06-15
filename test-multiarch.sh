#!/bin/bash

echo "🧪 测试多架构 Visit Tracker 镜像"
echo ""

# 配置
IMAGE="seven222/visit-tracker:v1.0.1"

echo "📋 测试镜像: $IMAGE"
echo ""

# 检查 manifest
echo "🔍 检查多架构 manifest..."
docker manifest inspect $IMAGE | jq '.manifests[] | {architecture: .platform.architecture, os: .platform.os, digest: .digest}'

echo ""

# 测试 AMD64 镜像
echo "🔨 测试 AMD64 镜像..."
docker run --rm --platform linux/amd64 $IMAGE node --version

echo ""

# 测试 ARM64 镜像
echo "🔨 测试 ARM64 镜像..."
docker run --rm --platform linux/arm64 $IMAGE node --version

echo ""

# 测试自动选择架构
echo "🎯 测试自动架构选择..."
docker run --rm $IMAGE node --version

echo ""

# 测试健康检查
echo "🏥 测试健康检查..."
docker run --rm -d --name test-visit-tracker -p 3001:3000 \
  -e DB_HOST=localhost \
  -e DB_PASSWORD=test123 \
  -e REDIS_HOST=localhost \
  -e REDIS_PASSWORD=test123 \
  -e JWT_SECRET=test-secret \
  $IMAGE

echo "等待容器启动..."
sleep 10

# 检查健康状态
if curl -s http://localhost:3001/health &> /dev/null; then
    echo "✅ 健康检查通过"
    curl -s http://localhost:3001/health | jq .
else
    echo "❌ 健康检查失败"
    docker logs test-visit-tracker
fi

# 清理
echo ""
echo "🧹 清理测试容器..."
docker stop test-visit-tracker &> /dev/null || true
docker rm test-visit-tracker &> /dev/null || true

echo ""
echo "✅ 多架构镜像测试完成！"
echo ""
echo "📦 可用镜像:"
echo "  $IMAGE (多架构 - 自动选择)"
echo "  seven222/visit-tracker:v1.0.1-amd64 (AMD64 专用)"
echo "  seven222/visit-tracker:v1.0.1-arm64 (ARM64 专用)"
echo ""
echo "🚀 部署命令:"
echo "  docker run -d -p 3000:3000 $IMAGE"
echo "  docker-compose -f docker-compose.production.yml up -d"
