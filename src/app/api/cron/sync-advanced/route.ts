import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
// Note: removed 'edge' runtime as it's incompatible with Prisma/Supabase
// Cloudflare Pages will handle this as a serverless function

// API endpoints
const ANALYTICS_API = 'https://nof1.ai/api/analytics'
const CONVERSATIONS_API = 'https://nof1.ai/api/conversations'
const API_TIMEOUT = 60000 // 60 seconds

/**
 * Initialize Supabase client (runtime only)
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Types
interface AnalyticsAPIResponse {
  analytics: Array<{
    id: string
    model_id: string
    updated_at: number
    fee_pnl_moves_breakdown_table: any
    winners_losers_breakdown_table: any
    signals_breakdown_table: any
    longs_shorts_breakdown_table: any
    overall_trades_overview_table: any
  }>
}

/**
 * Fetch data using Web API fetch (Cloudflare Workers compatible)
 */
async function fetchData<T>(url: string, name: string): Promise<T> {
  const startTime = Date.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AlphaArena-Cron/1.0',
        'Accept': 'application/json'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json() as T
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`✅ Fetched ${name} in ${elapsed}s`)

    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out')
    }
    throw error
  }
}

/**
 * Get AI model ID mapping
 */
async function getAIModelIdMap(supabase: SupabaseClient): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('ai_models')
    .select('id, name')

  if (error || !data) {
    throw new Error(`Failed to fetch AI models: ${error?.message}`)
  }

  // Manual mapping based on actual API responses
  const apiToDbMapping: Record<string, string> = {
    'claude-sonnet-4-5': 'claude-1',
    'claude-sonnet': 'claude-1',
    'claude': 'claude-1',
    'deepseek-chat-v3.1': 'deepseek-1',
    'deepseek-chat': 'deepseek-1',
    'deepseek': 'deepseek-1',
    'gemini-2.5-pro': 'gemini-1',
    'gemini-pro': 'gemini-1',
    'gemini': 'gemini-1',
    'gpt-5': 'chatgpt-1',
    'gpt-4': 'chatgpt-1',
    'chatgpt': 'chatgpt-1',
    'grok-4': 'grok-1',
    'grok': 'grok-1',
    'qwen3-max': 'qwen-1',
    'qwen': 'qwen-1'
  }

  const map = new Map<string, string>()

  for (const [apiId, dbId] of Object.entries(apiToDbMapping)) {
    map.set(apiId.toLowerCase(), dbId)
  }

  for (const model of data) {
    map.set(model.name.toLowerCase(), model.id)
    map.set(model.id.toLowerCase(), model.id)
  }

  return map
}

/**
 * Sync analytics data
 */
async function syncAnalytics(
  supabase: SupabaseClient,
  analyticsData: AnalyticsAPIResponse,
  modelIdMap: Map<string, string>
) {
  let synced = 0
  let skipped = 0

  for (const item of analyticsData.analytics) {
    const modelId = item.model_id.toLowerCase()
    const aiModelId = modelIdMap.get(modelId)

    if (!aiModelId) {
      console.warn(`⚠️  AI model not found for: ${item.model_id}`)
      skipped++
      continue
    }

    const feeData = item.fee_pnl_moves_breakdown_table || {}
    const winnersLosers = item.winners_losers_breakdown_table || {}
    const signals = item.signals_breakdown_table || {}

    const analyticsRecord = {
      ai_model_id: aiModelId,
      total_trades: (signals.num_long_signals || 0) + (signals.num_short_signals || 0) + (signals.num_close_signals || 0),
      winning_trades: Math.round((winnersLosers.win_rate || 0) / 100 * ((signals.num_long_signals || 0) + (signals.num_short_signals || 0))),
      losing_trades: Math.round((1 - (winnersLosers.win_rate || 0) / 100) * ((signals.num_long_signals || 0) + (signals.num_short_signals || 0))),
      win_rate: winnersLosers.win_rate || 0,
      total_pnl: feeData.overall_pnl_with_fees || 0,
      realized_pnl: feeData.overall_pnl_with_fees || 0,
      unrealized_pnl: 0,
      total_fees: feeData.total_fees_paid || 0,
      avg_fee_per_trade: feeData.avg_taker_fee || 0,
      buy_signals: signals.num_long_signals || 0,
      sell_signals: signals.num_short_signals || 0,
      hold_signals: signals.num_hold_signals || 0,
      sharpe_ratio: null,
      max_drawdown: null,
      volatility: feeData.std_net_pnl || null,
      raw_data: item,
      timestamp: new Date(item.updated_at * 1000).toISOString()
    }

    const { error } = await supabase
      .from('analytics_snapshots')
      .insert(analyticsRecord)

    if (error) {
      console.error(`❌ Failed to sync analytics for ${item.model_id}:`, error.message)
    } else {
      synced++
    }
  }

  return { synced, skipped }
}

/**
 * Main cron job handler
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

    if (authHeader !== expectedAuth) {
      console.error('❌ Unauthorized: Invalid cron secret')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🚀 Starting advanced data sync (cron job)...')
    const startTime = Date.now()

    // Initialize Supabase client (runtime only)
    const supabase = getSupabaseClient()

    // Get AI model mapping
    const modelIdMap = await getAIModelIdMap(supabase)
    console.log(`📋 Loaded ${modelIdMap.size} model mappings`)

    // Fetch analytics data
    let analyticsData: AnalyticsAPIResponse | null = null
    try {
      analyticsData = await fetchData<AnalyticsAPIResponse>(
        ANALYTICS_API,
        'analytics'
      )
    } catch (error) {
      console.error('⚠️  Failed to fetch analytics:', error)
    }

    // Sync analytics
    let analyticsResult = { synced: 0, skipped: 0 }
    if (analyticsData) {
      analyticsResult = await syncAnalytics(supabase, analyticsData, modelIdMap)
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${elapsed}s`,
      analytics: {
        synced: analyticsResult.synced,
        skipped: analyticsResult.skipped
      },
      note: 'Conversations sync skipped (timeout issues - will be implemented separately)'
    }

    console.log('✅ Sync completed:', result)

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Sync failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
