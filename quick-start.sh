#!/bin/bash

# Visit Tracker 快速启动脚本
# 适用于首次部署或快速测试

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    Visit Tracker                             ║"
echo "║                   快速启动脚本                                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker 未安装，请先安装 Docker${NC}"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker 未运行，请启动 Docker${NC}"
    exit 1
fi

# 检查 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker Compose 未安装，请先安装 Docker Compose${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker 环境检查通过${NC}"

# 选择部署模式
echo ""
echo "请选择部署模式："
echo "1) 开发环境 (本地构建)"
echo "2) 生产环境 (从 Docker Hub 拉取)"
echo "3) 仅构建镜像"
echo ""
read -p "请输入选择 (1-3): " choice

case $choice in
    1)
        MODE="dev"
        echo -e "${GREEN}选择：开发环境部署${NC}"
        ;;
    2)
        MODE="prod"
        echo -e "${GREEN}选择：生产环境部署${NC}"
        ;;
    3)
        MODE="build"
        echo -e "${GREEN}选择：仅构建镜像${NC}"
        ;;
    *)
        echo -e "${YELLOW}无效选择，使用默认开发环境${NC}"
        MODE="dev"
        ;;
esac

# 选择端口
echo ""
read -p "请输入 HTTP 端口 (默认 80): " port
PORT=${port:-80}

echo -e "${GREEN}HTTP 端口：${PORT}${NC}"

# 确认部署
echo ""
echo -e "${YELLOW}即将开始部署，配置如下：${NC}"
echo "  部署模式: ${MODE}"
echo "  HTTP 端口: ${PORT}"
echo ""
read -p "确认继续？(y/N): " confirm

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "部署已取消"
    exit 0
fi

# 执行部署
echo ""
echo -e "${GREEN}开始部署...${NC}"

# 给部署脚本执行权限
chmod +x deploy-simple.sh

# 根据模式执行部署
case $MODE in
    "dev")
        ./deploy-simple.sh --dev -p "$PORT"
        ;;
    "prod")
        ./deploy-simple.sh --prod -p "$PORT"
        ;;
    "build")
        ./deploy-simple.sh --build-only
        ;;
esac

echo ""
echo -e "${GREEN}🎉 快速启动完成！${NC}"
echo ""
echo "访问地址："
echo "  管理后台: http://localhost:${PORT}"
echo "  API 接口: http://localhost:${PORT}/api"
echo "  SDK 文件: http://localhost:${PORT}/sdk/tracker.js"
echo ""
echo "默认登录："
echo "  用户名: admin"
echo "  密码: password"
echo ""
echo "常用命令："
echo "  查看状态: docker-compose ps"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
