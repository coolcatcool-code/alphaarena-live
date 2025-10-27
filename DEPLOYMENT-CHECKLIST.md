# ✅ 部署清单 - Alpha Arena 数据同步

**目标**: 使用 Vercel + cron-job.org 实现自动数据同步

---

## 📋 总览

由于本地网络无法访问 nof1.ai API，我们使用 Vercel 部署 + cron-job.org 定时调用的方案。

**优势**:
- ✅ 完全免费（Vercel + cron-job.org + Supabase）
- ✅ 自动化，无需本地运行
- ✅ 可靠稳定，有失败通知

---

## 第 1 步：创建数据库表 ⏱️ 5 分钟

### 操作步骤

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入项目 → **SQL Editor** → **New Query**
3. 复制文件内容：`prisma/migrations/add_analytics_and_conversations.sql`
4. 粘贴到编辑器，点击 **Run**

### 验证

运行以下 SQL：
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('analytics_snapshots', 'ai_conversations');
```

应该返回 2 个表。

---

## 第 2 步：准备代码 ⏱️ 2 分钟

### 提交代码到 Git

```bash
git add .
git commit -m "feat: Add advanced data sync with Vercel cron"
git push origin main
```

### 确认文件存在

- `src/app/api/cron/sync-advanced/route.ts` ✅
- `prisma/migrations/add_analytics_and_conversations.sql` ✅
- `.env.local` (所有环境变量) ✅

---

## 第 3 步：部署到 Vercel ⏱️ 10 分钟

### 方法 A：Vercel Dashboard（推荐）

1. 访问 [vercel.com/new](https://vercel.com/new)
2. 选择你的 GitHub 仓库
3. 配置环境变量（见下方列表）
4. 点击 **Deploy**

### 方法 B：Vercel CLI

```bash
vercel --prod
```

### 必需的环境变量

在 Vercel 项目设置中添加（Settings → Environment Variables）：

```env
# Supabase（必需）
NEXT_PUBLIC_SUPABASE_URL=https://kqalqqnuliuszwljfosz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...（你的 service role key）

# Database（必需）
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Cron Secret（必需 - 必须更改！）
CRON_SECRET=（生成一个强密码，至少 32 字符）

# 其他（必需）
NEXT_PUBLIC_APP_URL=https://alphaarena-live.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_GA_ID=G-xxx

# OpenRouter（文章生成用，可选）
OPENROUTER_API_KEY=sk-or-v1-xxx
AI_MODEL=deepseek/deepseek-chat
```

### 生成强 CRON_SECRET

在 Node.js 中运行：
```javascript
require('crypto').randomBytes(32).toString('hex')
```

或在线生成：https://www.random.org/passwords/?num=1&len=32&format=plain

**⚠️ 重要**：保存这个密码，后面需要用！

---

## 第 4 步：测试 API Endpoint ⏱️ 2 分钟

部署完成后，测试 cron endpoint：

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://alphaarena-live.vercel.app/api/cron/sync-advanced
```

### 预期响应（成功）

```json
{
  "success": true,
  "timestamp": "2025-10-27T05:00:00.000Z",
  "duration": "2.5s",
  "analytics": {
    "synced": 6,
    "skipped": 0
  }
}
```

### 预期响应（失败）

```json
{"error": "Unauthorized"}  // CRON_SECRET 错误
```

---

## 第 5 步：设置 cron-job.org ⏱️ 5 分钟

### 注册账号

访问 [cron-job.org](https://cron-job.org/en/) 并注册免费账号。

### 创建 Cron Job

1. 登录后，点击 **Cronjobs** → **Create cronjob**

2. 填写表单：

   **Title**: `Alpha Arena - Sync Advanced Data`

   **URL**: `https://alphaarena-live.vercel.app/api/cron/sync-advanced`
   （替换为你的实际域名）

   **Schedule**: `*/5 * * * *`
   （每 5 分钟执行一次）

   **Request method**: `GET`

   **Headers**: 点击 "Add header"
   - Name: `Authorization`
   - Value: `Bearer YOUR_CRON_SECRET`
   （替换为你的实际密钥）

   **Notifications** (可选):
   - Enable "Send notifications on failure"
   - 输入你的邮箱

3. 点击 **Save**

### 测试运行

1. 找到刚创建的 job
2. 点击 **Execute now**
3. 查看 **History** 标签
4. 确认 Status 为 `200 OK`

---

## 第 6 步：验证数据 ⏱️ 2 分钟

### 检查 Supabase

1. Supabase Dashboard → **Table Editor**
2. 查看 `analytics_snapshots` 表
3. 应该看到 6 条新记录（每个 AI 模型一条）

### 检查 Vercel Logs

1. Vercel Dashboard → 你的项目
2. 点击 **Logs** 或 **Functions**
3. 查看最近的执行日志

### 检查 cron-job.org

1. 查看 **History** 标签
2. 确认每 5 分钟都有新的成功执行记录

---

## ✅ 完成检查清单

在继续之前，确保所有步骤都完成：

- [ ] Supabase 表已创建（`analytics_snapshots`）
- [ ] 代码已提交到 GitHub
- [ ] Vercel 部署成功
- [ ] 所有环境变量已配置
- [ ] CRON_SECRET 已更改为强密码
- [ ] API endpoint 测试成功（Status 200）
- [ ] cron-job.org 任务已创建
- [ ] 手动测试执行成功
- [ ] 数据出现在 Supabase 中

---

## 🎉 恭喜！

你的数据同步系统已经设置完成！

### 系统将自动：

- ✅ 每 5 分钟从 nof1.ai 获取最新数据
- ✅ 同步 6 个 AI 模型的交易分析数据
- ✅ 存储到 Supabase 数据库
- ✅ 在失败时通知你

### 下一步：

1. 构建功能页面（决策透明度、分析仪表板）
2. 使用数据生成 SEO 文章
3. 设置监控和告警

---

## 📚 相关文档

- **`VERCEL-CRON-SETUP.md`** - 详细设置指南
- **`ADVANCED-DATA-SETUP.md`** - 技术文档
- **`QUICK-ACTION-PLAN.md`** - 4周实施计划
- **`API-CONTENT-STRATEGY.md`** - 完整策略

---

## 🆘 故障排查

### 问题：401 Unauthorized

**原因**: CRON_SECRET 不匹配

**解决**:
1. 在 Vercel 查看环境变量中的 `CRON_SECRET`
2. 在 cron-job.org 查看 Authorization header
3. 确保两者完全一致（包括 `Bearer ` 前缀）

### 问题：500 Server Error

**原因**: 服务器内部错误

**解决**:
1. 查看 Vercel logs
2. 确认数据库表已创建
3. 检查 Supabase 连接字符串

### 问题：数据未同步

**原因**: Model ID 映射失败

**解决**:
1. 查看 Vercel logs 中的警告
2. 检查是否有 "AI model not found" 错误
3. 更新 `route.ts` 中的模型映射

---

**预计总时间**: 30 分钟
**成本**: $0/月（完全免费）
**维护工作**: 0（全自动）

**开始吧！** 🚀
