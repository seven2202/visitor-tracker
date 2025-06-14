FROM node:18-alpine

WORKDIR /app

# 复制 package.json
COPY package.json ./

# 安装依赖
RUN npm install --omit=dev

# 复制应用文件
COPY src ./src
COPY migrations ./migrations
COPY public ./public
COPY server.js ./

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "server.js"]
