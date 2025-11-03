// @ts-nocheck

/**
 * Check D1 Database Data Status
 *
 * This script checks all tables in D1 to see which have data and which are empty.
 */

// D1 Tables to check
const D1_TABLES = [
  'leaderboard_cache',
  'recent_trades_cache',
  'crypto_prices_cache',
  'crypto_prices_realtime',
  'model_analytics',
  'trades_detailed',
  'leaderboard_history',
  'daily_snapshots',
  'account_totals',
]

interface TableStatus {
  table: string
  count: number
  sample?: any
  error?: string
}

async function checkD1Tables(): Promise<void> {
  console.log('🔍 Checking D1 database tables...\n')

  const results: TableStatus[] = []

  // Use the API endpoint to check data
  const baseUrl = process.env.WORKER_URL || 'https://www.alphaarena-live.com'

  for (const table of D1_TABLES) {
    try {
      // Try to get data via API endpoints
      let endpoint = ''
      let count = 0
      let sample: any = null

      switch (table) {
        case 'leaderboard_cache':
          endpoint = `${baseUrl}/api/leaderboard`
          break
        case 'crypto_prices_realtime':
          endpoint = `${baseUrl}/api/crypto/prices`
          break
        case 'model_analytics':
          endpoint = `${baseUrl}/api/analytics/claude-sonnet-4-5`
          break
        case 'trades_detailed':
          endpoint = `${baseUrl}/api/trades/complete?limit=1`
          break
        default:
          // Skip tables without API endpoints
          results.push({ table, count: -1, error: 'No API endpoint' })
          continue
      }

      const response = await fetch(endpoint)
      const data = await response.json()

      if (data.data) {
        if (Array.isArray(data.data)) {
          count = data.pagination?.total || data.data.length
          sample = data.data[0]
        } else {
          count = 1
          sample = data.data
        }
      }

      results.push({ table, count, sample })
    } catch (error: any) {
      results.push({ table, count: 0, error: error.message })
    }
  }

  // Print results
  console.log('📊 D1 Database Status Report\n')
  console.log('=' .repeat(80))

  for (const result of results) {
    const status = result.count > 0 ? '✅' : result.count === 0 ? '❌' : '⚠️'
    const countStr = result.count >= 0 ? `${result.count} records` : 'No API'

    console.log(`${status} ${result.table.padEnd(30)} ${countStr}`)

    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }

    if (result.sample) {
      console.log(`   Sample: ${JSON.stringify(result.sample).substring(0, 100)}...`)
    }

    console.log()
  }

  console.log('=' .repeat(80))

  const totalTables = results.length
  const tablesWithData = results.filter(r => r.count > 0).length
  const emptyTables = results.filter(r => r.count === 0).length
  const noApiTables = results.filter(r => r.count === -1).length

  console.log(`\n📈 Summary:`)
  console.log(`   Total tables: ${totalTables}`)
  console.log(`   ✅ Tables with data: ${tablesWithData}`)
  console.log(`   ❌ Empty tables: ${emptyTables}`)
  console.log(`   ⚠️  Tables without API: ${noApiTables}`)

  console.log(`\n💡 Next steps:`)
  if (emptyTables > 0) {
    console.log(`   - Some tables are empty. The sync job may need more time.`)
    console.log(`   - Wait for the next 5-minute sync cycle and check again.`)
    console.log(`   - Or manually trigger: https://github.com/coolcatcool-code/alphaarena-live/actions/workflows/sync-data.yml`)
  } else {
    console.log(`   - All tables have data! ✨`)
    console.log(`   - Check the website: ${baseUrl}`)
  }
}

checkD1Tables().catch(console.error)
// @ts-nocheck
