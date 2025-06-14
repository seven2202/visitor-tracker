# 🚀 Visit Tracker 快速开始

## 💨 超快速部署（3 分钟）

```bash
# 1. 克隆项目
git clone <your-repository>
cd visit-tracker

# 2. 运行安装脚本（如果没有 Node.js/Docker）
./install-deps.sh

# 3. 一键部署
./deploy.sh
```

## 🎯 访问应用

打开浏览器访问：**http://localhost:3000**

**默认登录：**
- 用户名：`admin`
- 密码：`password`

## 🛠️ 如果遇到问题

### ❌ "Node.js 未安装"
```bash
# 运行依赖安装脚本
./install-deps.sh
```

### ❌ "Docker 未安装" 
```bash
# macOS
brew install --cask docker

# Ubuntu/Debian
curl -fsSL https://get.docker.com | sudo sh

# 或运行
./install-deps.sh
```

### ❌ "端口 3000 被占用"
```bash
# 杀掉占用端口的进程
lsof -ti:3000 | xargs kill -9

# 重新部署
./deploy.sh
```

### ❌ "数据库连接失败"
```bash
# 重启数据库
docker restart visit-tracker-db

# 或完全重新部署
docker rm -f visit-tracker-db
./deploy.sh
```

## 🔄 重新部署

```bash
# 停止服务
lsof -ti:3000 | xargs kill -9
docker rm -f visit-tracker-db

# 重新部署
./deploy.sh
```

## 📊 验证部署

```bash
# 检查服务状态
curl http://localhost:3000/health

# 检查登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

## 🎉 完成！

现在你有一个完整运行的 Visit Tracker 系统：

- 📊 **管理后台**：http://localhost:3000
- 🔌 **API 接口**：http://localhost:3000/api
- 🗄️ **数据库**：PostgreSQL (自动初始化)
- 👤 **默认用户**：admin/password

**开始使用吧！** 🚀
