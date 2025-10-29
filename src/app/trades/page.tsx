'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Filter,
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface Trade {
  id: string
  modelId: string
  symbol: string
  side: string
  leverage: number
  quantity: number
  confidence: number
  entry: {
    time: number
    price: number
    commission: number
  }
  exit: {
    time: number
    price: number
    commission: number
  } | null
  pnl: {
    realizedNet: number
    realizedGross: number
    totalCommission: number
  }
  holdingPeriodMins: number | null
  isOpen: boolean
  isProfitable: boolean
}

interface PaginationInfo {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

const AI_MODELS = [
  { id: 'qwen3-max', name: 'Qwen3 Max', color: '#06B6D4' },
  { id: 'deepseek-chat-v3.1', name: 'DeepSeek Chat v3.1', color: '#EF4444' },
  { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', color: '#8B5CF6' },
  { id: 'grok-4', name: 'Grok-4', color: '#FF6B6B' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', color: '#F59E0B' },
  { id: 'gpt-5', name: 'GPT-5', color: '#10B981' },
]

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'HYPE', 'PEPE', 'ARB']
const SIDES = ['long', 'short']

export default function TradingHistoryPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  })
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [selectedSymbol, setSelectedSymbol] = useState<string>('')
  const [selectedSide, setSelectedSide] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('entry_time')
  const [sortOrder, setSortOrder] = useState<string>('DESC')

  const fetchTrades = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      })

      if (selectedModel) params.append('model_id', selectedModel)
      if (selectedSymbol) params.append('symbol', selectedSymbol)
      if (selectedSide) params.append('side', selectedSide)

      const res = await fetch(`/api/trades/complete?${params}`)
      const data = await res.json()

      setTrades(data.data || [])
      setPagination(data.pagination || pagination)
    } catch (error) {
      console.error('Error fetching trades:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrades()
  }, [pagination.offset, selectedModel, selectedSymbol, selectedSide, sortBy, sortOrder])

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({
        ...prev,
        offset: Math.max(0, prev.offset - prev.limit)
      }))
    }
  }

  const handleNextPage = () => {
    if (pagination.hasMore) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }))
    }
  }

  const handleReset = () => {
    setSelectedModel('')
    setSelectedSymbol('')
    setSelectedSide('')
    setSortBy('entry_time')
    setSortOrder('DESC')
    setPagination(prev => ({ ...prev, offset: 0 }))
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const formatDuration = (mins: number | null) => {
    if (!mins) return 'N/A'
    if (mins < 60) return `${Math.round(mins)}m`
    const hours = Math.floor(mins / 60)
    const remainingMins = Math.round(mins % 60)
    return `${hours}h ${remainingMins}m`
  }

  const getModelName = (modelId: string) => {
    return AI_MODELS.find(m => m.id === modelId)?.name || modelId
  }

  const getModelColor = (modelId: string) => {
    return AI_MODELS.find(m => m.id === modelId)?.color || '#888888'
  }

  // Calculate statistics
  const stats = {
    totalTrades: pagination.total,
    profitableTrades: trades.filter(t => t.isProfitable).length,
    losingTrades: trades.filter(t => !t.isProfitable).length,
    avgPnl: trades.length > 0
      ? trades.reduce((sum, t) => sum + t.pnl.realizedNet, 0) / trades.length
      : 0,
    totalPnl: trades.reduce((sum, t) => sum + t.pnl.realizedNet, 0),
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-dark-bg to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
            <BarChart3 className="mr-3 h-8 w-8 text-brand-blue" />
            Trading History Browser
          </h1>
          <p className="text-text-secondary">
            Complete trading history with 272+ trades • Real-time data from D1 database
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <div className="text-xs text-text-secondary mb-1">Total Trades</div>
            <div className="text-2xl font-bold text-blue-400">{stats.totalTrades}</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
            <div className="text-xs text-text-secondary mb-1">Profitable</div>
            <div className="text-2xl font-bold text-green-400">{stats.profitableTrades}</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
            <div className="text-xs text-text-secondary mb-1">Losing</div>
            <div className="text-2xl font-bold text-red-400">{stats.losingTrades}</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
            <div className="text-xs text-text-secondary mb-1">Avg P&L</div>
            <div className={`text-2xl font-bold ${stats.avgPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${stats.avgPnl.toFixed(2)}
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
            <div className="text-xs text-text-secondary mb-1">Total P&L</div>
            <div className={`text-2xl font-bold ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${stats.totalPnl.toFixed(2)}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Filter className="mr-2 h-5 w-5 text-brand-blue" />
              Filters & Sorting
            </h3>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Model Filter */}
            <div>
              <label className="text-sm text-text-secondary mb-2 block">AI Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-sm"
              >
                <option value="">All Models</option>
                {AI_MODELS.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>

            {/* Symbol Filter */}
            <div>
              <label className="text-sm text-text-secondary mb-2 block">Symbol</label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-sm"
              >
                <option value="">All Symbols</option>
                {SYMBOLS.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>

            {/* Side Filter */}
            <div>
              <label className="text-sm text-text-secondary mb-2 block">Side</label>
              <select
                value={selectedSide}
                onChange={(e) => setSelectedSide(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-sm"
              >
                <option value="">Both Sides</option>
                {SIDES.map(side => (
                  <option key={side} value={side}>{side.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="text-sm text-text-secondary mb-2 block">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-sm"
              >
                <option value="entry_time">Entry Time</option>
                <option value="realized_net_pnl">P&L</option>
                <option value="confidence">Confidence</option>
                <option value="leverage">Leverage</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="text-sm text-text-secondary mb-2 block">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-sm"
              >
                <option value="DESC">Descending</option>
                <option value="ASC">Ascending</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Trades Table */}
        <Card className="p-6 mb-6">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12 text-text-secondary">
                <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
                <p>Loading trades...</p>
              </div>
            ) : trades.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No trades found matching the filters</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-border">
                    <th className="text-left text-sm text-text-secondary font-medium py-3 px-2">Model</th>
                    <th className="text-left text-sm text-text-secondary font-medium py-3 px-2">Symbol</th>
                    <th className="text-left text-sm text-text-secondary font-medium py-3 px-2">Side</th>
                    <th className="text-right text-sm text-text-secondary font-medium py-3 px-2">Entry</th>
                    <th className="text-right text-sm text-text-secondary font-medium py-3 px-2">Exit</th>
                    <th className="text-right text-sm text-text-secondary font-medium py-3 px-2">P&L</th>
                    <th className="text-right text-sm text-text-secondary font-medium py-3 px-2">Duration</th>
                    <th className="text-center text-sm text-text-secondary font-medium py-3 px-2">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade.id} className="border-b border-dark-border/50 hover:bg-dark-bg/30 transition-colors">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getModelColor(trade.modelId) }}
                          />
                          <span className="text-sm text-white">{getModelName(trade.modelId)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <Badge variant="outline" className="text-xs">{trade.symbol}</Badge>
                      </td>
                      <td className="py-4 px-2">
                        <Badge
                          variant={trade.side === 'long' ? 'default' : 'secondary'}
                          className="text-xs capitalize"
                        >
                          {trade.side}
                        </Badge>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div className="text-sm text-white">${trade.entry.price.toFixed(2)}</div>
                        <div className="text-xs text-text-secondary">{formatTime(trade.entry.time)}</div>
                      </td>
                      <td className="py-4 px-2 text-right">
                        {trade.exit ? (
                          <>
                            <div className="text-sm text-white">${trade.exit.price.toFixed(2)}</div>
                            <div className="text-xs text-text-secondary">{formatTime(trade.exit.time)}</div>
                          </>
                        ) : (
                          <span className="text-xs text-yellow-400">Open</span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div className={`text-sm font-bold ${trade.isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.isProfitable ? '+' : ''}${trade.pnl.realizedNet.toFixed(2)}
                        </div>
                        <div className="text-xs text-text-secondary">
                          Fee: ${trade.pnl.totalCommission.toFixed(2)}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div className="text-sm text-white flex items-center justify-end">
                          <Clock className="h-3 w-3 mr-1 text-text-secondary" />
                          {formatDuration(trade.holdingPeriodMins)}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <div className="text-sm text-purple-400">{(trade.confidence * 100).toFixed(0)}%</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} trades
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={pagination.offset === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!pagination.hasMore}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
