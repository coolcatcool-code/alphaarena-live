/**
 * Cloudflare Scheduled Worker for D1 Data Sync
 * This worker runs on cron schedule and syncs data from NOF1 API to D1 database
 */

export interface Env {
  DB: D1Database
  CRON_SECRET?: string
}

interface SyncResult {
  leaderboard: number
  trades: number
  analytics: number
  errors: string[]
}

// Fetch data from NOF1 API
async function fetchNOF1Data() {
  const [leaderboardRes, tradesRes, analyticsRes] = await Promise.all([
    fetch('https://nof1.ai/api/leaderboard'),
    fetch('https://nof1.ai/api/trades'),
    fetch('https://nof1.ai/api/analytics'),
  ])

  return {
    leaderboard: await leaderboardRes.json(),
    trades: await tradesRes.json(),
    analytics: await analyticsRes.json(),
  }
}

// Sync leaderboard data to D1
async function syncLeaderboard(db: D1Database, data: any): Promise<number> {
  const leaderboard = data.leaderboard || []
  let synced = 0

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

      synced++
    } catch (error) {
      console.error(`Error syncing leaderboard entry:`, error)
    }
  }

  return synced
}

// Sync trades data to D1
async function syncTrades(db: D1Database, data: any): Promise<number> {
  const trades = (data.trades || []).slice(0, 100) // Recent 100 trades
  let synced = 0

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
          trade.id || `trade-${Date.now()}-${synced}`,
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

      synced++
    } catch (error) {
      console.error(`Error syncing trade:`, error)
    }
  }

  return synced
}

// Sync analytics data to D1
async function syncAnalytics(db: D1Database, data: any): Promise<number> {
  const analytics = data.analytics || []
  let synced = 0

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

      synced++
    } catch (error) {
      console.error(`Error syncing analytics:`, error)
    }
  }

  return synced
}

// Main sync function
async function performSync(env: Env): Promise<SyncResult> {
  const result: SyncResult = {
    leaderboard: 0,
    trades: 0,
    analytics: 0,
    errors: []
  }

  try {
    console.log('📡 Fetching data from NOF1.ai...')
    const data = await fetchNOF1Data()

    console.log('💾 Syncing to D1 database...')

    // Sync all data types
    result.leaderboard = await syncLeaderboard(env.DB, data.leaderboard)
    result.trades = await syncTrades(env.DB, data.trades)
    result.analytics = await syncAnalytics(env.DB, data.analytics)

    console.log(`✅ Sync completed: ${result.leaderboard} leaderboard, ${result.trades} trades, ${result.analytics} analytics`)

  } catch (error: any) {
    console.error('❌ Sync failed:', error)
    result.errors.push(error.message || 'Unknown error')
  }

  return result
}

export default {
  // Handle scheduled events (cron triggers)
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('⏰ Cron triggered at:', new Date().toISOString())

    ctx.waitUntil(
      performSync(env).then(result => {
        console.log('📊 Sync result:', JSON.stringify(result))
      })
    )
  },

  // Handle fetch events (manual triggers)
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    // GET /status - Check sync status
    if (url.pathname === '/status' && request.method === 'GET') {
      try {
        const [snapshotsResult, tradesResult, analyticsResult] = await Promise.all([
          env.DB.prepare('SELECT COUNT(*) as count FROM snapshots').first(),
          env.DB.prepare('SELECT COUNT(*) as count FROM trades').first(),
          env.DB.prepare('SELECT COUNT(*) as count FROM analytics').first(),
        ])

        return Response.json({
          counts: {
            snapshots: snapshotsResult?.count || 0,
            trades: tradesResult?.count || 0,
            analytics: analyticsResult?.count || 0
          },
          timestamp: new Date().toISOString()
        })
      } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 })
      }
    }

    // POST /sync - Manual sync trigger
    if (url.pathname === '/sync' && request.method === 'POST') {
      // Optional: Check authorization
      // const auth = request.headers.get('authorization')
      // if (auth !== `Bearer ${env.CRON_SECRET}`) {
      //   return Response.json({ error: 'Unauthorized' }, { status: 401 })
      // }

      const result = await performSync(env)

      return Response.json({
        success: result.errors.length === 0,
        synced: {
          leaderboard: result.leaderboard,
          trades: result.trades,
          analytics: result.analytics
        },
        errors: result.errors.length > 0 ? result.errors : undefined,
        timestamp: new Date().toISOString()
      })
    }

    return Response.json({
      message: 'Alpha Arena D1 Sync Worker',
      endpoints: {
        'GET /status': 'Check sync status',
        'POST /sync': 'Trigger manual sync'
      }
    })
  }
}
