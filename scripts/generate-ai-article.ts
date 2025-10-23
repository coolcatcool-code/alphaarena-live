/**
 * AI增强的文章生成器
 * 使用OpenRouter API自动生成高质量分析文章
 * 支持多种AI模型：GPT-4, Claude, DeepSeek, Llama等
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import * as fs from 'fs'
import * as path from 'path'

// 加载环境变量
config({ path: '.env.local' })

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// OpenRouter配置 (兼容OpenAI SDK)
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://alphaarena-live.com',
    'X-Title': 'Alpha Arena Live'
  }
})

// AI模型配置（可在环境变量中修改）
const AI_MODEL = process.env.AI_MODEL || 'openai/gpt-4o-mini' // 默认使用GPT-4o-mini（便宜）

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

if (!process.env.OPENROUTER_API_KEY) {
  console.error('❌ Missing OPENROUTER_API_KEY! Please set it in .env.local')
  console.error('Get your API key from: https://openrouter.ai/keys')
  console.error('')
  console.error('OpenRouter支持的模型示例:')
  console.error('  - openai/gpt-4o-mini (推荐，便宜)')
  console.error('  - anthropic/claude-3.5-sonnet (质量最高)')
  console.error('  - deepseek/deepseek-chat (超便宜)')
  console.error('  - meta-llama/llama-3.1-70b-instruct (开源)')
  console.error('')
  console.error('在 .env.local 中设置模型:')
  console.error('  AI_MODEL=openai/gpt-4o-mini')
  process.exit(1)
}

console.log(`🤖 Using AI model: ${AI_MODEL}`)

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

// 获取数据
async function getTodayData() {
  const today = new Date().toISOString().split('T')[0]

  const { data: aiModels } = await supabase
    .from('ai_models')
    .select('*')
    .order('created_at')

  const { data: snapshots } = await supabase
    .from('snapshots')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(10)

  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .gte('timestamp', `${today}T00:00:00`)
    .order('timestamp', { ascending: false })

  return { aiModels, snapshots, trades }
}

// 使用AI生成每日报告
async function generateAIDailyReport() {
  console.log('📊 Fetching data from Supabase...')
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

  // 准备数据摘要给AI
  const sortedAIs = snapshots
    .sort((a, b) => b.current_pnl - a.current_pnl)
    .slice(0, 6)

  const aiModelMap = aiModels?.reduce((acc, ai) => {
    acc[ai.id] = ai
    return acc
  }, {} as Record<string, AIModel>) || {}

  const dataContext = {
    date: formattedDate,
    totalTrades: trades?.length || 0,
    leaderboard: sortedAIs.map((snap, idx) => ({
      rank: idx + 1,
      name: aiModelMap[snap.ai_model_id]?.name,
      description: aiModelMap[snap.ai_model_id]?.description,
      pnl: snap.current_pnl,
      totalAssets: snap.total_assets,
      winRate: snap.win_rate,
      openPositions: snap.open_positions
    })),
    topTrades: trades?.slice(0, 10).map(trade => ({
      aiName: aiModelMap[trade.ai_model_id]?.name,
      symbol: trade.symbol,
      action: trade.action,
      amount: trade.amount,
      price: trade.price,
      pnl: trade.pnl
    })) || []
  }

  console.log('🤖 Generating article with AI...')

  const prompt = `You are a professional financial analyst writing a daily report for Alpha Arena, an AI trading competition.

Today's Date: ${formattedDate}

Data Summary:
- Total Trades Today: ${dataContext.totalTrades}
- Number of AI Models: ${dataContext.leaderboard.length}

Current Leaderboard:
${dataContext.leaderboard.map(ai =>
  `${ai.rank}. ${ai.name} (${ai.description})
     - PnL: ${ai.pnl >= 0 ? '+' : ''}${ai.pnl.toFixed(2)}%
     - Total Assets: $${ai.totalAssets.toFixed(2)}
     - Win Rate: ${ai.winRate.toFixed(1)}%
     - Open Positions: ${ai.openPositions}`
).join('\n\n')}

Notable Trades:
${dataContext.topTrades.slice(0, 5).map(trade =>
  `- ${trade.aiName}: ${trade.action} ${Math.abs(trade.amount).toFixed(2)} ${trade.symbol} at $${trade.price.toFixed(2)} (P&L: ${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)})`
).join('\n')}

Write a comprehensive daily report (800-1000 words) with the following sections:
1. Executive Summary - Brief overview of today's trading
2. Current Leaderboard - Detailed analysis of each AI's performance
3. Trading Activity - Analysis of trading patterns and notable trades
4. Performance Analysis - Deep dive into top and worst performers
5. Market Outlook - Forward-looking insights based on today's data
6. Conclusion - Summary and call to action

Requirements:
- Professional, engaging tone
- Use data to support insights
- Include specific numbers and percentages
- Avoid generic statements
- Write in markdown format (without frontmatter - I'll add it)
- Use ## for main sections, ### for subsections
- Make it interesting and insightful for traders

IMPORTANT: Return ONLY the markdown content without the YAML frontmatter. Start directly with the main title (# Alpha Arena Daily Report - ${formattedDate})`

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a professional financial analyst specializing in AI trading systems and market analysis. Write clear, data-driven, engaging reports.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 2500
  })

  const aiGeneratedContent = completion.choices[0].message.content || ''

  // 添加frontmatter（兼容网站格式）
  const excerpt = `Daily performance analysis of ${sortedAIs.length} AI trading models. ${aiModelMap[topPerformer.ai_model_id]?.name} leads with ${topPerformer.current_pnl >= 0 ? '+' : ''}${topPerformer.current_pnl.toFixed(2)}% returns.`

  const article = `---
title: "Alpha Arena Daily Report - ${formattedDate}"
excerpt: "${excerpt}"
category: "analysis"
tags: ["daily-report", "ai-trading", "performance-analysis", "automated"]
publishedAt: "${date}"
readTime: 8
---

${aiGeneratedContent}

---

*This report is automatically generated using AI analysis of real trading data. Last updated: ${new Date().toISOString()}*
`

  console.log('✅ Daily report generated!')

  return {
    filename: `daily-report-${date}.md`,
    content: article
  }
}

// 使用AI生成策略分析
async function generateAIStrategyAnalysis() {
  console.log('📊 Fetching data for strategy analysis...')
  const { aiModels, snapshots, trades } = await getTodayData()

  if (!snapshots || snapshots.length === 0) {
    console.log('No data available')
    return null
  }

  const date = new Date().toISOString().split('T')[0]

  const aiModelMap = aiModels?.reduce((acc, ai) => {
    acc[ai.id] = ai
    return acc
  }, {} as Record<string, AIModel>) || {}

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

    const totalPnL = aiTrades.reduce((sum, t) => sum + t.pnl, 0)
    const symbols = [...new Set(aiTrades.map(t => t.symbol))]

    return {
      name: ai.name,
      description: ai.description,
      currentPnL: aiSnapshot?.current_pnl || 0,
      totalAssets: aiSnapshot?.total_assets || 0,
      winRate: aiSnapshot?.win_rate || 0,
      openPositions: aiSnapshot?.open_positions || 0,
      totalTrades,
      buyTrades,
      sellTrades,
      avgTradeSize,
      tradingStyle: buyTrades > sellTrades ? 'Bullish' : 'Bearish',
      dailyPnL: totalPnL,
      symbolsTraded: symbols.length,
      topSymbols: symbols.slice(0, 3)
    }
  }).filter(p => p.totalAssets > 0) || []

  console.log('🤖 Generating strategy analysis with AI...')

  const prompt = `You are an expert in algorithmic trading and AI strategy analysis. Write a comprehensive strategy comparison report for Alpha Arena.

AI Trading Models Analysis:

${aiTradingPatterns.map(ai =>
  `${ai.name}:
  Strategy Type: ${ai.description}
  Performance: ${ai.currentPnL >= 0 ? '+' : ''}${ai.currentPnL.toFixed(2)}% (Total Assets: $${ai.totalAssets.toFixed(2)})
  Win Rate: ${ai.winRate.toFixed(1)}%
  Trading Activity: ${ai.totalTrades} trades (${ai.buyTrades} buys, ${ai.sellTrades} sells)
  Market Stance: ${ai.tradingStyle}
  Average Trade Size: ${ai.avgTradeSize.toFixed(2)} units
  Daily P&L: $${ai.dailyPnL.toFixed(2)}
  Symbols Traded: ${ai.symbolsTraded} different symbols
  Top Symbols: ${ai.topSymbols.join(', ')}`
).join('\n\n')}

Write an in-depth strategy analysis report (900-1100 words) with these sections:

1. Overview - Introduction to the diverse strategies being employed
2. Strategy Profiles - Detailed analysis of each AI model's approach
3. Comparative Analysis - Compare and contrast different strategies
4. Risk Management Approaches - How each model handles risk
5. Market Adaptation - Which strategies are working in current conditions
6. Key Insights - Important takeaways for traders
7. Conclusion - Summary and implications

Requirements:
- Expert-level analysis
- Compare specific metrics between models
- Discuss strengths and weaknesses of each approach
- Use trading terminology appropriately
- Be specific with data points
- Write in markdown format (without frontmatter)
- Professional and insightful tone

IMPORTANT: Return ONLY the markdown content without YAML frontmatter. Start with the main title (# AI Trading Strategy Comparison)`

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a quantitative trading expert and financial analyst specializing in algorithmic trading strategies and AI systems.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 2800
  })

  const aiGeneratedContent = completion.choices[0].message.content || ''

  const weekNumber = Math.ceil(new Date().getDate() / 7)

  // 生成excerpt
  const topPerformer = aiTradingPatterns.sort((a, b) => b.currentPnL - a.currentPnL)[0]
  const excerpt = `Deep dive into trading strategies of ${aiTradingPatterns.length} AI models. ${topPerformer?.name || 'Top performer'} leads with ${topPerformer?.tradingStyle || 'balanced'} approach.`

  const article = `---
title: "AI Trading Strategy Comparison - Week ${weekNumber}"
excerpt: "${excerpt}"
category: "analysis"
tags: ["strategy-analysis", "ai-comparison", "trading-patterns", "automated"]
publishedAt: "${date}"
readTime: 10
---

${aiGeneratedContent}

---

*This analysis is automatically generated using AI-powered insights from real trading data. Updated: ${new Date().toISOString()}*
`

  console.log('✅ Strategy analysis generated!')

  return {
    filename: `strategy-analysis-${date}.md`,
    content: article
  }
}

// 主函数
async function main() {
  try {
    console.log('🚀 Starting AI-powered article generation...\n')

    // 确保目录存在
    const articlesDir = path.join(process.cwd(), 'content', 'articles')
    if (!fs.existsSync(articlesDir)) {
      fs.mkdirSync(articlesDir, { recursive: true })
    }

    // 生成每日报告
    const dailyReport = await generateAIDailyReport()
    if (dailyReport) {
      const dailyPath = path.join(articlesDir, dailyReport.filename)
      fs.writeFileSync(dailyPath, dailyReport.content)
      console.log(`\n✅ Daily report saved: ${dailyReport.filename}`)
    }

    console.log('\n---\n')

    // 生成策略分析
    const strategyAnalysis = await generateAIStrategyAnalysis()
    if (strategyAnalysis) {
      const strategyPath = path.join(articlesDir, strategyAnalysis.filename)
      fs.writeFileSync(strategyPath, strategyAnalysis.content)
      console.log(`\n✅ Strategy analysis saved: ${strategyAnalysis.filename}`)
    }

    console.log('\n🎉 AI article generation complete!\n')

  } catch (error) {
    console.error('❌ Error generating articles:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    process.exit(1)
  }
}

// 运行
if (require.main === module) {
  main()
}

export { generateAIDailyReport, generateAIStrategyAnalysis }
