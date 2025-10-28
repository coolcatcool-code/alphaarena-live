#!/bin/bash

# Alpha Arena Live - Production Deployment Script
# Deploy to your own server

set -e  # Exit on error

echo "🚀 Alpha Arena Live - Deployment Script"
echo "=========================================="
echo ""

# Configuration
APP_NAME="alphaarena-live"
APP_DIR="/var/www/${APP_NAME}"
NODE_VERSION="20"
PM2_APP_NAME="alphaarena"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
   echo -e "${RED}❌ Please do not run as root${NC}"
   exit 1
fi

echo -e "${GREEN}✓${NC} Starting deployment..."

# Step 1: Install system dependencies
echo ""
echo "📦 Step 1: Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y curl git build-essential

# Step 2: Install Node.js (if not installed)
if ! command -v node &> /dev/null; then
    echo ""
    echo "📦 Installing Node.js ${NODE_VERSION}..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}✓${NC} Node.js already installed: $(node --version)"
fi

# Step 3: Install pnpm
if ! command -v pnpm &> /dev/null; then
    echo ""
    echo "📦 Installing pnpm..."
    curl -fsSL https://get.pnpm.io/install.sh | sh -
    export PNPM_HOME="$HOME/.local/share/pnpm"
    export PATH="$PNPM_HOME:$PATH"
else
    echo -e "${GREEN}✓${NC} pnpm already installed: $(pnpm --version)"
fi

# Step 4: Install PM2 (Process Manager)
if ! command -v pm2 &> /dev/null; then
    echo ""
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
    pm2 startup systemd -u $USER --hp $HOME | tail -n 1 | sudo bash
else
    echo -e "${GREEN}✓${NC} PM2 already installed"
fi

# Step 5: Create app directory
echo ""
echo "📁 Step 2: Setting up application directory..."
sudo mkdir -p ${APP_DIR}
sudo chown -R $USER:$USER ${APP_DIR}

# Step 6: Clone or pull repository
if [ -d "${APP_DIR}/.git" ]; then
    echo ""
    echo "📥 Pulling latest changes..."
    cd ${APP_DIR}
    git pull origin main
else
    echo ""
    echo "📥 Cloning repository..."
    git clone https://github.com/coolcatcool-code/alphaarena-live.git ${APP_DIR}
    cd ${APP_DIR}
fi

# Step 7: Setup environment variables
echo ""
echo "🔐 Step 3: Setting up environment variables..."
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local not found!${NC}"
    echo "Please create .env.local with your configuration:"
    echo ""
    cat <<EOF
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=your_openrouter_key
CRON_SECRET=your_cron_secret
NEXT_PUBLIC_APP_URL=http://118.89.53.240:3000
NODE_ENV=production
EOF
    echo ""
    echo "Press Enter after creating .env.local to continue..."
    read
fi

# Step 8: Install dependencies
echo ""
echo "📦 Step 4: Installing dependencies..."
pnpm install --frozen-lockfile

# Step 9: Build application
echo ""
echo "🔨 Step 5: Building application..."
pnpm build

# Step 10: Setup PM2
echo ""
echo "🔧 Step 6: Setting up PM2..."

# Create PM2 ecosystem file
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '${PM2_APP_NAME}',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    cwd: '${APP_DIR}',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '${APP_DIR}/logs/error.log',
    out_file: '${APP_DIR}/logs/out.log',
    time: true
  }]
}
EOF

# Create logs directory
mkdir -p logs

# Step 11: Start/Restart application
echo ""
echo "🚀 Step 7: Starting application..."
pm2 delete ${PM2_APP_NAME} 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Step 12: Setup Nginx (if needed)
echo ""
echo "🌐 Step 8: Nginx configuration..."
if command -v nginx &> /dev/null; then
    echo "Nginx detected. Creating configuration..."

    sudo tee /etc/nginx/sites-available/${APP_NAME} > /dev/null <<EOF
server {
    listen 80;
    server_name 118.89.53.240 www.alphaarena-live.com alphaarena-live.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    sudo ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    echo -e "${GREEN}✓${NC} Nginx configured"
else
    echo -e "${YELLOW}⚠️  Nginx not installed. Application running on port 3000${NC}"
fi

# Step 13: Setup Cron for data sync
echo ""
echo "⏰ Step 9: Setting up cron job..."
CRON_JOB="*/5 * * * * curl -H \"Authorization: Bearer \$(grep CRON_SECRET ${APP_DIR}/.env.local | cut -d '=' -f2)\" http://localhost:3000/api/cron/sync-advanced > /dev/null 2>&1"
(crontab -l 2>/dev/null | grep -v "sync-advanced" ; echo "$CRON_JOB") | crontab -
echo -e "${GREEN}✓${NC} Cron job installed"

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Application Status:"
pm2 status
echo ""
echo "📊 Logs:"
echo "  View logs: pm2 logs ${PM2_APP_NAME}"
echo "  Error logs: tail -f ${APP_DIR}/logs/error.log"
echo "  Output logs: tail -f ${APP_DIR}/logs/out.log"
echo ""
echo "🌐 Access:"
echo "  Local: http://localhost:3000"
echo "  Public: http://118.89.53.240"
if command -v nginx &> /dev/null; then
    echo "  (via Nginx on port 80)"
fi
echo ""
echo "🔧 Useful commands:"
echo "  Restart: pm2 restart ${PM2_APP_NAME}"
echo "  Stop: pm2 stop ${PM2_APP_NAME}"
echo "  View status: pm2 status"
echo "  View logs: pm2 logs ${PM2_APP_NAME}"
echo ""
