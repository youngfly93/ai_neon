FROM node:16-alpine

# 创建应用目录
WORKDIR /usr/src/app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制应用代码
COPY . .

# 创建默认的空文件夹
RUN mkdir -p public/backgrounds

# 暴露端口
EXPOSE 3000

# 运行应用
CMD ["node", "server.js"] 