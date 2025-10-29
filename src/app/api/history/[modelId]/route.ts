import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Historical Performance API - Provides historical trends data
 *
 * Data sources:
 * - leaderboard_history - Ranking changes
 * - daily_snapshots - Daily snapshots
 * - account_totals - Account history (1,939 records)
 *
 * Returns:
 * - Equity history curve data
 * - Ranking change trends
 * - Daily P&L statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { modelId: string } }
) {
  try {
    const { modelId } = params
    const { searchParams } = new URL(request.url)

    // Time range parameters
    const days = parseInt(searchParams.get('days') || '30')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Get D1 database binding
    const env = (request as any).env
    const db = env?.DB

    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Calculate timestamp for the time range
    const currentTime = Math.floor(Date.now() / 1000)
    const startTime = currentTime - (days * 24 * 60 * 60)

    // Query leaderboard history
    const leaderboardHistoryQuery = await db.prepare(`
      SELECT
        id,
        model_id,
        timestamp,
        rank,
        equity,
        return_pct,
        sharpe,
        num_trades,
        win_rate,
        cached_at
      FROM leaderboard_history
      WHERE model_id = ? AND timestamp >= ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).bind(modelId, startTime, limit).all()

    // Query daily snapshots
    const dailySnapshotsQuery = await db.prepare(`
      SELECT
        id,
        model_id,
        snapshot_date,
        trades_count,
        total_pnl,
        total_fees,
        win_rate,
        best_trade_pnl,
        worst_trade_pnl,
        equity_eod,
        positions_open,
        cached_at
      FROM daily_snapshots
      WHERE model_id = ?
      ORDER BY snapshot_date DESC
      LIMIT ?
    `).bind(modelId, limit).all()

    // Query account totals (equity history)
    const accountTotalsQuery = await db.prepare(`
      SELECT
        id,
        model_id,
        timestamp,
        realized_pnl,
        unrealized_pnl,
        total_equity,
        positions_data,
        cached_at
      FROM account_totals
      WHERE model_id = ? AND timestamp >= ?
      ORDER BY timestamp ASC
      LIMIT ?
    `).bind(modelId, startTime, limit).all()

    // Transform leaderboard history
    const rankingHistory = (leaderboardHistoryQuery.results || []).map((entry: any) => ({
      timestamp: Number(entry.timestamp),
      date: new Date(Number(entry.timestamp) * 1000).toISOString(),
      rank: entry.rank,
      equity: Number(entry.equity || 0),
      returnPct: Number(entry.return_pct || 0),
      sharpe: Number(entry.sharpe || 0),
      numTrades: entry.num_trades,
      winRate: Number(entry.win_rate || 0),
    }))

    // Transform daily snapshots
    const dailySnapshots = (dailySnapshotsQuery.results || []).map((snapshot: any) => ({
      date: snapshot.snapshot_date,
      tradesCount: snapshot.trades_count,
      totalPnl: Number(snapshot.total_pnl || 0),
      totalFees: Number(snapshot.total_fees || 0),
      winRate: Number(snapshot.win_rate || 0),
      bestTradePnl: Number(snapshot.best_trade_pnl || 0),
      worstTradePnl: Number(snapshot.worst_trade_pnl || 0),
      equityEod: Number(snapshot.equity_eod || 0),
      positionsOpen: snapshot.positions_open,
    }))

    // Transform account totals (equity curve)
    const equityCurve = (accountTotalsQuery.results || []).map((entry: any) => {
      let positionsData = null
      try {
        if (entry.positions_data) {
          positionsData = JSON.parse(entry.positions_data)
        }
      } catch (e) {
        // Ignore parse errors
      }

      return {
        timestamp: Number(entry.timestamp),
        date: new Date(Number(entry.timestamp) * 1000).toISOString(),
        realizedPnl: Number(entry.realized_pnl || 0),
        unrealizedPnl: Number(entry.unrealized_pnl || 0),
        totalEquity: Number(entry.total_equity || 0),
        positions: positionsData,
      }
    })

    // Calculate statistics
    const stats = {
      totalDataPoints: equityCurve.length,
      rankingChanges: rankingHistory.length,
      dailySnapshots: dailySnapshots.length,
      timeRange: {
        start: new Date(startTime * 1000).toISOString(),
        end: new Date(currentTime * 1000).toISOString(),
        days: days,
      },
      currentEquity: equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].totalEquity : 0,
      startEquity: equityCurve.length > 0 ? equityCurve[0].totalEquity : 0,
      equityChange: equityCurve.length > 0
        ? equityCurve[equityCurve.length - 1].totalEquity - equityCurve[0].totalEquity
        : 0,
    }

    return NextResponse.json({
      data: {
        modelId: modelId,
        rankingHistory: rankingHistory.reverse(), // Reverse to ascending order
        dailySnapshots: dailySnapshots.reverse(),
        equityCurve: equityCurve,
        statistics: stats,
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error(`Error fetching history for model ${params.modelId}:`, error)

    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    )
  }
}
