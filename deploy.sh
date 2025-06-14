#!/bin/bash

echo "🚀 Visit Tracker 一键部署"
echo ""

# 检查必要工具
echo "🔍 检查环境..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

echo "✅ 环境检查通过"

# 1. 安装依赖
echo "📦 安装前端依赖..."
cd frontend
if [ -f "pnpm-lock.yaml" ] && command -v pnpm &> /dev/null; then
    pnpm install --silent
elif [ -f "yarn.lock" ] && command -v yarn &> /dev/null; then
    yarn install --silent
else
    npm install --silent
fi
cd ..

echo "📦 安装后端依赖..."
cd backend
if [ -f "pnpm-lock.yaml" ] && command -v pnpm &> /dev/null; then
    pnpm install --silent
elif [ -f "yarn.lock" ] && command -v yarn &> /dev/null; then
    yarn install --silent
else
    npm install --silent
fi
cd ..

# 2. 检查并启动数据库
if ! docker ps | grep -q visit-tracker-db; then
  echo "📦 启动数据库..."
  docker run -d --name visit-tracker-db -p 5432:5432 \
    -e POSTGRES_PASSWORD=123456 \
    -e POSTGRES_DB=visit_tracker \
    postgres:15
  echo "⏳ 等待数据库启动..."
  sleep 10
else
  echo "✅ 数据库已运行"
fi

# 3. 配置后端环境
echo "⚙️  配置环境变量..."
cat > backend/.env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=visit_tracker
DB_USER=postgres
DB_PASSWORD=123456
PORT=3000
JWT_SECRET=secret123
CORS_ORIGIN=*
EOF

# 4. 构建前端
echo "🔨 构建前端..."
cd frontend
if [ -f "pnpm-lock.yaml" ] && command -v pnpm &> /dev/null; then
    pnpm run build
elif [ -f "yarn.lock" ] && command -v yarn &> /dev/null; then
    yarn build
else
    npm run build
fi
cd ..

# 5. 复制前端文件到后端
echo "📁 复制前端文件..."
mkdir -p backend/public
cp -r frontend/dist/* backend/public/

# 6. 启动后端 (会自动初始化数据库)
echo "🚀 启动后端服务..."
cd backend
if [ -f "pnpm-lock.yaml" ] && command -v pnpm &> /dev/null; then
    pnpm start &
elif [ -f "yarn.lock" ] && command -v yarn &> /dev/null; then
    yarn start &
else
    npm start &
fi
cd ..

echo ""
echo "✅ 部署完成！"
echo ""
echo "🌐 访问地址: http://localhost:3000"
echo "👤 用户名: admin"
echo "🔑 密码: password"
echo ""
echo "💡 后端会自动检查并初始化数据库表结构"
echo "💡 支持 npm、yarn、pnpm 包管理器"
