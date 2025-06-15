# Visit Tracker 部署

## 真正的一键部署

```bash
# 1. 前端
cd frontend && npm install && npm run build && cd ..

# 2. 后端
cd backend && npm install && cd ..

# 3. 数据库
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=123456 -e POSTGRES_DB=visit_tracker postgres:15

# 4. 配置
echo "DB_HOST=localhost
DB_PORT=5432
DB_NAME=visit_tracker
DB_USER=postgres
DB_PASSWORD=123456
PORT=3000
JWT_SECRET=secret123" > backend/.env

# 5. 启动
cd backend && npm start
```

## 访问

http://localhost:3000

用户名: admin, 密码: password

## 停止

```bash
docker stop postgres
```

就这样，不需要复杂的脚本。
