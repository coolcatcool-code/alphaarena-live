import { NextResponse } from 'next/server'
import type { AnalyticsResponse } from '@/types'

export const revalidate = 180 // 缓存3分钟 (API每3分钟更新一次)

/**
 * Analytics API Proxy
 * Fetches comprehensive trading analytics from nof1.ai
 * Data includes: trading stats, PnL analysis, fees, signals, risk metrics
 */
export async function GET() {
  try {
    const response = await fetch('https://nof1.ai/api/analytics', {
      headers: {
        'User-Agent': 'AlphaArena-Live/1.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 180 } // 3分钟缓存
    })

    if (!response.ok) {
      throw new Error(`nof1.ai API error: ${response.status} ${response.statusText}`)
    }

    const data: AnalyticsResponse = await response.json()

    return NextResponse.json({
      ...data,
      cached: false,
      source: 'nof1.ai'
    })

  } catch (error) {
    console.error('Analytics API fetch error:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch analytics data',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'error'
      },
      { status: 500 }
    )
  }
}
