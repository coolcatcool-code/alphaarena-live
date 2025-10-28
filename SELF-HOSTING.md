# 🏠 自托管部署指南

## 服务器信息

- **IP**: 118.89.53.240
- **系统**: Ubuntu (建议 20.04 或 22.04)
- **用户**: ubuntu
- **Node.js**: 20.x
- **包管理器**: pnpm
- **进程管理**: PM2
- **反向代理**: Nginx (可选)

---

## 🚀 快速部署（3种方法）

### 方法 1: 自动化脚本（推荐）⭐

**在本地电脑上传脚本：**

```bash
# 上传部署脚本
scp deploy.sh ubuntu@118.89.53.240:~/

# SSH 连接到服务器
ssh ubuntu@118.89.53.240

# 执行部署脚本
chmod +x deploy.sh
./deploy.sh
```

脚本会自动完成：
- ✅ 安装 Node.js, pnpm, PM2
- ✅ 克隆代码仓库
- ✅ 安装依赖
- ✅ 构建应用
- ✅ 配置 PM2
- ✅ 设置 Nginx（如果已安装）
- ✅ 配置 Cron 任务

---

### 方法 2: 手动部署（完全控制）

#### 步骤 1: 连接服务器

```bash
ssh ubuntu@118.89.53.240
```

#### 步骤 2: 安装依赖

```bash
# 更新系统
sudo apt-get update

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc

# 安装 PM2
sudo npm install -g pm2

# 安装 Nginx
sudo apt-get install -y nginx
```

#### 步骤 3: 克隆代码

```bash
# 创建目录
sudo mkdir -p /var/www/alphaarena-live
sudo chown -R ubuntu:ubuntu /var/www/alphaarena-live

# 克隆仓库
cd /var/www/alphaarena-live
git clone https://github.com/coolcatcool-code/alphaarena-live.git .
```

#### 步骤 4: 配置环境变量

```bash
# 创建 .env.local
nano .env.local
```

添加以下内容：

```env
NEXT_PUBLIC_SUPABASE_URL=你的_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_key
SUPABASE_SERVICE_ROLE_KEY=你的_service_role_key
OPENROUTER_API_KEY=你的_openrouter_key
CRON_SECRET=你的_cron_secret
NEXT_PUBLIC_APP_URL=http://118.89.53.240:3000
NODE_ENV=production
```

#### 步骤 5: 构建应用

```bash
# 安装依赖
pnpm install

# 构建
pnpm build
```

#### 步骤 6: 启动应用

```bash
# 使用 PM2 启动
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 步骤 7: 配置 Nginx

```bash
# 创建 Nginx 配置
sudo nano /etc/nginx/sites-available/alphaarena-live
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name 118.89.53.240 www.alphaarena-live.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/alphaarena-live /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 步骤 8: 设置 Cron 任务

```bash
# 编辑 crontab
crontab -e

# 添加以下行
*/5 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/sync-advanced > /dev/null 2>&1
```

---

### 方法 3: Docker 部署（隔离环境）

#### 步骤 1: 安装 Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
```

#### 步骤 2: 创建 Dockerfile

项目已包含 Dockerfile，直接使用：

```bash
cd /var/www/alphaarena-live
git clone https://github.com/coolcatcool-code/alphaarena-live.git .
```

#### 步骤 3: 构建镜像

```bash
docker build -t alphaarena-live .
```

#### 步骤 4: 运行容器

```bash
docker run -d \
  --name alphaarena \
  -p 3000:3000 \
  --restart unless-stopped \
  --env-file .env.local \
  alphaarena-live
```

---

## 🔧 管理命令

### PM2 命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs alphaarena

# 重启应用
pm2 restart alphaarena

# 停止应用
pm2 stop alphaarena

# 删除应用
pm2 delete alphaarena
```

### 更新部署

```bash
cd /var/www/alphaarena-live
git pull origin main
pnpm install
pnpm build
pm2 restart alphaarena
```

### 查看日志

```bash
# PM2 日志
pm2 logs alphaarena --lines 100

# 应用日志
tail -f /var/www/alphaarena-live/logs/out.log
tail -f /var/www/alphaarena-live/logs/error.log

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔐 安全配置

### 1. 配置防火墙

```bash
# 安装 UFW
sudo apt-get install ufw

# 允许 SSH
sudo ufw allow 22/tcp

# 允许 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable
```

### 2. 设置 SSL 证书（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d www.alphaarena-live.com -d alphaarena-live.com

# 自动续期
sudo certbot renew --dry-run
```

### 3. 配置环境变量安全

```bash
# 设置正确的权限
chmod 600 /var/www/alphaarena-live/.env.local
```

---

## 📊 监控和维护

### 1. 服务器监控

```bash
# 安装 htop
sudo apt-get install htop

# 查看资源使用
htop

# 查看磁盘空间
df -h

# 查看内存使用
free -h
```

### 2. 应用监控

```bash
# PM2 监控界面
pm2 monit

# 查看进程详情
pm2 show alphaarena
```

### 3. 定期维护

```bash
# 清理日志
pm2 flush

# 清理旧的构建文件
cd /var/www/alphaarena-live
rm -rf .next/cache

# 更新系统
sudo apt-get update && sudo apt-get upgrade
```

---

## 🆘 故障排除

### 问题 1: 端口 3000 被占用

```bash
# 查找占用端口的进程
sudo lsof -i :3000

# 杀死进程
sudo kill -9 <PID>
```

### 问题 2: PM2 启动失败

```bash
# 查看详细错误
pm2 logs alphaarena --err

# 重置 PM2
pm2 kill
pm2 start ecosystem.config.js
```

### 问题 3: Nginx 配置错误

```bash
# 测试配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

### 问题 4: 数据库连接失败

```bash
# 检查环境变量
cat /var/www/alphaarena-live/.env.local

# 测试 Supabase 连接
curl https://YOUR_SUPABASE_URL/rest/v1/
```

---

## 📈 性能优化

### 1. 启用 Gzip 压缩

在 Nginx 配置中添加：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss application/json;
```

### 2. 配置缓存

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. 增加 PM2 实例

```javascript
// ecosystem.config.js
instances: 4,  // 或 'max' 使用所有 CPU 核心
```

---

## 🎯 访问应用

部署完成后，通过以下方式访问：

- **直接访问**: http://118.89.53.240:3000
- **通过 Nginx**: http://118.89.53.240
- **域名**: http://www.alphaarena-live.com (需配置 DNS)

---

## 📞 支持

如果遇到问题：
1. 查看日志：`pm2 logs alphaarena`
2. 检查服务状态：`pm2 status`
3. 验证配置：`nginx -t`

---

**部署愉快！** 🚀
