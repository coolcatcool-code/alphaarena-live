import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Complete Trades API - Provides access to all 272 detailed trade records
 *
 * Features:
 * - Pagination (limit, offset)
 * - Filtering (model_id, symbol, side)
 * - Sorting (entry_time, realized_net_pnl, confidence)
 * - Returns all 30+ fields per trade
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination parameters
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Filter parameters
    const modelId = searchParams.get('model_id') || ''
    const symbol = searchParams.get('symbol') || ''
    const side = searchParams.get('side') || ''

    // Sort parameters
    const sortBy = searchParams.get('sort_by') || 'entry_time'
    const sortOrder = searchParams.get('sort_order') || 'DESC'

    // Validate sort parameters
    const allowedSortFields = ['entry_time', 'exit_time', 'realized_net_pnl', 'confidence', 'quantity', 'leverage']
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'entry_time'
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    // Get D1 database binding
    const env = (request as any).env
    const db = env?.DB

    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Build WHERE clause
    const whereConditions: string[] = []
    const bindings: any[] = []

    if (modelId) {
      whereConditions.push('model_id = ?')
      bindings.push(modelId)
    }

    if (symbol) {
      whereConditions.push('symbol = ?')
      bindings.push(symbol)
    }

    if (side) {
      whereConditions.push('side = ?')
      bindings.push(side)
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''

    // Query total count
    const countQuery = await db.prepare(`
      SELECT COUNT(*) as total
      FROM trades_detailed
      ${whereClause}
    `).bind(...bindings).first()

    const totalCount = Number(countQuery?.total || 0)

    // Query trades with pagination
    const tradesQuery = await db.prepare(`
      SELECT
        id,
        model_id,
        -- Basic Info
        symbol,
        side,
        trade_type,
        leverage,
        quantity,
        confidence,
        -- Entry Data
        entry_time,
        entry_human_time,
        entry_price,
        entry_sz,
        entry_oid,
        entry_tid,
        entry_commission_dollars,
        entry_closed_pnl,
        entry_crossed,
        entry_liquidation,
        -- Exit Data
        exit_time,
        exit_human_time,
        exit_price,
        exit_sz,
        exit_oid,
        exit_tid,
        exit_commission_dollars,
        exit_closed_pnl,
        exit_crossed,
        exit_liquidation,
        exit_plan,
        -- P&L Data
        realized_net_pnl,
        realized_gross_pnl,
        total_commission_dollars,
        -- Metadata
        trade_id,
        cached_at
      FROM trades_detailed
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
    `).bind(...bindings, limit, offset).all()

    const trades = (tradesQuery.results || []).map((trade: any) => {
      let exitPlan = null
      try {
        if (trade.exit_plan) {
          exitPlan = JSON.parse(trade.exit_plan)
        }
      } catch (e) {
        console.warn('Failed to parse exit_plan:', e)
      }

      return {
        id: trade.id,
        modelId: trade.model_id,

        // Basic Info
        symbol: trade.symbol,
        side: trade.side,
        tradeType: trade.trade_type,
        leverage: Number(trade.leverage || 1),
        quantity: Number(trade.quantity || 0),
        confidence: Number(trade.confidence || 0),

        // Entry Data
        entry: {
          time: Number(trade.entry_time),
          humanTime: trade.entry_human_time,
          price: Number(trade.entry_price || 0),
          size: Number(trade.entry_sz || 0),
          orderId: trade.entry_oid,
          tradeId: trade.entry_tid,
          commission: Number(trade.entry_commission_dollars || 0),
          closedPnl: Number(trade.entry_closed_pnl || 0),
          crossed: Boolean(trade.entry_crossed),
          liquidation: trade.entry_liquidation,
        },

        // Exit Data
        exit: trade.exit_time ? {
          time: Number(trade.exit_time),
          humanTime: trade.exit_human_time,
          price: Number(trade.exit_price || 0),
          size: Number(trade.exit_sz || 0),
          orderId: trade.exit_oid,
          tradeId: trade.exit_tid,
          commission: Number(trade.exit_commission_dollars || 0),
          closedPnl: Number(trade.exit_closed_pnl || 0),
          crossed: Boolean(trade.exit_crossed),
          liquidation: trade.exit_liquidation,
          plan: exitPlan,
        } : null,

        // P&L Data
        pnl: {
          realizedNet: Number(trade.realized_net_pnl || 0),
          realizedGross: Number(trade.realized_gross_pnl || 0),
          totalCommission: Number(trade.total_commission_dollars || 0),
        },

        // Metadata
        tradeId: trade.trade_id,
        cachedAt: new Date(Number(trade.cached_at) * 1000).toISOString(),

        // Calculated fields
        holdingPeriodMins: trade.exit_time
          ? (Number(trade.exit_time) - Number(trade.entry_time)) / 60
          : null,
        isOpen: !trade.exit_time,
        isProfitable: Number(trade.realized_net_pnl || 0) > 0,
      }
    })

    return NextResponse.json({
      data: trades,
      pagination: {
        total: totalCount,
        limit: limit,
        offset: offset,
        hasMore: offset + limit < totalCount,
      },
      filters: {
        modelId: modelId || null,
        symbol: symbol || null,
        side: side || null,
      },
      sorting: {
        field: sortField,
        order: sortDirection,
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Error fetching complete trades:', error)

    return NextResponse.json(
      { error: 'Failed to fetch trades data' },
      { status: 500 }
    )
  }
}
