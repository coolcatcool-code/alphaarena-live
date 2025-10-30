'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LiveIndicator } from '@/components/features/Live/LiveIndicator'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  Target, 
  Zap,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  RefreshCw
} from 'lucide-react'
import type { 
  AISnapshot, 
  Position, 
  LeaderboardResponse, 
  PositionsResponse 
} from '@/types'

interface LiveStats {
  totalActivePositions: number
  totalUnrealizedPnL: number
  totalRealizedPnL: number
  mostActiveModel: string
  riskLevel: 'low' | 'medium' | 'high'
  marketSentiment: 'bullish' | 'bearish' | 'neutral'
}

interface MarketData {
  symbol: string
  price: number
  change24h: number
  volume: number
}

interface RecentTrade {
  id: string
  modelId: string
  symbol: string
  side: string
  pnl: number
  entryPrice?: number
  exitPrice?: number | null
  entryTime: number
}

interface RecentTradesResponse {
  data: Array<{
    id: string
    modelId: string
    symbol: string
    side: string
    pnl?: number
    realizedPnL?: number
    entryPrice?: number
    exitPrice?: number | null
    entryTime: number
    timestamp?: number
  }>
  total: number
  timestamp: string
}

export default function LivePage() {
  const [leaderboard, setLeaderboard] = useState<AISnapshot[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [liveTrades, setLiveTrades] = useState<RecentTrade[]>([])
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null)
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'profitable' | 'losing'>('all')

  const fetchData = async () => {
    try {
      const [leaderboardRes, positionsRes, tradesRes, cryptoPricesRes] = await Promise.all([
        fetch('/api/leaderboard'),
        fetch('/api/positions'),
        fetch('/api/trades/recent?limit=20'),
        fetch('/api/crypto/prices'),
      ])

      const leaderboardData = await leaderboardRes.json() as LeaderboardResponse
      const positionsData = await positionsRes.json() as PositionsResponse
      const tradesJson = await tradesRes.json() as RecentTradesResponse
      const cryptoPrices = await cryptoPricesRes.json() as { data?: any[]; source?: string }

      const recentTrades: RecentTrade[] = Array.isArray(tradesJson.data)
        ? tradesJson.data.map(trade => ({
            id: trade.id,
            modelId: trade.modelId,
            symbol: trade.symbol,
            side: trade.side,
            pnl: trade.realizedPnL ?? trade.pnl ?? 0,
            entryPrice: trade.entryPrice,
            exitPrice: trade.exitPrice ?? null,
            entryTime: trade.entryTime ?? trade.timestamp ?? 0
          }))
        : []

      setLeaderboard(leaderboardData.data)
      setPositions(positionsData.data)
      setLiveTrades(recentTrades)

      // Calculate live stats
      const stats = calculateLiveStats(leaderboardData.data, positionsData.data)
      setLiveStats(stats)

      // Real-time crypto prices from D1
      if (cryptoPrices.data && cryptoPrices.data.length > 0) {
        setMarketData(cryptoPrices.data)
      } else {
        // Fallback to mock data if API fails
        setMarketData([
          { symbol: 'BTC', price: 67234.56, change24h: 2.34, volume: 28500000000 },
          { symbol: 'ETH', price: 3456.78, change24h: -1.23, volume: 15200000000 },
          { symbol: 'SOL', price: 178.90, change24h: 4.56, volume: 2100000000 },
          { symbol: 'BNB', price: 612.34, change24h: 1.89, volume: 1800000000 },
        ])
      }

      setLastUpdate(new Date())
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch live data:', error)
      // Set fallback mock data on error
      setMarketData([
        { symbol: 'BTC', price: 67234.56, change24h: 2.34, volume: 28500000000 },
        { symbol: 'ETH', price: 3456.78, change24h: -1.23, volume: 15200000000 },
        { symbol: 'SOL', price: 178.90, change24h: 4.56, volume: 2100000000 },
        { symbol: 'BNB', price: 612.34, change24h: 1.89, volume: 1800000000 },
      ])
      setLiveTrades([])
    }
  }

  const calculateLiveStats = (leaderboard: AISnapshot[], positions: Position[]): LiveStats => {
    const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + (pos.pnl || 0), 0)
    const totalRealizedPnL = leaderboard.reduce((sum, ai) => sum + (ai.currentPnL || 0), 0)
    const mostActive = leaderboard.length > 0
      ? leaderboard.reduce((max, ai) =>
          (ai.openPositions || 0) > (max.openPositions || 0) ? ai : max, leaderboard[0]
        )
      : undefined

    const riskLevel = Math.abs(totalUnrealizedPnL) > 1000 ? 'high' :
      Math.abs(totalUnrealizedPnL) > 500 ? 'medium' : 'low'

    const sentiment = totalUnrealizedPnL > 100 ? 'bullish' :
      totalUnrealizedPnL < -100 ? 'bearish' : 'neutral'

    return {
      totalActivePositions: positions.length,
      totalUnrealizedPnL,
      totalRealizedPnL,
      mostActiveModel: mostActive?.aiModel?.name || 'N/A',
      riskLevel,
      marketSentiment: sentiment
    }
  }

  useEffect(() => {
    fetchData()
    
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchData, 30000) // 30 seconds refresh
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  // Filter trading data
  const filteredTrades = liveTrades.filter(trade => {
    if (selectedFilter === 'profitable') return (trade.pnl || 0) > 0
    if (selectedFilter === 'losing') return (trade.pnl || 0) < 0
    return true
  })

  // Group positions by AI
  const positionsByAI = positions.reduce((acc, pos) => {
    if (!acc[pos.aiModelId]) acc[pos.aiModelId] = []
    acc[pos.aiModelId].push(pos)
    return acc
  }, {} as Record<string, Position[]>)

  const formatTime = (date: Date | string) => {
    const d = new Date(date)
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-400 border-red-400'
      case 'medium': return 'text-yellow-400 border-yellow-400'
      case 'low': return 'text-green-400 border-green-400'
      default: return 'text-gray-400 border-gray-400'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-green-400" />
      case 'bearish': return <TrendingDown className="h-4 w-4 text-red-400" />
      default: return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-dark-bg to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
              <Zap className="mr-3 h-8 w-8 text-brand-blue" />
              Live Trading Floor
            </h1>
            <p className="text-text-secondary">
              Real-time trading monitoring and in-depth analysis of 6 AI models
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 lg:mt-0">
            <div className="flex items-center gap-2">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Manual Refresh
              </Button>
            </div>
            <LiveIndicator lastUpdate={lastUpdate} />
          </div>
        </div>

        {/* Real-time Stats Dashboard */}
        {liveStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-5 w-5 text-blue-400" />
                <Badge variant="secondary" className="text-xs">LIVE</Badge>
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {liveStats.totalActivePositions}
              </div>
              <div className="text-xs text-text-secondary">Active Positions</div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-400">
                ${liveStats.totalRealizedPnL.toFixed(0)}
              </div>
              <div className="text-xs text-text-secondary">Realized P&L</div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-5 w-5 text-purple-400" />
                {getSentimentIcon(liveStats.marketSentiment)}
              </div>
              <div className="text-2xl font-bold text-purple-400">
                ${liveStats.totalUnrealizedPnL.toFixed(0)}
              </div>
              <div className="text-xs text-text-secondary">Unrealized P&L</div>
            </Card>

            <Card className={`p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20`}>
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                <Badge variant="outline" className={`text-xs ${getRiskColor(liveStats.riskLevel)}`}>
                  {liveStats.riskLevel.toUpperCase()}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-orange-400">
                {liveStats.riskLevel.toUpperCase()}
              </div>
              <div className="text-xs text-text-secondary">Risk Level</div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-500/20">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                <Badge variant="secondary" className="text-xs">ACTIVE</Badge>
              </div>
              <div className="text-lg font-bold text-cyan-400 truncate">
                {liveStats.mostActiveModel}
              </div>
              <div className="text-xs text-text-secondary">Most Active Model</div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border-indigo-500/20">
              <div className="flex items-center justify-between mb-2">
                <Eye className="h-5 w-5 text-indigo-400" />
                {getSentimentIcon(liveStats.marketSentiment)}
              </div>
              <div className="text-lg font-bold text-indigo-400 capitalize">
                {liveStats.marketSentiment}
              </div>
              <div className="text-xs text-text-secondary">Market Sentiment</div>
            </Card>
          </div>
        )}

        {/* Market Data Ticker */}
        <Card className="p-4 mb-8 bg-dark-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-brand-blue" />
              Real-Time Market Data
            </h3>
            <Badge variant="outline" className="text-green-400 border-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
              Live Updates
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {marketData.map((market) => (
              <div key={market.symbol} className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                <div>
                  <div className="font-semibold text-white">{market.symbol}</div>
                  <div className="text-sm text-text-secondary">
                    ${market.price.toLocaleString()}
                  </div>
                </div>
                <div className={`text-right ${market.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  <div className="flex items-center">
                    {market.change24h >= 0 ? 
                      <ArrowUpRight className="h-4 w-4 mr-1" /> : 
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    }
                    {Math.abs(market.change24h).toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Compact Leaderboard with Enhanced Info */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Live Leaderboard</h2>
            <Link href="/">
              <Button variant="outline" size="sm">
                View Detailed Leaderboard
              </Button>
            </Link>
          </div>
          <Card className="p-6">
            <div className="space-y-3">
              {leaderboard.map((ai) => (
                <Link key={ai.id} href={`/live/${ai.aiModelId}`}>
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-dark-bg/50 transition-colors cursor-pointer border border-transparent hover:border-dark-border">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-text-muted w-8">
                        #{ai.rank}
                      </span>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: ai.aiModel.color || '#888' }}
                        />
                        <div>
                          <span className="text-white font-semibold">{ai.aiModel.name}</span>
                          <div className="text-sm text-text-secondary">
                            {ai.openPositions || 0} trades • Win rate {(ai.winRate || 0).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          ai.currentPnL >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {ai.currentPnL >= 0 ? '+' : ''}{ai.currentPnL.toFixed(2)}%
                        </div>
                        <div className="text-sm text-text-secondary">
                          ${ai.totalAssets?.toLocaleString() || '0'}
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        {ai.currentPnL >= 0 ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )}
                        <Badge 
                          variant={ai.currentPnL >= 0 ? "default" : "secondary"}
                          className="mt-1 text-xs"
                        >
                          {positionsByAI[ai.aiModelId]?.length || 0} positions
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </section>

        {/* Live Trades Feed */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Activity className="mr-2 h-6 w-6 text-brand-blue" />
              Live Trading Feed
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-text-secondary" />
              <select 
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as any)}
                className="bg-dark-card border border-dark-border rounded px-3 py-1 text-white text-sm"
              >
                <option value="all">All Trades</option>
                <option value="profitable">Profitable Trades</option>
                <option value="losing">Losing Trades</option>
              </select>
            </div>
          </div>
          
          <Card className="p-6">
            <div className="space-y-4">
              {filteredTrades.slice(0, 10).map((trade) => {
                const modelName = leaderboard.find(item => item.aiModelId === trade.modelId)?.aiModel?.name || trade.modelId
                const isClosed = trade.exitPrice !== null && trade.exitPrice !== undefined

                return (
                  <div key={trade.id} className="flex items-center justify-between p-4 bg-dark-bg/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <Clock className="h-4 w-4 text-text-secondary mb-1" />
                        <span className="text-xs text-text-secondary">
                          {formatTime(new Date(trade.entryTime * 1000))}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">{modelName}</span>
                          <Badge variant="outline" className="text-xs">
                            {trade.symbol}
                          </Badge>
                          <Badge
                            variant={trade.side?.toUpperCase() === 'LONG' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {trade.side?.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-text-secondary">
                          Entry: {trade.entryPrice !== undefined ? `$${trade.entryPrice.toFixed(2)}` : 'N/A'}
                          {isClosed && trade.exitPrice !== null && trade.exitPrice !== undefined && (
                            <span>{` | Exit: $${trade.exitPrice.toFixed(2)}`}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {isClosed ? 'Closed' : 'Open Position'}
                      </div>
                    </div>
                  </div>
                )
              })}

              
              {filteredTrades.length === 0 && (
                <div className="text-center py-8 text-text-secondary">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trading data matching the filter criteria</p>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* Quick Actions */}
        <section className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/analysis">
              <Button size="lg" className="w-full sm:w-auto">
                <BarChart3 className="mr-2 h-5 w-5" />
                In-Depth Analysis Report
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <TrendingUp className="mr-2 h-5 w-5" />
                View Full Leaderboard
              </Button>
            </Link>
            <Button size="lg" variant="ghost" className="w-full sm:w-auto" onClick={fetchData}>
              <RefreshCw className="mr-2 h-5 w-5" />
              Refresh All Data
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}
