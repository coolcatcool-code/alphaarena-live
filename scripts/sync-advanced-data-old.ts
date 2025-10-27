/**
 * Advanced Data Synchronization Script
 * Syncs analytics and conversations data from nof1.ai to Supabase
 * Run: pnpm sync-advanced-data
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

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

// Increased timeout for slow connections
const API_TIMEOUT = 60000 // 60 seconds
const MAX_RETRIES = 3

// Types (matching nof1.ai API responses)
interface AnalyticsAPIResponse {
  data: any[]
  timestamp: string
  count: number
}

interface ConversationsAPIResponse {
  data: any[]
  timestamp: string
  count: number
}

/**
 * Fetch with retry logic
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

      const response = await axios.get(url, {
        timeout: API_TIMEOUT,
        headers: {
          'User-Agent': 'AlphaArena-Sync/1.0',
          'Accept': 'application/json'
        }
      })

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`✅ Fetched ${name} in ${elapsed}s`)

      return response.data
    } catch (error) {
      const isLastAttempt = attempt === retries

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          console.error(`⏱️  Timeout: ${name} took longer than ${API_TIMEOUT / 1000}s`)
        } else if (error.response) {
          console.error(`❌ HTTP ${error.response.status}: ${name}`)
        } else if (error.request) {
          console.error(`❌ No response received for ${name}`)
        } else {
          console.error(`❌ Error setting up request for ${name}:`, error.message)
        }
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
 * Get AI model ID by name from Supabase
 */
async function getAIModelId(modelName: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('ai_models')
    .select('id')
    .eq('name', modelName)
    .single()

  if (error || !data) {
    console.warn(`⚠️  AI model not found: ${modelName}`)
    return null
  }

  return data.id
}

/**
 * Sync analytics data to Supabase
 */
async function syncAnalytics(analyticsData: AnalyticsAPIResponse) {
  console.log('\n📊 Syncing analytics data to Supabase...')

  let synced = 0
  let skipped = 0

  for (const item of analyticsData.data) {
    // Get AI model ID from name
    const aiModelId = await getAIModelId(item.ai_model_name)
    if (!aiModelId) {
      skipped++
      continue
    }

    // Extract and transform data
    const analyticsRecord = {
      ai_model_id: aiModelId,

      // Trading Statistics
      total_trades: item.trading_stats?.total_trades || 0,
      winning_trades: item.trading_stats?.winning_trades || 0,
      losing_trades: item.trading_stats?.losing_trades || 0,
      win_rate: item.trading_stats?.win_rate || 0,

      // PnL Analysis
      total_pnl: item.pnl_analysis?.total_pnl || 0,
      realized_pnl: item.pnl_analysis?.realized_pnl || 0,
      unrealized_pnl: item.pnl_analysis?.unrealized_pnl || 0,

      // Fee Analysis
      total_fees: item.fee_analysis?.total_fees || 0,
      avg_fee_per_trade: item.fee_analysis?.avg_fee_per_trade || 0,

      // Signal Distribution
      buy_signals: item.signal_distribution?.buy_signals || 0,
      sell_signals: item.signal_distribution?.sell_signals || 0,
      hold_signals: item.signal_distribution?.hold_signals || 0,

      // Risk Metrics
      sharpe_ratio: item.risk_metrics?.sharpe_ratio || null,
      max_drawdown: item.risk_metrics?.max_drawdown || null,
      volatility: item.risk_metrics?.volatility || null,

      // Store full raw data
      raw_data: item,

      timestamp: new Date().toISOString()
    }

    const { error } = await supabase
      .from('analytics_snapshots')
      .insert(analyticsRecord)

    if (error) {
      console.error(`❌ Failed to sync analytics for ${item.ai_model_name}:`, error.message)
    } else {
      synced++
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
async function syncConversations(conversationsData: ConversationsAPIResponse) {
  console.log('\n💬 Syncing conversations data to Supabase...')

  let synced = 0
  let skipped = 0

  for (const item of conversationsData.data) {
    // Get AI model ID from name
    const aiModelId = await getAIModelId(item.ai_model_name)
    if (!aiModelId) {
      skipped++
      continue
    }

    // Extract decision process data
    const decision = item.decision_process?.decision || 'HOLD'
    const chainOfThought = item.decision_process?.chain_of_thought || ''
    const reasoning = item.decision_process?.reasoning || ''
    const confidence = item.decision_process?.confidence || null

    // Extract target symbol if there's a proposed action
    const targetSymbol = item.proposed_action?.symbol || null

    const conversationRecord = {
      ai_model_id: aiModelId,

      // Market data (stored as JSON)
      market_data: item.market_data || {},

      // AI decision process
      chain_of_thought: chainOfThought,
      decision: decision,
      reasoning: reasoning,

      // Positions (stored as JSON)
      current_positions: item.current_positions || [],
      target_symbol: targetSymbol,
      confidence: confidence,

      // Store full raw data
      raw_data: item,

      timestamp: new Date().toISOString()
    }

    const { error } = await supabase
      .from('ai_conversations')
      .insert(conversationRecord)

    if (error) {
      console.error(`❌ Failed to sync conversation for ${item.ai_model_name}:`, error.message)
    } else {
      synced++
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
  console.log('🚀 Starting advanced data synchronization...\n')

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

    // Fetch data sequentially (more reliable than parallel for slow connections)
    console.log('📥 Fetching data from nof1.ai...\n')

    let analyticsData: AnalyticsAPIResponse | null = null
    let conversationsData: ConversationsAPIResponse | null = null

    try {
      analyticsData = await fetchAnalyticsData()
    } catch (error) {
      console.error('⚠️  Failed to fetch analytics data, will skip analytics sync')
    }

    console.log('')

    try {
      conversationsData = await fetchConversationsData()
    } catch (error) {
      console.error('⚠️  Failed to fetch conversations data, will skip conversations sync')
    }

    // Check if we got any data
    if (!analyticsData && !conversationsData) {
      throw new Error('Failed to fetch any data from nof1.ai. Please check your internet connection and try again.')
    }

    console.log('')

    // Sync data to Supabase
    let analyticsResult = { synced: 0, skipped: 0 }
    let conversationsResult = { synced: 0, skipped: 0 }

    if (analyticsData) {
      analyticsResult = await syncAnalytics(analyticsData)
    } else {
      console.log('⏭️  Skipping analytics sync (no data)\n')
    }

    if (conversationsData) {
      conversationsResult = await syncConversations(conversationsData)
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
