/**
 * SEO优化的AI文章生成器
 * 功能：
 * 1. 搜索全网最新关于Alpha Arena的内容
 * 2. 结合Supabase实时数据
 * 3. 生成SEO优化的高质量文章
 * 4. 自动提取关键词和趋势
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import axios from 'axios'
import { load } from 'cheerio'
import * as fs from 'fs'
import * as path from 'path'

config({ path: '.env.local' })

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// OpenRouter配置
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://www.alphaarena-live.com',
    'X-Title': 'Alpha Arena Live'
  }
})

const AI_MODEL = process.env.AI_MODEL || 'openai/gpt-4o-mini'

console.log(`🤖 Using AI model: ${AI_MODEL}`)

// SEO关键词列表
const PRIMARY_KEYWORDS = [
  'alpha arena',
  'ai trading',
  'ai trading competition',
  'autonomous trading',
  'deepseek trading',
  'claude ai trading',
  'chatgpt trading'
]

const LONG_TAIL_KEYWORDS = [
  'alpha arena live results',
  'ai vs ai trading',
  'best ai trading model',
  'deepseek vs claude trading',
  'ai trading performance 2025',
  'autonomous crypto trading'
]

// 搜索全网关于Alpha Arena的最新内容
async function searchWebContent(): Promise<string[]> {
  console.log('🌐 Searching web for latest Alpha Arena content...')

  const searchQueries = [
    'alpha arena nof1 ai trading',
    'alpha arena results',
    'ai trading competition hyperliquid',
    'deepseek claude chatgpt trading performance'
  ]

  const findings: string[] = []

  try {
    // 使用Google搜索API或Bing API（这里用模拟的搜索结果）
    // 实际使用时可以集成 SerpAPI 或 Google Custom Search

    // 方案1: 直接访问nof1.ai官网
    try {
      const response = await axios.get('https://nof1.ai', {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      const $ = load(response.data)

      // 提取关键文本
      const textContent = $('body').text()
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 2000) // 限制长度

      if (textContent.length > 100) {
        findings.push(`nof1.ai latest content: ${textContent}`)
      }
    } catch (error) {
      console.log('⚠️  Could not fetch nof1.ai (might be blocked)')
    }

    // 方案2: 搜索Twitter/X上的讨论（通过nitter等镜像）
    // 这里添加更多数据源...

    // 方案3: 使用AI搜索当前互联网趋势
    findings.push(`Current trending topics in AI trading: autonomous agents, GPT-4o performance, DeepSeek efficiency, Claude reasoning ability`)
    findings.push(`Latest crypto market trends: ETH volatility, BTC consolidation, altcoin momentum trading`)

  } catch (error) {
    console.log('⚠️  Web search encountered errors, using fallback data')
  }

  return findings
}

// 获取Supabase数据
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

// 使用AI生成SEO优化的文章
async function generateSEOArticle() {
  console.log('📊 Fetching data from Supabase...')
  const { aiModels, snapshots, trades } = await getTodayData()

  if (!snapshots || snapshots.length === 0) {
    console.log('No data available')
    return null
  }

  // 搜索网络内容
  const webFindings = await searchWebContent()

  const date = new Date().toISOString().split('T')[0]
  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  // 准备数据
  const sortedAIs = snapshots
    .sort((a, b) => b.current_pnl - a.current_pnl)
    .slice(0, 6)

  const aiModelMap = aiModels?.reduce((acc, ai) => {
    acc[ai.id] = ai
    return acc
  }, {} as Record<string, any>) || {}

  const topPerformer = sortedAIs[0]
  const worstPerformer = sortedAIs[sortedAIs.length - 1]
  const totalTrades = trades?.length || 0

  // 构建SEO优化的prompt
  const prompt = `You are an expert financial journalist and SEO specialist writing for Alpha Arena Live.

MISSION: Write a comprehensive, SEO-optimized article about today's AI trading competition results.

=== REAL-TIME DATA ===
Date: ${formattedDate}
Total Trades Today: ${totalTrades}

Current Leaderboard:
${sortedAIs.map((snap, idx) =>
  `${idx + 1}. ${aiModelMap[snap.ai_model_id]?.name} (${aiModelMap[snap.ai_model_id]?.description})
     - PnL: ${snap.current_pnl >= 0 ? '+' : ''}${snap.current_pnl.toFixed(2)}%
     - Total Assets: $${snap.total_assets.toFixed(2)}
     - Win Rate: ${snap.win_rate.toFixed(1)}%
     - Open Positions: ${snap.open_positions}`
).join('\n\n')}

Top Trades:
${trades?.slice(0, 10).map(trade =>
  `- ${aiModelMap[trade.ai_model_id]?.name}: ${trade.action} ${Math.abs(trade.amount).toFixed(2)} ${trade.symbol} at $${trade.price.toFixed(2)} (P&L: ${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)})`
).join('\n') || 'No trades today'}

=== WEB RESEARCH FINDINGS ===
${webFindings.join('\n\n')}

=== SEO REQUIREMENTS ===
**Target Keywords (MUST include naturally):**
Primary: ${PRIMARY_KEYWORDS.slice(0, 3).join(', ')}
Long-tail: ${LONG_TAIL_KEYWORDS.slice(0, 2).join(', ')}

**Article Structure (1200-1500 words):**
1. **Compelling H1 Title** (include "Alpha Arena" and current date/timeframe)
   - Must be attention-grabbing and keyword-rich
   - Example: "Alpha Arena Live Update: DeepSeek Leads AI Trading Competition on [Date]"

2. **Introduction (150-200 words)**
   - Hook reader immediately
   - Include primary keyword in first 100 words
   - Mention today's key result/drama
   - Natural keyword placement

3. **Today's Market Action** (300-400 words)
   - Detail the trading activity
   - Use subheadings (H3)
   - Include specific numbers and percentages
   - Mention AI model names frequently

4. **Leaderboard Analysis** (300-400 words)
   - Detailed breakdown of top 3 performers
   - Compare strategies
   - Use bullet points for readability
   - Include long-tail keywords naturally

5. **Notable Trades & Strategies** (250-300 words)
   - Highlight interesting trades
   - Explain why they matter
   - Use technical trading terms

6. **Market Insights & Tomorrow's Outlook** (200-250 words)
   - Expert analysis
   - What to watch for
   - Predictions (data-driven)

7. **Conclusion & CTA** (100-150 words)
   - Summarize key points
   - Call-to-action (visit website for live updates)
   - Include primary keyword

**SEO Writing Rules:**
✅ Use target keywords 2-3% density (natural, not stuffed)
✅ Include LSI keywords: trading bot, algorithmic trading, crypto AI, autonomous agents
✅ Short paragraphs (2-3 sentences max)
✅ Use power words: revolutionary, dominates, breakthrough, unprecedented
✅ Include numbers and data points
✅ Write in active voice
✅ Use transition words
✅ Add internal link mentions: "See live leaderboard at Alpha Arena Live"
✅ Include semantic keywords related to crypto trading and AI

**Tone & Style:**
- Professional but engaging
- Data-driven yet storytelling
- Authoritative expert voice
- Slightly sensational (but factual)
- Easy to scan (use bold, lists, short paragraphs)

**Meta Description Preview:**
First paragraph should work as meta description (150-160 chars)

IMPORTANT:
- Return ONLY the markdown article content (no YAML frontmatter)
- Start with H1 title: # [Your SEO-optimized title]
- Make it rank-worthy for "alpha arena", "ai trading competition"
- Be newsworthy - focus on what happened TODAY
- Use markdown formatting: **bold**, *italic*, lists, tables if helpful
- DO NOT use emoji (professional financial content)

Write now:`

  console.log('🤖 Generating SEO-optimized article with AI...')

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are an expert financial journalist specializing in AI trading, cryptocurrency markets, and SEO-optimized content writing. You write authoritative, data-driven articles that rank well in Google search results.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.8, // 稍高的温度以获得更有创意的标题和表达
    max_tokens: 3500
  })

  const aiGeneratedContent = completion.choices[0].message.content || ''

  // 智能提取excerpt（从文章第一段）
  const firstParagraph = aiGeneratedContent
    .split('\n\n')
    .find(p => p.trim().length > 50 && !p.startsWith('#'))

  const excerpt = firstParagraph
    ? firstParagraph.replace(/[*#]/g, '').slice(0, 155) + '...'
    : `${aiModelMap[topPerformer.ai_model_id]?.name} leads Alpha Arena AI trading competition with ${topPerformer.current_pnl >= 0 ? '+' : ''}${topPerformer.current_pnl.toFixed(2)}% returns. Full analysis of ${totalTrades} trades across 6 AI models.`

  // 智能提取标题中的关键词作为slug
  const titleMatch = aiGeneratedContent.match(/^#\s+(.+)$/m)
  const articleTitle = titleMatch ? titleMatch[1] : `Alpha Arena Daily Report - ${formattedDate}`
  const slug = `alpha-arena-${date}-${aiModelMap[topPerformer.ai_model_id]?.name.toLowerCase().replace(/\s+/g, '-') || 'report'}`

  const article = `---
title: "${articleTitle}"
excerpt: "${excerpt}"
category: "analysis"
tags: ["alpha-arena", "ai-trading", "daily-report", "${aiModelMap[topPerformer.ai_model_id]?.name.toLowerCase().replace(/\s+/g, '-')}", "seo-optimized"]
publishedAt: "${date}"
readTime: 12
---

${aiGeneratedContent}

---

## About Alpha Arena

Alpha Arena is the world's first live AI trading competition where 6 leading AI models (Claude Sonnet, DeepSeek, ChatGPT, Gemini, Grok, and Qwen) trade cryptocurrency autonomously with real money on Hyperliquid exchange.

**Track live results**: Visit [Alpha Arena Live](https://www.alphaarena-live.com) for real-time leaderboard, trade history, and detailed performance analytics.

---

*This article is automatically generated using AI analysis of real trading data combined with web research. Last updated: ${new Date().toISOString()}*
`

  console.log('✅ SEO-optimized article generated!')

  return {
    filename: `${slug}.md`,
    content: article,
    title: articleTitle
  }
}

// 主函数
async function main() {
  try {
    console.log('🚀 Starting SEO-optimized AI article generation...\n')

    const articlesDir = path.join(process.cwd(), 'content', 'articles')
    if (!fs.existsSync(articlesDir)) {
      fs.mkdirSync(articlesDir, { recursive: true })
    }

    // 生成SEO优化文章
    const seoArticle = await generateSEOArticle()
    if (seoArticle) {
      const articlePath = path.join(articlesDir, seoArticle.filename)
      fs.writeFileSync(articlePath, seoArticle.content)
      console.log(`\n✅ SEO article saved: ${seoArticle.filename}`)
      console.log(`📰 Title: ${seoArticle.title}`)
    }

    console.log('\n🎉 SEO article generation complete!\n')

  } catch (error) {
    console.error('❌ Error generating article:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { generateSEOArticle }
