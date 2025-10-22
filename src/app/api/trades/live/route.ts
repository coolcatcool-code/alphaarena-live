import { NextResponse } from 'next/server'
import { mockTrades } from '@/lib/mock/data'

export const revalidate = 0

export async function GET() {
  try {
    // 返回最近的交易（按时间倒序）
    const sortedTrades = [...mockTrades].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    )

    return NextResponse.json({
      data: sortedTrades.slice(0, 20), // 最新 20 条
      timestamp: new Date().toISOString(),
      count: sortedTrades.length,
    })
  } catch (error) {
    console.error('Live Trades API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch live trades',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
