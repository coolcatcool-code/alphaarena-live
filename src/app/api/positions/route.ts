import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const ACCOUNT_TOTALS_API = 'https://nof1.ai/api/account_totals'
const API_TIMEOUT = 30000

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

/**
 * Positions API - Fetches current open positions from NOF1 API
 */
export async function GET(request: NextRequest) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    const response = await fetch(ACCOUNT_TOTALS_API, {
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

    const data = await response.json() as { accountTotals: any[] }
    const accountTotals = data.accountTotals || []

    // Extract all open positions from all accounts
    const allPositions: any[] = []

    for (const account of accountTotals) {
      const modelId = account.model_id
      const positions = account.positions || {}

      for (const [symbol, position] of Object.entries(positions as Record<string, any>)) {
        if (position && position.quantity !== 0) {
          const modelInfo = AI_MODELS[modelId as keyof typeof AI_MODELS] || {
            id: modelId,
            name: modelId,
            avatar: `/avatars/${modelId}.png`,
            description: 'AI Trading Model',
            color: '#888888'
          }

          allPositions.push({
            id: `${modelId}-${symbol}-${position.entry_time}`,
            aiModelId: modelId,
            symbol: symbol,
            side: Number(position.quantity) > 0 ? 'LONG' : 'SHORT',
            entryPrice: Number(position.entry_price || 0),
            currentPrice: Number(position.current_price || 0),
            size: Math.abs(Number(position.quantity || 0)),
            leverage: Number(position.leverage || 1),
            pnl: Number(position.unrealized_pnl || 0),
            pnlPercentage: Number(position.unrealized_pnl || 0) / Number(position.margin || 1) * 100,
            status: 'OPEN',
            openedAt: new Date(position.entry_time * 1000),
            margin: Number(position.margin || 0),
            liquidationPrice: Number(position.liquidation_price || 0),
            aiModel: {
              id: modelInfo.id,
              name: modelInfo.name,
              avatar: modelInfo.avatar,
              description: modelInfo.description,
              color: modelInfo.color,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          })
        }
      }
    }

    return NextResponse.json({
      data: allPositions,
      timestamp: new Date().toISOString(),
      count: allPositions.length,
      source: 'nof1-api-direct'
    })

  } catch (error: any) {
    console.error('Error fetching positions:', error)

    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - NOF1 API took too long to respond' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch positions from NOF1 API', details: error.message },
      { status: 500 }
    )
  }
}
