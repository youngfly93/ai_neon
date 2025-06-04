#!/bin/bash

# 终端颜色设置
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # 无颜色

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}       AI NEON'world 部署脚本         ${NC}"
echo -e "${BLUE}========================================${NC}"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker未安装. 请先安装Docker.${NC}"
    echo -e "${YELLOW}访问 https://docs.docker.com/get-docker/ 获取安装指南${NC}"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}错误: Docker Compose未安装. 请先安装Docker Compose.${NC}"
    echo -e "${YELLOW}访问 https://docs.docker.com/compose/install/ 获取安装指南${NC}"
    exit 1
fi

echo -e "${GREEN}开始部署AI NEON'world...${NC}"

# 创建所需目录
echo -e "${BLUE}创建数据目录...${NC}"
mkdir -p data
mkdir -p public/backgrounds
mkdir -p custom_themes

# 构建并启动容器
echo -e "${BLUE}构建并启动Docker容器...${NC}"
docker-compose down
docker-compose up -d --build

# 检查容器是否成功启动
if [ $? -eq 0 ]; then
    echo -e "${GREEN}部署成功!${NC}"
    
    # 获取服务器IP
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    echo -e "${YELLOW}应用现在运行在: http://${SERVER_IP}:3000${NC}"
    echo -e "${BLUE}查看应用日志: docker-compose logs -f${NC}"
    echo -e "${BLUE}停止应用: docker-compose down${NC}"
else
    echo -e "${RED}部署失败. 请检查日志获取更多信息.${NC}"
    echo -e "${BLUE}查看日志: docker-compose logs${NC}"
fi

echo -e "${BLUE}========================================${NC}" 