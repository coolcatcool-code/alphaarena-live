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
