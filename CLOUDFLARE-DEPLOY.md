# ☁️ Cloudflare Pages 部署指南（简化版）

## ⚡ 快速部署（5分钟）

Cloudflare Pages 现在**原生支持 Next.js**，无需适配器！

---

## 📋 部署步骤

### 1️⃣ 在 Cloudflare Dashboard 创建项目

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages**
3. 点击 **Create Application** → **Pages** → **Connect to Git**

### 2️⃣ 连接 GitHub 仓库

1. 授权 Cloudflare 访问你的 GitHub
2. 选择仓库：`coolcatcool-code/alphaarena-live`
3. 分支：`main`

### 3️⃣ 配置构建设置

```yaml
Framework preset: Next.js
Build command: pnpm build
Build output directory: .next
Root directory: (leave blank)
Node version: 20
```

### 4️⃣ 添加环境变量

在 **Environment variables** 中添加：

| 变量名 | 值 | 来源 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | .env.local |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJxxx...` | .env.local |
| `OPENROUTER_API_KEY` | `sk-or-xxx...` | .env.local |
| `CRON_SECRET` | `your-random-secret` | .env.local |
| `NEXT_PUBLIC_APP_URL` | `https://alphaarena-live.pages.dev` | 新生成 |

**重要**：确保在 **Production** 和 **Preview** 两个环境都添加这些变量！

### 5️⃣ 部署

1. 点击 **Save and Deploy**
2. 等待构建完成（约 3-5 分钟）
3. 访问分配的 URL：`https://alphaarena-live.pages.dev`

---

## 🔄 配置 Cron Triggers

### 在 Cloudflare Dashboard 中

1. 进入你的 Pages 项目
2. **Settings** → **Functions** → **Cron Triggers**
3. 点击 **Add Cron Trigger**

配置如下：

```yaml
Cron expression: */5 * * * *  # 每5分钟
URL: /api/cron/sync-advanced
```

4. 添加环境变量（如果还没有）：
   - `CRON_SECRET` = 你的密钥

5. 保存

---

## 🌐 配置自定义域名

### 方法 1：在 Cloudflare（域名已在 Cloudflare）

1. 在 Pages 项目中：**Custom domains** → **Set up a custom domain**
2. 输入：`www.alphaarena-live.com`
3. Cloudflare 自动配置 DNS ✅

### 方法 2：外部 DNS

如果域名不在 Cloudflare：
1. 添加 CNAME 记录：
   ```
   Type: CNAME
   Name: www
   Content: alphaarena-live.pages.dev
   TTL: Auto
   ```

2. 在 Cloudflare Pages 添加自定义域名

### 根域名重定向

在 Cloudflare 中创建 Redirect Rule：
```
Source: alphaarena-live.com
Target: https://www.alphaarena-live.com
Status: 301 (Permanent)
```

---

## ✅ 验证部署

部署成功后，测试以下功能：

### 基础功能
```bash
# 检查首页
curl https://alphaarena-live.pages.dev

# 检查 API
curl https://alphaarena-live.pages.dev/api/leaderboard

# 检查文章页面
curl https://alphaarena-live.pages.dev/analysis/daily-report-2025-10-27
```

### Cron 任务（手动触发测试）
```bash
curl -X GET "https://alphaarena-live.pages.dev/api/cron/sync-advanced" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

预期响应：
```json
{
  "success": true,
  "timestamp": "2025-10-28T...",
  "duration": "2.5s",
  "analytics": {
    "synced": 6,
    "skipped": 0
  }
}
```

---

## 🔍 查看日志

### Real-time Logs

1. 进入 Pages 项目
2. **Logs** → **Begin log stream**
3. 触发一次 cron 任务
4. 查看实时输出

### Function Invocations

1. **Analytics** → **Function Invocations**
2. 查看每个 API endpoint 的调用次数和错误率

---

## ⚠️ 常见问题

### 问题 1: 构建失败 - "Prisma not found"

**解决**：
确保 `build` 命令包含 `prisma generate`：
```json
"build": "prisma generate && next build"
```

### 问题 2: 环境变量未生效

**解决**：
1. 检查变量名拼写
2. 确保在 **Production** 环境添加
3. 重新部署：`git commit --allow-empty -m "redeploy" && git push`

### 问题 3: Cron 不执行

**检查**：
1. Cron trigger 是否正确配置
2. `CRON_SECRET` 环境变量是否设置
3. 查看 Function logs 中的错误

**手动触发测试**：
```bash
curl -H "Authorization: Bearer YOUR_SECRET" \
  https://alphaarena-live.pages.dev/api/cron/sync-advanced
```

### 问题 4: 数据库连接失败

**解决**：
1. 确认 Supabase 连接字符串正确
2. 检查 Service Role Key 权限
3. 测试连接：
   ```bash
   curl https://alphaarena-live.pages.dev/api/leaderboard
   ```

---

## 📊 Cloudflare vs Vercel

| 功能 | Vercel | Cloudflare Pages |
|------|--------|------------------|
| 免费带宽 | 100GB/月 | **无限** ✅ |
| 请求数 | 无限 | 100,000/天 |
| 边缘节点 | 全球 | **275+** ✅ |
| 冷启动 | ~100ms | **<50ms** ✅ |
| Cron Jobs | 外部服务 | **内置** ✅ |
| 构建时间 | 6,000 分钟/月 | 500 次/月 |
| 成本 | $20+/月 (Pro) | **$0** ✅ |

---

## 🚀 高级配置（可选）

### 预渲染优化

在 `next.config.js` 中：
```javascript
module.exports = {
  // ... 现有配置

  // 优化静态导出
  output: 'standalone',

  // 图片优化
  images: {
    unoptimized: true, // Cloudflare 有自己的图片优化
  }
}
```

### 自定义 Headers

在 `next.config.js` 中：
```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-cache, no-store' },
      ],
    },
  ]
}
```

---

## 📚 相关文档

- [Cloudflare Pages - Next.js](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Cloudflare Workers - Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## ✅ 部署检查清单

在上线前确认：

- [ ] 所有环境变量已设置
- [ ] 首页可以访问
- [ ] API endpoints 正常工作
- [ ] 文章页面可以渲染
- [ ] Cron 任务已配置并测试
- [ ] 自定义域名已配置（如果需要）
- [ ] SSL/TLS 证书已生效
- [ ] DNS 记录正确指向
- [ ] 301 重定向配置正确
- [ ] Google Search Console 已更新

---

## 🎉 完成！

现在你的网站已经部署到 Cloudflare Pages，享受：
- ⚡ 超快的全球访问速度
- 💰 完全免费（无流量限制）
- 🔒 自动 HTTPS
- 🤖 内置 Cron Jobs
- 📊 实时分析

**有问题？** 查看 Cloudflare Dashboard 的 Real-time logs！
