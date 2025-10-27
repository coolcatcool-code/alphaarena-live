/**
 * 自动化文章生成器
 * 从Supabase数据库读取最新数据，生成分析文章
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// 加载环境变量
config({ path: '.env.local' })

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface AIModel {
  id: string
  name: string
  description: string
  color: string
}

interface Snapshot {
  ai_model_id: string
  current_pnl: number
  total_assets: number
  win_rate: number
  rank: number
  open_positions: number
  timestamp: string
}

interface Trade {
  ai_model_id: string
  symbol: string
  side: string
  action: string
  amount: number
  price: number
  pnl: number
  timestamp: string
}

// 获取今天的数据
async function getTodayData() {
  const today = new Date().toISOString().split('T')[0]

  // 获取所有AI模型
  const { data: aiModels } = await supabase
    .from('ai_models')
    .select('*')
    .order('created_at')

  // 获取最新快照
  const { data: snapshots } = await supabase
    .from('snapshots')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(10)

  // 获取今天的交易
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .gte('timestamp', `${today}T00:00:00`)
    .order('timestamp', { ascending: false })

  return { aiModels, snapshots, trades }
}

// 生成每日总结文章
async function generateDailySummary() {
  const { aiModels, snapshots, trades } = await getTodayData()

  if (!snapshots || snapshots.length === 0) {
    console.log('No data available for today')
    return null
  }

  const date = new Date().toISOString().split('T')[0]
  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  // 按PnL排序
  const sortedAIs = snapshots
    .sort((a, b) => b.current_pnl - a.current_pnl)
    .slice(0, 6)

  // 找出表现最好和最差的
  const topPerformer = sortedAIs[0]
  const worstPerformer = sortedAIs[sortedAIs.length - 1]

  // 计算今天的交易数
  const todayTrades = trades?.length || 0

  // 找出最活跃的AI
  const tradesByAI = trades?.reduce((acc, trade) => {
    acc[trade.ai_model_id] = (acc[trade.ai_model_id] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const mostActive = Object.entries(tradesByAI)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]

  const aiModelMap = aiModels?.reduce((acc, ai) => {
    acc[ai.id] = ai
    return acc
  }, {} as Record<string, AIModel>) || {}

  const article = `---
title: "Alpha Arena Daily Report - ${formattedDate}"
description: "Daily performance analysis of 6 AI trading models in Alpha Arena competition"
date: "${date}"
author: "Alpha Arena Analytics"
tags: ["daily-report", "ai-trading", "performance-analysis"]
---

# Alpha Arena Daily Report - ${formattedDate}

## Executive Summary

Today's trading session saw ${todayTrades} trades executed across 6 AI models.
${aiModelMap[topPerformer.ai_model_id]?.name} continues to lead the pack with a ${topPerformer.current_pnl.toFixed(2)}% return,
while ${aiModelMap[worstPerformer.ai_model_id]?.name} faces challenges with a ${worstPerformer.current_pnl.toFixed(2)}% return.

## Current Leaderboard

${sortedAIs.map((snap, idx) => `
### ${idx + 1}. ${aiModelMap[snap.ai_model_id]?.name}
- **PnL**: ${snap.current_pnl >= 0 ? '+' : ''}${snap.current_pnl.toFixed(2)}%
- **Total Assets**: $${snap.total_assets.toFixed(2)}
- **Win Rate**: ${snap.win_rate.toFixed(1)}%
- **Open Positions**: ${snap.open_positions}
`).join('\n')}

## Trading Activity

Today saw **${todayTrades} trades** executed. ${mostActive ? `${aiModelMap[mostActive[0]]?.name} was the most active with ${mostActive[1]} trades.` : 'Trading activity was relatively quiet.'}

### Notable Trades

${trades?.slice(0, 5).map(trade => `
- **${aiModelMap[trade.ai_model_id]?.name}**: ${trade.action} ${Math.abs(trade.amount).toFixed(2)} ${trade.symbol} at $${trade.price.toFixed(2)}
  - P&L: ${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}
`).join('\n') || 'No significant trades today.'}

## Performance Analysis

### Top Performer: ${aiModelMap[topPerformer.ai_model_id]?.name}

${aiModelMap[topPerformer.ai_model_id]?.name} maintains its leadership position with strong performance:
- Return: **${topPerformer.current_pnl >= 0 ? '+' : ''}${topPerformer.current_pnl.toFixed(2)}%**
- Portfolio Value: **$${topPerformer.total_assets.toFixed(2)}**
- Win Rate: **${topPerformer.win_rate.toFixed(1)}%**

The model's ${aiModelMap[topPerformer.ai_model_id]?.description.toLowerCase()} continues to show effectiveness in current market conditions.

### Struggling: ${aiModelMap[worstPerformer.ai_model_id]?.name}

${aiModelMap[worstPerformer.ai_model_id]?.name} faces headwinds:
- Return: **${worstPerformer.current_pnl.toFixed(2)}%**
- Portfolio Value: **$${worstPerformer.total_assets.toFixed(2)}**

The ${aiModelMap[worstPerformer.ai_model_id]?.description.toLowerCase()} may need to adapt to current market dynamics.

## Market Outlook

Based on today's trading patterns, we observe:
- ${todayTrades > 20 ? 'High trading activity suggests increased volatility' : 'Moderate trading activity indicates stable market conditions'}
- ${Math.abs(topPerformer.current_pnl - worstPerformer.current_pnl) > 50 ? 'Wide performance spread shows divergent strategies' : 'Narrow performance spread suggests similar market interpretation'}

## Conclusion

The competition remains intense as AI models adapt their strategies daily.
Visit [Alpha Arena Live](https://alphaarena-live.com) to track real-time updates and detailed analysis.

---

*This report is automatically generated from real trading data. Last updated: ${new Date().toISOString()}*
`

  return {
    filename: `daily-report-${date}.md`,
    content: article
  }
}

// 生成策略分析文章
async function generateStrategyAnalysis() {
  const { aiModels, snapshots, trades } = await getTodayData()

  if (!snapshots) return null

  const date = new Date().toISOString().split('T')[0]

  // 分析每个AI的交易模式
  const aiTradingPatterns = aiModels?.map(ai => {
    const aiTrades = trades?.filter(t => t.ai_model_id === ai.id) || []
    const aiSnapshot = snapshots?.find(s => s.ai_model_id === ai.id)

    const totalTrades = aiTrades.length
    const buyTrades = aiTrades.filter(t => t.action === 'BUY').length
    const sellTrades = aiTrades.filter(t => t.action === 'SELL').length
    const avgTradeSize = aiTrades.length > 0
      ? aiTrades.reduce((sum, t) => sum + Math.abs(t.amount), 0) / aiTrades.length
      : 0

    return {
      ai,
      snapshot: aiSnapshot,
      totalTrades,
      buyTrades,
      sellTrades,
      avgTradeSize,
      tradingStyle: buyTrades > sellTrades ? 'Bullish' : 'Bearish'
    }
  }).filter(p => p.snapshot) || []

  const article = `---
title: "AI Trading Strategy Comparison - Week ${Math.ceil(new Date().getDate() / 7)}"
description: "Deep dive into trading strategies employed by different AI models"
date: "${date}"
author: "Alpha Arena Analytics"
tags: ["strategy-analysis", "ai-comparison", "trading-patterns"]
---

# AI Trading Strategy Comparison

## Overview

This analysis examines the distinct trading strategies employed by each AI model in the Alpha Arena competition.
By analyzing trading patterns, position sizing, and market timing, we can understand what makes each strategy unique.

## Strategy Profiles

${aiTradingPatterns.map(pattern => `
### ${pattern.ai.name}

**Strategy**: ${pattern.ai.description}

**Performance Metrics**:
- Current Return: ${pattern.snapshot!.current_pnl >= 0 ? '+' : ''}${pattern.snapshot!.current_pnl.toFixed(2)}%
- Total Assets: $${pattern.snapshot!.total_assets.toFixed(2)}
- Win Rate: ${pattern.snapshot!.win_rate.toFixed(1)}%
- Open Positions: ${pattern.snapshot!.open_positions}

**Trading Behavior**:
- Total Trades: ${pattern.totalTrades}
- Buy/Sell Ratio: ${pattern.buyTrades}/${pattern.sellTrades}
- Market Stance: **${pattern.tradingStyle}**
- Average Trade Size: ${pattern.avgTradeSize.toFixed(2)} units

**Analysis**:
${pattern.ai.name}'s ${pattern.ai.description.toLowerCase()} is ${pattern.snapshot!.current_pnl > 0 ? 'proving effective' : 'facing challenges'}
in current market conditions. The ${pattern.tradingStyle.toLowerCase()} stance ${pattern.buyTrades > pattern.sellTrades ? 'shows confidence in upward price movement' : 'suggests defensive positioning'}.
`).join('\n')}

## Comparative Analysis

### Most Active Trader
${aiTradingPatterns.sort((a, b) => b.totalTrades - a.totalTrades)[0]?.ai.name} leads in trading frequency,
executing ${aiTradingPatterns[0]?.totalTrades} trades. This aligns with their ${aiTradingPatterns[0]?.ai.description.toLowerCase()}.

### Most Selective
${aiTradingPatterns.sort((a, b) => a.totalTrades - b.totalTrades)[0]?.ai.name} takes a more measured approach with only
${aiTradingPatterns.sort((a, b) => a.totalTrades - b.totalTrades)[0]?.totalTrades} trades, reflecting their ${aiTradingPatterns.sort((a, b) => a.totalTrades - b.totalTrades)[0]?.ai.description.toLowerCase()}.

## Key Insights

1. **Strategy Diversity**: The wide range of approaches demonstrates that there's no single "best" strategy
2. **Market Adaptation**: AIs adjust their trading frequency based on market conditions
3. **Risk Management**: Position sizing varies significantly across models

## Conclusion

Each AI model brings unique strengths to the competition. The diversity in strategies makes Alpha Arena an excellent
benchmark for understanding different approaches to algorithmic trading.

Track live updates at [Alpha Arena Live](https://alphaarena-live.com).

---

*Analysis generated from real trading data. Updated: ${new Date().toISOString()}*
`

  return {
    filename: `strategy-analysis-${date}.md`,
    content: article
  }
}

// 主函数
async function main() {
  try {
    console.log('🚀 Starting article generation...')

    // 确保目录存在
    const articlesDir = path.join(process.cwd(), 'content', 'articles')
    if (!fs.existsSync(articlesDir)) {
      fs.mkdirSync(articlesDir, { recursive: true })
    }

    // 生成每日总结
    console.log('📝 Generating daily summary...')
    const dailySummary = await generateDailySummary()
    if (dailySummary) {
      const dailyPath = path.join(articlesDir, dailySummary.filename)
      fs.writeFileSync(dailyPath, dailySummary.content)
      console.log(`✅ Daily summary saved: ${dailySummary.filename}`)
    }

    // 生成策略分析
    console.log('📊 Generating strategy analysis...')
    const strategyAnalysis = await generateStrategyAnalysis()
    if (strategyAnalysis) {
      const strategyPath = path.join(articlesDir, strategyAnalysis.filename)
      fs.writeFileSync(strategyPath, strategyAnalysis.content)
      console.log(`✅ Strategy analysis saved: ${strategyAnalysis.filename}`)
    }

    console.log('🎉 Article generation complete!')

  } catch (error) {
    console.error('❌ Error generating articles:', error)
    process.exit(1)
  }
}

// 运行
if (require.main === module) {
  main()
}

export { generateDailySummary, generateStrategyAnalysis }
