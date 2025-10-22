import { NextResponse } from 'next/server'
import { mockPositions, aiModels, generateMockTradeHistory, mockSnapshots } from '@/lib/mock/data'

export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: { aiModelId: string } }
) {
  try {
    const { aiModelId } = params

    const aiModel = aiModels[aiModelId]
    if (!aiModel) {
      return NextResponse.json(
        { error: 'AI Model not found' },
        { status: 404 }
      )
    }

    const snapshot = mockSnapshots.find(s => s.aiModelId === aiModelId)
    if (!snapshot) {
      return NextResponse.json(
        { error: 'Snapshot not found' },
        { status: 404 }
      )
    }

    const positions = mockPositions.filter(
      p => p.aiModelId === aiModelId && p.status === 'OPEN'
    )

    const recentTrades = generateMockTradeHistory(aiModelId, 20)

    // 计算统计数据
    const allTrades = generateMockTradeHistory(aiModelId, 100)
    const totalTrades = allTrades.length
    const avgHoldTime = 4.2 // hours
    const favoriteAsset = 'BTC'
    const avgLeverage = positions.reduce((sum, p) => sum + p.leverage, 0) / positions.length || 2

    return NextResponse.json({
      aiModel,
      snapshot,
      positions,
      recentTrades,
      stats: {
        totalTrades,
        avgHoldTime,
        favoriteAsset,
        avgLeverage: Math.round(avgLeverage * 10) / 10,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('AI Detail API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch AI detail',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
