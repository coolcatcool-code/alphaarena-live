# 🚀 Cloudflare Workers 迁移指南

## 📋 迁移概述

将 Alpha Arena Live 从 Vercel 迁移到 Cloudflare Pages + Workers

**预估时间**: 1-2 小时
**难度**: 中等
**成本**: 完全免费（Cloudflare Free Plan）

---

## 🎯 Step 1: 安装 Cloudflare 依赖

### 1.1 安装 @cloudflare/next-on-pages

```bash
pnpm add -D @cloudflare/next-on-pages wrangler
```

### 1.2 更新 package.json scripts

在 `package.json` 中添加：

```json
{
  "scripts": {
    "pages:build": "npx @cloudflare/next-on-pages",
    "pages:dev": "npx @cloudflare/next-on-pages --experimental-minify",
    "pages:deploy": "pnpm pages:build && wrangler pages deploy .vercel/output/static",
    "wrangler": "wrangler"
  }
}
```

---

## 🎯 Step 2: 创建 Cloudflare 配置文件

### 2.1 创建 wrangler.toml

```toml
name = "alphaarena-live"
compatibility_date = "2024-10-27"
pages_build_output_dir = ".vercel/output/static"

[observability]
enabled = true

# Cron Triggers for scheduled tasks
[triggers]
crons = ["*/5 * * * *"]  # Every 5 minutes
```

### 2.2 创建 .dev.vars（本地开发环境变量）

```bash
# 复制 .env.local 到 .dev.vars
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=your_openrouter_key
CRON_SECRET=your_cron_secret
```

---

## 🎯 Step 3: 代码调整（兼容性修复）

### 3.1 替换 Node.js https 模块

**问题**: Cloudflare Workers 不支持 Node.js 的 `https` 模块

**修复**: 在 `src/app/api/cron/sync-advanced/route.ts` 中，将 `https.get()` 替换为 `fetch()`

原代码：
```typescript
import * as https from 'https'

async function fetchData<T>(url: string, name: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {...})
  })
}
```

新代码：
```typescript
async function fetchData<T>(url: string, name: string): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AlphaArena-Cron/1.0',
        'Accept': 'application/json'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timed out')
    }
    throw error
  }
}
```

### 3.2 调整 maxDuration

**问题**: Cloudflare Workers Free Plan CPU 时间限制为 10ms，Paid Plan 为 50ms

**修复**: 移除或调整 `maxDuration`

```typescript
// 移除这一行（Cloudflare Workers 不支持）
// export const maxDuration = 300

// 改为使用 runtime edge（可选）
export const runtime = 'edge'
```

### 3.3 更新 next.config.js

添加 Cloudflare 兼容性配置：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['www.alphaarena-live.com', 'alphaarena-live.com'],
    formats: ['image/avif', 'image/webp']
  },
  // Cloudflare Pages 兼容性
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
```

---

## 🎯 Step 4: 创建 Cloudflare Pages 项目

### 4.1 在 Cloudflare Dashboard 中创建项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages**
3. 点击 **Create Application** → **Pages** → **Connect to Git**
4. 选择你的 GitHub 仓库：`coolcatcool-code/alphaarena-live`

### 4.2 配置构建设置

- **Framework preset**: Next.js
- **Build command**: `pnpm pages:build`
- **Build output directory**: `.vercel/output/static`
- **Node version**: `20.x`

### 4.3 设置环境变量

在 Cloudflare Pages 设置中添加：

| 变量名 | 值 | 备注 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 项目 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJxxx...` | Service Role Key（保密） |
| `OPENROUTER_API_KEY` | `sk-or-xxx...` | OpenRouter API Key |
| `CRON_SECRET` | `your-random-secret` | Cron 验证密钥 |
| `NEXT_PUBLIC_APP_URL` | `https://alphaarena-live.pages.dev` | 应用 URL |

---

## 🎯 Step 5: 配置 Cron Triggers

### 5.1 使用 Cloudflare Workers Cron Triggers

**方法 1: 在 wrangler.toml 中配置**（推荐）

```toml
[triggers]
crons = ["*/5 * * * *"]  # 每 5 分钟运行一次
```

**方法 2: 创建独立的 Cron Worker**

创建 `workers/cron-sync.ts`:

```typescript
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // 调用你的 sync endpoint
    const response = await fetch('https://alphaarena-live.pages.dev/api/cron/sync-advanced', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.CRON_SECRET}`
      }
    })

    console.log('Cron sync result:', await response.json())
  }
}
```

### 5.2 配置 Cron Worker 的 wrangler.toml

创建 `workers/wrangler.toml`:

```toml
name = "alphaarena-cron-sync"
main = "cron-sync.ts"
compatibility_date = "2024-10-27"

[triggers]
crons = ["*/5 * * * *"]

[vars]
PAGES_URL = "https://alphaarena-live.pages.dev"

[[env.production.vars]]
CRON_SECRET = "your-cron-secret"
```

---

## 🎯 Step 6: 部署到 Cloudflare

### 6.1 本地测试

```bash
# 构建项目
pnpm pages:build

