# 🚀 Alpha Arena Live - 部署指南

## 快速部署到 Vercel

### 方法 1: 通过 GitHub（推荐）

#### 步骤 1: 推送到 GitHub

```bash
# 1. 在 GitHub 创建新仓库
# 访问 https://github.com/new
# 仓库名: alphaarena-live
# 不要初始化 README, .gitignore, license

# 2. 连接远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/alphaarena-live.git

# 3. 推送代码
git branch -M main
git push -u origin main
```

#### 步骤 2: 部署到 Vercel

1. **访问 Vercel**
   - 打开 https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择你的 GitHub 仓库 `alphaarena-live`
   - 点击 "Import"

3. **配置项目**
   - Framework Preset: `Next.js` (自动检测)
   - Root Directory: `./` (默认)
   - Build Command: `pnpm build` (自动)
   - Output Directory: `.next` (自动)

4. **添加环境变量**
   点击 "Environment Variables"，添加以下变量：

   ```
   # Supabase Database
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...

   # Supabase API
   NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Analytics (可选)
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

   # Cron Secret
   CRON_SECRET=your-random-secret-key
   ```

5. **部署**
   - 点击 "Deploy"
   - 等待构建完成（约 2-3 分钟）
   - 完成后会获得一个 URL，例如：`https://alphaarena-live.vercel.app`

### 方法 2: 使用 Vercel CLI

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 部署（首次）
vercel

# 根据提示选择：
# Set up and deploy? Y
# Which scope? (选择你的账户)
# Link to existing project? N
# What's your project's name? alphaarena-live
# In which directory is your code located? ./
# Want to override the settings? N

# 4. 添加环境变量
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# 5. 部署到生产环境
vercel --prod
```

---

## 🌐 配置自定义域名

### 在 Vercel 配置

1. **进入项目设置**
   - Vercel Dashboard → 选择项目
   - Settings → Domains

2. **添加域名**
   - 输入 `alphaarena-live.com`
   - 点击 "Add"

3. **配置 DNS**

   Vercel 会显示需要配置的 DNS 记录，通常是：

   **选项 A: 使用 A 记录**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

   **选项 B: 使用 CNAME（推荐）**
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

4. **在域名注册商配置**

   以 Cloudflare 为例：
   - 登录 Cloudflare
   - 选择域名 `alphaarena-live.com`
   - DNS → Records → Add Record
   - 添加上述记录
   - 等待 DNS 传播（5-30 分钟）

5. **验证**
   - 等待 Vercel 验证完成（显示绿色 ✓）
   - SSL 证书自动生成
   - 访问 `https://alphaarena-live.com`

---

## 🗄️ 数据库迁移

部署后运行数据库迁移：

### 方法 1: 本地运行（推荐用于首次部署）

```bash
# 1. 确保本地环境变量已配置
# 复制 Vercel 的环境变量到本地 .env

# 2. 生成 Prisma 客户端
pnpm prisma generate

# 3. 推送数据库架构
pnpm prisma db push

# 或使用迁移
pnpm prisma migrate deploy
```

### 方法 2: 通过 Vercel 环境

在 Vercel 项目中添加一个临时的 API 路由：

```typescript
// src/app/api/migrate/route.ts
import { execSync } from 'child_process'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')

  // 验证密钥（从环境变量获取）
  if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    // 运行迁移
    execSync('npx prisma db push --accept-data-loss')

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

然后访问：`https://your-app.vercel.app/api/migrate?secret=your-migration-secret`

**⚠️ 运行后记得删除这个文件！**

---

## ✅ 部署后检查清单

```bash
# 1. 检查网站可访问
curl -I https://alphaarena-live.com
# 期望: HTTP/2 200

# 2. 检查 API 正常
curl https://alphaarena-live.com/api/leaderboard
# 期望: 返回 JSON 数据

# 3. 检查环境变量
# Vercel Dashboard → Settings → Environment Variables
# 确认所有变量都已设置

# 4. 检查构建日志
# Vercel Dashboard → Deployments → 最新部署 → Logs
# 确认无错误

# 5. 检查数据库连接
# 访问网站，查看是否显示数据
# 打开浏览器控制台，确认无错误

# 6. 检查 SEO
# 访问 view-source:https://alphaarena-live.com
# 确认 meta 标签正确

# 7. 性能测试
# 使用 Lighthouse (Chrome DevTools)
# 期望: Performance > 90
```

---

## 🔄 持续部署

### 自动部署

GitHub 仓库配置好后，每次推送到 `main` 分支都会自动触发部署：

```bash
# 1. 修改代码
git add .
git commit -m "Update feature X"

# 2. 推送
git push origin main

# 3. Vercel 自动部署
# 访问 Vercel Dashboard 查看进度
```

