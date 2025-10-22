import { NextResponse } from 'next/server'
import { mockPositions } from '@/lib/mock/data'

export const revalidate = 0 // 实时数据，不缓存

export async function GET() {
  try {
    // 只返回 OPEN 状态的持仓
    const openPositions = mockPositions.filter(p => p.status === 'OPEN')

    return NextResponse.json({
      data: openPositions,
      timestamp: new Date().toISOString(),
      count: openPositions.length,
    })
  } catch (error) {
    console.error('Positions API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch positions data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
