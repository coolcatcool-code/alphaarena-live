// nof1.ai API Client
const NOF1_API_BASE = 'https://nof1.ai/api'

// AI Model ID 映射
const AI_MODEL_MAP: Record<string, string> = {
  'claude-sonnet-4-5': 'claude-1',
  'deepseek-chat-v3.1': 'deepseek-1',
  'gemini-2.5-pro': 'gemini-1',
  'gpt-5': 'chatgpt-1',
  'grok-4': 'grok-1',
  'qwen3-max': 'qwen-1',
}

export interface Nof1LeaderboardEntry {
  id: string
  num_trades: number
  win_dollars: number
  num_losses: number
  num_wins: number
  sharpe: number
  lose_dollars: number
  return_pct: number
  equity: number
}

export interface Nof1Position {
  id: string
  positions: Record<string, {
    symbol: string
    entry_price: number
    current_price: number
    margin: number
    leverage: number
    quantity: number
    unrealized_pnl: number
    closed_pnl: number
    confidence: number
    entry_time: number
    side?: string
  }>
}

export interface Nof1Trade {
  id: string
  model_id: string
  symbol: string
  side: string
  entry_price: number
  exit_price: number
  quantity: number
  leverage: number
  realized_net_pnl: number
  entry_time: number
  exit_time: number
  trade_type: string
}

export async function fetchNof1Leaderboard(): Promise<{ leaderboard: Nof1LeaderboardEntry[] }> {
  const response = await fetch(`${NOF1_API_BASE}/leaderboard`, {
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
    },
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch leaderboard: ${response.status} - ${errorText}`)
  }
  return response.json()
}

export async function fetchNof1Positions(): Promise<{ positions: Nof1Position[] }> {
  const response = await fetch(`${NOF1_API_BASE}/positions`, {
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
    },
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch positions: ${response.status} - ${errorText}`)
  }
  return response.json()
}

export async function fetchNof1Trades(): Promise<{ trades: Nof1Trade[] }> {
  const response = await fetch(`${NOF1_API_BASE}/trades`, {
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
    },
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch trades: ${response.status} - ${errorText}`)
  }
  return response.json()
}

// Transform nof1.ai data to our format
export function transformLeaderboard(nof1Data: Nof1LeaderboardEntry[]) {
  // Sort by return_pct descending (highest return first)
  const sorted = [...nof1Data].sort((a, b) => b.return_pct - a.return_pct)

  return sorted.map((entry, index) => {
    const ourId = AI_MODEL_MAP[entry.id] || entry.id
    return {
      id: `snapshot-${ourId}`,
      aiModelId: ourId,
      currentPnL: entry.return_pct,
      totalAssets: entry.equity,
      openPositions: 0, // Will be filled from positions
      winRate: entry.num_trades > 0 ? (entry.num_wins / entry.num_trades) * 100 : 0,
      rank: index + 1,
      rankChange: 0,
      timestamp: new Date(),
    }
  })
}

export function transformPositions(nof1Data: Nof1Position[]) {
  const positions: any[] = []

  nof1Data.forEach((modelData) => {
    const ourId = AI_MODEL_MAP[modelData.id] || modelData.id

    Object.entries(modelData.positions).forEach(([symbol, pos]) => {
      positions.push({
        id: `pos-${ourId}-${symbol}`,
        aiModelId: ourId,
        symbol: symbol,
        side: pos.quantity > 0 ? 'LONG' : 'SHORT',
        entryPrice: pos.entry_price,
        currentPrice: pos.current_price,
        size: Math.abs(pos.quantity * pos.entry_price),
        leverage: pos.leverage,
        pnl: pos.unrealized_pnl,
        pnlPercentage: (pos.unrealized_pnl / pos.margin) * 100,
        status: 'OPEN',
        openedAt: new Date(pos.entry_time * 1000),
      })
    })
  })

  return positions
}

export function transformTrades(nof1Data: Nof1Trade[], limit = 50) {
  // Sort by exit_time descending to get latest trades first
  const sorted = [...nof1Data].sort((a, b) => b.exit_time - a.exit_time)

  return sorted.slice(0, limit).map((trade) => {
    const ourId = AI_MODEL_MAP[trade.model_id] || trade.model_id

    // Better action type detection
    let action: 'BUY' | 'SELL' | 'CLOSE' = 'CLOSE'
    if (trade.trade_type === 'long') {
      action = 'BUY'
    } else if (trade.trade_type === 'short') {
      action = 'SELL'
    }

    return {
      id: trade.id,
      aiModelId: ourId,
      action,
      symbol: trade.symbol,
      side: trade.trade_type === 'long' ? 'LONG' : 'SHORT',
      amount: Math.abs(trade.quantity * trade.entry_price),
      price: trade.exit_price || trade.entry_price,
      leverage: trade.leverage,
      pnl: trade.realized_net_pnl,
      fee: 0,
      timestamp: new Date(trade.exit_time * 1000),
    }
  })
}
