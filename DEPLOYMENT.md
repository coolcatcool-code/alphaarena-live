# Alpha Arena Live - 部署指南

## 📋 部署前准备

### 1. 确认Supabase数据库已配置

确保Supabase中已创建以下表：
- `ai_models` - AI模型信息
- `snapshots` - 排行榜快照
- `positions` - 持仓数据
- `trades` - 交易记录

### 2. 数据已同步到Supabase

在部署前，确保Supabase中有数据：
```bash
# 本地测试同步API
curl -X POST http://localhost:3003/api/sync

# 应该返回类似：
# {"success":true,"synced":{"snapshots":6,"positions":29,"trades":100}}
```

## 🚀 Vercel部署步骤

### 步骤 1: 准备环境变量

在Vercel Dashboard中设置以下环境变量：

```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://kqalqqnuliuszwljfosz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYWxxcW51bGl1c3p3bGpmb3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMDg4OTMsImV4cCI6MjA3NjU4NDg5M30.q0A3cQ0Jv9PIkIJLx-KQPso_EDD1I3ol-U6iZXer1_w
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYWxxcW51bGl1c3p3bGpmb3N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTAwODg5MywiZXhwIjoyMDc2NTg0ODkzfQ.JRrYg1PRoTr262ZIwf9G3wsSF2WTT1MCVliQnQxtxms

# 数据库连接（Prisma使用，可选）
DATABASE_URL=postgresql://postgres.kqalqqnuliuszwljfosz:runEASY@2014@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.kqalqqnuliuszwljfosz:runEASY@2014@db.kqalqqnuliuszwljfosz.supabase.co:5432/postgres

# Google Analytics
NEXT_PUBLIC_GA_ID=G-8Y9WJBQSR3

# 网站URL
NEXT_PUBLIC_APP_URL=https://alphaarena-live.com
```

### 步骤 2: 推送代码到Git仓库

```bash
git add .
git commit -m "Deploy: Supabase integration with real-time data"
git push origin main
```

### 步骤 3: 在Vercel中部署

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 导入你的Git仓库
3. 在 **Environment Variables** 中添加上述环境变量
4. 点击 **Deploy**

## 📊 当前架构

### 数据流
```
用户访问网站
    ↓
前端每1分钟自动刷新
    ↓
调用API Routes
    - /api/leaderboard (排行榜)
    - /api/positions (持仓)
    - /api/trades/live (实时交易)
    - /api/live/[aiModelId] (AI详情)
    ↓
从Supabase数据库读取数据
    ↓
显示在网页上
```

### API Routes配置
所有API routes已配置为：
- ✅ 从Supabase读取数据
- ✅ `revalidate = 0` - 不缓存，始终读取最新数据
- ✅ 错误时降级到mock数据（确保网站始终可用）

### 前端刷新频率
- 首页 (`/`): 每1分钟刷新排行榜
- Live页面 (`/live`): 每1分钟刷新
- AI详情页 (`/live/[aiModelId]`): 每1分钟刷新

## 🔄 数据更新机制

### 当前方案（手动更新）

数据不会自动同步到Supabase。需要手动调用sync API更新数据：

```bash
# 手动同步数据
curl -X POST https://alphaarena-live.com/api/sync
```

### 未来方案（待实现）

可以通过以下方式实现自动同步：

#### 选项A: Vercel Cron Jobs
在 `vercel.json` 中配置：
```json
{
  "crons": [
    {
      "path": "/api/sync",
      "schedule": "* * * * *"  // 每分钟执行
    }
  ]
}
```
⚠️ 注意：Vercel Hobby计划限制每天100次执行

#### 选项B: 外部Cron服务
使用服务如：
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- GitHub Actions

配置定时调用：`https://alphaarena-live.com/api/sync`

#### 选项C: Supabase Edge Functions
创建Supabase Edge Function定时调用nof1.ai API

## 📱 部署后验证

### 1. 检查网站是否正常访问
```bash
curl https://alphaarena-live.com
```

### 2. 验证API数据源
```bash
# 检查leaderboard API
curl https://alphaarena-live.com/api/leaderboard | grep "source"
# 应该返回: "source":"supabase"

# 检查positions API
curl https://alphaarena-live.com/api/positions | grep "source"
# 应该返回: "source":"supabase"
```

### 3. 测试前端刷新
- 访问首页，等待1分钟，观察数据是否刷新
- 访问 `/live` 页面，等待1分钟，观察交易数据是否刷新

## 🛠️ 故障排查

### 问题1: API返回mock数据
**症状**: API响应中 `"source":"mock-fallback"`

**原因**:
- Supabase连接失败
- 环境变量未正确配置

**解决**:
1. 检查Vercel环境变量是否正确设置
2. 检查Supabase数据库是否可访问
3. 查看Vercel部署日志

### 问题2: 数据不更新
**症状**: 网页显示的数据始终不变

**原因**:
- Supabase中没有最新数据
- 前端刷新机制未启动

**解决**:
1. 手动调用 `/api/sync` 更新Supabase数据
2. 检查浏览器控制台是否有错误
3. 强制刷新页面（Ctrl+F5）

### 问题3: 数据库连接错误
**症状**: API返回500错误

**原因**:
- Supabase凭证错误
- 数据库表不存在

**解决**:
1. 验证 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. 检查Supabase Dashboard中表是否存在
3. 运行SQL migration创建表

## 📊 监控

### Vercel Dashboard
- **Deployments** - 查看部署状态
- **Functions** - 查看API调用日志
- **Analytics** - 查看网站访问数据

### Supabase Dashboard
- **Table Editor** - 查看数据库表数据
- **SQL Editor** - 运行查询验证数据
- **API** - 查看API使用情况

## 🎯 性能优化建议

1. **启用CDN缓存** - Vercel自动启用
2. **图片优化** - 使用Next.js Image组件
3. **数据库索引** - 在 `ai_model_id`, `timestamp` 等字段上创建索引
4. **连接池** - 已使用Supabase连接池（pgbouncer）

## 📝 注意事项

- ✅ 网站会显示Supabase中的数据
- ✅ 前端每分钟自动刷新
- ⚠️ 数据不会自动同步到Supabase（需要手动或配置定时任务）
- ⚠️ 确保Supabase中有初始数据后再部署
- ⚠️ 保护好 `SUPABASE_SERVICE_ROLE_KEY`，不要泄露

## 🔐 安全建议

1. **环境变量** - 不要将 `.env.local` 提交到Git
2. **Service Role Key** - 只在服务端使用，不要暴露到客户端
3. **API限流** - 考虑添加速率限制
4. **CORS配置** - 限制API访问来源

## 📞 支持

如有问题，请查看：
- [Next.js文档](https://nextjs.org/docs)
- [Supabase文档](https://supabase.com/docs)
- [Vercel文档](https://vercel.com/docs)