# 本地预览
npx wrangler pages dev .vercel/output/static
```

### 6.2 首次部署

```bash
# 登录 Cloudflare
npx wrangler login

# 部署到 Pages
pnpm pages:deploy
```

### 6.3 连接到 Git（自动部署）

在 Cloudflare Dashboard 中：
1. 进入你的 Pages 项目
2. **Settings** → **Builds & deployments**
3. 点击 **Connect to Git**
4. 选择分支：`main`
5. 配置自动部署

---

## 🎯 Step 7: 配置自定义域名

### 7.1 在 Cloudflare Pages 中添加域名

1. 进入 Pages 项目 → **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入：`www.alphaarena-live.com`
4. Cloudflare 会自动配置 DNS

### 7.2 更新 DNS 记录

如果域名不在 Cloudflare 托管：
- 添加 CNAME 记录：`www` → `alphaarena-live.pages.dev`

如果在 Cloudflare 托管：
- 自动配置，无需手动操作

### 7.3 配置根域名重定向

在 Cloudflare 中创建 Page Rule 或使用 Bulk Redirects：
- `alphaarena-live.com` → `https://www.alphaarena-live.com` (301 永久重定向)

---

## 🎯 Step 8: 验证迁移

### 8.1 功能检查清单

- [ ] 首页加载正常
- [ ] 实时数据更新
- [ ] 文章页面渲染
- [ ] API endpoints 正常工作
- [ ] Cron 任务自动运行
- [ ] 数据库连接正常
- [ ] 图片加载正常
- [ ] SEO meta tags 正确

### 8.2 测试 Cron 任务

```bash
# 手动触发 cron endpoint
curl -X GET "https://www.alphaarena-live.com/api/cron/sync-advanced" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 8.3 查看 Cron 日志

在 Cloudflare Dashboard:
1. 进入 **Workers & Pages**
2. 选择你的项目
3. 点击 **Logs** → **Real-time logs**

---

## 🎯 Step 9: 清理和优化

### 9.1 移除 Vercel 特定代码

```bash
# 卸载 Vercel Analytics（可选）
pnpm remove @vercel/analytics

# 或替换为 Cloudflare Web Analytics
```

### 9.2 删除 vercel.json

```bash
git rm vercel.json
git commit -m "chore: Remove Vercel config after migration to Cloudflare"
```

### 9.3 更新 README.md

添加 Cloudflare 部署徽章：

```markdown
[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/coolcatcool-code/alphaarena-live)
```

---

## 📊 Cloudflare vs Vercel 对比

| 功能 | Vercel | Cloudflare Workers/Pages |
|------|--------|--------------------------|
| **免费额度** | 100GB 带宽 | 无限带宽 ✅ |
| **请求数** | 无限 | 100,000/天 |
| **构建时间** | 6,000 分钟/月 | 500 次构建/月 |
| **边缘节点** | 全球 | 全球 (275+) ✅ |
| **Cron Jobs** | 需要外部服务 | 内置 Cron Triggers ✅ |
| **冷启动** | ~100ms | <10ms ✅ |
| **成本** | $20+/月 (Pro) | $0 (Free Plan) ✅ |

---

## ⚠️ 注意事项

### Cloudflare Workers 限制

1. **CPU 时间**
   - Free: 10ms CPU 时间/请求
   - Paid: 50ms CPU 时间/请求
   - **影响**: 长时间运行的任务可能需要拆分

2. **内存限制**
   - 128 MB

3. **请求大小**
   - 最大 100 MB

4. **不支持的 Node.js API**
   - `fs`, `path`, `crypto` (部分)
   - 需要使用 Web APIs 替代

### 解决方案

如果遇到 CPU 时间限制：
- 将长时间任务拆分为多个请求
- 使用 Cloudflare Durable Objects（付费功能）
- 使用外部服务（如保留 cron-job.org 调用）

---

## 🆘 故障排除

### 问题 1: 构建失败

**错误**: `Module not found: Can't resolve 'fs'`

**解决**:
```javascript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  }
}
```

### 问题 2: Cron 不执行

**检查**:
1. 确认 `wrangler.toml` 中 cron 配置正确
2. 查看 Cloudflare Dashboard → Workers → Triggers
3. 检查日志中的错误信息

### 问题 3: 环境变量未加载

**解决**:
1. 确认在 Pages 设置中正确添加环境变量
2. 重新部署项目
3. 使用 `console.log(env)` 调试

---

## 📚 参考资料

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)
- [Cloudflare Workers Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)

---

## ✅ 完成后

迁移完成后：
1. ✅ 验证所有功能正常
2. ✅ 监控 Cloudflare Analytics
3. ✅ 更新文档和 README
4. ✅ 通知团队新的部署 URL
5. ✅ 在 Vercel 保留项目 1-2 周作为备份
6. ✅ 更新 Google Search Console 中的域名

---

**祝迁移顺利！** 🎉

如有问题，随时查看 Cloudflare 文档或提问。
