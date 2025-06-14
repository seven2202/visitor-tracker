#!/bin/bash

set -e

echo "🔧 修复 Docker 架构问题"
echo ""

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
        echo "❌ 不支持的架构: $ARCH"
        exit 1
        ;;
esac

echo "🔍 检测到架构: $ARCH"
echo "🎯 目标平台: $PLATFORM"
echo ""

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# 删除旧镜像
echo "🗑️  删除旧镜像..."
docker rmi seven222/visit-tracker:latest 2>/dev/null || true
docker rmi visit-tracker:test 2>/dev/null || true

# 重新构建镜像（指定平台）
echo "🔨 重新构建镜像..."
docker build --platform $PLATFORM -t seven222/visit-tracker:latest .

# 重新启动服务
echo "🚀 重新启动服务..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ 等待服务启动..."
sleep 15

# 检查服务状态
echo "🔍 检查服务状态..."
if curl -s http://localhost:3000/health &> /dev/null; then
    echo "✅ 服务启动成功！"
    echo ""
    echo "🌐 访问地址: http://localhost:3000"
    echo "👤 用户名: admin"
    echo "🔑 密码: password"
else
    echo "❌ 服务启动失败，查看日志:"
    echo "docker-compose -f docker-compose.prod.yml logs app"
fi
