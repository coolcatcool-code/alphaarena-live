'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Copy,
  ExternalLink,
  QrCode,
  CheckCircle,
  AlertCircle,
  Wallet,
  Shield,
  Activity,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BarChart
} from 'lucide-react'
import { toast } from 'sonner'
import type { LeaderboardResponse } from '@/types'

interface ModelAnalytics {
  totalTrades: number
  winRate: number
  avgPnl: number
  sharpeRatio: number
  bestTrade: number
  worstTrade: number
}

interface RecentTrade {
  id: string
  symbol: string
  side: string
  pnl: number
  entryTime: number
}

interface ModelMetadata {
  name: string
  walletAddress: string
  network: string
  description: string
  useCase: string
  status: 'active' | 'inactive' | 'maintenance'
  explorerUrl: string
  color: string
}

interface ModelCard {
  id: string
  name: string
  walletAddress: string
  network: string
  description: string
  useCase: string
  status: 'active' | 'inactive' | 'maintenance'
  explorerUrl: string
  color: string
  leaderboard?: {
    rank: number
    currentPnL: number
    totalAssets: number
    winRate: number
    openPositions: number
    timestamp: string
  }
}

const MODEL_METADATA: Record<string, ModelMetadata> = {
  'gpt-5': {
    name: 'GPT-5',
    walletAddress: '0x67293d914eafb26878534571add81f6bd2d9fe06',
    network: 'Hyperliquid',
    description: 'Advanced language model with superior reasoning capabilities',
    useCase: 'Complex trading strategies and market analysis',
    status: 'active',
    explorerUrl: 'https://coinglass.com/hyperliquid/',
    color: '#10B981'
  },
  'claude-sonnet-4-5': {
    name: 'Claude Sonnet 4.5',
    walletAddress: '0x59fa085d106541a834017b97060bcbbb0aa82869',
    network: 'Hyperliquid',
    description: "Anthropic's most capable model for nuanced understanding",
    useCase: 'Risk assessment and portfolio optimization',
    status: 'active',
    explorerUrl: 'https://coinglass.com/hyperliquid/',
    color: '#8B5CF6'
  },
  'gemini-2.5-pro': {
    name: 'Gemini 2.5 Pro',
    walletAddress: '0x1b7a7d099a670256207a30dd0ae13d35f278010f',
    network: 'Hyperliquid',
    description: "Google's multimodal AI with advanced reasoning",
    useCase: 'Multi-asset trading and cross-market analysis',
    status: 'active',
    explorerUrl: 'https://coinglass.com/hyperliquid/',
    color: '#F59E0B'
  },
  'grok-4': {
    name: 'Grok-4',
    walletAddress: '0x56d652e62998251b56c8398fb11fcfe464c08f84',
    network: 'Hyperliquid',
    description: "xAI's advanced model with real-time information processing",
    useCase: 'Real-time market analysis and news-driven trading',
    status: 'active',
    explorerUrl: 'https://coinglass.com/hyperliquid/',
    color: '#FF6B6B'
  },
  'deepseek-chat-v3.1': {
    name: 'DeepSeek Chat v3.1',
    walletAddress: '0xc20ac4dc4188660cbf555448af52694ca62b0734',
    network: 'Hyperliquid',
    description: 'High-performance model optimized for financial analysis',
    useCase: 'Algorithmic trading and market prediction',
    status: 'active',
    explorerUrl: 'https://coinglass.com/hyperliquid/',
    color: '#EF4444'
  },
  'qwen3-max': {
    name: 'Qwen3 Max',
    walletAddress: '0x7a8fd8bba33e37361ca6b0cb4518a44681bad2f3',
    network: 'Hyperliquid',
    description: "Alibaba's flagship model with exceptional performance",
    useCase: 'High-frequency trading and arbitrage strategies',
    status: 'active',
    explorerUrl: 'https://coinglass.com/hyperliquid/',
    color: '#06B6D4'
  }
}

