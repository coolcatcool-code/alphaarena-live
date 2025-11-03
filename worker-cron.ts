/**
 * Cloudflare Scheduled Worker for AlphaArena D1 data sync.
 * Handles periodic ingestion from NOF1 APIs into the Cloudflare D1 database.
 */

const NOF1_BASE = 'https://nof1.ai/api'

const FIVE_MINUTES = 5
const ONE_HOUR = 60
const ONE_DAY = 60 * 24

const MODELS = [
  'qwen3-max',
  'deepseek-chat-v3.1',
  'claude-sonnet-4-5',
  'grok-4',
  'gemini-2.5-pro',
  'gpt-5'
]

type JsonValue = string | number | boolean | null | JsonValue[] | { [x: string]: JsonValue }

export interface Env {
  DB: D1Database
  CRON_SECRET?: string
}

interface SyncResult {
  leaderboard: number | null
  tradesRecent: number | null
  tradesDetailed: number | null
  analyticsSummary: number | null
  analyticsDetails: number | null
  conversations: number | null
  accountTotals: number | null
  accountPositions: number | null
  sinceInception: number | null
  cryptoPrices: number | null
  errors: string[]
  skipped: string[]
  timestamp: number
  startedAt: number
  finishedAt: number
  durationMs: number
}

async function ensureTables(db: D1Database) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS sync_runs (
      job TEXT PRIMARY KEY,
      last_run INTEGER NOT NULL
    )
  `).run()

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS leaderboard_cache (
      model_id TEXT PRIMARY KEY,
      num_trades INTEGER,
      sharpe REAL,
      win_dollars REAL,
      num_losses INTEGER,
      lose_dollars REAL,
      return_pct REAL,
      equity REAL,
      num_wins INTEGER,
      rank INTEGER,
      cached_at INTEGER
    )
  `).run()

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS recent_trades_cache (
      id TEXT PRIMARY KEY,
      model_id TEXT,
      symbol TEXT,
      side TEXT,
      entry_time INTEGER,
      exit_time INTEGER,
      realized_net_pnl REAL,
      trade_data TEXT,
      cached_at INTEGER
    )
  `).run()

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS trades_detailed (
      id TEXT PRIMARY KEY,
      model_id TEXT,
      symbol TEXT,
      side TEXT,
      trade_type TEXT,
      leverage REAL,
      quantity REAL,
      confidence REAL,
      entry_time INTEGER,
      entry_human_time TEXT,
      entry_price REAL,
      entry_sz REAL,
      entry_oid TEXT,
      entry_tid TEXT,
      entry_commission_dollars REAL,
      entry_closed_pnl REAL,
      entry_crossed INTEGER,
      exit_time INTEGER,
      exit_human_time TEXT,
      exit_price REAL,
      exit_sz REAL,
      exit_oid TEXT,
      exit_tid TEXT,
      exit_commission_dollars REAL,
      exit_closed_pnl REAL,
      exit_crossed INTEGER,
      exit_plan TEXT,
      realized_net_pnl REAL,
      realized_gross_pnl REAL,
      total_commission_dollars REAL,
      trade_json TEXT,
      cached_at INTEGER
    )
  `).run()

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS model_analytics (
      model_id TEXT PRIMARY KEY,
      updated_at INTEGER,
      last_trade_exit_time INTEGER,
      last_convo_timestamp INTEGER,
      overall_pnl_with_fees REAL,
      overall_pnl_without_fees REAL,
      total_fees_paid REAL,
      total_fees_as_pct_of_pnl REAL,
      avg_net_pnl REAL,
      avg_gross_pnl REAL,
      std_net_pnl REAL,
      std_gross_pnl REAL,
      biggest_net_gain REAL,
      biggest_net_loss REAL,
      win_rate REAL,
      avg_winners_net_pnl REAL,
      avg_losers_net_pnl REAL,
      std_winners_net_pnl REAL,
      std_losers_net_pnl REAL,
      total_trades INTEGER,
      num_long_trades INTEGER,
      num_short_trades INTEGER,
      long_short_trades_ratio REAL,
      avg_holding_period_mins REAL,
      median_holding_period_mins REAL,
      std_holding_period_mins REAL,
      avg_longs_holding_period REAL,
      avg_shorts_holding_period REAL,
      avg_size_of_trade_notional REAL,
      median_size_of_trade_notional REAL,
      std_size_of_trade_notional REAL,
      total_signals INTEGER,
      num_long_signals INTEGER,
      num_short_signals INTEGER,
      num_close_signals INTEGER,
      num_hold_signals INTEGER,
      long_signal_pct REAL,
      short_signal_pct REAL,
      close_signal_pct REAL,
      hold_signal_pct REAL,
      avg_confidence REAL,
      median_confidence REAL,
      std_confidence REAL,
      avg_confidence_long REAL,
      avg_confidence_short REAL,
      avg_confidence_close REAL,
      avg_leverage REAL,
      median_leverage REAL,
      avg_convo_leverage REAL,
      sharpe_ratio REAL,
      mins_long_combined REAL,
      mins_short_combined REAL,
      mins_flat_combined REAL,
      pct_mins_long_combined REAL,
      pct_mins_short_combined REAL,
      pct_mins_flat_combined REAL,
      num_invocations INTEGER,
      avg_invocation_break_mins REAL,
      min_invocation_break_mins REAL,
      max_invocation_break_mins REAL,
      cached_at INTEGER
    )
  `).run()

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS model_analytics_details (
      model_id TEXT PRIMARY KEY,
      raw_data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `).run()

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      model_id TEXT,
      conversation_time INTEGER,
      decision TEXT,
      confidence REAL,
      symbol TEXT,
      action_taken TEXT,
      raw_data TEXT,
      cached_at INTEGER
    )
  `).run()

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS account_totals (
      id TEXT PRIMARY KEY,
      model_id TEXT,
      timestamp INTEGER,
      realized_pnl REAL,
      unrealized_pnl REAL,
      total_equity REAL,
      positions_data TEXT,
      cached_at INTEGER
    )
  `).run()

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS account_positions (
      id TEXT PRIMARY KEY,
      account_total_id TEXT,
      model_id TEXT,
      symbol TEXT,
      quantity REAL,
      entry_price REAL,
      current_price REAL,
      unrealized_pnl REAL,
      closed_pnl REAL,
      leverage REAL,
      margin REAL,
      liquidation_price REAL,
      entry_time INTEGER,
      confidence REAL,
      risk_usd REAL,
      exit_plan TEXT,
      cached_at INTEGER
    )
  `).run()

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS since_inception_values (
      id TEXT PRIMARY KEY,
      model_id TEXT,
      nav_since_inception REAL,
      inception_date INTEGER,
      num_invocations INTEGER,
      cached_at INTEGER
    )
  `).run()

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS crypto_prices_realtime (
      symbol TEXT PRIMARY KEY,
      price REAL,
      timestamp INTEGER,
      cached_at INTEGER
    )
  `).run()
}

async function shouldRun(db: D1Database, job: string, intervalMinutes: number, now: number) {
  const record = await db
    .prepare(`SELECT last_run FROM sync_runs WHERE job = ?`)
    .bind(job)
    .first<{ last_run: number }>()

  if (!record) return true
  return now - record.last_run >= intervalMinutes * 60 * 1000
}

async function markRun(db: D1Database, job: string, now: number) {
  await db
    .prepare(`INSERT OR REPLACE INTO sync_runs (job, last_run) VALUES (?, ?)`)
    .bind(job, now)
    .run()
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'AlphaArena-Worker/1.0',
      'Accept': 'application/json'
    },
    cf: {
      cacheTtl: 0,
      cacheEverything: false
    }
  })

  if (!response.ok) {
    throw new Error(`${url} -> ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<Record<string, JsonValue>>
}

