# 🔴 LIVE Dashboard 实施方案

## 📋 目标

创建一个实时交易数据看板，展示：
1. **实时排行榜**（已有）
2. **AI 持仓详情** - 每个 AI 当前持有的仓位
3. **实时交易流** - 最新的交易记录滚动显示
4. **详细性能图表** - PnL 趋势、胜率变化等
5. **个人 AI 详情页** - 点击查看单个 AI 的完整数据

---

## 🎨 页面结构设计

### `/live` - 主 Live Dashboard 页面

```
┌─────────────────────────────────────────────────┐
│  🔴 LIVE   Last Update: 2 seconds ago          │
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 Real-time Leaderboard (Compact View)       │
│  ┌───────────────────────────────────────┐     │
│  │ 1. DeepSeek      +40.5%  $14,050  ↑  │     │
│  │ 2. Claude        +12.3%  $11,230  ↑  │     │
│  │ 3. ChatGPT       -5.2%   $9,480   ↓  │     │
│  └───────────────────────────────────────┘     │
│                                                 │
│  📈 Performance Chart (24h PnL)                 │
│  [Line chart showing all 6 AIs]                │
│                                                 │
│  💼 Open Positions Summary                      │
│  ┌─────────────┬─────────────┬─────────────┐   │
│  │ DeepSeek    │ Claude      │ ChatGPT     │   │
│  │ BTC LONG    │ ETH LONG    │ SOL SHORT   │   │
│  │ +15.2%      │ +8.3%       │ -12.1%      │   │
│  └─────────────┴─────────────┴─────────────┘   │
│                                                 │
│  📰 Live Trade Feed                             │
│  ┌─────────────────────────────────────────┐   │
│  │ 🟢 DeepSeek BOUGHT BTC @ $95,420        │   │
│  │    2x leverage, $2,000 - 2s ago         │   │
│  │                                         │   │
│  │ 🔴 Gemini SOLD ETH @ $3,580             │   │
│  │    Position closed, -$450 - 15s ago     │   │
│  │                                         │   │
│  │ 🟢 Claude BOUGHT SOL @ $185             │   │
│  │    1x leverage, $1,500 - 32s ago        │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### `/live/[aiModelId]` - 单个 AI 详情页

```
┌─────────────────────────────────────────────────┐
│  DeepSeek Trading Dashboard                     │
│  🟢 Active | Rank #1 | +40.5% PnL              │
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 Performance Overview                        │
│  ┌──────────┬──────────┬──────────┬──────────┐ │
│  │ Total    │ Win Rate │ Sharpe   │ Max DD   │ │
│  │ $14,050  │ 68.2%    │ 2.4      │ -8.5%    │ │
│  └──────────┴──────────┴──────────┴──────────┘ │
│                                                 │
│  📈 PnL Chart (7 days)                          │
│  [Detailed chart with annotations]              │
│                                                 │
│  💼 Current Positions (3 open)                  │
│  ┌─────────────────────────────────────────┐   │
│  │ BTC LONG | Entry: $94,200 | Now: $95,420│   │
│  │ Size: $5,000 | 2x | PnL: +$129.63      │   │
│  │ Opened: 3h ago                          │   │
│  ├─────────────────────────────────────────┤   │
│  │ ETH LONG | Entry: $3,480 | Now: $3,580  │   │
│  │ Size: $3,000 | 3x | PnL: +$86.21       │   │
│  │ Opened: 5h ago                          │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  📜 Trade History (Last 20)                     │
│  [Table with filters]                           │
│                                                 │
│  🧠 Strategy Analysis                           │
│  - Trading Style: Aggressive Momentum           │
│  - Avg Hold Time: 4.2 hours                    │
│  - Favorite Asset: BTC (45% trades)            │
│  - Preferred Leverage: 2-3x                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔧 技术实现方案

### 阶段 1: MVP - 使用现有 Mock 数据（立即可做）

**不需要真实 API**，先用模拟数据完成 UI 和功能：

1. **扩展 Mock 数据**
   ```typescript
   // 添加持仓数据
   interface Position {
     id: string
     aiModelId: string
     symbol: string
     side: 'LONG' | 'SHORT'
     entryPrice: number
     currentPrice: number
     size: number
     leverage: number
     pnl: number
     openedAt: Date
   }

   // 添加实时交易数据
   interface LiveTrade extends Trade {
     status: 'OPEN' | 'CLOSED'
     duration?: number
   }
   ```

2. **创建 API 端点**
   - `GET /api/positions` - 获取所有持仓
   - `GET /api/positions/[aiModelId]` - 单个 AI 持仓
   - `GET /api/trades/live` - 实时交易流（最新 50 条）
   - `GET /api/trades/[aiModelId]` - 单个 AI 交易历史

3. **实时更新机制**
   - 使用 `setInterval` 每 5 秒轮询一次
   - 可选：后期使用 WebSocket 实现真实推送

4. **UI 组件**
   - `LiveIndicator` - 🔴 LIVE 指示器
   - `PositionCard` - 持仓卡片
   - `TradeFeed` - 交易流（滚动列表）
   - `PerformanceChart` - 性能图表
   - `AIDetailDashboard` - AI 详情页

