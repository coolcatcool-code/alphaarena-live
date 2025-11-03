import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TRADES_API = 'https://nof1.ai/api/trades'
const API_TIMEOUT = 30000 // 30 seconds

/**
 * Complete Trades API - Fetches all detailed trade records from NOF1 API
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

    // Fetch trades from NOF1 API
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
    let trades = data.trades || []

    // Apply filters
    if (modelId) {
      trades = trades.filter((trade: any) => {
        const tradeModelId = trade.model_id?.toLowerCase()
        const searchId = modelId.toLowerCase()

        // Direct match
        if (tradeModelId === searchId) return true

        // Common mappings
        const mappings: Record<string, string[]> = {
          'claude-1': ['claude-sonnet-4-5', 'claude-sonnet', 'claude'],
          'deepseek-1': ['deepseek-chat-v3.1', 'deepseek-chat', 'deepseek'],
          'gemini-1': ['gemini-2.5-pro', 'gemini-pro', 'gemini'],
          'chatgpt-1': ['gpt-5', 'gpt-4', 'chatgpt'],
          'grok-1': ['grok-4', 'grok'],
          'qwen-1': ['qwen3-max', 'qwen'],
        }

        for (const [dbId, apiIds] of Object.entries(mappings)) {
          if (searchId === dbId && apiIds.some(id => id === tradeModelId)) {
            return true
          }
        }

        return false
      })
    }

    if (symbol) {
      trades = trades.filter((trade: any) =>
        trade.symbol?.toUpperCase() === symbol.toUpperCase()
      )
    }

    if (side) {
      trades = trades.filter((trade: any) =>
        trade.side?.toUpperCase() === side.toUpperCase()
      )
    }

    // Apply sorting
    const sortField = sortBy === 'realized_net_pnl' ? 'realized_net_pnl' :
                     sortBy === 'confidence' ? 'confidence' :
                     sortBy === 'quantity' ? 'quantity' :
                     sortBy === 'leverage' ? 'leverage' :
                     sortBy === 'exit_time' ? 'exit_time' :
                     'entry_time'

    trades.sort((a: any, b: any) => {
      const aVal = a[sortField] || 0
      const bVal = b[sortField] || 0
      return sortOrder.toUpperCase() === 'DESC' ?
        (bVal > aVal ? 1 : -1) :
        (aVal > bVal ? 1 : -1)
    })

    const totalCount = trades.length

    // Apply pagination
    const paginatedTrades = trades.slice(offset, offset + limit)

    // Transform to frontend format
    const transformedTrades = paginatedTrades.map((trade: any) => {
      let exitPlan = null
      try {
        if (typeof trade.exit_plan === 'string') {
          exitPlan = JSON.parse(trade.exit_plan)
        } else if (trade.exit_plan) {
          exitPlan = trade.exit_plan
        }
      } catch (e) {
        console.warn('Failed to parse exit_plan:', e)
      }

      return {
        id: trade.id || trade.trade_id,
        modelId: trade.model_id,

        // Basic Info
        symbol: trade.symbol,
        side: trade.side,
        tradeType: trade.trade_type || (trade.side === 'LONG' ? 'long' : 'short'),
        leverage: Number(trade.leverage || 1),
        quantity: Number(trade.quantity || 0),
        confidence: Number(trade.confidence || 0),

        // Entry Data
        entry: {
          time: Number(trade.entry_time),
          humanTime: trade.entry_human_time || new Date(trade.entry_time * 1000).toISOString(),
          price: Number(trade.entry_price || 0),
          size: Number(trade.entry_sz || trade.quantity || 0),
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
          humanTime: trade.exit_human_time || new Date(trade.exit_time * 1000).toISOString(),
          price: Number(trade.exit_price || 0),
          size: Number(trade.exit_sz || trade.quantity || 0),
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
        tradeId: trade.trade_id || trade.id,
        cachedAt: new Date().toISOString(),

        // Calculated fields
        holdingPeriodMins: trade.exit_time
          ? (Number(trade.exit_time) - Number(trade.entry_time)) / 60
          : null,
        isOpen: !trade.exit_time,
        isProfitable: Number(trade.realized_net_pnl || 0) > 0,
      }
    })

    return NextResponse.json({
      data: transformedTrades,
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
        order: sortOrder,
      },
      source: 'nof1-api-direct',
      timestamp: new Date().toISOString(),
    })

  } catch (error: any) {
    console.error('Error fetching complete trades:', error)

    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - NOF1 API took too long to respond' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch trades data from NOF1 API', details: error.message },
      { status: 500 }
    )
  }
}
