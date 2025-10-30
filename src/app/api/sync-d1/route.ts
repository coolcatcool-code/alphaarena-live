import { NextRequest, NextResponse } from 'next/server'

// Explicitly use Node.js runtime for OpenNext compatibility
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface NOF1Response {
  leaderboard?: any[]
  trades?: any[]
  analytics?: any[]
}

/**
 * Sync data from NOF1 API to D1 database
 * This endpoint can be called manually or via cron
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify authorization (optional, comment out for testing)
    // const authHeader = request.headers.get('authorization')
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    console.log('🚀 Starting D1 sync...')

    // Get D1 database binding from Cloudflare Workers environment
    // In production, this will be available via env.DB
    const env = (request as any).env
    const db = env?.DB

    if (!db) {
      return NextResponse.json({
        error: 'D1 database not available',
        note: 'This endpoint requires Cloudflare Workers environment with D1 binding'
      }, { status: 500 })
    }

    // Fetch data from NOF1 API
    console.log('📡 Fetching data from NOF1.ai...')

    const [leaderboardRes, tradesRes, analyticsRes] = await Promise.all([
      fetch('https://nof1.ai/api/leaderboard', { cache: 'no-store' }),
      fetch('https://nof1.ai/api/trades', { cache: 'no-store' }),
      fetch('https://nof1.ai/api/analytics', { cache: 'no-store' }),
    ])

    const leaderboardData = await leaderboardRes.json() as any
    const tradesData = await tradesRes.json() as any
    const analyticsData = await analyticsRes.json() as any

    const results = {
      leaderboard: 0,
      trades: 0,
      analytics: 0,
      errors: [] as string[]
    }

    // Sync Leaderboard
    const leaderboard = leaderboardData.leaderboard || []
    for (const entry of leaderboard) {
      try {
        await db
          .prepare(`
            INSERT OR REPLACE INTO snapshots (
              id, ai_model_id, current_pnl, total_assets, open_positions,
              win_rate, rank, rank_change, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            `${entry.aiModelId}-${Date.now()}`,
            entry.aiModelId,
            entry.totalPnL || 0,
            entry.totalAssets || 0,
            entry.openPositions || 0,
            entry.winRate || 0,
            entry.rank || 0,
            entry.rankChange || 0,
            new Date().toISOString()
          )
          .run()

        results.leaderboard++
      } catch (error: any) {
        results.errors.push(`Leaderboard ${entry.aiModelId}: ${error.message}`)
      }
    }

    // Sync Trades (recent 100)
    const trades = (tradesData.trades || []).slice(0, 100)
    for (const trade of trades) {
      try {
        await db
          .prepare(`
            INSERT OR IGNORE INTO trades (
              id, ai_model_id, action, symbol, side, amount, price,
              leverage, pnl, fee, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            trade.id || `trade-${Date.now()}-${results.trades}`,
            trade.aiModelId,
            trade.action || 'UNKNOWN',
            trade.symbol || '',
            trade.side || '',
            trade.amount || 0,
            trade.price || 0,
            trade.leverage || 1,
            trade.pnl || null,
            trade.fee || 0,
            trade.timestamp || new Date().toISOString()
          )
          .run()

        results.trades++
      } catch (error: any) {
        results.errors.push(`Trade: ${error.message}`)
      }
    }

    // Sync Analytics
    const analytics = analyticsData.analytics || []
    for (const entry of analytics) {
      try {
        await db
          .prepare(`
            INSERT OR REPLACE INTO analytics (
              id, ai_model_id, total_trades, winning_trades, losing_trades,
              total_volume, avg_pnl, max_drawdown, sharpe_ratio, win_rate,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            `${entry.aiModelId}-analytics`,
            entry.aiModelId,
            entry.totalTrades || 0,
            entry.winningTrades || 0,
            entry.losingTrades || 0,
            entry.totalVolume || 0,
            entry.avgPnL || 0,
            entry.maxDrawdown || 0,
            entry.sharpeRatio || 0,
            entry.winRate || 0,
            new Date().toISOString()
          )
          .run()

        results.analytics++
      } catch (error: any) {
        results.errors.push(`Analytics ${entry.aiModelId}: ${error.message}`)
      }
    }

    const duration = Date.now() - startTime

    console.log(`✅ Sync completed in ${duration}ms`)
    console.log(`📊 Results: ${results.leaderboard} leaderboard, ${results.trades} trades, ${results.analytics} analytics`)

    return NextResponse.json({
      success: true,
      duration,
      synced: {
        leaderboard: results.leaderboard,
        trades: results.trades,
        analytics: results.analytics
      },
      errors: results.errors.length > 0 ? results.errors : undefined,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Sync failed:', error)

    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack?.split('\n').slice(0, 5),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    const env = (request as any).env
    const db = env?.DB

    if (!db) {
      return NextResponse.json({
        error: 'D1 database not available'
      }, { status: 500 })
    }

    // Query counts from D1
    const [snapshotsResult, tradesResult, analyticsResult] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM snapshots').first(),
      db.prepare('SELECT COUNT(*) as count FROM trades').first(),
      db.prepare('SELECT COUNT(*) as count FROM analytics').first(),
    ])

    return NextResponse.json({
      counts: {
        snapshots: snapshotsResult?.count || 0,
        trades: tradesResult?.count || 0,
        analytics: analyticsResult?.count || 0
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Status check failed:', error)

    return NextResponse.json({
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
}
