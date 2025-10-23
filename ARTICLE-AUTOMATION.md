# 文章自动化生成系统

## 🎯 系统概述

自动化文章生成系统每天从Supabase数据库读取最新的AI交易数据，生成两篇分析文章：
1. **每日报告** - 当天的交易总结和排行榜分析
2. **策略分析** - 各个AI模型的交易策略对比

## 📁 文件结构

```
scripts/
  ├── generate-article.ts      # 文章生成主脚本
  └── run-article-generator.js # 运行脚本（已弃用，使用npm script代替）

content/articles/              # 生成的文章存放目录
  ├── daily-report-YYYY-MM-DD.md
  └── strategy-analysis-YYYY-MM-DD.md
```

## 🚀 使用方法

### 方法1：使用npm script（推荐）

```bash
# 生成今天的文章
pnpm generate-articles
```

### 方法2：直接运行脚本

```bash
# 使用tsx直接运行
npx tsx scripts/generate-article.ts
```

## 📝 生成的文章类型

### 1. 每日报告 (Daily Report)

**文件名格式**: `daily-report-YYYY-MM-DD.md`

**包含内容**:
- 当天交易总结
- 最新排行榜
- 表现最好/最差的AI分析
- 今日notable交易
- 市场展望

**示例**:
```markdown
---
title: "Alpha Arena Daily Report - October 23, 2025"
description: "Daily performance analysis of 6 AI trading models"
date: "2025-10-23"
author: "Alpha Arena Analytics"
tags: ["daily-report", "ai-trading", "performance-analysis"]
---

# Alpha Arena Daily Report - October 23, 2025

## Executive Summary
...
```

### 2. 策略分析 (Strategy Analysis)

**文件名格式**: `strategy-analysis-YYYY-MM-DD.md`

**包含内容**:
- 每个AI的策略profile
- 交易行为分析
- Buy/Sell比例
- 市场立场（Bullish/Bearish）
- 策略对比分析

**示例**:
```markdown
---
title: "AI Trading Strategy Comparison - Week 4"
description: "Deep dive into trading strategies employed by different AI models"
date: "2025-10-23"
...
```

## ⚙️ 配置要求

### 环境变量

确保 `.env.local` 包含以下变量：

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 依赖包

以下依赖已自动安装：
- `@supabase/supabase-js` - Supabase客户端
- `dotenv` - 环境变量加载
- `tsx` - TypeScript执行器

## 🔄 自动化方案

### 方案1：手动每天运行（当前）

```bash
# 每天运行一次
pnpm generate-articles
```

### 方案2：使用Cron Job（Linux/Mac）

创建cron任务每天自动运行：

```bash
# 编辑crontab
crontab -e

# 添加每天早上8点运行的任务
0 8 * * * cd /path/to/alphaarena && pnpm generate-articles >> logs/article-gen.log 2>&1
```

### 方案3：使用Windows任务计划程序

1. 打开"任务计划程序"
2. 创建基本任务
3. 触发器：每天
4. 操作：启动程序
   - 程序：`C:\Program Files\nodejs\node.exe`
   - 参数：`C:\path\to\pnpm generate-articles`
   - 起始于：`C:\Users\Zero\trae\alphaarena`

### 方案4：GitHub Actions（推荐，自动提交）

创建 `.github/workflows/generate-articles.yml`：

```yaml
name: Generate Daily Articles

on:
  schedule:
    - cron: '0 0 * * *'  # 每天UTC 0点运行
  workflow_dispatch:  # 允许手动触发

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Generate articles
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: pnpm generate-articles

      - name: Commit and push
        run: |
          git config user.name "Article Bot"
          git config user.email "bot@alphaarena-live.com"
          git add content/articles/
          git commit -m "chore: generate daily articles $(date +%Y-%m-%d)" || echo "No changes"
          git push
```

**配置GitHub Secrets**:
1. 访问 GitHub仓库 → Settings → Secrets
2. 添加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 📊 文章数据来源

### 数据库表

```sql
-- AI模型信息
ai_models (id, name, description, color)

-- 快照数据（排行榜）
snapshots (ai_model_id, current_pnl, total_assets, win_rate, rank)

-- 交易记录
trades (ai_model_id, symbol, side, action, amount, price, pnl, timestamp)
```

### 数据查询逻辑

1. **获取最新快照** - 查询最近10条快照，按PnL排序
2. **获取今日交易** - 筛选timestamp >= 今天0点的交易
3. **计算统计** - 交易数量、买卖比例、最活跃AI等

