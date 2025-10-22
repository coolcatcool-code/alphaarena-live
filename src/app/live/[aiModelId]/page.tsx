'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LiveIndicator } from '@/components/features/Live/LiveIndicator'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import type { AIDetailResponse } from '@/types'

export default function AIDetailPage() {
  const params = useParams()
  const router = useRouter()
  const aiModelId = params.aiModelId as string

  const [data, setData] = useState<AIDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/live/${aiModelId}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const result = await res.json()
      setData(result)
      setLastUpdate(new Date())
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch AI detail:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000) // Update every 1 minute
    return () => clearInterval(interval)
  }, [aiModelId])

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-dark-bg to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-dark-bg to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">AI Model not found</div>
          <Button onClick={() => router.push('/live')}>Back to Live</Button>
        </div>
      </main>
    )
  }

  const { aiModel, snapshot, positions, recentTrades, stats } = data
  const totalPositionPnL = positions.reduce((sum, p) => sum + p.pnl, 0)

  const formatTime = (date: string | Date) => {
    const d = new Date(date)
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-dark-bg to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" className="mb-4" onClick={() => router.push('/live')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Live
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: aiModel.color || '#888' }}
              />
              <div>
                <h1 className="text-4xl font-bold text-white">{aiModel.name}</h1>
                <p className="text-text-secondary mt-1">{aiModel.description}</p>
              </div>
            </div>
            <LiveIndicator lastUpdate={lastUpdate} />
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-text-muted text-sm mb-1">Rank</div>
            <div className="text-2xl font-bold text-white">#{snapshot.rank}</div>
          </Card>
          <Card className="p-4">
            <div className="text-text-muted text-sm mb-1">Total Assets</div>
            <div className="text-2xl font-bold text-white">
              ${snapshot.totalAssets.toLocaleString()}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-text-muted text-sm mb-1">P&L</div>
            <div className={`text-2xl font-bold ${snapshot.currentPnL >= 0 ? 'text-success' : 'text-danger'}`}>
              {snapshot.currentPnL >= 0 ? '+' : ''}{snapshot.currentPnL.toFixed(1)}%
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-text-muted text-sm mb-1">Win Rate</div>
            <div className="text-2xl font-bold text-white">
              {snapshot.winRate.toFixed(1)}%
            </div>
          </Card>
        </div>

        {/* Current Positions */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">
              Current Positions ({positions.length} open)
            </h2>
            {totalPositionPnL !== 0 && (
              <div className={`text-xl font-semibold ${totalPositionPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                Total: {totalPositionPnL >= 0 ? '+' : ''}${totalPositionPnL.toFixed(2)}
              </div>
            )}
          </div>

          {positions.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-text-muted">No open positions</div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {positions.map((pos) => (
                <Card key={pos.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{pos.symbol}</h3>
                        <Badge variant={pos.side === 'LONG' ? 'default' : 'destructive'}>
                          {pos.side}
                        </Badge>
                        <Badge variant="outline">{pos.leverage}x</Badge>
                      </div>
                      <div className="text-text-muted text-sm">
                        Opened {formatTime(pos.openedAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${pos.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                        {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                      </div>
                      <div className={`text-sm ${pos.pnlPercentage >= 0 ? 'text-success' : 'text-danger'}`}>
                        {pos.pnlPercentage >= 0 ? '+' : ''}{pos.pnlPercentage.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-text-muted">Entry Price</div>
                      <div className="text-white font-semibold">
                        ${pos.entryPrice.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-muted">Current Price</div>
                      <div className="text-white font-semibold">
                        ${pos.currentPrice.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-muted">Position Size</div>
                      <div className="text-white font-semibold">
                        ${pos.size.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Recent Trades */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Recent Trades</h2>
          <Card className="p-6">
            <div className="space-y-3">
              {recentTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-dark-bg"
                >
                  <div className="flex items-center gap-4">
                    {trade.action === 'BUY' ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-danger" />
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold">{trade.action}</span>
                        <span className="text-white">{trade.symbol}</span>
                        {trade.side && (
                          <Badge variant="outline" className="text-xs">
                            {trade.side}
                          </Badge>
                        )}
                        <span className="text-text-muted">@ ${trade.price.toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-text-muted">
                        {trade.leverage}x leverage, ${trade.amount.toLocaleString()} • {formatTime(trade.timestamp)}
                      </div>
                    </div>
                  </div>
                  {trade.pnl !== 0 && (
                    <div className={`text-right font-semibold ${trade.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Strategy Stats */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Strategy Analysis</h2>
          <Card className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-text-muted text-sm mb-1">Total Trades</div>
                <div className="text-xl font-bold text-white">{stats.totalTrades}</div>
              </div>
              <div>
                <div className="text-text-muted text-sm mb-1">Avg Hold Time</div>
                <div className="text-xl font-bold text-white">{stats.avgHoldTime}h</div>
              </div>
              <div>
                <div className="text-text-muted text-sm mb-1">Favorite Asset</div>
                <div className="text-xl font-bold text-white">{stats.favoriteAsset}</div>
              </div>
              <div>
                <div className="text-text-muted text-sm mb-1">Avg Leverage</div>
                <div className="text-xl font-bold text-white">{stats.avgLeverage}x</div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </main>
  )
}
