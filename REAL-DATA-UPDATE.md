# 真实数据接入 - 快速实施指南

## ✅ 已完成

1. **发现 nof1.ai 公开 API**
   - `https://nof1.ai/api/leaderboard`
   - `https://nof1.ai/api/positions`
   - `https://nof1.ai/api/trades`

2. **创建数据转换层**
   - `src/lib/nof1/client.ts` - 完整的 API 客户端
   - 数据转换函数已实现
   - AI 模型 ID 映射完成

## 🚀 下一步：更新 API 路由

由于 token 限制和时间考虑，我建议：

### 方案：逐步替换

1. **先测试一个端点** - leaderboard
2. **验证数据正确性**
3. **然后更新其他端点**

### 需要修改的文件

```typescript
// src/app/api/leaderboard/route.ts
import { fetchNof1Leaderboard, transformLeaderboard } from '@/lib/nof1/client'
import { aiModels } from '@/lib/mock/data'

export const revalidate = 60 // 1分钟缓存

export async function GET() {
  try {
    const { leaderboard } = await fetchNof1Leaderboard()
    const snapshots = transformLeaderboard(leaderboard)

    // 补充 aiModel 对象
    const enrichedSnapshots = snapshots.map(s => ({
      ...s,
      aiModel: aiModels[s.aiModelId]
    }))

    return NextResponse.json({
      data: enrichedSnapshots,
      timestamp: new Date().toISOString(),
      count: enrichedSnapshots.length,
      source: 'nof1.ai' // 标记真实数据源
    })
  } catch (error) {
    console.error('nof1.ai API error:', error)
    // 降级到 mock 数据
    return NextResponse.json({
      data: mockSnapshots,
      timestamp: new Date().toISOString(),
      count: mockSnapshots.length,
      source: 'mock-fallback'
    })
  }
}
```

```typescript
// src/app/api/positions/route.ts
import { fetchNof1Positions, transformPositions } from '@/lib/nof1/client'
import { aiModels } from '@/lib/mock/data'

export const revalidate = 60

export async function GET() {
  try {
    const { positions } = await fetchNof1Positions()
    const transformedPositions = transformPositions(positions)

    // 补充 aiModel 对象
    const enrichedPositions = transformedPositions.map(p => ({
      ...p,
      aiModel: aiModels[p.aiModelId]
    }))

    return NextResponse.json({
      data: enrichedPositions,
      timestamp: new Date().toISOString(),
      count: enrichedPositions.length,
    })
  } catch (error) {
    console.error('Positions API error:', error)
    return NextResponse.json({
      data: mockPositions.filter(p => p.status === 'OPEN'),
      timestamp: new Date().toISOString(),
      count: mockPositions.length,
    })
  }
}
```

```typescript
// src/app/api/trades/live/route.ts
import { fetchNof1Trades, transformTrades } from '@/lib/nof1/client'
import { aiModels } from '@/lib/mock/data'

export const revalidate = 60

export async function GET() {
  try {
    const { trades } = await fetchNof1Trades()
    const transformedTrades = transformTrades(trades, 20)

    // 补充 aiModel 对象
    const enrichedTrades = transformedTrades.map(t => ({
      ...t,
      aiModel: aiModels[t.aiModelId]
    }))

    return NextResponse.json({
      data: enrichedTrades,
      timestamp: new Date().toISOString(),
      count: enrichedTrades.length,
    })
  } catch (error) {
    console.error('Trades API error:', error)
    return NextResponse.json({
      data: mockTrades,
      timestamp: new Date().toISOString(),
      count: mockTrades.length,
    })
  }
}
```

## ⚠️ 注意事项

1. **错误处理**：所有 API 都有降级机制（fallback to mock data）
2. **缓存策略**：60秒缓存避免频繁请求
3. **数据验证**：确保返回的数据结构符合我们的类型定义

## 🎯 建议

由于现在是第一次接入，建议：

1. **我先帮你更新 leaderboard API**
2. **你测试本地是否正常**
3. **确认无误后再更新其他端点**
4. **最后一起部署**

这样可以：
- ✅ 降低风险
- ✅ 快速验证
- ✅ 分步调试

---

**你想现在立即更新所有 API，还是先测试一个？**
