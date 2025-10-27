/**
 * Advanced Data Synchronization Script V2
 * Based on ACTUAL nof1.ai API structure
 * Run: pnpm sync-advanced-data
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as https from 'https'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// API endpoints
const ANALYTICS_API = 'https://nof1.ai/api/analytics'
const CONVERSATIONS_API = 'https://nof1.ai/api/conversations'

const API_TIMEOUT = 60000 // 60 seconds
const MAX_RETRIES = 3

// Types based on ACTUAL API responses
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
    last_trade_exit_time?: number
    invocation_breakdown_table?: any
    last_convo_doc_id?: string
    last_convo_timestamp?: number
  }>
}

interface ConversationsAPIResponse {
  conversations: Array<{
    id: string
    user_prompt: string
    llm_response: any
    cycle_id: number
    inserted_at: number
    cot_trace: string
    model_id: string
    skill: string
    cot_trace_summary: string
    timestamp: number
    run_id: string
  }>
}

/**
 * Fetch with retry logic using native Node.js https
 */
async function fetchWithRetry<T>(
  url: string,
  name: string,
  retries = MAX_RETRIES
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📡 Fetching ${name}... (attempt ${attempt}/${retries})`)
      const startTime = Date.now()

      const data = await new Promise<string>((resolve, reject) => {
        const req = https.get(url, {
          headers: {
            'User-Agent': 'AlphaArena-Sync/2.0',
            'Accept': 'application/json'
          },
          timeout: API_TIMEOUT
        }, (res) => {
          let data = ''

          // Check for non-200 status
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
            return
          }

          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            resolve(data)
          })

          res.on('error', (error) => {
            reject(error)
          })
        })

        req.on('error', (error) => {
          reject(error)
        })

        req.on('timeout', () => {
          req.destroy()
          reject(new Error('Request timed out'))
        })
      })

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`✅ Fetched ${name} in ${elapsed}s`)

      return JSON.parse(data) as T
    } catch (error) {
      const isLastAttempt = attempt === retries

      if (error instanceof Error) {
        console.error(`❌ Error fetching ${name}:`, error.message)
      } else {
        console.error(`❌ Unknown error fetching ${name}:`, error)
      }

      if (isLastAttempt) {
        throw error
      }

      // Wait before retry (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
      console.log(`⏳ Waiting ${waitTime / 1000}s before retry...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw new Error(`Failed to fetch ${name} after ${retries} attempts`)
}

/**
 * Fetch analytics data from nof1.ai
 */
async function fetchAnalyticsData(): Promise<AnalyticsAPIResponse> {
  return fetchWithRetry<AnalyticsAPIResponse>(
    ANALYTICS_API,
    'analytics data'
  )
}

/**
 * Fetch conversations data from nof1.ai
 */
async function fetchConversationsData(): Promise<ConversationsAPIResponse> {
  return fetchWithRetry<ConversationsAPIResponse>(
    CONVERSATIONS_API,
    'conversations data'
  )
}

/**
 * Get AI model ID mapping (model_id -> database id)
 * Handles mapping between API model IDs and database IDs
 */
async function getAIModelIdMap(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('ai_models')
    .select('id, name')

  if (error || !data) {
    throw new Error(`Failed to fetch AI models: ${error?.message}`)
  }

  // Manual mapping based on actual API responses
  const apiToDbMapping: Record<string, string> = {
    // Claude variants
    'claude-sonnet-4-5': 'claude-1',
    'claude-sonnet': 'claude-1',
    'claude': 'claude-1',

    // DeepSeek variants
    'deepseek-chat-v3.1': 'deepseek-1',
    'deepseek-chat': 'deepseek-1',
    'deepseek': 'deepseek-1',

    // Gemini variants
    'gemini-2.5-pro': 'gemini-1',
    'gemini-pro': 'gemini-1',
    'gemini': 'gemini-1',

    // ChatGPT/GPT variants
    'gpt-5': 'chatgpt-1',
    'gpt-4': 'chatgpt-1',
    'chatgpt': 'chatgpt-1',

    // Grok variants
    'grok-4': 'grok-1',
    'grok': 'grok-1',

    // Qwen variants
    'qwen3-max': 'qwen-1',
    'qwen': 'qwen-1'
  }

  const map = new Map<string, string>()

  // Add manual mappings
  for (const [apiId, dbId] of Object.entries(apiToDbMapping)) {
    map.set(apiId.toLowerCase(), dbId)
  }

  // Also add database names and IDs for fallback
  for (const model of data) {
    map.set(model.name.toLowerCase(), model.id)
    map.set(model.id.toLowerCase(), model.id)
  }

  return map
}

