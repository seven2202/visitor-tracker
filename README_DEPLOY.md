# Visit Tracker 部署

## 🚀 一键部署

```bash
./deploy.sh
```

就这么简单！脚本会自动：

1. ✅ 启动 PostgreSQL 数据库
2. ✅ 配置环境变量
3. ✅ 构建前端
4. ✅ 复制前端文件
5. ✅ 启动后端（自动初始化数据库）

## 🌟 新特性：自动数据库初始化

后端启动时会自动：
- 检查数据库表是否存在
- 如果不存在，自动创建所有表
- 插入默认管理员用户
- 插入示例网站数据

**不需要手动执行任何 SQL 脚本！**

## 🌐 访问

http://localhost:3000

**默认登录：**
- 用户名: `admin`
- 密码: `password`

## 🛑 停止服务

```bash
# 停止后端
lsof -ti:3000 | xargs kill -9

# 停止数据库
docker stop visit-tracker-db
```

## 🔄 重新部署

```bash
# 完全重新开始
docker rm -f visit-tracker-db
./deploy.sh
```

**真正的一键部署，零配置！** 🎉
