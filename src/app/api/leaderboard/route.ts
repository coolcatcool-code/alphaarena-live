import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const LEADERBOARD_API = 'https://nof1.ai/api/leaderboard'
const API_TIMEOUT = 30000 // 30 seconds

// AI Model metadata
const AI_MODELS = {
  'qwen3-max': {
    id: 'qwen3-max',
    name: 'Qwen3 Max',
    avatar: '/avatars/qwen.png',
    description: "Alibaba's flagship model with exceptional performance",
    color: '#06B6D4'
  },
  'deepseek-chat-v3.1': {
    id: 'deepseek-chat-v3.1',
    name: 'DeepSeek Chat v3.1',
    avatar: '/avatars/deepseek.png',
    description: 'High-performance model optimized for financial analysis',
    color: '#EF4444'
  },
  'claude-sonnet-4-5': {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    avatar: '/avatars/claude.png',
    description: "Anthropic's most capable model for nuanced understanding",
    color: '#8B5CF6'
  },
  'grok-4': {
    id: 'grok-4',
    name: 'Grok-4',
    avatar: '/avatars/grok.png',
    description: "xAI's advanced model with real-time information processing",
    color: '#FF6B6B'
  },
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    avatar: '/avatars/gemini.png',
    description: "Google's multimodal AI with advanced reasoning",
    color: '#F59E0B'
  },
  'gpt-5': {
    id: 'gpt-5',
    name: 'GPT-5',
    avatar: '/avatars/gpt5.png',
    description: 'Advanced language model with superior reasoning capabilities',
    color: '#10B981'
  },
  'buynhold_btc': {
    id: 'buynhold_btc',
    name: 'Buy & Hold BTC',
    avatar: '/avatars/btc.png',
    description: 'Passive buy and hold Bitcoin strategy',
    color: '#F7931A'
  }
}

export async function GET(request: NextRequest) {
  try {
    // Fetch leaderboard from NOF1 API
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    const response = await fetch(LEADERBOARD_API, {
      headers: {
        'User-Agent': 'AlphaArena/1.0',
        'Accept': 'application/json'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`NOF1 API returned ${response.status}`)
    }

    const data = await response.json() as { leaderboard: any[] }
    const leaderboard = data.leaderboard || []

    // Transform to frontend format
    const enrichedSnapshots = leaderboard.map((entry: any, index: number) => {
      const modelId = entry.id || entry.model_id
      const modelInfo = AI_MODELS[modelId as keyof typeof AI_MODELS] || {
        id: modelId,
        name: modelId,
        avatar: '/avatars/default.png',
        description: 'AI Trading Model',
        color: '#888888'
      }

      // Calculate win rate
      const totalTrades = entry.num_trades || 0
      const numWins = entry.num_wins || 0
      const winRate = totalTrades > 0 ? (numWins / totalTrades) * 100 : 0

      const timestamp = new Date()

      return {
        id: `snapshot-${modelId}-${timestamp.getTime()}`,
        aiModelId: modelId,
        currentPnL: Number(entry.return_pct || 0),
        totalAssets: Number(entry.equity || 0),
        openPositions: 0, // Will be calculated from positions if needed
        totalTrades: totalTrades,
        winRate: winRate,
        rank: entry.rank || (index + 1),
        rankChange: 0,
        timestamp: timestamp,
        aiModel: {
          id: modelInfo.id,
          name: modelInfo.name,
          avatar: modelInfo.avatar,
          description: modelInfo.description,
          color: modelInfo.color,
          createdAt: new Date(),
          updatedAt: timestamp,
        }
      }
    })

    return NextResponse.json({
      data: enrichedSnapshots,
      timestamp: new Date().toISOString(),
      count: enrichedSnapshots.length,
      source: 'nof1-api-direct'
    })

  } catch (error: any) {
    console.error('NOF1 API error:', error)

    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - NOF1 API took too long to respond' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch leaderboard from NOF1 API', details: error.message },
      { status: 500 }
    )
  }
}
