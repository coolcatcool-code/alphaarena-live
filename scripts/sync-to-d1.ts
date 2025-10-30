/**
 * Sync data from NOF1 API to Cloudflare D1 database
 * This script fetches data from NOF1.ai and stores it in D1
 */

interface NOF1LeaderboardEntry {
  aiModelId: string
  aiModelName: string
  totalPnL: number
  totalAssets: number
  openPositions: number
  winRate: number
  rank: number
  rankChange: number
}

interface NOF1Trade {
  id: string
  aiModelId: string
  action: string
  symbol: string
  side: string
  amount: number
  price: number
  leverage: number
  pnl: number | null
  fee: number
  timestamp: string
}

interface NOF1Analytics {
  aiModelId: string
  totalTrades: number
  winningTrades: number
  losingTrades: number
  totalVolume: number
  avgPnL: number
  maxDrawdown: number
  sharpeRatio: number
  winRate: number
}

// Fetch data from NOF1 API
async function fetchNOF1Data() {
  console.log('📡 Fetching data from NOF1.ai...')

  const [leaderboardRes, tradesRes, analyticsRes] = await Promise.all([
    fetch('https://nof1.ai/api/leaderboard'),
    fetch('https://nof1.ai/api/trades'),
    fetch('https://nof1.ai/api/analytics'),
  ])

  const leaderboard = await leaderboardRes.json()
  const trades = await tradesRes.json()
  const analytics = await analyticsRes.json()

  return { leaderboard, trades, analytics }
}

// Sync leaderboard data to D1
async function syncLeaderboard(db: any, data: any) {
  console.log('📊 Syncing leaderboard data...')

  const leaderboard = data.leaderboard?.leaderboard || []
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
      console.error(`Error syncing leaderboard entry for ${entry.aiModelId}:`, error)
    }
  }

  console.log(`✅ Synced ${synced}/${leaderboard.length} leaderboard entries`)
  return synced
}

// Sync trades data to D1
async function syncTrades(db: any, data: any) {
  console.log('💱 Syncing trades data...')

  const trades = data.trades?.trades || []
  let synced = 0

  for (const trade of trades.slice(0, 100)) { // Limit to recent 100 trades
    try {
      await db
        .prepare(`
          INSERT OR REPLACE INTO trades (
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

  console.log(`✅ Synced ${synced}/${trades.length} trades`)
  return synced
}

// Sync analytics data to D1
async function syncAnalytics(db: any, data: any) {
  console.log('📈 Syncing analytics data...')

  const analytics = data.analytics?.analytics || []
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
      console.error(`Error syncing analytics for ${entry.aiModelId}:`, error)
    }
  }

  console.log(`✅ Synced ${synced}/${analytics.length} analytics entries`)
  return synced
}

// Main sync function
export async function syncToD1(db: any) {
  const startTime = Date.now()
  console.log('🚀 Starting D1 sync...')

  try {
    // Fetch all data
    const data = await fetchNOF1Data()

    // Sync all tables
    const results = await Promise.all([
      syncLeaderboard(db, data),
      syncTrades(db, data),
      syncAnalytics(db, data),
    ])

    const duration = Date.now() - startTime
    console.log(`\n✅ Sync completed in ${duration}ms`)
    console.log(`📊 Results: ${results[0]} leaderboard, ${results[1]} trades, ${results[2]} analytics`)

    return {
      success: true,
      duration,
      synced: {
        leaderboard: results[0],
        trades: results[1],
        analytics: results[2],
      }
    }
  } catch (error) {
    console.error('❌ Sync failed:', error)
    throw error
  }
}

// CLI execution
if (require.main === module) {
  console.log('⚠️  This script requires D1 database binding')
  console.log('Use: npx wrangler d1 execute alphaarena-db --remote --command="..."')
  console.log('Or run via Cloudflare Workers cron job')
}
