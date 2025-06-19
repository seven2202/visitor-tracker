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
