# Supabase 数据库设置

## 1. 创建数据库表

访问你的Supabase项目：https://app.supabase.com/project/your-project-id

进入 **SQL Editor**，运行以下SQL文件的内容：

📁 `supabase/migrations/20251022_create_trading_tables.sql`

这将创建以下表：
- ✅ `ai_models` - AI模型信息
- ✅ `snapshots` - 排行榜快照数据
- ✅ `positions` - 持仓数据
- ✅ `trades` - 交易历史

## 2. 数据同步API

### 手动同步
```bash
curl -X POST http://localhost:3001/api/sync
```

### 查看同步状态
```bash
curl http://localhost:3001/api/sync
```

## 3. 自动同步（可选）

### 方案A：定时任务（推荐）
使用Vercel Cron Jobs或其他定时任务服务，每分钟调用：
```
POST https://alphaarena-live.com/api/sync
```

### 方案B：前端触发
在页面加载时自动调用sync API（已在代码中准备好）

## 4. 数据流程

```
nof1.ai API (外部真实数据)
    ↓
Next.js API Routes
    - /api/leaderboard
    - /api/positions
    - /api/trades/live
    ↓
/api/sync (同步数据)
    ↓
Supabase Database (持久化存储)
    - ai_models
    - snapshots
    - positions
    - trades
```

## 5. 环境变量

确保 `.env.local` 包含：
```env
# ⚠️ 重要：从 Supabase 项目设置 → API 获取实际值
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 6. 测试步骤

1. 在Supabase SQL Editor运行migration SQL
2. 启动dev服务器：`pnpm dev`
3. 手动触发同步：`curl -X POST http://localhost:3001/api/sync`
4. 检查Supabase表中是否有数据
5. 查看同步状态：`curl http://localhost:3001/api/sync`

## 7. 使用Supabase数据（可选）

目前应用直接从nof1.ai API获取实时数据。如果想改为从Supabase读取：

1. 修改 `/api/leaderboard/route.ts` 等API
2. 从Supabase查询而不是调用nof1.ai
3. 依赖定时同步任务保持数据更新

这种架构的优点：
- ✅ 减少对外部API的依赖
- ✅ 可以添加历史数据分析
- ✅ 更快的响应速度（本地数据库）
- ✅ 可以添加自定义字段和计算
