#!/bin/bash

set -e

echo "🚀 一键部署 Visit Tracker"

# 1. 启动数据库
echo "启动数据库..."
docker run -d --name visit-tracker-db -p 5432:5432 \
  -e POSTGRES_PASSWORD=123456 \
  -e POSTGRES_DB=visit_tracker \
  postgres:15 2>/dev/null || echo "数据库已存在"

sleep 5

# 2. 配置后端环境
echo "配置后端..."
cat > backend/.env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=visit_tracker
DB_USER=postgres
DB_PASSWORD=123456
PORT=3000
JWT_SECRET=secret123
EOF

# 3. 检查依赖
if [ ! -d "backend/node_modules" ]; then
  echo "❌ 请先安装后端依赖: cd backend && npm install"
  exit 1
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "❌ 请先安装前端依赖: cd frontend && npm install"
  exit 1
fi

# 4. 构建前端
echo "构建前端..."
cd frontend
npm run build --silent 2>/dev/null || npm run build
cd ..

# 5. 启动后端
echo "启动服务..."
cd backend
npm start &
cd ..

echo ""
echo "✅ 部署完成！"
echo "🌐 访问: http://localhost:3000"
echo "👤 用户名: admin"
echo "🔑 密码: password"