### 预览部署

创建 Pull Request 时，Vercel 会自动创建预览部署：

```bash
# 1. 创建新分支
git checkout -b feature/new-analysis

# 2. 提交修改
git add .
git commit -m "Add new analysis article"

# 3. 推送
git push origin feature/new-analysis

# 4. 在 GitHub 创建 Pull Request
# Vercel 会在 PR 中评论预览链接
```

---

## 📊 监控和分析

### Vercel Analytics

1. **启用 Vercel Analytics**
   ```bash
   pnpm add @vercel/analytics
   ```

2. **添加到 layout.tsx**
   ```typescript
   import { Analytics } from '@vercel/analytics/react'

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Analytics />
         </body>
       </html>
     )
   }
   ```

3. **查看数据**
   - Vercel Dashboard → Analytics
   - 查看访问量、页面性能等

### Google Analytics

1. **配置 GA4**
   - 在 Vercel 环境变量中设置 `NEXT_PUBLIC_GA_ID`

2. **查看数据**
   - 访问 https://analytics.google.com
   - 实时报告、用户报告等

---

## 🛠️ 故障排除

### 部署失败

**错误: "Build failed"**
```bash
# 检查构建日志
# Vercel Dashboard → Deployments → 失败的部署 → Logs

# 常见原因:
# 1. TypeScript 错误
pnpm type-check

# 2. 缺少依赖
pnpm install

# 3. 环境变量缺失
# 检查 Vercel Environment Variables
```

**错误: "Module not found"**
```bash
# 确保所有依赖都在 package.json 中
# 本地测试构建:
pnpm build

# 如果本地成功但 Vercel 失败，检查 Node 版本
# package.json 中指定版本:
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 数据库连接失败

**错误: "Can't reach database server"**
```bash
# 1. 检查 DATABASE_URL 格式
# 正确格式:
DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# 2. 检查 Supabase IP 白名单
# Supabase Dashboard → Settings → Database → Connection Pooling
# 确保允许所有 IP: 0.0.0.0/0

# 3. 测试连接
# 使用 Supabase SQL Editor 运行:
SELECT 1;
```

### 环境变量问题

**客户端访问不到环境变量**
```bash
# 客户端环境变量必须以 NEXT_PUBLIC_ 开头
# ✅ 正确:
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co

# ❌ 错误:
SUPABASE_URL=https://xxx.supabase.co

# 修改后需要重新部署
vercel --prod
```

### 域名 SSL 证书问题

**错误: "SSL handshake failed"**
```bash
# 1. 等待 DNS 传播
# 使用工具检查: https://dnschecker.org

# 2. 强制 SSL 更新
# Vercel Dashboard → Settings → Domains
# 点击域名旁的 "Refresh SSL"

# 3. 检查 DNS 配置
# 确保 CNAME 记录正确指向 Vercel
dig alphaarena-live.com
```

---

## 🚀 性能优化

### 1. 启用 Edge Caching

在 API 路由中添加缓存：

```typescript
// src/app/api/leaderboard/route.ts
export const revalidate = 300 // 5分钟缓存

export async function GET() {
  // ...
}
```

### 2. 图片优化

使用 Next.js Image 组件：

```tsx
import Image from 'next/image'

<Image
  src="/og-image.png"
  alt="Alpha Arena"
  width={1200}
  height={630}
  priority
/>
```

### 3. 代码分割

使用 dynamic imports：

```tsx
import dynamic from 'next/dynamic'

const TrendChart = dynamic(() => import('@/components/TrendChart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false
})
```

### 4. 启用压缩

在 `next.config.js` 中：

```javascript
module.exports = {
  compress: true,
  swcMinify: true,
}
```

---

## 📱 下一步行动

### 部署成功后

1. **提交网站到搜索引擎**
   ```bash
   # Google Search Console
   https://search.google.com/search-console

   # 提交 sitemap
   https://alphaarena-live.com/sitemap.xml
   ```

2. **社交媒体分享**
   - 在 Twitter 发布上线公告
   - 在 Reddit 相关 subreddit 发帖
   - 在 Product Hunt 提交产品

3. **监控和优化**
   - 每天查看 Vercel Analytics
   - 检查 Google Analytics 数据
   - 根据用户反馈优化

4. **内容更新**
   - 定期发布新的分析文章
   - 更新排行榜数据
   - 添加新功能

---

## 需要帮助？

- **Vercel 文档**: https://vercel.com/docs
- **Next.js 文档**: https://nextjs.org/docs
- **Supabase 文档**: https://supabase.com/docs
- **Prisma 文档**: https://www.prisma.io/docs

祝部署顺利！🎉
