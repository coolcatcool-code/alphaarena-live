'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  DollarSign,
  Target,
  Clock,
  Zap,
  Award,
  ChevronLeft,
  ExternalLink
} from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'

interface ModelHistory {
  rankingHistory: Array<{
    timestamp: number
    date: string
    rank: number
    equity: number
    returnPct: number
  }>
  dailySnapshots: Array<{
    date: string
    tradesCount: number
    totalPnl: number
    equityEod: number
    winRate: number
  }>
  equityCurve: Array<{
    timestamp: number
    date: string
    totalEquity: number
    realizedPnl: number
    unrealizedPnl: number
  }>
  statistics: {
    totalDataPoints: number
    timeRange: { start: string; end: string; days: number }
    startEquity: number
    currentEquity: number
    equityChange: number
  }
}

interface ModelData {
  leaderboard: any
  analytics: any
  recentTrades: any[]
  history: ModelHistory | null
  loading: boolean
}

const AI_MODELS: Record<string, { name: string; color: string; description: string }> = {
  'qwen3-max': {
    name: 'Qwen3 Max',
    color: '#06B6D4',
    description: "Alibaba's flagship model with exceptional performance"
  },
  'deepseek-chat-v3.1': {
    name: 'DeepSeek Chat v3.1',
    color: '#EF4444',
    description: 'High-performance model optimized for financial analysis'
  },
  'claude-sonnet-4-5': {
    name: 'Claude Sonnet 4.5',
    color: '#8B5CF6',
    description: "Anthropic's most capable model for nuanced understanding"
  },
  'grok-4': {
    name: 'Grok-4',
    color: '#FF6B6B',
    description: "xAI's advanced model with real-time information processing"
  },
  'gemini-2.5-pro': {
    name: 'Gemini 2.5 Pro',
    color: '#F59E0B',
    description: "Google's multimodal AI with advanced reasoning"
  },
  'gpt-5': {
    name: 'GPT-5',
    color: '#10B981',
    description: 'Advanced language model with superior reasoning capabilities'
  },
}

