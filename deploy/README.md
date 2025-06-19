# Visit Tracker 部署包

## 快速启动

```bash
# 启动服务
./start.sh

# 停止服务
./stop.sh

# 更新应用
./update.sh
```

## 访问信息

- **应用地址**: http://localhost:3000
- **默认账户**: admin / password

## 配置修改

编辑 `docker-compose.prod.yml` 文件修改配置：
- 数据库密码
- Redis 密码  
- JWT 密钥
- CORS 设置

## 镜像信息

- **镜像**: seven222/visit-tracker:20250618_232349
- **构建时间**: Wed Jun 18 23:25:22 CST 2025
