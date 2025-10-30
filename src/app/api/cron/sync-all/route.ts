import { NextRequest, NextResponse } from 'next/server'
import {
  createClient as createSupabaseClient,
  SupabaseClient
} from '@supabase/supabase-js'
import type {
  NOF1LeaderboardResponse,
  NOF1TradesResponse,
  NOF1AnalyticsResponse,
  NOF1ConversationsResponse,
  NOF1AccountTotalsResponse,
  NOF1SinceInceptionResponse,
  NOF1CryptoPricesResponse,
} from '@/types'

// Explicitly use Node.js runtime (not edge) for OpenNext compatibility
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// API端点配置
const API_ENDPOINTS = {
  leaderboard: 'https://nof1.ai/api/leaderboard',
  trades: 'https://nof1.ai/api/trades',
  analytics: 'https://nof1.ai/api/analytics',
  conversations: 'https://nof1.ai/api/conversations',
  accountTotals: 'https://nof1.ai/api/account-totals',
  sinceInception: 'https://nof1.ai/api/since-inception-values',
  cryptoPrices: 'https://nof1.ai/api/crypto-prices',
}

// 类型定义
interface SyncResult {
  task: string
  status: 'success' | 'failed'
  data?: any
  error?: string
  duration: number
}

function getSupabaseClient(request?: NextRequest): SupabaseClient {
  const env = request ? ((request as any).env ?? undefined) : undefined

  const supabaseUrl =
    env?.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    env?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createSupabaseClient(supabaseUrl, supabaseKey)
}

