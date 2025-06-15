#!/bin/bash

echo "🚀 Visit Tracker 一键部署"
echo ""

# 检查数据库
if ! docker ps | grep -q visit-tracker-db; then
  echo "启动数据库..."
  docker run -d --name visit-tracker-db -p 5432:5432 \
    -e POSTGRES_PASSWORD=123456 \
    -e POSTGRES_DB=visit_tracker \
    postgres:15
  sleep 10
else
  echo "数据库已运行"
fi

# 配置环境
cat > backend/.env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=visit_tracker
DB_USER=postgres
DB_PASSWORD=123456
PORT=3000
JWT_SECRET=secret123
EOF

# 构建前端
echo "构建前端..."
cd frontend && npm run build && cd ..

# 启动后端
echo "启动后端..."
cd backend && npm start &

echo ""
echo "✅ 完成！访问 http://localhost:3000"
echo "用户名: admin, 密码: password"
