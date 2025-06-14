FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 设置生产环境变量
ENV VITE_API_URL=/api

# 构建应用
RUN npm run build

# 设置工作目录
WORKDIR /app

# 复制构建的文件
COPY --from=0 /app/dist /app/dist

# 安装 serve 包
RUN npm install -g serve

# 暴露端口
EXPOSE 80

# 启动 serve
CMD ["serve", "-s", "dist", "-l", "80"]
