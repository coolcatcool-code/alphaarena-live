import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Recent Trades API - Provides latest trading records based on D1 database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get D1 database binding
    const env = (request as any).env
    const db = env?.DB

    if (!db) {
      // If no D1 database, return empty data
      return NextResponse.json({
        data: [],
        total: 0,
        timestamp: new Date().toISOString()
      })
    }

    // Query recent trading data
    const tradesQuery = await db.prepare(`
      SELECT 
        id,
        model_id,
        symbol,
        side,
        entry_time,
        exit_time,
        realized_net_pnl,
        trade_data
      FROM recent_trades_cache 
      ORDER BY entry_time DESC 
      LIMIT ?
    `).bind(limit).all()

    const trades = (tradesQuery.results || []).map((trade: any) => {
      let tradeData = {}
      try {
        tradeData = JSON.parse(trade.trade_data || '{}')
      } catch (e) {
        console.warn('Failed to parse trade data:', e)
      }

      return {
        id: trade.id,
        modelId: trade.model_id,
        symbol: trade.symbol,
        side: trade.side,
        pnl: Number(trade.realized_net_pnl || 0),
        timestamp: Number(trade.entry_time),
        entryTime: Number(trade.entry_time),
        exitTime: trade.exit_time ? Number(trade.exit_time) : null,
        entryPrice: (tradeData as any).entry_price || 0,
        exitPrice: (tradeData as any).exit_price || null,
        realizedPnL: Number(trade.realized_net_pnl || 0),
        ...tradeData
      }
    })

    // 获取总交易数
    const countQuery = await db.prepare(`
      SELECT COUNT(*) as total 
      FROM recent_trades_cache
    `).first()

    return NextResponse.json({
      data: trades,
      total: Number(countQuery?.total || 0),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching recent trades:', error)
    
    return NextResponse.json({
      data: [],
      total: 0,
      timestamp: new Date().toISOString(),
      error: 'Failed to fetch trades'
    }, { status: 500 })
  }
}