function toTimestampSeconds(value: unknown, fallback: number): number {
  if (typeof value === 'number') return Math.floor(value)
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) return Math.floor(parsed)
  }
  return fallback
}

async function syncLeaderboard(db: D1Database, payload: any, timestamp: number) {
  const leaderboard = Array.isArray(payload?.leaderboard) ? payload.leaderboard : []
  if (!leaderboard.length) return 0

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO leaderboard_cache (
      model_id, num_trades, sharpe, win_dollars, num_losses,
      lose_dollars, return_pct, equity, num_wins, rank, cached_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  await db.batch(
    leaderboard.map((entry: any, index: number) =>
      stmt.bind(
        entry.id ?? entry.model_id ?? '',
        entry.num_trades ?? 0,
        entry.sharpe ?? 0,
        entry.win_dollars ?? 0,
        entry.num_losses ?? 0,
        entry.lose_dollars ?? 0,
        entry.return_pct ?? 0,
        entry.equity ?? 0,
        entry.num_wins ?? 0,
        entry.rank ?? index + 1,
        timestamp
      )
    )
  )

  return leaderboard.length
}

async function syncTrades(db: D1Database, payload: any, timestamp: number) {
  const trades = Array.isArray(payload?.trades) ? payload.trades : []
  if (!trades.length) return { recent: 0, detailed: 0 }

  const recentLimit = 50
  const recentStmt = db.prepare(`
    INSERT OR REPLACE INTO recent_trades_cache (
      id, model_id, symbol, side, entry_time, exit_time,
      realized_net_pnl, trade_data, cached_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  await db.batch(
    trades.slice(0, recentLimit).map((trade: any, index: number) => {
      const entryTime = toTimestampSeconds(trade.entry_time, timestamp)
      const exitTime = trade.exit_time != null ? toTimestampSeconds(trade.exit_time, timestamp) : null
      const realized = trade.realized_net_pnl ?? trade.pnl ?? null

      return recentStmt.bind(
        trade.id ?? `recent-${timestamp}-${index}`,
        trade.model_id ?? '',
        trade.symbol ?? '',
        trade.side ?? '',
        entryTime,
        exitTime,
        realized,
        JSON.stringify(trade),
        timestamp
      )
    })
  )

  const detailedStmt = db.prepare(`
    INSERT OR REPLACE INTO trades_detailed (
      id, model_id, symbol, side, trade_type, leverage, quantity, confidence,
      entry_time, entry_human_time, entry_price, entry_sz, entry_oid, entry_tid,
      entry_commission_dollars, entry_closed_pnl, entry_crossed,
      exit_time, exit_human_time, exit_price, exit_sz, exit_oid, exit_tid,
      exit_commission_dollars, exit_closed_pnl, exit_crossed, exit_plan,
      realized_net_pnl, realized_gross_pnl, total_commission_dollars,
      trade_json, cached_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?
    )
  `)

  await db.batch(
    trades.map((trade: any, index: number) => {
      const entryTime = toTimestampSeconds(trade.entry_time, timestamp)
      const exitTime = trade.exit_time != null ? toTimestampSeconds(trade.exit_time, timestamp) : null
      const entryCrossed = trade.entry_crossed ? 1 : 0
      const exitCrossed = trade.exit_crossed ? 1 : 0
      const exitPlan = trade.exit_plan ? JSON.stringify(trade.exit_plan) : null
      const totalCommission =
        (trade.total_commission_dollars ??
          ((trade.entry_commission_dollars ?? 0) + (trade.exit_commission_dollars ?? 0))) || 0

      return detailedStmt.bind(
        trade.id ?? `detail-${timestamp}-${index}`,
        trade.model_id ?? '',
        trade.symbol ?? '',
        trade.side ?? '',
        trade.trade_type ?? trade.side ?? '',
        trade.leverage ?? 1,
        trade.quantity ?? trade.entry_sz ?? 0,
        trade.confidence ?? 0,
        entryTime,
        trade.entry_human_time ?? '',
        trade.entry_price ?? 0,
        trade.entry_sz ?? 0,
        trade.entry_oid ?? '',
        trade.entry_tid ?? '',
        trade.entry_commission_dollars ?? 0,
        trade.entry_closed_pnl ?? 0,
        entryCrossed,
        exitTime,
        trade.exit_human_time ?? '',
        trade.exit_price ?? 0,
        trade.exit_sz ?? 0,
        trade.exit_oid ?? '',
        trade.exit_tid ?? '',
        trade.exit_commission_dollars ?? 0,
        trade.exit_closed_pnl ?? 0,
        exitCrossed,
        exitPlan,
        trade.realized_net_pnl ?? trade.pnl ?? 0,
        trade.realized_gross_pnl ?? 0,
        totalCommission,
        JSON.stringify(trade),
        timestamp
      )
    })
  )

  return { recent: Math.min(trades.length, recentLimit), detailed: trades.length }
}

async function syncAnalyticsSummary(db: D1Database, payload: any, timestamp: number) {
  const analytics = Array.isArray(payload?.analytics) ? payload.analytics : []
  if (!analytics.length) return 0

  const serverTime = toTimestampSeconds(payload?.serverTime, timestamp)

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO model_analytics (
      model_id, updated_at, last_trade_exit_time, last_convo_timestamp,
      overall_pnl_with_fees, overall_pnl_without_fees, total_fees_paid, total_fees_as_pct_of_pnl,
      avg_net_pnl, avg_gross_pnl, std_net_pnl, std_gross_pnl, biggest_net_gain, biggest_net_loss,
      win_rate, avg_winners_net_pnl, avg_losers_net_pnl, std_winners_net_pnl, std_losers_net_pnl,
      total_trades, num_long_trades, num_short_trades, long_short_trades_ratio,
      avg_holding_period_mins, median_holding_period_mins, std_holding_period_mins,
      avg_longs_holding_period, avg_shorts_holding_period,
      avg_size_of_trade_notional, median_size_of_trade_notional, std_size_of_trade_notional,
      total_signals, num_long_signals, num_short_signals, num_close_signals, num_hold_signals,
      long_signal_pct, short_signal_pct, close_signal_pct, hold_signal_pct,
      avg_confidence, median_confidence, std_confidence,
      avg_confidence_long, avg_confidence_short, avg_confidence_close,
      avg_leverage, median_leverage, avg_convo_leverage,
      sharpe_ratio, mins_long_combined, mins_short_combined, mins_flat_combined,
      pct_mins_long_combined, pct_mins_short_combined, pct_mins_flat_combined,
      num_invocations, avg_invocation_break_mins, min_invocation_break_mins, max_invocation_break_mins,
      cached_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `)

  await db.batch(
    analytics.map((item: any) => {
      const fee = item.fee_pnl_moves_breakdown_table ?? {}
      const winners = item.winners_losers_breakdown_table ?? {}
      const trading = item.overall_trades_overview_table ?? {}
      const holding = item.holding_period_breakdown_table ?? {}
      const size = item.trade_size_breakdown_table ?? {}
      const signals = item.signals_breakdown_table ?? {}
      const confidence = item.confidence_breakdown_table ?? {}
      const leverage = item.leverage_breakdown_table ?? {}
      const time = item.time_in_market_breakdown_table ?? {}
      const invocation = item.invocation_breakdown_table ?? {}

      return stmt.bind(
        item.model_id ?? '',
        item.updated_at ?? serverTime,
        item.last_trade_exit_time ?? null,
        item.last_convo_timestamp ?? null,
        fee.overall_pnl_with_fees ?? 0,
        fee.overall_pnl_without_fees ?? 0,
        fee.total_fees_paid ?? 0,
        fee.total_fees_as_pct_of_pnl ?? 0,
        fee.avg_net_pnl ?? 0,
        fee.avg_gross_pnl ?? 0,
        fee.std_net_pnl ?? 0,
        fee.std_gross_pnl ?? 0,
        fee.biggest_net_gain ?? 0,
        fee.biggest_net_loss ?? 0,
        winners.win_rate ?? 0,
        winners.avg_winners_net_pnl ?? 0,
        winners.avg_losers_net_pnl ?? 0,
        winners.std_winners_net_pnl ?? 0,
        winners.std_losers_net_pnl ?? 0,
        trading.total_trades ?? item.total_trades ?? 0,
        trading.num_long_trades ?? item.num_long_trades ?? 0,
        trading.num_short_trades ?? item.num_short_trades ?? 0,
        trading.long_short_ratio ?? item.long_short_ratio ?? 0,
        holding.avg_holding_period_mins ?? item.avg_holding_period_mins ?? 0,
        holding.median_holding_period_mins ?? item.median_holding_period_mins ?? 0,
        holding.std_holding_period_mins ?? item.std_holding_period_mins ?? 0,
        holding.avg_longs_holding_period ?? item.avg_longs_holding_period ?? 0,
        holding.avg_shorts_holding_period ?? item.avg_shorts_holding_period ?? 0,
        size.avg_size_of_trade_notional ?? item.avg_size_of_trade_notional ?? 0,
        size.median_size_of_trade_notional ?? item.median_size_of_trade_notional ?? 0,
        size.std_size_of_trade_notional ?? item.std_size_of_trade_notional ?? 0,
        signals.total_signals ?? item.total_signals ?? 0,
        signals.num_long_signals ?? item.num_long_signals ?? 0,
        signals.num_short_signals ?? item.num_short_signals ?? 0,
        signals.num_close_signals ?? item.num_close_signals ?? 0,
        signals.num_hold_signals ?? item.num_hold_signals ?? 0,
        signals.long_signal_pct ?? item.long_signal_pct ?? 0,
        signals.short_signal_pct ?? item.short_signal_pct ?? 0,
        signals.close_signal_pct ?? item.close_signal_pct ?? 0,
        signals.hold_signal_pct ?? item.hold_signal_pct ?? 0,
        confidence.avg_confidence ?? item.avg_confidence ?? 0,
        confidence.median_confidence ?? item.median_confidence ?? 0,
        confidence.std_confidence ?? item.std_confidence ?? 0,
        confidence.avg_confidence_long ?? item.avg_confidence_long ?? 0,
        confidence.avg_confidence_short ?? item.avg_confidence_short ?? 0,
        confidence.avg_confidence_close ?? item.avg_confidence_close ?? 0,
        leverage.avg_leverage ?? item.avg_leverage ?? 0,
        leverage.median_leverage ?? item.median_leverage ?? 0,
        leverage.avg_convo_leverage ?? item.avg_convo_leverage ?? 0,
        item.sharpe_ratio ?? 0,
        time.mins_long_combined ?? item.mins_long_combined ?? 0,
        time.mins_short_combined ?? item.mins_short_combined ?? 0,
        time.mins_flat_combined ?? item.mins_flat_combined ?? 0,
        time.pct_mins_long_combined ?? item.pct_mins_long_combined ?? 0,
        time.pct_mins_short_combined ?? item.pct_mins_short_combined ?? 0,
        time.pct_mins_flat_combined ?? item.pct_mins_flat_combined ?? 0,
        invocation.num_invocations ?? item.num_invocations ?? 0,
        invocation.avg_invocation_break_mins ?? item.avg_invocation_break_mins ?? 0,
        invocation.min_invocation_break_mins ?? item.min_invocation_break_mins ?? 0,
        invocation.max_invocation_break_mins ?? item.max_invocation_break_mins ?? 0,
        timestamp
      )
    })
  )

  return analytics.length
}

async function syncModelAnalyticsDetails(db: D1Database, modelId: string, payload: any, timestamp: number) {
  await db
    .prepare(`
      INSERT OR REPLACE INTO model_analytics_details (model_id, raw_data, updated_at)
      VALUES (?, ?, ?)
    `)
    .bind(modelId, JSON.stringify(payload), timestamp)
    .run()

  return 1
}

async function syncConversations(db: D1Database, payload: any, timestamp: number) {
  const conversations = Array.isArray(payload?.conversations) ? payload.conversations : []
  if (!conversations.length) return 0

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO ai_conversations (
      id, model_id, conversation_time, decision, confidence,
      symbol, action_taken, raw_data, cached_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  await db.batch(
    conversations.map((item: any) => {
      const conversationTime = toTimestampSeconds(item.timestamp, timestamp)
      return stmt.bind(
        item.id ?? `${item.model_id ?? 'conversation'}-${conversationTime}`,
        item.model_id ?? '',
        conversationTime,
        item.decision_type ?? item.decision ?? '',
        item.confidence ?? 0,
        item.symbol ?? '',
        item.action_taken ?? '',
        JSON.stringify(item),
        timestamp
      )
    })
  )

  return conversations.length
}

async function syncAccountTotals(db: D1Database, payload: any, timestamp: number) {
  const totalsSource =
    Array.isArray(payload?.accountTotals) ? payload.accountTotals :
    Array.isArray(payload?.accounts) ? payload.accounts :
    Array.isArray(payload?.data) ? payload.data :
    []

  if (!totalsSource.length) {
    return { totals: 0, positions: 0 }
  }

  const totalStmt = db.prepare(`
    INSERT OR REPLACE INTO account_totals (
      id, model_id, timestamp, realized_pnl, unrealized_pnl,
      total_equity, positions_data, cached_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const positionStmt = db.prepare(`
    INSERT OR REPLACE INTO account_positions (
      id, account_total_id, model_id, symbol, quantity,
      entry_price, current_price, unrealized_pnl, closed_pnl,
      leverage, margin, liquidation_price, entry_time,
      confidence, risk_usd, exit_plan, cached_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const totalStatements: D1PreparedStatement[] = []
  const positionStatements: D1PreparedStatement[] = []
  let positionCount = 0

  for (const [index, account] of totalsSource.entries()) {
    const accountId =
      account?.id ?? account?.account_id ?? `${account?.model_id ?? 'account'}-${index}`
    const modelId = account?.model_id ?? accountId.split('_')[0] ?? ''
    const positionsRaw = account?.positions ?? account?.positions_data ?? {}
    const realized = Number(account?.realized_pnl ?? account?.realized ?? 0)
    const unrealized = Number(account?.unrealized_pnl ?? account?.unrealized ?? 0)
    const totalEquity = Number(account?.total_equity ?? account?.equity ?? realized + unrealized)
    const accountTimestamp = toTimestampSeconds(account?.timestamp, timestamp)
    const positionsJson = JSON.stringify(positionsRaw ?? {})

    totalStatements.push(
      totalStmt.bind(
        accountId,
        modelId,
        accountTimestamp,
        realized,
        unrealized,
        totalEquity,
        positionsJson,
        timestamp
      )
    )

    // Clear previous snapshot for this account before inserting the fresh positions
    await db.prepare(`DELETE FROM account_positions WHERE account_total_id = ?`).bind(accountId).run()

    const entries = Array.isArray(positionsRaw)
      ? positionsRaw.map((pos: any, posIndex: number) => [pos.symbol ?? `asset-${posIndex}`, pos] as [string, any])
      : Object.entries(positionsRaw ?? {})

    entries.forEach(([symbolKey, pos]: [string, any], posIndex: number) => {
      const symbol = pos?.symbol ?? symbolKey
      const exitPlan = pos?.exit_plan ? JSON.stringify(pos.exit_plan) : null
      positionStatements.push(
        positionStmt.bind(
          `${accountId}_${symbol}_${timestamp}_${posIndex}`,
          accountId,
          modelId,
          symbol,
          pos?.quantity ?? pos?.size ?? 0,
          pos?.entry_price ?? 0,
          pos?.current_price ?? 0,
          pos?.unrealized_pnl ?? 0,
          pos?.closed_pnl ?? 0,
          pos?.leverage ?? 0,
          pos?.margin ?? 0,
          pos?.liquidation_price ?? 0,
          toTimestampSeconds(pos?.entry_time ?? pos?.timestamp, timestamp),
          pos?.confidence ?? 0,
          pos?.risk_usd ?? 0,
          exitPlan,
          timestamp
        )
      )
      positionCount++
    })
  }

  if (totalStatements.length) {
    await db.batch(totalStatements)
  }
  if (positionStatements.length) {
    await db.batch(positionStatements)
  }

  return { totals: totalStatements.length, positions: positionCount }
}

async function syncSinceInception(db: D1Database, payload: any, timestamp: number) {
  const entries = Array.isArray(payload?.sinceInceptionValues) ? payload.sinceInceptionValues : []
  if (!entries.length) return 0

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO since_inception_values (
      id, model_id, nav_since_inception, inception_date, num_invocations, cached_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `)

  await db.batch(
    entries.map((entry: any, index: number) =>
      stmt.bind(
        entry.id ?? `${entry.model_id ?? 'since'}-${index}`,
        entry.model_id ?? '',
        entry.nav_since_inception ?? 0,
        toTimestampSeconds(entry.inception_date, timestamp),
        entry.num_invocations ?? 0,
        timestamp
      )
    )
  )

  return entries.length
}

async function syncCryptoPrices(db: D1Database, payload: any, timestamp: number) {
  const rawPrices = payload?.prices
  const entries: Array<{ symbol: string; price: number; timestamp: number | null }> = []

  if (Array.isArray(rawPrices)) {
    rawPrices.forEach((item: any, index: number) => {
      entries.push({
        symbol: item?.symbol ?? `asset-${index}`,
        price: Number(item?.price ?? 0),
        timestamp: item?.timestamp ?? item?.last_updated ?? null
      })
    })
  } else if (rawPrices && typeof rawPrices === 'object') {
    for (const [symbol, value] of Object.entries(rawPrices)) {
      const priceData = value as any
      entries.push({
        symbol,
        price: Number(priceData?.price ?? 0),
        timestamp: priceData?.timestamp ?? priceData?.last_updated ?? null
      })
    }
  }

  if (!entries.length) return 0

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO crypto_prices_realtime (
      symbol, price, timestamp, cached_at
    ) VALUES (?, ?, ?, ?)
  `)

  await db.batch(
    entries.map((entry, index) =>
      stmt.bind(
        entry.symbol ?? `asset-${index}`,
        entry.price,
        toTimestampSeconds(entry.timestamp, timestamp),
        timestamp
      )
    )
  )

  return entries.length
}

async function performSync(env: Env): Promise<SyncResult> {
  const db = env.DB
  const startedAt = Date.now()
  const now = startedAt
  const timestamp = Math.floor(now / 1000)

  await ensureTables(db)

  const result: SyncResult = {
    leaderboard: null,
    tradesRecent: null,
    tradesDetailed: null,
    analyticsSummary: null,
    analyticsDetails: null,
    conversations: null,
    accountTotals: null,
    accountPositions: null,
    sinceInception: null,
    cryptoPrices: null,
    errors: [],
    skipped: [],
    timestamp,
    startedAt,
    finishedAt: startedAt,
    durationMs: 0
  }

  const skippedJobs: string[] = []

  const runJob = async (job: string, intervalMinutes: number, runner: () => Promise<void>) => {
    const due = await shouldRun(db, job, intervalMinutes, now)
    if (!due) {
      skippedJobs.push(job)
      console.log(`[sync] skip ${job} (not due)`)
      return false
    }

    console.log(`[sync] start ${job}`)
    try {
      await runner()
      await markRun(db, job, now)
      console.log(`[sync] finish ${job}`)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[sync] ${job} failed`, error)
      result.errors.push(`${job}: ${message}`)
      return false
    }
  }

  await runJob('leaderboard', FIVE_MINUTES, async () => {
    const payload = await fetchJson(`${NOF1_BASE}/leaderboard`)
    result.leaderboard = await syncLeaderboard(db, payload, timestamp)
  })

  await runJob('trades', FIVE_MINUTES, async () => {
    const payload = await fetchJson(`${NOF1_BASE}/trades`)
    const tradeCounts = await syncTrades(db, payload, timestamp)
    result.tradesRecent = tradeCounts.recent
    result.tradesDetailed = tradeCounts.detailed
  })

  await runJob('analytics', ONE_HOUR, async () => {
    const payload = await fetchJson(`${NOF1_BASE}/analytics`)
    result.analyticsSummary = await syncAnalyticsSummary(db, payload, timestamp)
  })

  let analyticsDetailsCount = 0
  for (const model of MODELS) {
    const executed = await runJob(`analytics:${model}`, ONE_HOUR, async () => {
      const payload = await fetchJson(`${NOF1_BASE}/analytics/${encodeURIComponent(model)}`)
      await syncModelAnalyticsDetails(db, model, payload, timestamp)
    })
    if (executed) analyticsDetailsCount++
  }
  if (analyticsDetailsCount > 0) {
    result.analyticsDetails = (result.analyticsDetails ?? 0) + analyticsDetailsCount
  }

  await runJob('conversations', FIVE_MINUTES, async () => {
    const payload = await fetchJson(`${NOF1_BASE}/conversations`)
    result.conversations = await syncConversations(db, payload, timestamp)
  })

  await runJob('account-totals', FIVE_MINUTES, async () => {
    const payload = await fetchJson(`${NOF1_BASE}/account-totals`)
    const counts = await syncAccountTotals(db, payload, timestamp)
    result.accountTotals = counts.totals
    result.accountPositions = counts.positions
  })

  await runJob('since-inception', ONE_DAY, async () => {
    const payload = await fetchJson(`${NOF1_BASE}/since-inception-values`)
    result.sinceInception = await syncSinceInception(db, payload, timestamp)
  })

  await runJob('crypto-prices', FIVE_MINUTES, async () => {
    const payload = await fetchJson(`${NOF1_BASE}/crypto-prices`)
    result.cryptoPrices = await syncCryptoPrices(db, payload, timestamp)
  })

  result.skipped = skippedJobs

  const finishedAt = Date.now()
  result.finishedAt = finishedAt
  result.durationMs = finishedAt - startedAt

  return result
}

async function getSyncStatus(db: D1Database) {
  await ensureTables(db)
  const query = await db
    .prepare(`SELECT job, last_run FROM sync_runs ORDER BY job ASC`)
    .all<{ job: string; last_run: number }>()

  const rows = query.results ?? []
  return rows.map(row => ({
    job: row.job,
    lastRun: row.last_run,
    lastRunIso: new Date(row.last_run).toISOString()
  }))
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(performSync(env))
  },

  async fetch(request: Request, env: Env) {
    const method = request.method?.toUpperCase() ?? 'GET'
    const secret = env.CRON_SECRET
    if (secret) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${secret}`) {
        return new Response('Unauthorized', { status: 401 })
      }
    }

    if (method === 'GET') {
      const status = await getSyncStatus(env.DB)
      return Response.json({ success: true, status })
    }

    if (method === 'POST') {
      const result = await performSync(env)
      return Response.json({ success: result.errors.length === 0, result })
    }

    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'GET, POST' }
    })
  }
}