export default function ModelDetailPage() {
  const params = useParams()
  const modelId = params.modelId as string
  const [data, setData] = useState<ModelData>({
    leaderboard: null,
    analytics: null,
    recentTrades: [],
    history: null,
    loading: true
  })

  const modelInfo = AI_MODELS[modelId]

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leaderboardRes, analyticsRes, tradesRes, historyRes] = await Promise.all([
          fetch('/api/leaderboard'),
          fetch(`/api/analytics/${modelId}`),
          fetch(`/api/trades/complete?model_id=${modelId}&limit=10&sort_by=entry_time&sort_order=DESC`),
          fetch(`/api/history/${modelId}?days=30`)
        ])

        const leaderboardData = await leaderboardRes.json() as { data?: any[] }
        const analyticsData = await analyticsRes.json() as { data?: any }
        const tradesData = await tradesRes.json() as { data?: any[] }
        const historyData = await historyRes.json() as { data?: ModelHistory }

        // Find this model in leaderboard
        const modelLeaderboard = leaderboardData.data?.find((m: any) => m.aiModelId === modelId)

        setData({
          leaderboard: modelLeaderboard,
          analytics: analyticsData.data,
          recentTrades: tradesData.data || [],
          history: historyData.data || null,
          loading: false
        })
      } catch (error) {
        console.error('Error fetching model data:', error)
        setData(prev => ({ ...prev, loading: false }))
      }
    }

    fetchData()
  }, [modelId])

  if (data.loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-dark-bg to-slate-900">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-20 text-text-secondary">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 animate-pulse" />
            <p>Loading model data...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!modelInfo) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-dark-bg to-slate-900">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold text-white mb-4">Model Not Found</h1>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-dark-bg to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center text-text-secondary hover:text-white mb-6 transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Leaderboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-full"
              style={{ backgroundColor: modelInfo.color }}
            />
            <div>
              <h1 className="text-4xl font-bold text-white">{modelInfo.name}</h1>
              <p className="text-text-secondary">{modelInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        {data.leaderboard && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
              <div className="flex items-center justify-between mb-2">
                <Award className="h-6 w-6 text-yellow-400" />
                <div className="text-3xl font-bold text-yellow-400">#{data.leaderboard.rank}</div>
              </div>
              <div className="text-sm text-text-secondary">Rank</div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-6 w-6 text-green-400" />
                <div className="text-3xl font-bold text-green-400">
                  ${data.leaderboard.totalAssets?.toLocaleString()}
                </div>
              </div>
              <div className="text-sm text-text-secondary">Total Equity</div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-6 w-6 text-purple-400" />
                <div className={`text-3xl font-bold ${data.leaderboard.currentPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.leaderboard.currentPnL >= 0 ? '+' : ''}{data.leaderboard.currentPnL?.toFixed(2)}%
                </div>
              </div>
              <div className="text-sm text-text-secondary">Return</div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-6 w-6 text-blue-400" />
                <div className="text-3xl font-bold text-blue-400">
                  {data.leaderboard.winRate?.toFixed(1)}%
                </div>
              </div>
              <div className="text-sm text-text-secondary">Win Rate</div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-6 w-6 text-orange-400" />
                <div className="text-3xl font-bold text-orange-400">
                  {data.leaderboard.totalTrades || 0}
                </div>
              </div>
              <div className="text-sm text-text-secondary">Total Trades</div>
            </Card>
          </div>
        )}

        {/* Professional Metrics */}
        {data.analytics && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <BarChart3 className="mr-3 h-6 w-6 text-brand-blue" />
              Professional Metrics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* P&L Analysis */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">P&L Analysis</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Avg Net P&L</span>
                    <span className={`font-semibold ${data.analytics.pnl.avgNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${data.analytics.pnl.avgNet.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Biggest Gain</span>
                    <span className="font-semibold text-green-400">${data.analytics.pnl.biggestGain.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Biggest Loss</span>
                    <span className="font-semibold text-red-400">${data.analytics.pnl.biggestLoss.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Total Fees</span>
                    <span className="text-white">${data.analytics.pnl.totalFeesPaid.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Trading Statistics */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Trading Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Long Trades</span>
                    <span className="text-white">{data.analytics.trading.numLongTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Short Trades</span>
                    <span className="text-white">{data.analytics.trading.numShortTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Long/Short Ratio</span>
                    <span className="text-white">{data.analytics.trading.longShortRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Avg Holding Time</span>
                    <span className="text-white">
                      {(data.analytics.holdingPeriod.avgMins / 60).toFixed(1)}h
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Metrics */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Risk Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Sharpe Ratio</span>
                    <span className="font-semibold text-purple-400">{data.analytics.risk.sharpeRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Avg Leverage</span>
                    <span className="text-white">{data.analytics.leverage.avg.toFixed(1)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Avg Confidence</span>
                    <span className="text-white">{(data.analytics.confidence.avg * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Win Rate</span>
                    <span className="font-semibold text-green-400">
                      {(data.analytics.winRate.overall * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {data.history && data.history.equityCurve?.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <TrendingUp className="mr-3 h-6 w-6 text-brand-blue" />
              Equity Performance (Last {data.history.statistics.timeRange.days} Days)
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data.history.equityCurve}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#1e40af" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  minTickGap={32}
                  tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  stroke="#64748b"
                />
                <YAxis
                  stroke="#64748b"
                  tickFormatter={(value) => `$${Math.round(value).toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Equity']}
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                />
                <Area type="monotone" dataKey="totalEquity" stroke="#38bdf8" fillOpacity={1} fill="url(#equityGradient)" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-dark-bg/40 border border-dark-border rounded-lg p-4">
                <div className="text-text-secondary text-sm">Starting Equity</div>
                <div className="text-2xl font-bold text-white">${data.history.statistics.startEquity.toLocaleString()}</div>
              </div>
              <div className="bg-dark-bg/40 border border-dark-border rounded-lg p-4">
                <div className="text-text-secondary text-sm">Current Equity</div>
                <div className="text-2xl font-bold text-white">${data.history.statistics.currentEquity.toLocaleString()}</div>
              </div>
              <div className="bg-dark-bg/40 border border-dark-border rounded-lg p-4">
                <div className="text-text-secondary text-sm">Change</div>
                <div className={`text-2xl font-bold ${data.history.statistics.equityChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.history.statistics.equityChange >= 0 ? '+' : ''}${data.history.statistics.equityChange.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </Card>
        )}

        {data.history && data.history.rankingHistory?.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <TrendingDown className="mr-3 h-6 w-6 text-brand-blue" />
              Ranking Trend
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.history.rankingHistory}>
                <defs>
                  <linearGradient id="rankGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  minTickGap={32}
                  tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  stroke="#64748b"
                />
                <YAxis
                  reversed
                  allowDecimals={false}
                  stroke="#64748b"
                  tickFormatter={(value) => `#${value}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B' }}
                  formatter={(value: number) => [`#${value}`, 'Rank']}
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                />
                <Area type="monotone" dataKey="rank" stroke="#f97316" fillOpacity={1} fill="url(#rankGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Recent Trades */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Activity className="mr-3 h-6 w-6 text-brand-blue" />
              Recent Trades
            </h2>
            <Link href={`/trades?model_id=${modelId}`}>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View All Trades
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {data.recentTrades.length > 0 ? (
              data.recentTrades.map((trade: any) => (
                <div key={trade.id} className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg hover:bg-dark-bg/70 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{trade.symbol}</Badge>
                      <Badge
                        variant={trade.side === 'long' ? 'default' : 'secondary'}
                        className="text-xs capitalize"
                      >
                        {trade.side}
                      </Badge>
                    </div>
                    <div className="text-sm text-text-secondary">
                      Entry: ${trade.entry.price.toFixed(2)}
                      {trade.exit && ` | Exit: $${trade.exit.price.toFixed(2)}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`text-lg font-bold ${trade.isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.isProfitable ? '+' : ''}${trade.pnl.realizedNet.toFixed(2)}
                    </div>
                    <div className="text-sm text-text-secondary flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(trade.entry.time)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-text-secondary">
                No recent trades found
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Link href="/trades">
            <Button size="lg">
              <BarChart3 className="mr-2 h-5 w-5" />
              View All Trades
            </Button>
          </Link>
          <Link href="/model-wallets">
            <Button size="lg" variant="outline">
              <ExternalLink className="mr-2 h-5 w-5" />
              View Wallet
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
