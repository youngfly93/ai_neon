# AI NEON'world 部署指南

## Docker部署步骤

### 前提条件

- 安装Docker: [Docker安装指南](https://docs.docker.com/get-docker/)
- 安装Docker Compose: [Docker Compose安装指南](https://docs.docker.com/compose/install/)

### 部署步骤

1. **克隆代码到服务器**

```bash
git clone <你的仓库地址> ai-neon-world
cd ai-neon-world
```

2. **使用Docker Compose构建并启动**

```bash
docker-compose up -d
```

此命令会构建Docker镜像并在后台启动容器。

3. **验证部署**

访问 `http://你的服务器IP:3000` 确认应用已成功部署。

4. **查看日志**

```bash
docker-compose logs -f
```

### 数据持久化

配置中已设置以下数据卷映射:

- `./data:/usr/src/app/data`: 用于存储应用数据
- `./public/backgrounds:/usr/src/app/public/backgrounds`: 用于保存自定义背景
- `./custom_themes:/usr/src/app/custom_themes`: 用于保存自定义主题

### 更新应用

当需要更新应用时:

```bash
git pull
docker-compose down
docker-compose up -d --build
```

### 停止应用

```bash
docker-compose down
```

## 直接部署 (不使用Docker)

如果你不想使用Docker，也可以直接部署:

1. **安装Node.js**: 确保服务器上已安装Node.js 14或更高版本

2. **克隆并安装**:
   ```bash
   git clone <你的仓库地址> ai-neon-world
   cd ai-neon-world
   npm install
   ```

3. **启动应用**:
   ```bash
   NODE_ENV=production node server.js
   ```

4. **使用PM2管理应用** (推荐):
   ```bash
   npm install -g pm2
   pm2 start server.js --name ai-neon-world
   ```

## NGINX配置 (可选)

如果你想使用NGINX作为反向代理:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 问题排查

1. **端口冲突**: 如果3000端口被占用，可在docker-compose.yml中修改为其他端口
2. **权限问题**: 确保数据卷目录有正确的权限
3. **连接问题**: 检查服务器防火墙设置是否允许3000端口 