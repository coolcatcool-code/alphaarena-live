import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TRADES_API = 'https://nof1.ai/api/trades'
const API_TIMEOUT = 30000

/**
 * Recent Trades API - Returns latest trades from NOF1 API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    const response = await fetch(TRADES_API, {
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

    const data = await response.json() as { trades: any[] }
    const trades = (data.trades || [])
      .sort((a: any, b: any) => (b.entry_time || 0) - (a.entry_time || 0))
      .slice(0, limit)
      .map((trade: any) => ({
        id: trade.id || trade.trade_id,
        modelId: trade.model_id,
        symbol: trade.symbol,
        side: trade.side,
        entryTime: trade.entry_time,
        exitTime: trade.exit_time,
        realizedNetPnl: Number(trade.realized_net_pnl || 0),
        entryPrice: Number(trade.entry_price || 0),
        exitPrice: Number(trade.exit_price || 0),
        quantity: Number(trade.quantity || 0),
      }))

    return NextResponse.json({
      data: trades,
      total: trades.length,
      source: 'nof1-api-direct',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error fetching recent trades:', error)

    return NextResponse.json(
      { error: 'Failed to fetch recent trades', details: error.message },
      { status: 500 }
    )
  }
}