### 阶段 2: 真实数据对接（需要数据源）

**两种数据来源方案：**

#### 方案 A: 爬虫抓取 nof1.ai 官方数据

**优点**：
- 真实数据
- 自动更新

**缺点**：
- 需要开发爬虫
- 可能违反服务条款
- 数据延迟

**实现**：
```typescript
// src/lib/scraper/alphaarena-scraper.ts
export async function scrapeAlphaArenaData() {
  // 1. 抓取排行榜数据
  const leaderboardData = await fetch('https://alpha-arena.nof1.ai/api/leaderboard')

  // 2. 抓取交易数据
  const tradesData = await fetch('https://alpha-arena.nof1.ai/api/trades')

  // 3. 存入数据库
  await saveToDatabase(leaderboardData, tradesData)
}
```

#### 方案 B: Hyperliquid 链上数据（推荐）

**优点**：
- 官方公开 API
- 完全合法
- 实时准确

**缺点**：
- 需要找到 AI 的钱包地址
- 需要解析链上交易

**实现**：
```typescript
// src/lib/hyperliquid/client.ts
export async function getWalletPositions(address: string) {
  const response = await fetch(`https://api.hyperliquid.xyz/info`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'userState',
      user: address
    })
  })
  return response.json()
}

export async function getWalletTrades(address: string) {
  const response = await fetch(`https://api.hyperliquid.xyz/info`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'userFills',
      user: address
    })
  })
  return response.json()
}
```

**关键问题**：需要获取 6 个 AI 的 Hyperliquid 钱包地址

#### 方案 C: 手动更新（备选）

如果无法获取自动数据：
- 每天手动从 nof1.ai 截图/复制数据
- 存入 Supabase 数据库
- 网站读取数据库数据

---

## 📊 数据库扩展

需要在 Prisma schema 添加：

```prisma
model Position {
  id          String   @id @default(uuid())
  aiModelId   String   @map("ai_model_id")
  symbol      String
  side        String   // LONG, SHORT
  entryPrice  Decimal  @db.Decimal(15, 2)
  currentPrice Decimal @db.Decimal(15, 2)
  size        Decimal  @db.Decimal(15, 2)
  leverage    Int
  pnl         Decimal  @db.Decimal(15, 2)
  status      String   @default("OPEN") // OPEN, CLOSED
  openedAt    DateTime @default(now())
  closedAt    DateTime?

  aiModel AIModel @relation(fields: [aiModelId], references: [id])

  @@index([aiModelId, status])
  @@index([status, openedAt(sort: Desc)])
  @@map("positions")
}
```

---

## 🎯 MVP 实施步骤（第一阶段）

### Step 1: 创建 Mock 数据和 API
- [ ] 扩展 types 添加 Position 接口
- [ ] 创建 `/api/positions` 端点（mock 数据）
- [ ] 创建 `/api/trades/live` 端点（mock 数据）
- [ ] 测试 API 响应

### Step 2: 创建 UI 组件
- [ ] `LiveIndicator` - LIVE 标识
- [ ] `PositionCard` - 持仓卡片组件
- [ ] `TradeFeed` - 交易流组件
- [ ] `PerformanceChart` - 图表组件（使用 recharts）

### Step 3: 创建页面
- [ ] `/live/page.tsx` - 主 Live 页面
- [ ] `/live/[aiModelId]/page.tsx` - AI 详情页
- [ ] 添加到导航栏

### Step 4: 实时更新
- [ ] 实现自动刷新逻辑（5秒轮询）
- [ ] 添加"最后更新时间"显示
- [ ] 添加手动刷新按钮

### Step 5: 测试和优化
- [ ] 测试所有组件
- [ ] 响应式设计
- [ ] 性能优化
- [ ] SEO 优化

---

## 📦 需要的依赖

```bash
pnpm add recharts date-fns
```

- `recharts` - 图表库
- `date-fns` - 日期格式化

---

## 🚀 预期效果

完成后用户可以：

1. **实时监控** - 看到所有 AI 的实时表现
2. **查看持仓** - 知道每个 AI 持有什么仓位
3. **追踪交易** - 看到最新的买卖操作
4. **深度分析** - 点击单个 AI 查看详细数据
5. **自动更新** - 无需刷新，数据自动更新

---

## ⏱️ 预估工作量

**MVP 阶段（使用 Mock 数据）**：
- API 开发：1-2 小时
- UI 组件：3-4 小时
- 页面集成：2-3 小时
- 测试优化：1-2 小时

**总计**：7-11 小时

**真实数据对接（阶段2）**：
- 取决于数据源方案
- Hyperliquid API：4-6 小时
- 爬虫方案：8-12 小时

---

## 💡 建议

**现在立即开始 MVP**：
1. 使用 Mock 数据快速完成 UI 和功能
2. 部署到生产环境，先让用户看到界面
3. 同时研究真实数据对接方案
4. 逐步替换 Mock 数据为真实数据

这样可以：
- ✅ 快速上线新功能
- ✅ 收集用户反馈
- ✅ 有时间研究最佳数据方案
- ✅ 避免"完美主义陷阱"

---

**准备好开始了吗？我可以立即开始实现 MVP！**
