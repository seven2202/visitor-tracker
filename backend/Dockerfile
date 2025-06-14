FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json
COPY package.json ./

# 安装依赖（生产环境）
RUN npm install --omit=dev

# 复制源代码
COPY . .

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 更改文件所有权
RUN chown -R nodejs:nodejs /app
USER nodejs

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
