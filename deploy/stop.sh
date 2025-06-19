#!/bin/bash

echo "🛑 停止 Visit Tracker..."
docker-compose -f docker-compose.prod.yml down

echo "✅ 服务已停止"
