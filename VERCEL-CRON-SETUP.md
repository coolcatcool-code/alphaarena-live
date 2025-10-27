# Vercel + Cron-Job.org 设置指南

本地网络无法访问 nof1.ai API？没问题！使用 Vercel + cron-job.org 解决。

## 🎯 解决方案

1. **部署到 Vercel** - Vercel 服务器可以访问 nof1.ai
2. **cron-job.org** - 定时调用 Vercel API endpoint
3. **数据自动同步** - 每 3-5 分钟同步一次

## 📋 前置要求

- ✅ Supabase 数据库表已创建（见 `NEXT-STEPS.md`）
- ✅ Vercel 账号
- ✅ cron-job.org 账号（免费）

---

## 第一步：准备环境变量

确保 `.env.local` 中有所有必需的环境变量：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Cron Secret
CRON_SECRET=temp-secret-change-in-production

# Analytics
NEXT_PUBLIC_GA_ID=G-xxx

# App URL
NEXT_PUBLIC_APP_URL=https://alphaarena-live.com

# Supabase Keys
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenRouter (for articles)
OPENROUTER_API_KEY=sk-or-v1-xxx
AI_MODEL=deepseek/deepseek-chat
```

---

## 第二步：部署到 Vercel

### 选项 A：通过 Vercel Dashboard（推荐）

1. 访问 [vercel.com](https://vercel.com)
2. 点击 "Add New..." → "Project"
3. 导入你的 GitHub 仓库
4. 配置环境变量（从 `.env.local` 复制）
5. 点击 "Deploy"

### 选项 B：通过 Vercel CLI

```bash
# 安装 Vercel CLI（如果还没有）
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 设置环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add CRON_SECRET
# ... 添加所有其他环境变量

# 部署到生产环境
vercel --prod
```

### 重要：设置 CRON_SECRET

**必须更改默认的 cron secret！**

在 Vercel Dashboard:
1. 进入 Settings → Environment Variables
2. 找到 `CRON_SECRET`
3. 更改为一个强密码（至少 32 个字符）
4. 保存这个密码，稍后需要用到

生成强密码：
```bash
# 在 Node.js 中生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 第三步：测试 API Endpoint

部署成功后，测试 cron endpoint：

```bash
# 替换为你的域名和 CRON_SECRET
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://alphaarena-live.com/api/cron/sync-advanced
```

预期响应：
```json
{
  "success": true,
  "timestamp": "2025-10-27T05:00:00.000Z",
  "duration": "2.5s",
  "analytics": {
    "synced": 6,
    "skipped": 0
  },
  "note": "Conversations sync skipped (timeout issues)"
}
```

如果返回 `401 Unauthorized`，说明 CRON_SECRET 不正确。

---

## 第四步：设置 cron-job.org

### 1. 注册账号

