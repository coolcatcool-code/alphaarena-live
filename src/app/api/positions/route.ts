import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const ACCOUNT_TOTALS_API = 'https://nof1.ai/api/account_totals'
const API_TIMEOUT = 30000

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
              id: modelId,
              name: modelId,
              avatar: `/avatars/${modelId}.png`,
              description: 'AI Trading Model',
              color: '#888888',
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
