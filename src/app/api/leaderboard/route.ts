import { NextResponse } from 'next/server'
import { mockSnapshots } from '@/lib/mock/data'

export const revalidate = 300 // 5分钟缓存

export async function GET() {
  try {
    // MVP: 返回模拟数据
    // TODO: 后续接入真实数据抓取
    return NextResponse.json({
      data: mockSnapshots,
      timestamp: new Date().toISOString(),
      count: mockSnapshots.length,
      source: 'mock' // 标识数据来源
    })
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch leaderboard data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