访问 [cron-job.org](https://cron-job.org/en/) 并注册免费账号。

### 2. 创建新的 Cron Job

1. 登录后，点击 "Cronjobs" → "Create cronjob"

2. **Title**: `Alpha Arena - Sync Advanced Data`

3. **URL**: `https://alphaarena-live.com/api/cron/sync-advanced`
   - 替换为你的实际域名

4. **Schedule**:
   - 选择 "Every 5 minutes"
   - 或者自定义：`*/5 * * * *`

5. **Request method**: `GET`

6. **Headers**: 点击 "Add header"
   - Name: `Authorization`
   - Value: `Bearer YOUR_CRON_SECRET`
   - 替换 `YOUR_CRON_SECRET` 为你的实际密钥

7. **Notifications** (可选):
   - Enable "Send notifications on failure"
   - 输入你的邮箱

8. **Save**

### 3. 测试运行

点击 "Execute now" 手动触发一次，检查是否成功。

在 "History" 标签中查看执行结果：
- ✅ Status 200 = 成功
- ❌ Status 401 = CRON_SECRET 错误
- ❌ Status 500 = 服务器错误

---

## 第五步：验证数据同步

### 检查 Supabase

1. 访问 Supabase Dashboard
2. 进入 Table Editor
3. 查看 `analytics_snapshots` 表
4. 应该看到新插入的数据

### 检查 Vercel Logs

1. Vercel Dashboard → 你的项目
2. 点击 "Logs"
3. 查看 cron job 的执行日志

---

## 📊 监控和维护

### 每天检查

- cron-job.org 执行历史
- Vercel 函数调用次数
- Supabase 数据库记录数

### 每周检查

- 数据质量（是否有缺失）
- 错误率
- API 响应时间

### 故障排查

#### Cron Job 失败（Status 401）

**原因**: CRON_SECRET 不匹配

**解决**:
1. 检查 Vercel 环境变量中的 `CRON_SECRET`
2. 检查 cron-job.org 中的 Authorization header
3. 确保两者完全一致

#### Cron Job 失败（Status 500）

**原因**: 服务器错误

**解决**:
1. 查看 Vercel logs
2. 检查 Supabase 连接
3. 验证表是否存在

#### 数据没有更新

**原因**: Model ID 映射失败

**解决**:
1. 查看 Vercel logs 中的警告
2. 检查是否有 "AI model not found" 错误
3. 更新 `sync-advanced/route.ts` 中的映射

---

## 🚀 高级配置

### 调整同步频率

根据需求调整 cron 表达式：

```bash
# 每 3 分钟（匹配 nof1.ai 更新频率）
*/3 * * * *

# 每 5 分钟（推荐）
*/5 * * * *

# 每 10 分钟（节省 API 调用）
*/10 * * * *

# 每小时
0 * * * *
```

### 添加 Slack/Discord 通知

在 cron-job.org 中配置 Webhook 通知：

1. Settings → Integrations
2. 添加 Slack/Discord webhook URL
3. 选择通知条件（失败、成功等）

### 增加超时时间

如果需要同步 Conversations 数据（当前跳过），修改 `route.ts`:

```typescript
export const maxDuration = 300 // 改为 5 分钟
const API_TIMEOUT = 120000 // 改为 120 秒
```

---

## 💰 成本估算

### Vercel

- **Hobby Plan**: 免费
  - 100GB 带宽/月
  - 100 小时函数执行时间/月
  - 足够用于此项目

每次同步约：
- 执行时间: ~3 秒
- 带宽: ~50KB

每月成本: **$0**

### cron-job.org

- **Free Plan**: 免费
  - 最多 50 个 cron jobs
  - 最高频率: 每分钟
  - 足够用于此项目

每月成本: **$0**

### Supabase

- **Free Plan**: 免费
  - 500MB 数据库
  - 50,000 月活用户
  - 足够用于此项目

预计数据增长:
- 每次同步: ~30KB
- 每天: ~8.6MB (每 5 分钟一次)
- 每月: ~260MB

每月成本: **$0**

**总成本: $0/月** 🎉

---

## ✅ 完成检查清单

在继续之前，确保：

- [ ] Supabase 表已创建（`analytics_snapshots`）
- [ ] Vercel 部署成功
- [ ] 环境变量已配置
- [ ] CRON_SECRET 已更改为强密码
- [ ] cron-job.org 任务已创建
- [ ] 手动测试成功（Status 200）
- [ ] 数据出现在 Supabase 中

---

## 📚 相关文档

- `NEXT-STEPS.md` - 数据库表创建指南
- `ADVANCED-DATA-SETUP.md` - 完整技术文档
- `INTEGRATION-SUMMARY.md` - 项目总结

---

## 🆘 需要帮助？

常见问题：

1. **Q: 本地如何测试？**
   A: 使用 `vercel dev` 在本地运行，或直接测试部署后的 URL

2. **Q: 如何查看详细日志？**
   A: Vercel Dashboard → Functions → 选择函数 → Logs

3. **Q: 数据重复怎么办？**
   A: 目前每次都插入新记录，可以后续添加去重逻辑

4. **Q: Conversations 数据什么时候同步？**
   A: API 超时问题解决后会添加，或使用单独的 endpoint

---

**现在开始部署吧！** 🚀

1. 提交代码到 Git
2. 在 Vercel 部署
3. 设置 cron-job.org
4. 享受自动化数据同步！