/**
 * Sync analytics data to Supabase
 */
async function syncAnalytics(
  analyticsData: AnalyticsAPIResponse,
  modelIdMap: Map<string, string>
) {
  console.log('\n📊 Syncing analytics data to Supabase...')

  let synced = 0
  let skipped = 0

  for (const item of analyticsData.analytics) {
    // Try to find matching AI model
    const modelId = item.model_id.toLowerCase()
    const aiModelId = modelIdMap.get(modelId)

    if (!aiModelId) {
      console.warn(`⚠️  AI model not found for: ${item.model_id}`)
      skipped++
      continue
    }

    // Extract key metrics from nested tables
    const feeData = item.fee_pnl_moves_breakdown_table || {}
    const winnersLosers = item.winners_losers_breakdown_table || {}
    const signals = item.signals_breakdown_table || {}

    const analyticsRecord = {
      ai_model_id: aiModelId,

      // Trading Statistics
      total_trades: signals.num_long_signals + signals.num_short_signals + signals.num_close_signals || 0,
      winning_trades: Math.round((winnersLosers.win_rate || 0) / 100 * (signals.num_long_signals + signals.num_short_signals) || 0),
      losing_trades: Math.round((1 - (winnersLosers.win_rate || 0) / 100) * (signals.num_long_signals + signals.num_short_signals) || 0),
      win_rate: winnersLosers.win_rate || 0,

      // PnL Analysis
      total_pnl: feeData.overall_pnl_with_fees || 0,
      realized_pnl: feeData.overall_pnl_with_fees || 0,
      unrealized_pnl: 0,

      // Fee Analysis
      total_fees: feeData.total_fees_paid || 0,
      avg_fee_per_trade: feeData.avg_taker_fee || 0,

      // Signal Distribution
      buy_signals: signals.num_long_signals || 0,
      sell_signals: signals.num_short_signals || 0,
      hold_signals: signals.num_hold_signals || 0,

      // Risk Metrics (not in current data, set to null)
      sharpe_ratio: null,
      max_drawdown: null,
      volatility: feeData.std_net_pnl || null,

      // Store full raw data
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
      console.log(`  ✓ Synced analytics for ${item.model_id}`)
    }
  }

  console.log(`✅ Analytics synced: ${synced} records`)
  if (skipped > 0) {
    console.log(`⚠️  Skipped: ${skipped} records (AI model not found)`)
  }

  return { synced, skipped }
}

/**
 * Sync conversations data to Supabase
 */
