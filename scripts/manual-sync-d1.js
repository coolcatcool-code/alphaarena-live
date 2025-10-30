/**
 * Manual D1 Sync Script
 * Fetches data from NOF1 API and generates SQL statements to insert into D1
 */

const https = require('https')
const { execSync } = require('child_process')

// Fetch data from NOF1 API
async function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

// Execute SQL in D1
function executeSQL(sql) {
  const escapedSQL = sql.replace(/"/g, '\\"')
  const command = `npx wrangler d1 execute alphaarena-db --remote --command="${escapedSQL}"`

  try {
    execSync(command, { stdio: 'inherit' })
    return true
  } catch (error) {
    console.error('SQL execution failed:', error.message)
    return false
  }
}

// Main sync function
async function syncToD1() {
  console.log('🚀 Starting manual D1 sync...\n')

  try {
    // Fetch data
    console.log('📡 Fetching data from NOF1.ai...')

    const [leaderboardData, tradesData, analyticsData] = await Promise.all([
      fetchData('https://nof1.ai/api/leaderboard'),
      fetchData('https://nof1.ai/api/trades'),
      fetchData('https://nof1.ai/api/analytics')
    ])

    const timestamp = new Date().toISOString()
    let successCount = 0
    let errorCount = 0

    // Sync Leaderboard
    console.log('\n📊 Syncing leaderboard...')
    const leaderboard = leaderboardData.leaderboard || []

    for (const entry of leaderboard) {
      const sql = `INSERT OR REPLACE INTO snapshots (
        id, ai_model_id, current_pnl, total_assets, open_positions,
        win_rate, rank, rank_change, timestamp
      ) VALUES (
        '${entry.aiModelId}-${Date.now()}',
        '${entry.aiModelId}',
        ${entry.totalPnL || 0},
        ${entry.totalAssets || 0},
        ${entry.openPositions || 0},
        ${entry.winRate || 0},
        ${entry.rank || 0},
        ${entry.rankChange || 0},
        '${timestamp}'
      );`

      if (executeSQL(sql)) {
        successCount++
        console.log(`  ✓ ${entry.aiModelId}`)
      } else {
        errorCount++
      }
    }

    // Sync Trades (recent 50)
    console.log('\n💱 Syncing trades (recent 50)...')
    const trades = (tradesData.trades || []).slice(0, 50)

    for (const trade of trades) {
      const tradeId = trade.id || `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const sql = `INSERT OR IGNORE INTO trades (
        id, ai_model_id, action, symbol, side, amount, price,
        leverage, pnl, fee, timestamp
      ) VALUES (
        '${tradeId}',
        '${trade.aiModelId}',
        '${trade.action || 'UNKNOWN'}',
        '${trade.symbol || ''}',
        '${trade.side || ''}',
        ${trade.amount || 0},
        ${trade.price || 0},
        ${trade.leverage || 1},
        ${trade.pnl !== undefined && trade.pnl !== null ? trade.pnl : 'NULL'},
        ${trade.fee || 0},
        '${trade.timestamp || timestamp}'
      );`

      if (executeSQL(sql)) {
        successCount++
        console.log(`  ✓ ${tradeId.substr(0, 20)}...`)
      } else {
        errorCount++
      }
    }

    // Sync Analytics
    console.log('\n📈 Syncing analytics...')
    const analytics = analyticsData.analytics || []

    for (const entry of analytics) {
      const sql = `INSERT OR REPLACE INTO analytics (
        id, ai_model_id, total_trades, winning_trades, losing_trades,
        total_volume, avg_pnl, max_drawdown, sharpe_ratio, win_rate,
        updated_at
      ) VALUES (
        '${entry.aiModelId}-analytics',
        '${entry.aiModelId}',
        ${entry.totalTrades || 0},
        ${entry.winningTrades || 0},
        ${entry.losingTrades || 0},
        ${entry.totalVolume || 0},
        ${entry.avgPnL || 0},
        ${entry.maxDrawdown || 0},
        ${entry.sharpeRatio || 0},
        ${entry.winRate || 0},
        '${timestamp}'
      );`

      if (executeSQL(sql)) {
        successCount++
        console.log(`  ✓ ${entry.aiModelId}`)
      } else {
        errorCount++
      }
    }

    console.log('\n✅ Sync completed!')
    console.log(`  Success: ${successCount}`)
    console.log(`  Errors: ${errorCount}`)

    // Verify data
    console.log('\n🔍 Verifying data...')
    executeSQL('SELECT COUNT(*) as count FROM snapshots;')
    executeSQL('SELECT COUNT(*) as count FROM trades;')
    executeSQL('SELECT COUNT(*) as count FROM analytics;')

  } catch (error) {
    console.error('\n❌ Sync failed:', error.message)
    process.exit(1)
  }
}

// Run sync
syncToD1().catch(console.error)