const faqs = [
  {
    question: 'How do I verify wallet status?',
    answer: 'Click on any wallet address to view it on CoinGlass Hyperliquid explorer, where you can see transaction history, balance, and current status in real-time.'
  },
  {
    question: 'What network are these wallets on?',
    answer: 'All AI model wallets operate on Hyperliquid for maximum security and transparency.'
  },
  {
    question: 'How often are wallet addresses updated?',
    answer: 'Wallet addresses are permanent and don\'t change. However, we update the status and last activity information every 5 minutes.'
  },
  {
    question: 'Can I send funds to these addresses?',
    answer: 'These are AI trading model wallets. Do not send personal funds to these addresses as they are managed by automated trading systems.'
  },
  {
    question: 'What does each status mean?',
    answer: 'Active: Model is currently trading. Inactive: Model is paused. Maintenance: Model is being updated or serviced.'
  }
]

export default function ModelWalletsPage() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [showQR, setShowQR] = useState<string | null>(null)
  const [models, setModels] = useState<ModelCard[]>([])
  const [modelAnalytics, setModelAnalytics] = useState<Record<string, ModelAnalytics>>({})
  const [modelTrades, setModelTrades] = useState<Record<string, RecentTrade[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchModelData = async () => {
      try {
        const leaderboardRes = await fetch('/api/leaderboard')
        const leaderboardData = await leaderboardRes.json() as LeaderboardResponse

        const leaderboardModels: ModelCard[] = leaderboardData.data.map(entry => {
          const metadata = MODEL_METADATA[entry.aiModelId] ?? {
            name: entry.aiModel?.name || entry.aiModelId,
            walletAddress: 'N/A',
            network: 'Hyperliquid',
            description: entry.aiModel?.description || 'AI trading model',
            useCase: 'Autonomous trading',
            status: 'active' as const,
            explorerUrl: 'https://coinglass.com/hyperliquid/',
            color: entry.aiModel?.color || '#4B5563'
          }

          return {
            id: entry.aiModelId,
            name: entry.aiModel?.name || metadata.name,
            walletAddress: metadata.walletAddress,
            network: metadata.network,
            description: metadata.description,
            useCase: metadata.useCase,
            status: metadata.status,
            explorerUrl: metadata.explorerUrl,
            color: entry.aiModel?.color || metadata.color,
            leaderboard: {
              rank: entry.rank,
              currentPnL: entry.currentPnL,
              totalAssets: entry.totalAssets,
              winRate: entry.winRate,
              openPositions: entry.openPositions || 0,
              timestamp: new Date(entry.timestamp).toISOString()
            }
          }
        })

        const seen = new Set(leaderboardModels.map(model => model.id))
        Object.entries(MODEL_METADATA).forEach(([id, metadata]) => {
          if (!seen.has(id)) {
            leaderboardModels.push({
              id,
              name: metadata.name,
              walletAddress: metadata.walletAddress,
              network: metadata.network,
              description: metadata.description,
              useCase: metadata.useCase,
              status: metadata.status,
              explorerUrl: metadata.explorerUrl,
              color: metadata.color
            })
          }
        })

        setModels(leaderboardModels)

        const enrichmentResults = await Promise.all(
          leaderboardModels.map(async model => {
            try {
              const [analyticsRes, tradesRes] = await Promise.all([
                fetch(`/api/analytics/${model.id}`),
                fetch(`/api/trades/complete?model_id=${model.id}&limit=3&sort_by=entry_time&sort_order=DESC`)
              ])

              const analyticsJson = analyticsRes.ok
                ? await analyticsRes.json().catch(() => null)
                : null
              const tradesJson = tradesRes.ok
                ? await tradesRes.json().catch(() => null)
                : null

              const analytics: ModelAnalytics | undefined = analyticsJson?.data
                ? {
                    totalTrades: analyticsJson.data.trading?.totalTrades || 0,
                    winRate: (analyticsJson.data.winRate?.overall || 0) * 100,
                    avgPnl: analyticsJson.data.pnl?.avgNet || 0,
                    sharpeRatio: analyticsJson.data.risk?.sharpeRatio || 0,
                    bestTrade: analyticsJson.data.pnl?.biggestGain || 0,
                    worstTrade: analyticsJson.data.pnl?.biggestLoss || 0
                  }
                : undefined

              const trades: RecentTrade[] = Array.isArray(tradesJson?.data)
                ? tradesJson.data.map((trade: any) => ({
                    id: trade.id,
                    symbol: trade.symbol,
                    side: trade.side,
                    pnl: trade.pnl?.realizedNet ?? trade.pnl ?? 0,
                    entryTime: trade.entry?.time || trade.entryTime || 0
                  }))
                : []

              return { modelId: model.id, analytics, trades }
            } catch (error) {
              console.warn(`Failed to enrich model ${model.id}:`, error)
              return { modelId: model.id, analytics: undefined, trades: [] }
            }
          })
        )

        const analyticsMap: Record<string, ModelAnalytics> = {}
        const tradesMap: Record<string, RecentTrade[]> = {}

        enrichmentResults.forEach(result => {
          if (result.analytics) {
            analyticsMap[result.modelId] = result.analytics
          }
          tradesMap[result.modelId] = result.trades
        })

        setModelAnalytics(analyticsMap)
        setModelTrades(tradesMap)
      } catch (error) {
        console.error('Error fetching model data:', error)
        toast.error('Failed to load live analytics. Displaying wallet metadata only.')
      } finally {
        setLoading(false)
      }
    }

    fetchModelData()
  }, [])

  const copyToClipboard = async (address: string, modelName: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(address)
      toast.success(`${modelName} wallet address copied!`)
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (err) {
      toast.error('Failed to copy address')
    }
  }

  const openExplorer = (model: AIModel) => {
    window.open(`${model.explorerUrl}${model.walletAddress}`, '_blank')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'maintenance':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />
      default:
        return <AlertCircle className="h-4 w-4 text-red-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'maintenance':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      default:
        return 'bg-red-500/10 text-red-400 border-red-500/20'
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleString()
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-dark-bg to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center">
            <Wallet className="mr-4 h-10 w-10 text-brand-blue" />
            AI Model Wallets
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-6">
            Real-time blockchain wallet addresses for all 6 AI trading models. Monitor transactions, 
            verify status, and track performance on Hyperliquid.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="outline" className="text-green-400 border-green-400">
              <Activity className="mr-2 h-4 w-4" />
              Live Status Monitoring
            </Badge>
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              <Shield className="mr-2 h-4 w-4" />
              Hyperliquid
            </Badge>
            <Badge variant="outline" className="text-purple-400 border-purple-400">
              <CheckCircle className="mr-2 h-4 w-4" />
              Verified Addresses
            </Badge>
          </div>
        </div>

        {!loading && models.length === 0 && (
          <Card className="p-6 mb-12 text-center border-dark-border bg-dark-card">
            <p className="text-text-secondary">
              Wallet metadata is unavailable at the moment. Please check back shortly once the sync completes.
            </p>
          </Card>
        )}

        {/* Model Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {models.map((model) => {
            const analytics = modelAnalytics[model.id]
            const trades = modelTrades[model.id] ?? []
            const leaderboard = model.leaderboard

            return (
              <Card key={model.id} className="p-6 hover:shadow-lg transition-all duration-300 bg-dark-card border-dark-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: model.color }}
                  />
                  <h3 className="text-xl font-bold text-white">{model.name}</h3>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(model.status)}
                  <Badge className={`ml-2 text-xs ${getStatusColor(model.status)}`}>
                    {model.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <p className="text-text-secondary text-sm mb-3">{model.description}</p>
              
              <div className="bg-dark-bg/50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-secondary">Wallet Address</span>
                  <span className="text-xs text-text-secondary">{model.network}</span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-sm text-white font-mono">
                    {formatAddress(model.walletAddress)}
                  </code>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(model.walletAddress, model.name)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedAddress === model.walletAddress ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openExplorer(model)}
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Use Case:</span>
                  <span className="text-white text-right">{model.useCase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Last Updated:</span>
                  <span className="text-white">{formatTime(leaderboard?.timestamp)}</span>
                </div>
              </div>

              {leaderboard && (
                <div className="mt-4 pt-4 border-t border-dark-border">
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                    <Activity className="mr-2 h-4 w-4 text-brand-blue" />
                    Latest Snapshot
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-dark-bg/30 rounded p-2">
                      <div className="text-xs text-text-secondary">Rank</div>
                      <div className="text-lg font-bold text-white">#{leaderboard.rank}</div>
                    </div>
                    <div className="bg-dark-bg/30 rounded p-2">
                      <div className="text-xs text-text-secondary">Total Assets</div>
                      <div className="text-lg font-bold text-white">
                        ${leaderboard.totalAssets.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div className="bg-dark-bg/30 rounded p-2">
                      <div className="text-xs text-text-secondary">Return</div>
                      <div className={`text-lg font-bold ${leaderboard.currentPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {leaderboard.currentPnL >= 0 ? '+' : ''}{leaderboard.currentPnL.toFixed(2)}%
                      </div>
                    </div>
                    <div className="bg-dark-bg/30 rounded p-2">
                      <div className="text-xs text-text-secondary">Win Rate</div>
                      <div className="text-lg font-bold text-purple-400">{leaderboard.winRate.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              {analytics && (
                <div className="mt-4 pt-4 border-t border-dark-border">
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                    <BarChart className="mr-2 h-4 w-4 text-brand-blue" />
                    Performance Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-dark-bg/30 rounded p-2">
                      <div className="text-xs text-text-secondary">Total Trades</div>
                      <div className="text-lg font-bold text-white">{analytics.totalTrades}</div>
                    </div>
                    <div className="bg-dark-bg/30 rounded p-2">
                      <div className="text-xs text-text-secondary">Win Rate</div>
                      <div className="text-lg font-bold text-green-400">{analytics.winRate.toFixed(1)}%</div>
                    </div>
                    <div className="bg-dark-bg/30 rounded p-2">
                      <div className="text-xs text-text-secondary">Avg P&L</div>
                      <div className={`text-lg font-bold ${analytics.avgPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${analytics.avgPnl.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-dark-bg/30 rounded p-2">
                      <div className="text-xs text-text-secondary">Sharpe Ratio</div>
                      <div className="text-lg font-bold text-purple-400">{analytics.sharpeRatio.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Trades */}
              {trades.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dark-border">
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                    <Activity className="mr-2 h-4 w-4 text-brand-blue" />
                    Recent Trades
                  </h4>
                  <div className="space-y-2">
                    {trades.map((trade) => (
                      <div key={trade.id} className="flex justify-between items-center bg-dark-bg/30 rounded p-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={trade.side === 'long' ? 'default' : 'secondary'} className="text-xs">
                            {trade.symbol}
                          </Badge>
                          <span className="text-xs text-text-secondary capitalize">{trade.side}</span>
                        </div>
                        <span className={`text-sm font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div className="mt-4 pt-4 border-t border-dark-border text-center">
                  <div className="text-xs text-text-secondary">Loading performance data...</div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openExplorer(model)}
                  className="flex-1"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Explorer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQR(showQR === model.id ? null : model.id)}
                  className="px-3"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>

              {showQR === model.id && (
                <div className="mt-4 p-4 bg-white rounded-lg text-center">
                  <div className="text-black text-xs mb-2">QR Code for {model.name}</div>
                  <div className="bg-gray-200 h-32 flex items-center justify-center text-gray-600 text-sm">
                    QR Code: {formatAddress(model.walletAddress)}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {models.filter(m => m.status === 'active').length}
            </div>
            <div className="text-sm text-text-secondary">Active Models</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {models.length}
            </div>
            <div className="text-sm text-text-secondary">Total Models</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">1</div>
            <div className="text-sm text-text-secondary">Network</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-400 mb-1">24/7</div>
            <div className="text-sm text-text-secondary">Monitoring</div>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <HelpCircle className="mr-3 h-6 w-6 text-brand-blue" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-dark-border pb-4">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
                  {expandedFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-text-secondary" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-text-secondary" />
                  )}
                </button>
                {expandedFaq === index && (
                  <p className="mt-3 text-text-secondary">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Security Notice */}
        <Card className="p-6 mt-8 bg-yellow-500/10 border-yellow-500/20">
          <div className="flex items-start">
            <Shield className="h-6 w-6 text-yellow-400 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Security Notice</h3>
              <p className="text-text-secondary">
                These wallet addresses are managed by automated AI trading systems. 
                Do not send personal funds to these addresses. Always verify addresses 
                on CoinGlass Hyperliquid explorer before any transactions.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
