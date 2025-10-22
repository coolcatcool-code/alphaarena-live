'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LiveIndicator } from '@/components/features/Live/LiveIndicator'
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react'
import type { AISnapshot, Position, Trade, LeaderboardResponse } from '@/types'

export default function LivePage() {
  const [leaderboard, setLeaderboard] = useState<AISnapshot[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [liveTrades, setLiveTrades] = useState<Trade[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [leaderboardRes, positionsRes, tradesRes] = await Promise.all([
        fetch('/api/leaderboard'),
        fetch('/api/positions'),
        fetch('/api/trades/live'),
      ])

      const leaderboardData: LeaderboardResponse = await leaderboardRes.json()
      const positionsData = await positionsRes.json()
      const tradesData = await tradesRes.json()

      setLeaderboard(leaderboardData.data)
      setPositions(positionsData.data)
      setLiveTrades(tradesData.data)
      setLastUpdate(new Date())
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch live data:', error)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000) // Update every 1 minute
    return () => clearInterval(interval)
  }, [])

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

  return (
    <main className="min-h-screen bg-gradient-to-b from-dark-bg to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Live Trading Dashboard
            </h1>
            <p className="text-text-secondary">
              Real-time positions and trading activity from all 6 AI models
            </p>
          </div>
          <LiveIndicator lastUpdate={lastUpdate} />
        </div>

        {/* Compact Leaderboard */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Real-time Rankings</h2>
          <Card className="p-6">
            <div className="space-y-3">
              {leaderboard.map((ai) => (
                <Link key={ai.id} href={`/live/${ai.aiModelId}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-dark-bg transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-text-muted w-8">
                        {ai.rank}
                      </span>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ai.aiModel.color || '#888' }}
                        />
                        <span className="text-white font-semibold">{ai.aiModel.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${ai.currentPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                          {ai.currentPnL >= 0 ? '+' : ''}{ai.currentPnL.toFixed(1)}%
                        </div>
                        <div className="text-sm text-text-muted">
                          ${ai.totalAssets.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {ai.rankChange > 0 ? (
                          <ArrowUpRight className="w-4 h-4 text-success" />
                        ) : ai.rankChange < 0 ? (
                          <ArrowDownRight className="w-4 h-4 text-danger" />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </section>

        {/* Open Positions Summary */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Open Positions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaderboard.slice(0, 6).map((ai) => {
              const aiPositions = positionsByAI[ai.aiModelId] || []
              const totalPnL = aiPositions.reduce((sum, p) => sum + p.pnl, 0)

              return (
                <Link key={ai.aiModelId} href={`/live/${ai.aiModelId}`}>
                  <Card className="p-5 hover:border-brand-blue transition-colors cursor-pointer h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: ai.aiModel.color || '#888' }}
                        />
                        <h3 className="font-bold text-white">{ai.aiModel.name}</h3>
                      </div>
                      <Badge variant={totalPnL >= 0 ? 'default' : 'destructive'}>
                        {aiPositions.length} open
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {aiPositions.slice(0, 3).map((pos) => (
                        <div key={pos.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-text-secondary">{pos.symbol}</span>
                            <Badge variant="outline" className="text-xs">
                              {pos.side}
                            </Badge>
                          </div>
                          <span className={pos.pnl >= 0 ? 'text-success' : 'text-danger'}>
                            {pos.pnl >= 0 ? '+' : ''}{pos.pnlPercentage.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                      {aiPositions.length === 0 && (
                        <div className="text-text-muted text-sm italic">No open positions</div>
                      )}
                    </div>
                    {totalPnL !== 0 && (
                      <div className="mt-4 pt-4 border-t border-dark-border flex justify-between items-center">
                        <span className="text-text-secondary text-sm">Total P&L</span>
                        <span className={`font-semibold ${totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                          ${totalPnL.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Live Trade Feed */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Live Trade Feed</h2>
          <Card className="p-6">
            <div className="space-y-3">
              {liveTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-dark-bg hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {trade.action === 'BUY' ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-danger" />
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="font-semibold"
                          style={{ color: trade.aiModel.color || '#fff' }}
                        >
                          {trade.aiModel.name}
                        </span>
                        <span className="text-text-secondary">{trade.action}</span>
                        <span className="text-white font-semibold">{trade.symbol}</span>
                        <span className="text-text-muted">@ ${trade.price.toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-text-muted">
                        {trade.leverage}x leverage, ${trade.amount.toLocaleString()} • {formatTime(trade.timestamp)}
                      </div>
                    </div>
                  </div>
                  {trade.pnl !== 0 && (
                    <div className={`text-right ${trade.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                      <div className="font-semibold">
                        {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </main>
  )
}
