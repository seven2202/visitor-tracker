#!/bin/bash

echo "🔄 更新 Visit Tracker..."

# 拉取最新镜像
docker-compose -f docker-compose.prod.yml pull

# 重新创建容器
docker-compose -f docker-compose.prod.yml up -d

echo "✅ 更新完成"
