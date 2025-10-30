/**
 * Check Data Sync Status (Both D1 and Supabase)
 *
 * Checks both D1 cache tables and Supabase source tables
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const WORKER_URL = process.env.WORKER_URL || 'https://www.alphaarena-live.com'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface TableStatus {
  table: string
  count: number
  sample?: any
  error?: string
}

async function checkD1Tables(): Promise<TableStatus[]> {
  console.log('📦 Checking D1 Cache Tables...')

  const D1_TABLES = [
    { name: 'leaderboard_cache', endpoint: '/api/leaderboard' },
    { name: 'crypto_prices_realtime', endpoint: '/api/crypto/prices' },
  ]

  const results: TableStatus[] = []

  for (const { name, endpoint } of D1_TABLES) {
    try {
      const response = await fetch(`${WORKER_URL}${endpoint}`)
      const data = await response.json()

      let count = 0
      let sample: any = null

      if (data.data) {
        if (Array.isArray(data.data)) {
          count = data.pagination?.total || data.data.length
          sample = data.data[0]
        } else {
          count = 1
          sample = data.data
        }
      }

      results.push({ table: name, count, sample })
    } catch (error: any) {
      results.push({ table: name, count: 0, error: error.message })
    }
  }

  return results
}

async function checkSupabaseTables(): Promise<TableStatus[]> {
  console.log('\n🗄️  Checking Supabase Source Tables...')

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const results: TableStatus[] = []

  // Check trades table
  try {
    const { data, error, count } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: false })
      .limit(1)

    if (error) throw error

    results.push({
      table: 'trades (Supabase)',
      count: count || 0,
      sample: data?.[0]
    })
  } catch (error: any) {
    results.push({
      table: 'trades (Supabase)',
      count: 0,
      error: error.message
    })
  }

  // Check analytics_snapshots table
  try {
    const { data, error, count } = await supabase
      .from('analytics_snapshots')
      .select('*', { count: 'exact', head: false })
      .order('timestamp', { ascending: false })
      .limit(1)

    if (error) throw error

    results.push({
      table: 'analytics_snapshots (Supabase)',
      count: count || 0,
      sample: data?.[0]
    })
  } catch (error: any) {
    results.push({
      table: 'analytics_snapshots (Supabase)',
      count: 0,
      error: error.message
    })
  }

  // Check ai_conversations table
  try {
    const { data, error, count } = await supabase
      .from('ai_conversations')
      .select('*', { count: 'exact', head: false })
      .limit(1)

    if (error) throw error

    results.push({
      table: 'ai_conversations (Supabase)',
      count: count || 0,
      sample: data?.[0]
    })
  } catch (error: any) {
    results.push({
      table: 'ai_conversations (Supabase)',
      count: 0,
      error: error.message
    })
  }

  // Check ai_models table
  try {
    const { data, error, count } = await supabase
      .from('ai_models')
      .select('*', { count: 'exact', head: false })
      .limit(1)

    if (error) throw error

    results.push({
      table: 'ai_models (Supabase)',
      count: count || 0,
      sample: data?.[0]
    })
  } catch (error: any) {
    results.push({
      table: 'ai_models (Supabase)',
      count: 0,
      error: error.message
    })
  }

  return results
}

async function main() {
  console.log('🔍 Comprehensive Data Sync Status Check\n')
  console.log('=' .repeat(80))

  // Check D1 tables
  const d1Results = await checkD1Tables()

  // Check Supabase tables
  const supabaseResults = await checkSupabaseTables()

  // Print all results
  console.log('\n📊 Complete Status Report\n')
  console.log('=' .repeat(80))

  const allResults = [...d1Results, ...supabaseResults]

  for (const result of allResults) {
    const status = result.count > 0 ? '✅' : result.error ? '❌' : '⚠️'
    const countStr = result.count >= 0 ? `${result.count} records` : 'Unknown'

    console.log(`\n${status} ${result.table.padEnd(40)} ${countStr}`)

    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }

    if (result.sample && result.count > 0) {
      const sampleStr = JSON.stringify(result.sample).substring(0, 100)
      console.log(`   Sample: ${sampleStr}...`)
    }
  }

  console.log('\n' + '=' .repeat(80))

  // Summary
  const d1Tables = d1Results.length
  const d1WithData = d1Results.filter(r => r.count > 0).length
  const supabaseTables = supabaseResults.length
  const supabaseWithData = supabaseResults.filter(r => r.count > 0).length

  console.log(`\n📈 Summary:`)
  console.log(`   D1 Cache Tables: ${d1WithData}/${d1Tables} populated`)
  console.log(`   Supabase Source Tables: ${supabaseWithData}/${supabaseTables} populated`)

  const totalTables = allResults.length
  const totalWithData = allResults.filter(r => r.count > 0).length
  const overallHealth = ((totalWithData / totalTables) * 100).toFixed(1)

  console.log(`   Overall Health: ${overallHealth}% (${totalWithData}/${totalTables} tables with data)`)

  console.log(`\n💡 Status:`)
  if (supabaseWithData === supabaseTables) {
    console.log(`   ✅ Data sync is working! All Supabase tables are populated.`)
    console.log(`   ✅ Your website can display data from these tables.`)
  } else {
    console.log(`   ⚠️  Some Supabase tables are empty. Run the sync again.`)
  }

  if (d1WithData < d1Tables) {
    console.log(`   ℹ️  D1 cache tables (model_analytics, trades_detailed) are not yet implemented.`)
    console.log(`   ℹ️  This is normal - data is served from Supabase directly.`)
  }
}

main().catch(console.error)
