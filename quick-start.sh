#!/bin/bash

# Alpha Arena Live - 快速启动脚本
# 用途：自动化初始化项目

set -e  # 遇到错误立即退出

echo "🚀 Alpha Arena Live - Quick Start Script"
echo "========================================"
echo ""

# 检查Node.js版本
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Error: Node.js 18 or higher required. Current: $(node -v)"
  exit 1
fi
echo "✅ Node.js version: $(node -v)"
echo ""

# 检查pnpm
echo "📦 Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
  echo "⚠️  pnpm not found. Installing..."
  npm install -g pnpm
fi
echo "✅ pnpm version: $(pnpm -v)"
echo ""

# 初始化Next.js项目
echo "🔧 Initializing Next.js project..."
if [ ! -f "package.json" ]; then
  echo "Creating Next.js app..."
  pnpm create next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-git
else
  echo "✅ package.json already exists, skipping..."
fi
echo ""

# 安装依赖
echo "📦 Installing dependencies..."
pnpm add @radix-ui/react-slot @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-select
pnpm add class-variance-authority clsx tailwind-merge
pnpm add lucide-react
pnpm add chart.js react-chartjs-2
pnpm add @tanstack/react-query
pnpm add axios
pnpm add date-fns
pnpm add react-markdown remark-gfm rehype-highlight
pnpm add @prisma/client
pnpm add framer-motion
pnpm add @vercel/analytics

pnpm add -D @types/node prettier prisma
echo "✅ Dependencies installed"
echo ""

# 初始化shadcn/ui
echo "🎨 Setting up shadcn/ui..."
if [ ! -f "components.json" ]; then
  npx shadcn-ui@latest init -y
  npx shadcn-ui@latest add button card badge table tabs select
else
  echo "✅ shadcn/ui already configured"
fi
echo ""

# 初始化Prisma
echo "🗄️  Setting up Prisma..."
if [ ! -f "prisma/schema.prisma" ]; then
  npx prisma init
  echo "✅ Prisma initialized"
else
  echo "✅ Prisma already initialized"
fi
echo ""

# 创建环境变量文件
echo "🔐 Creating environment files..."
if [ ! -f ".env.local" ]; then
  cat > .env.local << EOF
# Database (Supabase)
DATABASE_URL="postgresql://postgres:password@localhost:5432/alphaarena"
DIRECT_URL="postgresql://postgres:password@localhost:5432/alphaarena"

# Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Cron Secret (generate a random string)
CRON_SECRET="$(openssl rand -base64 32)"

# Optional
NEXT_PUBLIC_SENTRY_DSN=""
EOF
  echo "✅ .env.local created"
else
  echo "✅ .env.local already exists"
fi

if [ ! -f ".env.example" ]; then
  cat > .env.example << EOF
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
CRON_SECRET="your-secret-here"
EOF
  echo "✅ .env.example created"
fi
echo ""

# 创建基础目录结构
echo "📁 Creating project structure..."
mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/components/features/Leaderboard
mkdir -p src/components/features/Charts
mkdir -p src/components/features/TradeHistory
mkdir -p src/components/features/Articles
mkdir -p src/components/common
mkdir -p src/lib/api
mkdir -p src/lib/scraper
mkdir -p src/lib/database
mkdir -p src/lib/articles
mkdir -p src/lib/utils
mkdir -p src/types
mkdir -p src/hooks
mkdir -p src/config
mkdir -p src/styles
mkdir -p content/articles
mkdir -p public/images/ai-avatars
mkdir -p scripts
echo "✅ Directory structure created"
echo ""

# 创建.gitignore
echo "📝 Creating .gitignore..."
if [ ! -f ".gitignore" ]; then
  cat > .gitignore << EOF
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Next.js
.next/
out/
build
dist

# Production
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Misc
.DS_Store
*.pem

# Debug
*.tsbuildinfo

# Local env files
.env*.local
.env

# Vercel
.vercel

# Prisma
prisma/migrations/

# IDEs
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
.idea
*.swp
*.swo
*~

# TypeScript
*.tsbuildinfo
EOF
  echo "✅ .gitignore created"
fi
echo ""

# 初始化Git（如果还没有）
echo "🔧 Setting up Git..."
if [ ! -d ".git" ]; then
  git init
  git add .
  git commit -m "Initial commit: Alpha Arena Live setup"
  echo "✅ Git initialized"
else
  echo "✅ Git already initialized"
fi
echo ""

# 打印下一步操作
echo ""
echo "=========================================="
echo "✅ Quick Start Complete!"
echo "=========================================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Update .env.local with your actual database credentials"
echo "   - Get Supabase credentials from https://supabase.com"
echo "   - Get Google Analytics ID from https://analytics.google.com"
echo ""
echo "2. Update Prisma schema (prisma/schema.prisma)"
echo "   - Copy schema from DEVELOPMENT-GUIDE.md"
echo ""
echo "3. Generate Prisma client:"
echo "   pnpm prisma generate"
echo "   pnpm prisma db push"
echo ""
echo "4. Start development server:"
echo "   pnpm dev"
echo ""
echo "5. Visit http://localhost:3000"
echo ""
echo "📚 For detailed instructions, see:"
echo "   - EXECUTION-PLAN.md (execution roadmap)"
echo "   - DEVELOPMENT-GUIDE.md (technical docs)"
echo ""
echo "🚀 Happy coding!"