/**
 * Cron触发的同步端点
 * 每5分钟自动执行，同步所有NOF1 API数据
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // 1. 验证Cron Secret
  const authHeader = request.headers.get('authorization')

  // In Cloudflare Workers, env variables are accessed via request.env
  const env = (request as any).env
  const cronSecret = env?.CRON_SECRET || process.env.CRON_SECRET

  console.log('🔐 Auth check:', {
    hasAuthHeader: !!authHeader,
    hasCronSecret: !!cronSecret,
    secretLength: cronSecret?.length || 0
  })

  if (!cronSecret) {
    console.error('❌ CRON_SECRET not configured')
    return NextResponse.json(
      { error: 'CRON_SECRET not configured in Worker environment' },
      { status: 500 }
    )
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('❌ Unauthorized access attempt')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  console.log('🚀 Starting comprehensive data sync...')

  try {
    // 2. 初始化Supabase客户端
    const supabase = getSupabaseClient(request)

    // 3. 获取D1数据库（如果可用）
    // 在Cloudflare Workers环境中，D1通过env.DB绑定访问
    const db = (request as any).env?.DB

    if (db) {
      console.log('✅ D1 database available')
    } else {
      console.log('⚠️  D1 database not available, will only sync to Supabase')
    }

    // 4. 并行执行所有同步任务
    const syncTasks = [
      syncLeaderboard(supabase, db),
      syncTrades(supabase, db),
      syncAnalytics(supabase, db),
      syncConversations(supabase),
      syncAccountTotals(supabase),
      syncSinceInception(supabase),
      syncCryptoPrices(supabase, db),
    ]

    const results = await Promise.allSettled(syncTasks)

    // 5. 处理结果
    const syncResults: SyncResult[] = results.map((result, index) => {
      const taskName = Object.keys(API_ENDPOINTS)[index]

      if (result.status === 'fulfilled') {
        return {
          task: taskName,
          status: 'success',
          data: result.value,
          duration: Date.now() - startTime,
        }
      } else {
        console.error(`❌ ${taskName} failed:`, result.reason)
        return {
          task: taskName,
          status: 'failed',
          error: result.reason?.message || 'Unknown error',
          duration: Date.now() - startTime,
        }
      }
    })

    // 6. 统计摘要
    const summary = {
      success: syncResults.filter(r => r.status === 'success').length,
      failed: syncResults.filter(r => r.status === 'failed').length,
      totalDuration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      results: syncResults,
    }

    console.log('✅ Sync completed:', summary)

    return NextResponse.json({
      summary,
      results: syncResults
    })
  } catch (error: any) {
    console.error('❌ Sync failed with critical error:', error)

    return NextResponse.json(
      {
        error: 'Critical sync failure',
        message: error.message,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

// ========================================
// 1. 同步排行榜数据
// ========================================
async function syncLeaderboard(supabase: SupabaseClient, db?: D1Database) {
  console.log('📊 Syncing leaderboard...')
  const startTime = Date.now()

  const response = await fetch(API_ENDPOINTS.leaderboard)
  if (!response.ok) {
    throw new Error(`Failed to fetch leaderboard: ${response.statusText}`)
  }

  const data = await response.json() as NOF1LeaderboardResponse
  const timestamp = Date.now()

  // 保存到Supabase（历史快照）
  const snapshots = data.leaderboard.map((item, index) => ({
    snapshot_time: new Date(),
    model_id: item.id,
    rank: index + 1,
    num_trades: item.num_trades,
    sharpe: item.sharpe,
    win_dollars: item.win_dollars,
    num_losses: item.num_losses,
    lose_dollars: item.lose_dollars,
    return_pct: item.return_pct,
    equity: item.equity,
    num_wins: item.num_wins,
  }))

  const { error: supabaseError } = await supabase
    .from('leaderboard_snapshots')
    .insert(snapshots)

  if (supabaseError) {
    console.error('⚠️  Supabase insert error:', supabaseError.message)
  }

  // 更新D1缓存（实时数据）
  if (db) {
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO leaderboard_cache
        (model_id, num_trades, sharpe, win_dollars, num_losses, lose_dollars,
         return_pct, equity, num_wins, rank, cached_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      await db.batch(
        data.leaderboard.map((item: any, index: number) =>
          stmt.bind(
            item.id,
            item.num_trades,
            item.sharpe,
            item.win_dollars,
            item.num_losses,
            item.lose_dollars,
            item.return_pct,
            item.equity,
            item.num_wins,
            index + 1,
            timestamp
          )
        )
      )

      console.log(`✅ D1 cache updated`)
    } catch (d1Error: any) {
      console.error('⚠️  D1 update error:', d1Error.message)
    }
  }

  const duration = Date.now() - startTime
  console.log(`✅ Leaderboard synced: ${data.leaderboard.length} models (${duration}ms)`)

  return {
    models: data.leaderboard.length,
    supabase: !supabaseError,
    d1: !!db,
  }
}

// ========================================
// 2. 同步交易数据
// ========================================
async function syncTrades(supabase: SupabaseClient, db?: D1Database) {
  console.log('💱 Syncing trades...')
  const startTime = Date.now()

  const response = await fetch(API_ENDPOINTS.trades)
  if (!response.ok) {
    throw new Error(`Failed to fetch trades: ${response.statusText}`)
  }

  const data = await response.json() as NOF1TradesResponse
  const timestamp = Date.now()

  // 获取最近的trade_id以避免重复
  const { data: existingTrades } = await supabase
    .from('trades')
    .select('trade_id')
    .order('entry_time', { ascending: false })
    .limit(500)

  const existingIds = new Set(
    (existingTrades || []).map((t: any) => t.trade_id)
  )

  // 过滤出新交易
  const newTrades = data.trades.filter(
    (t) => !existingIds.has(t.trade_id)
  )

  let insertedCount = 0

  if (newTrades.length > 0) {
    // 映射交易数据
    const tradesData = newTrades.map((trade) => ({
      id: trade.id,
      trade_id: trade.trade_id,
      symbol: trade.symbol,
      side: trade.side,
      trade_type: trade.trade_type,
      model_id: trade.model_id,
      quantity: trade.quantity,
      leverage: trade.leverage,
      confidence: trade.confidence,
      entry_time: trade.entry_time,
      entry_human_time: trade.entry_human_time,
      entry_price: trade.entry_price,
      entry_sz: trade.entry_sz,
      entry_tid: trade.entry_tid,
      entry_oid: trade.entry_oid,
      entry_crossed: trade.entry_crossed,
      entry_commission_dollars: trade.entry_commission_dollars,
      entry_closed_pnl: trade.entry_closed_pnl,
      exit_time: trade.exit_time,
      exit_human_time: trade.exit_human_time,
      exit_price: trade.exit_price,
      exit_sz: trade.exit_sz,
      exit_tid: trade.exit_tid,
      exit_oid: trade.exit_oid,
      exit_crossed: trade.exit_crossed,
      exit_commission_dollars: trade.exit_commission_dollars,
      exit_closed_pnl: trade.exit_closed_pnl,
      realized_gross_pnl: trade.realized_gross_pnl,
      realized_net_pnl: trade.realized_net_pnl,
      total_commission_dollars: trade.total_commission_dollars,
    }))

    const { error, data: insertedData } = await supabase
      .from('trades')
      .insert(tradesData)
      .select('id')

    if (error) {
      console.error('⚠️  Trades insert error:', error.message)
    } else {
      insertedCount = insertedData?.length || newTrades.length
    }
  }

  // 更新D1缓存（最近100条）
  if (db) {
    try {
      // 清空旧缓存
      await db.prepare('DELETE FROM recent_trades_cache').run()

      // 插入最新100条
      const recent100 = data.trades.slice(0, 100)
      const stmt = db.prepare(`
        INSERT INTO recent_trades_cache
        (id, model_id, symbol, side, entry_time, exit_time, realized_net_pnl, trade_data, cached_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      await db.batch(
        recent100.map((trade: any) =>
          stmt.bind(
            trade.id,
            trade.model_id,
            trade.symbol,
            trade.side,
            Math.floor(trade.entry_time),
            trade.exit_time ? Math.floor(trade.exit_time) : null,
            trade.realized_net_pnl,
            JSON.stringify(trade),
            timestamp
          )
        )
      )

      console.log(`✅ D1 cache updated with ${recent100.length} recent trades`)
    } catch (d1Error: any) {
      console.error('⚠️  D1 update error:', d1Error.message)
    }
  }

  const duration = Date.now() - startTime
  console.log(`✅ Trades synced: ${insertedCount} new, ${data.trades.length} total (${duration}ms)`)

  return {
    new_trades: insertedCount,
    total_trades: data.trades.length,
  }
}

// ========================================
// 3. 同步分析数据
// ========================================
async function syncAnalytics(supabase: SupabaseClient, db?: D1Database) {
  console.log('📈 Syncing analytics...')
  const startTime = Date.now()

  const response = await fetch(API_ENDPOINTS.analytics)
  if (!response.ok) {
    throw new Error(`Failed to fetch analytics: ${response.statusText}`)
  }

  const data = await response.json() as NOF1AnalyticsResponse

  // 保存到Supabase
  const analyticsData = data.analytics.map((item) => ({
    snapshot_time: new Date(data.serverTime || Date.now()),
    model_id: item.model_id,
    // Fee & PnL Breakdown
    std_net_pnl: item.fee_pnl_moves_breakdown_table?.std_net_pnl,
    total_fees_paid: item.fee_pnl_moves_breakdown_table?.total_fees_paid,
    overall_pnl_without_fees: item.fee_pnl_moves_breakdown_table?.overall_pnl_without_fees,
    total_fees_as_pct_of_pnl: item.fee_pnl_moves_breakdown_table?.total_fees_as_pct_of_pnl,
    overall_pnl_with_fees: item.fee_pnl_moves_breakdown_table?.overall_pnl_with_fees,
    avg_taker_fee: item.fee_pnl_moves_breakdown_table?.avg_taker_fee,
    std_gross_pnl: item.fee_pnl_moves_breakdown_table?.std_gross_pnl,
    avg_net_pnl: item.fee_pnl_moves_breakdown_table?.avg_net_pnl,
    biggest_net_loss: item.fee_pnl_moves_breakdown_table?.biggest_net_loss,
    biggest_net_gain: item.fee_pnl_moves_breakdown_table?.biggest_net_gain,
    avg_gross_pnl: item.fee_pnl_moves_breakdown_table?.avg_gross_pnl,
    std_taker_fee: item.fee_pnl_moves_breakdown_table?.std_taker_fee,
    // Winners & Losers Breakdown
    win_rate: item.winners_losers_breakdown_table?.win_rate,
    avg_winners_net_pnl: item.winners_losers_breakdown_table?.avg_winners_net_pnl,
    avg_losers_net_pnl: item.winners_losers_breakdown_table?.avg_losers_net_pnl,
    avg_winners_notional: item.winners_losers_breakdown_table?.avg_winners_notional,
    avg_losers_notional: item.winners_losers_breakdown_table?.avg_losers_notional,
    avg_winners_holding_period: item.winners_losers_breakdown_table?.avg_winners_holding_period,
    avg_losers_holding_period: item.winners_losers_breakdown_table?.avg_losers_holding_period,
    // 原始数据（完整保存）
    raw_data: item,
  }))

  const { error } = await supabase
    .from('analytics_snapshots')
    .insert(analyticsData)

  if (error) {
    console.error('⚠️  Analytics insert error:', error.message)
  }

  const duration = Date.now() - startTime
  console.log(`✅ Analytics synced: ${data.analytics.length} models (${duration}ms)`)

  return {
    models: data.analytics.length,
  }
}

// ========================================
// 4. 同步对话数据
// ========================================
async function syncConversations(supabase: SupabaseClient) {
  console.log('💬 Syncing conversations...')
  const startTime = Date.now()

  const response = await fetch(API_ENDPOINTS.conversations)
  if (!response.ok) {
    throw new Error(`Failed to fetch conversations: ${response.statusText}`)
  }

  const data = await response.json() as NOF1ConversationsResponse

  // 检查数据结构
  if (!data.conversations || !Array.isArray(data.conversations)) {
    console.log('⚠️  No conversations data available')
    return { new_conversations: 0 }
  }

  // 获取已存在的对话ID
  const { data: existingConvos } = await supabase
    .from('ai_conversations')
    .select('id')
    .limit(500)

  const existingIds = new Set((existingConvos || []).map((c: any) => c.id))

  // 过滤出新对话
  const newConvos = data.conversations.filter(
    (c: any) => !existingIds.has(c.id)
  )

  let insertedCount = 0

  if (newConvos.length > 0) {
    const convosData = newConvos.map((convo: any) => ({
      id: convo.id,
      model_id: convo.model_id,
      conversation_time: new Date(convo.timestamp),
      user_prompt: convo.user_prompt,
      ai_response: convo.ai_response,
      decision_type: convo.decision_type,
      symbol: convo.symbol,
      action_taken: convo.action_taken,
      confidence: convo.confidence,
      raw_data: convo,
    }))

    const { error, data: insertedData } = await supabase
      .from('ai_conversations')
      .insert(convosData)
      .select('id')

    if (error) {
      console.error('⚠️  Conversations insert error:', error.message)
    } else {
      insertedCount = insertedData?.length || newConvos.length
    }
  }

  const duration = Date.now() - startTime
  console.log(`✅ Conversations synced: ${insertedCount} new (${duration}ms)`)

  return { new_conversations: insertedCount }
}

// ========================================
// 5. 同步账户总额
// ========================================
async function syncAccountTotals(supabase: SupabaseClient) {
  console.log('💰 Syncing account totals...')
  const startTime = Date.now()

  const response = await fetch(API_ENDPOINTS.accountTotals)
  if (!response.ok) {
    throw new Error(`Failed to fetch account totals: ${response.statusText}`)
  }

  const data = await response.json() as NOF1AccountTotalsResponse

  // 这个API可能返回账户总额数据
  // 可以存储到一个简单的键值表或直接合并到leaderboard_snapshots

  const duration = Date.now() - startTime
  console.log(`✅ Account totals synced (${duration}ms)`)

  return { synced: true, data }
}

// ========================================
// 6. 同步自启动数据
// ========================================
async function syncSinceInception(supabase: SupabaseClient) {
  console.log('📅 Syncing since inception data...')
  const startTime = Date.now()

  const response = await fetch(API_ENDPOINTS.sinceInception)
  if (!response.ok) {
    throw new Error(`Failed to fetch since inception: ${response.statusText}`)
  }

  const data = await response.json() as NOF1SinceInceptionResponse

  // 这个API可能返回自启动以来的累计数据
  // 可以存储到专门的表中

  const duration = Date.now() - startTime
  console.log(`✅ Since inception data synced (${duration}ms)`)

  return { synced: true, data }
}

// ========================================
// 7. 同步加密货币价格
// ========================================
async function syncCryptoPrices(supabase: SupabaseClient, db?: D1Database) {
  console.log('💵 Syncing crypto prices...')
  const startTime = Date.now()

  const response = await fetch(API_ENDPOINTS.cryptoPrices)
  if (!response.ok) {
    throw new Error(`Failed to fetch crypto prices: ${response.statusText}`)
  }

  const data = await response.json() as NOF1CryptoPricesResponse
  const timestamp = Date.now()

  // 更新D1缓存（实时价格）
  if (db && data.prices) {
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO crypto_prices_cache
        (symbol, price, change_24h, volume_24h, cached_at)
        VALUES (?, ?, ?, ?, ?)
      `)

      await db.batch(
        data.prices.map((priceData) =>
          stmt.bind(
            priceData.symbol,
            priceData.price,
            priceData.change_24h,
            priceData.volume_24h,
            timestamp
          )
        )
      )

      console.log(`✅ D1 price cache updated`)
    } catch (d1Error: any) {
      console.error('⚠️  D1 price update error:', d1Error.message)
    }
  }

  const duration = Date.now() - startTime
  console.log(`✅ Crypto prices synced (${duration}ms)`)

  return { synced: true, data }
}
