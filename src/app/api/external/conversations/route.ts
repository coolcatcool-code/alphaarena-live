import { NextResponse } from 'next/server'
import type { ConversationsResponse } from '@/types'

export const dynamic = 'force-dynamic' // Don't pre-render at build time
export const revalidate = 180 // 缓存3分钟 (API每3分钟更新一次)

/**
 * Conversations API Proxy
 * Fetches AI decision-making process from nof1.ai
 * Data includes: market data, chain of thought, decisions, positions
 */
export async function GET() {
  try {
    const response = await fetch('https://nof1.ai/api/conversations', {
      headers: {
        'User-Agent': 'AlphaArena-Live/1.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 180 } // 3分钟缓存
    })

    if (!response.ok) {
      throw new Error(`nof1.ai API error: ${response.status} ${response.statusText}`)
    }

    const data: ConversationsResponse = await response.json()

    return NextResponse.json({
      ...data,
      cached: false,
      source: 'nof1.ai'
    })

  } catch (error) {
    console.error('Conversations API fetch error:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch conversations data',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'error'
      },
      { status: 500 }
    )
  }
}
