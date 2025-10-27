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