## 🎨 自定义文章模板

### 修改文章生成逻辑

编辑 `scripts/generate-article.ts`：

```typescript
// 修改每日报告模板
async function generateDailySummary() {
  // ... 数据获取逻辑

  const article = `
# 你的自定义标题

## 自定义章节
...
  `

  return { filename: '...', content: article }
}
```

### 添加新的文章类型

```typescript
// 添加新函数
async function generateWeeklyRecap() {
  // 实现周报生成逻辑
}

// 在main函数中调用
async function main() {
  const dailySummary = await generateDailySummary()
  const strategyAnalysis = await generateStrategyAnalysis()
  const weeklyRecap = await generateWeeklyRecap()  // 新增

  // 保存文件...
}
```

## 🐛 故障排查

### 问题1：环境变量未加载

**错误信息**: `Error: supabaseUrl is required`

**解决方法**:
```bash
# 检查.env.local是否存在
ls -la .env.local

# 检查变量是否设置
cat .env.local | grep SUPABASE
```

### 问题2：无法连接Supabase

**错误信息**: `Error fetching data from Supabase`

**解决方法**:
1. 检查网络连接
2. 验证Supabase凭证是否正确
3. 检查Supabase项目是否暂停

### 问题3：生成的文章为空

**原因**: 数据库中没有数据

**解决方法**:
```bash
# 先运行sync API确保有数据
curl -X POST http://localhost:3000/api/sync

# 然后再生成文章
pnpm generate-articles
```

### 问题4：TypeScript错误

**错误信息**: `TS2304: Cannot find name ...`

**解决方法**:
```bash
# 重新安装依赖
pnpm install

# 确保tsx已安装
pnpm add -D tsx
```

## 📈 文章质量提升

### 1. 添加更多数据分析

```typescript
// 计算移动平均
const movingAverage = snapshots.slice(0, 7).reduce(...)

// 计算波动率
const volatility = calculateVolatility(trades)

// 添加到文章中
const article = `
## 技术指标
- 7日移动平均：${movingAverage}
- 波动率：${volatility}%
`
```

### 2. 添加图表生成（可选）

使用chartjs-node-canvas生成图表：

```bash
pnpm add chartjs-node-canvas
```

```typescript
import { ChartJSNodeCanvas } from 'chartjs-node-canvas'

async function generateChart(data) {
  const canvas = new ChartJSNodeCanvas({ width: 800, height: 600 })
  const image = await canvas.renderToBuffer(chartConfig)
  fs.writeFileSync('chart.png', image)
}
```

### 3. AI内容生成（高级）

集成OpenAI API生成更丰富的分析：

```typescript
import OpenAI from 'openai'

async function enhanceWithAI(data) {
  const openai = new OpenAI()
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "user",
      content: `分析这些交易数据：${JSON.stringify(data)}`
    }]
  })
  return completion.choices[0].message.content
}
```

## 📝 最佳实践

### 1. 定期备份

```bash
# 每周备份articles目录
cp -r content/articles content/articles-backup-$(date +%Y%m%d)
```

### 2. 文章版本控制

所有文章都提交到Git，保留历史记录：

```bash
git add content/articles/
git commit -m "chore: daily articles $(date +%Y-%m-%d)"
git push
```

### 3. 监控和日志

```bash
# 记录执行日志
pnpm generate-articles >> logs/article-gen.log 2>&1

# 定期检查日志
tail -f logs/article-gen.log
```

### 4. 错误通知

添加错误通知（可选）：

```typescript
try {
  await main()
} catch (error) {
  // 发送邮件或Slack通知
  await sendNotification(`Article generation failed: ${error.message}`)
  throw error
}
```

## 🎯 下一步改进

### 短期
- [ ] 添加更多文章模板（周报、月报）
- [ ] 改进文章格式和样式
- [ ] 添加更多数据分析

### 中期
- [ ] 集成AI内容生成
- [ ] 自动生成图表
- [ ] 添加邮件订阅功能

### 长期
- [ ] 多语言支持（中文、日文）
- [ ] 视频内容生成
- [ ] 社交媒体自动发布

## 📞 获取帮助

如有问题：
1. 检查本文档的故障排查部分
2. 查看脚本代码注释
3. 查看生成的日志文件
4. 提交GitHub Issue

---

**最后更新**: 2025-10-23
**维护者**: Alpha Arena Team
