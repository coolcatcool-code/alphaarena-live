'use client'

import { useEffect, useState } from 'react'
import { Leaderboard } from '@/components/features/Leaderboard/Leaderboard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import { TrendingUp, TrendingDown, DollarSign, Activity, Target, Zap, BarChart3, Users } from 'lucide-react'
import type { LeaderboardResponse } from '@/types'

interface MarketStats {
  totalTrades: number
  totalVolume: number
  bestPerformer: string
  bestPerformance: number
  worstPerformer: string
  worstPerformance: number
  activeModels: number
  avgWinRate: number
}

interface RecentTrade {
  id: string
  modelId: string
  symbol: string
  side: string
  pnl: number
  timestamp: number
}

export function HomePageClient() {
  const { t } = useTranslation()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null)
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null)
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [leaderboardRes, statsRes, tradesRes] = await Promise.all([
          fetch('/api/leaderboard'),
          fetch('/api/stats/market'),
          fetch('/api/trades/recent?limit=5')
        ])
        
        const leaderboard = await leaderboardRes.json() as LeaderboardResponse
        setLeaderboardData(leaderboard)

        // If API doesn't exist, use mock data
        try {
          const stats = await statsRes.json() as MarketStats
          setMarketStats(stats)
        } catch {
          // Calculate stats based on leaderboard data
          if (leaderboard.data) {
            const stats = calculateStatsFromLeaderboard(leaderboard.data)
            setMarketStats(stats)
          }
        }

        try {
          const trades = await tradesRes.json() as { data: RecentTrade[] }
          setRecentTrades(trades.data || [])
        } catch {
          // Use mock data
          setRecentTrades([])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  const calculateStatsFromLeaderboard = (data: any[]) => {
    const totalTrades = data.reduce((sum, item) => sum + (item.totalTrades || 0), 0)
    const totalPnL = data.reduce((sum, item) => sum + (item.currentPnL || 0), 0)
    const best = data.reduce((max, item) => item.currentPnL > max.currentPnL ? item : max, data[0])
    const worst = data.reduce((min, item) => item.currentPnL < min.currentPnL ? item : min, data[0])
    
    return {
      totalTrades,
      totalVolume: Math.abs(totalPnL) * 100, // Estimate trading volume
      bestPerformer: best?.aiModel?.name || 'N/A',
      bestPerformance: best?.currentPnL || 0,
      worstPerformer: worst?.aiModel?.name || 'N/A',
      worstPerformance: worst?.currentPnL || 0,
      activeModels: data.length,
      avgWinRate: data.reduce((sum, item) => sum + (item.winRate || 0), 0) / data.length
    }
  }

  const topPerformer = leaderboardData?.data[0]?.currentPnL.toFixed(1) || '0'

  return (
    <main className="min-h-screen bg-gradient-to-b from-dark-bg to-slate-900">
      {/* Hero Section with Enhanced Stats */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            {t('home.title')}{' '}
            <span className="bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent">
              {t('home.titleHighlight')}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-3xl mx-auto">
            Real-time tracking of 6 top AI models' trading performance with quantitative analysis platform based on real market data
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a href="#leaderboard">
              <Button size="lg" className="w-full sm:w-auto">
                <Activity className="mr-2 h-5 w-5" />
                View Live Leaderboard
              </Button>
            </a>
            <Link href="/live">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Zap className="mr-2 h-5 w-5" />
                Live Trading Floor
              </Button>
            </Link>
            <Link href="/model-wallets">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Target className="mr-2 h-5 w-5" />
                Model Wallets
              </Button>
            </Link>
            <Link href="/analysis">
              <Button size="lg" variant="ghost" className="w-full sm:w-auto">
                <BarChart3 className="mr-2 h-5 w-5" />
                In-Depth Analysis
              </Button>
            </Link>
          </div>

          {/* Enhanced Market Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-6 w-6 text-blue-400" />
                <Badge variant="secondary" className="text-xs">LIVE</Badge>
              </div>
              <div className="text-3xl font-bold text-blue-400">{marketStats?.activeModels || 6}</div>
              <div className="text-sm text-text-secondary">AI Trading Models</div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-6 w-6 text-green-400" />
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-green-400">
                ${(marketStats?.totalVolume || 60000).toLocaleString()}
              </div>
              <div className="text-sm text-text-secondary">Total Trading Capital</div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-6 w-6 text-purple-400" />
                <Badge variant="outline" className="text-xs text-purple-400">TOP</Badge>
              </div>
              <div className="text-3xl font-bold text-purple-400">
                {topPerformer}%
              </div>
              <div className="text-sm text-text-secondary">Best Return Rate</div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-6 w-6 text-orange-400" />
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              </div>
              <div className="text-3xl font-bold text-orange-400">
                {marketStats?.totalTrades || 0}
              </div>
              <div className="text-sm text-text-secondary">Total Trades</div>
            </Card>
          </div>

          {/* Market Insights */}
          {marketStats && (
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <Card className="p-6 text-left">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-green-400" />
                  Market Performance Highlights
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Best Performing Model</span>
                    <div className="flex items-center">
                      <span className="text-green-400 font-semibold mr-2">
                        {marketStats.bestPerformer}
                      </span>
                      <Badge variant="secondary" className="text-green-400">
                        +{marketStats.bestPerformance.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Average Win Rate</span>
                    <span className="text-white font-semibold">
                      {marketStats.avgWinRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 text-left">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-blue-400" />
                  Live Trading Activity
                </h3>
                <div className="space-y-3">
                  {recentTrades.slice(0, 3).map((trade, index) => (
                    <div key={trade.id || index} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-text-secondary text-sm">
                          {trade.modelId || 'AI Model'} • {trade.symbol || 'BTC'}
                        </span>
                        <Badge 
                          variant={trade.side === 'long' ? 'default' : 'secondary'} 
                          className="ml-2 text-xs"
                        >
                          {trade.side || 'LONG'}
                        </Badge>
                      </div>
                      <span className={`font-semibold ${
                        (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(trade.pnl || 0) >= 0 ? '+' : ''}{(trade.pnl || 0).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                  {recentTrades.length === 0 && (
                    <div className="text-text-secondary text-sm">
                      No recent trading data available
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Enhanced Leaderboard Section */}
      <section id="leaderboard" className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            AI Trading Leaderboard
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <p className="text-text-secondary">
              Real-time updates • Refreshed every minute • Last updated:{' '}
              {leaderboardData?.timestamp
                ? new Date(leaderboardData.timestamp).toLocaleString()
                : '-'}
            </p>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <Badge variant="outline" className="text-green-400 border-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                Live Data
              </Badge>
              <Badge variant="secondary">
                Based on Real Trading
              </Badge>
            </div>
          </div>
        </div>
        
        {loading ? (
          <Leaderboard snapshots={[]} loading={true} />
        ) : (
          <Leaderboard snapshots={leaderboardData?.data || []} />
        )}
        
        <div className="text-center mt-8">
          <Link href="/live">
            <Button size="lg" className="mr-4">
              <Zap className="mr-2 h-5 w-5" />
              Enter Live Trading Floor
            </Button>
          </Link>
          <Link href="/analysis">
            <Button size="lg" variant="outline">
              <BarChart3 className="mr-2 h-5 w-5" />
              View Detailed Analysis
            </Button>
          </Link>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Real-Time Data Driven</h3>
            <p className="text-text-secondary">
              Based on real market data, updated every minute for AI model trading performance, providing the most accurate investment reference
            </p>
          </Card>

          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Professional Quantitative Analysis</h3>
            <p className="text-text-secondary">
              In-depth analysis of AI trading strategies, including risk indicators, return distribution, trading patterns and other professional data
            </p>
          </Card>

          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Investment Decision Support</h3>
            <p className="text-text-secondary">
              Through AI model performance comparison, help investors identify optimal strategies and reduce investment risks
            </p>
          </Card>
        </div>
      </section>
    </main>
  )
}
