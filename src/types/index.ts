// AI Model基础信息
export interface AIModel {
  id: string
  name: string
  avatar?: string | null
  description?: string | null
  color?: string | null
  createdAt: Date
  updatedAt: Date
}

// AI快照数据（实时状态）
export interface AISnapshot {
  id: string
  aiModelId: string
  currentPnL: number
  totalAssets: number
  openPositions: number
  winRate: number
  rank: number
  rankChange: number
  timestamp: Date
  aiModel: AIModel
}

// 交易记录
export interface Trade {
  id: string
  aiModelId: string
  action: 'BUY' | 'SELL' | 'CLOSE'
  symbol: string
  side?: 'LONG' | 'SHORT' | null
  amount: number
  price: number
  leverage: number
  pnl: number
  fee: number
  timestamp: Date
  aiModel: AIModel
}

// 持仓信息
export interface Position {
  id: string
  aiModelId: string
  symbol: string
  side: 'LONG' | 'SHORT'
  entryPrice: number
  currentPrice: number
  size: number
  leverage: number
  pnl: number
  pnlPercentage: number
  status: 'OPEN' | 'CLOSED'
  openedAt: Date
  closedAt?: Date
  aiModel: AIModel
}

// 文章接口
export interface Article {
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  readTime: number
  publishedAt: string
  updatedAt?: string
}

// API响应类型
export interface LeaderboardResponse {
  data: AISnapshot[]
  timestamp: string
  count: number
}

export interface TradesResponse {
  data: Trade[]
  meta: {
    total: number
    returned: number
    totalVolume: number
    totalPnL: number
  }
}

export interface PositionsResponse {
  data: Position[]
  timestamp: string
  count: number
}

export interface AIDetailResponse {
  aiModel: AIModel
  snapshot: AISnapshot
  positions: Position[]
  recentTrades: Trade[]
  stats: {
    totalTrades: number
    avgHoldTime: number
    favoriteAsset: string
    avgLeverage: number
  }
}

// 组件Props类型
export interface LeaderboardProps {
  snapshots: AISnapshot[]
  loading?: boolean
}

export interface TrendChartProps {
  snapshots: AISnapshot[]
}

export interface TradeHistoryProps {
  trades: Trade[]
  limit?: number
}

// ==================== New API Types ====================

// Analytics API Types (from /api/analytics)
export interface AnalyticsData {
  ai_model_id: string
  ai_model_name: string

  // Trading Statistics
  trading_stats: {
    total_trades: number
    winning_trades: number
    losing_trades: number
    win_rate: number
    avg_trade_size: number
    total_volume: number
  }

  // PnL Analysis
  pnl_analysis: {
    total_pnl: number
    realized_pnl: number
    unrealized_pnl: number
    avg_win: number
    avg_loss: number
    profit_factor: number
  }

  // Fee Analysis
  fee_analysis: {
    total_fees: number
    avg_fee_per_trade: number
    fee_to_pnl_ratio: number
  }

  // Signal Distribution
  signal_distribution: {
    buy_signals: number
    sell_signals: number
    hold_signals: number
  }

  // Risk Metrics
  risk_metrics: {
    sharpe_ratio: number | null
    max_drawdown: number | null
    volatility: number | null
    var_95: number | null
  }

  // Time Analysis
  time_analysis: {
    avg_hold_time_minutes: number
    most_active_hour: number
    trade_frequency_per_day: number
  }

  // Performance by Asset
  performance_by_asset: {
    symbol: string
    trades: number
    pnl: number
    win_rate: number
  }[]

  timestamp: string
}

export interface AnalyticsResponse {
  data: AnalyticsData[]
  timestamp: string
  count: number
}

// Conversations API Types (from /api/conversations)
export interface MarketData {
  timestamp: string
  prices: {
    [symbol: string]: {
      current: number
      change_24h: number
      volume_24h: number
      high_24h: number
      low_24h: number
    }
  }
  indicators: {
    [symbol: string]: {
      rsi: number
      macd: {
        value: number
        signal: number
        histogram: number
      }
      bb: {
        upper: number
        middle: number
        lower: number
      }
      ema_20: number
      ema_50: number
    }
  }
}

export interface ConversationPosition {
  symbol: string
  side: 'LONG' | 'SHORT'
  entry_price: number
  current_price: number
  size: number
  leverage: number
  unrealized_pnl: number
  unrealized_pnl_percent: number
}

export interface ConversationData {
  ai_model_id: string
  ai_model_name: string

  // Market Data Seen by AI
  market_data: MarketData

  // AI Decision Making Process
  decision_process: {
    chain_of_thought: string
    key_observations: string[]
    risk_assessment: string
    decision: 'BUY' | 'SELL' | 'HOLD' | 'CLOSE'
    reasoning: string
    confidence: number
  }

  // Current Positions
  current_positions: ConversationPosition[]

  // Proposed Action (if decision is BUY/SELL)
  proposed_action?: {
    symbol: string
    side: 'LONG' | 'SHORT'
    size: number
    leverage: number
    entry_strategy: string
    stop_loss?: number
    take_profit?: number
  }

  timestamp: string
}

export interface ConversationsResponse {
  data: ConversationData[]
  timestamp: string
  count: number
}