async function syncConversations(
  conversationsData: ConversationsAPIResponse,
  modelIdMap: Map<string, string>
) {
  console.log('\n💬 Syncing conversations data to Supabase...')

  let synced = 0
  let skipped = 0

  for (const item of conversationsData.conversations) {
    // Try to find matching AI model
    const modelId = item.model_id.toLowerCase()
    const aiModelId = modelIdMap.get(modelId)

    if (!aiModelId) {
      console.warn(`⚠️  AI model not found for: ${item.model_id}`)
      skipped++
      continue
    }

    // Extract decision from llm_response
    let decision = 'HOLD'
    let targetSymbol: string | null = null
    let confidence: number | null = null

    if (item.llm_response && typeof item.llm_response === 'object') {
      // llm_response is a dict of coins with signals
      const signals = Object.values(item.llm_response) as any[]
      const buyOrSellSignals = signals.filter(s => s.signal !== 'hold')

      if (buyOrSellSignals.length > 0) {
        decision = buyOrSellSignals[0].signal.toUpperCase()
        targetSymbol = buyOrSellSignals[0].coin
        confidence = buyOrSellSignals[0].confidence ? buyOrSellSignals[0].confidence * 100 : null
      }
    }

    const conversationRecord = {
      ai_model_id: aiModelId,

      // Market data (extract from user_prompt or store empty)
      market_data: { user_prompt_length: item.user_prompt.length },

      // AI decision process
      chain_of_thought: item.cot_trace || '',
      decision: decision,
      reasoning: item.cot_trace_summary || '',

      // Positions (stored as empty array for now)
      current_positions: [],
      target_symbol: targetSymbol,
      confidence: confidence,

      // Store full raw data
      raw_data: item,

      timestamp: new Date(item.timestamp * 1000).toISOString()
    }

    const { error } = await supabase
      .from('ai_conversations')
      .insert(conversationRecord)

    if (error) {
      console.error(`❌ Failed to sync conversation for ${item.model_id}:`, error.message)
    } else {
      synced++
      console.log(`  ✓ Synced conversation for ${item.model_id}`)
    }
  }

  console.log(`✅ Conversations synced: ${synced} records`)
  if (skipped > 0) {
    console.log(`⚠️  Skipped: ${skipped} records (AI model not found)`)
  }

  return { synced, skipped }
}

/**
 * Main sync function
 */
async function main() {
  console.log('🚀 Starting advanced data synchronization (V2)...\n')

  const startTime = Date.now()

  try {
    // Test Supabase connection
    console.log('🔌 Testing Supabase connection...')
    const { error: connectionError } = await supabase
      .from('ai_models')
      .select('id', { count: 'exact', head: true })

    if (connectionError) {
      throw new Error(`Supabase connection failed: ${connectionError.message}`)
    }
    console.log('✅ Supabase connected\n')

    // Get AI model ID mapping
    console.log('📋 Loading AI model mappings...')
    const modelIdMap = await getAIModelIdMap()
    console.log(`✅ Loaded ${modelIdMap.size} model mappings\n`)

    // Fetch data sequentially
    console.log('📥 Fetching data from nof1.ai...\n')

    let analyticsData: AnalyticsAPIResponse | null = null
    let conversationsData: ConversationsAPIResponse | null = null

    try {
      analyticsData = await fetchAnalyticsData()
    } catch (error) {
      console.error('⚠️  Failed to fetch analytics data, will skip analytics sync\n')
    }

    try {
      conversationsData = await fetchConversationsData()
    } catch (error) {
      console.error('⚠️  Failed to fetch conversations data, will skip conversations sync\n')
    }

    // Check if we got any data
    if (!analyticsData && !conversationsData) {
      throw new Error('Failed to fetch any data from nof1.ai. Please check your internet connection and try again.')
    }

    // Sync data to Supabase
    let analyticsResult = { synced: 0, skipped: 0 }
    let conversationsResult = { synced: 0, skipped: 0 }

    if (analyticsData) {
      analyticsResult = await syncAnalytics(analyticsData, modelIdMap)
    } else {
      console.log('⏭️  Skipping analytics sync (no data)\n')
    }

    if (conversationsData) {
      conversationsResult = await syncConversations(conversationsData, modelIdMap)
    } else {
      console.log('⏭️  Skipping conversations sync (no data)\n')
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
    const hasWarnings = !analyticsData || !conversationsData

    console.log('\n' + '='.repeat(60))
    console.log(hasWarnings ? '⚠️  Sync completed with warnings' : '✅ Sync completed successfully!')
    console.log('='.repeat(60))
    console.log(`📊 Analytics: ${analyticsResult.synced} synced, ${analyticsResult.skipped} skipped`)
    console.log(`💬 Conversations: ${conversationsResult.synced} synced, ${conversationsResult.skipped} skipped`)
    console.log(`⏱️  Time elapsed: ${elapsed}s`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n❌ Sync failed:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    process.exit(1)
  }
}

// Run sync if executed directly
if (require.main === module) {
  main()
}

export { syncAnalytics, syncConversations, fetchAnalyticsData, fetchConversationsData }
