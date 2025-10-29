import { NextRequest, NextResponse } from 'next/server'
import { mockSnapshots } from '@/lib/mock/data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0 // 不缓存，始终读取最新数据

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
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get D1 database binding
    const env = (request as any).env
    const db = env?.DB

    if (!db) {
      console.warn('D1 database not available, using mock data')
      // 降级到 mock 数据
      return NextResponse.json({
        data: mockSnapshots,
        timestamp: new Date().toISOString(),
        count: mockSnapshots.length,
        source: 'mock-fallback'
      }, { status: 200 })
    }

    // Query leaderboard from D1
    const leaderboardQuery = await db.prepare(`
      SELECT
        model_id,
        num_trades,
        sharpe,
        win_dollars,
        num_losses,
        lose_dollars,
        return_pct,
        equity,
        num_wins,
        rank,
        cached_at
      FROM leaderboard_cache
      WHERE model_id != ''
      ORDER BY rank ASC
    `).all()

    const leaderboard = leaderboardQuery.results || []

    // Transform to frontend format
    const enrichedSnapshots = leaderboard.map((entry: any) => {
      const modelId = entry.model_id
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

      return {
        id: `snapshot-${modelId}-${entry.cached_at}`,
        aiModelId: modelId,
        currentPnL: Number(entry.return_pct || 0),
        totalAssets: Number(entry.equity || 0),
        openPositions: 0, // Will be populated from positions data if needed
        totalTrades: totalTrades,
        winRate: winRate,
        rank: entry.rank || 0,
        rankChange: 0, // TODO: Calculate from leaderboard_history
        timestamp: new Date(Number(entry.cached_at) * 1000),
        aiModel: {
          id: modelInfo.id,
          name: modelInfo.name,
          avatar: modelInfo.avatar,
          description: modelInfo.description,
          color: modelInfo.color,
          createdAt: new Date(),
          updatedAt: new Date(Number(entry.cached_at) * 1000),
        }
      }
    })

    return NextResponse.json({
      data: enrichedSnapshots,
      timestamp: new Date().toISOString(),
      count: enrichedSnapshots.length,
      source: 'd1' // 标记数据源为D1
    })

  } catch (error) {
    console.error('D1 API error:', error)
    // 降级到 mock 数据
    return NextResponse.json({
      data: mockSnapshots,
      timestamp: new Date().toISOString(),
      count: mockSnapshots.length,
      source: 'mock-fallback'
    }, { status: 200 })
  }
}