// Database Models for new tables
export interface AnalyticsSnapshot {
  id: string
  aiModelId: string
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalPnL: number
  realizedPnL: number
  unrealizedPnL: number
  totalFees: number
  avgFeePerTrade: number
  buySignals: number
  sellSignals: number
  holdSignals: number
  sharpeRatio: number | null
  maxDrawdown: number | null
  volatility: number | null
  rawData: any
  timestamp: Date
  createdAt: Date
}

export interface AIConversation {
  id: string
  aiModelId: string
  marketData: any
  chainOfThought: string
  decision: string
  reasoning: string
  currentPositions: any
  targetSymbol: string | null
  confidence: number | null
  rawData: any
  timestamp: Date
  createdAt: Date
}

// ==================== NOF1 API Response Types ====================

// Leaderboard API Response
export interface NOF1LeaderboardItem {
  id: string
  num_trades: number
  sharpe: number | null
  win_dollars: number
  num_losses: number
  lose_dollars: number
  return_pct: number
  equity: number
  num_wins: number
}

export interface NOF1LeaderboardResponse {
  leaderboard: NOF1LeaderboardItem[]
}

// Trades API Response
export interface NOF1Trade {
  id: string
  trade_id: string
  model_id: string
  symbol: string
  side: 'LONG' | 'SHORT'
  trade_type?: string
  quantity?: number
  leverage: number
  confidence?: number
  entry_price: number
  entry_time: number
  entry_human_time?: string
  entry_sz?: number
  entry_tid?: string
  entry_oid?: string
  entry_crossed?: boolean
  entry_commission_dollars?: number
  entry_closed_pnl?: number
  exit_price: number | null
  exit_time: number | null
  exit_human_time?: string
  exit_sz?: number
  exit_tid?: string
  exit_oid?: string
  exit_crossed?: boolean
  exit_commission_dollars?: number
  exit_closed_pnl?: number
  realized_gross_pnl?: number
  realized_net_pnl: number | null
  total_commission_dollars?: number
  unrealized_pnl: number | null
  status: 'OPEN' | 'CLOSED'
  fees: number
}

export interface NOF1TradesResponse {
  trades: NOF1Trade[]
}

// Analytics API Response
export interface NOF1AnalyticsItem {
  model_id: string
  model_name: string
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  total_pnl: number
  total_fees: number
  sharpe_ratio: number | null
  max_drawdown: number | null
  avg_trade_duration: number
  performance_by_asset: {
    symbol: string
    trades: number
    pnl: number
    win_rate: number
  }[]
  // Nested breakdown tables
  fee_pnl_moves_breakdown_table?: {
    std_net_pnl?: number
    total_fees_paid?: number
    overall_pnl_without_fees?: number
    total_fees_as_pct_of_pnl?: number
    overall_pnl_with_fees?: number
    avg_taker_fee?: number
    std_gross_pnl?: number
    avg_net_pnl?: number
    biggest_net_loss?: number
    biggest_net_gain?: number
    avg_gross_pnl?: number
    std_taker_fee?: number
  }
  winners_losers_breakdown_table?: {
    win_rate?: number
    avg_winners_net_pnl?: number
    avg_losers_net_pnl?: number
    avg_winners_notional?: number
    avg_losers_notional?: number
    avg_winners_holding_period?: number
    avg_losers_holding_period?: number
  }
}

export interface NOF1AnalyticsResponse {
  analytics: NOF1AnalyticsItem[]
  serverTime?: string
}

// Conversations API Response
export interface NOF1ConversationItem {
  model_id: string
  model_name: string
  timestamp: string
  decision: 'BUY' | 'SELL' | 'HOLD' | 'CLOSE'
  reasoning: string
  confidence: number
  market_data: any
  current_positions: any[]
}

export interface NOF1ConversationsResponse {
  conversations: NOF1ConversationItem[]
}

// Account Totals API Response
export interface NOF1AccountTotalsItem {
  model_id: string
  total_equity: number
  available_balance: number
  margin_used: number
  unrealized_pnl: number
  realized_pnl: number
}

export interface NOF1AccountTotalsResponse {
  accounts: NOF1AccountTotalsItem[]
}

// Since Inception Values API Response
export interface NOF1SinceInceptionItem {
  model_id: string
  initial_capital: number
  current_equity: number
  total_return_pct: number
  total_pnl: number
  days_active: number
  total_trades: number
}

export interface NOF1SinceInceptionResponse {
  data: NOF1SinceInceptionItem[]
}

// Crypto Prices API Response
export interface NOF1CryptoPrice {
  symbol: string
  price: number
  change_24h: number
  volume_24h: number
  high_24h: number
  low_24h: number
  last_updated: number
}

export interface NOF1CryptoPricesResponse {
  prices: NOF1CryptoPrice[]
}

// Model-specific Analytics Response
export interface NOF1ModelAnalyticsResponse {
  model_id: string
  model_name: string
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  total_pnl: number
  total_fees: number
  sharpe_ratio: number | null
  max_drawdown: number | null
  avg_trade_duration: number
  performance_by_asset: {
    symbol: string
    trades: number
    pnl: number
    win_rate: number
  }[]
  recent_trades: NOF1Trade[]
}
