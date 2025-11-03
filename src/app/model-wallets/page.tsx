'use client'

import { useEffect, useMemo, useState } from 'react'
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
  ChevronUp
} from 'lucide-react'
import { toast } from 'sonner'
import type {
  LeaderboardResponse,
  NOF1ModelAnalyticsResponse,
  NOF1TradesResponse
} from '@/types'

interface ModelMetadata {
  id: string
  name: string
  walletAddress: string
  network: string
  description: string
  useCase: string
  status: 'active' | 'inactive' | 'maintenance'
  explorerUrl: string
  color: string
}

interface ModelView extends ModelMetadata {
  leaderboard?: {
    rank: number
    currentPnL: number
    totalAssets: number
    winRate: number
    openPositions: number
    timestamp: string
  }
  analytics?: {
    totalTrades: number
    winRate: number
    avgNetPnl: number
    sharpeRatio: number
    bestTrade: number
    worstTrade: number
  }
  recentTrades: Array<{
    id: string
    symbol: string
    side: string
    pnl: number
    entryTime: number
  }>
}

const MODEL_METADATA: Record<string, ModelMetadata> = {
  'gpt-5': {
    id: 'gpt-5',
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
    id: 'claude-sonnet-4-5',
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
    id: 'gemini-2.5-pro',
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
    id: 'grok-4',
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
    id: 'deepseek-chat-v3.1',
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
    id: 'qwen3-max',
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

const FAQS = [
  {
    question: '如何验证钱包状态？',
    answer:
      '点击任意钱包地址即可跳转到 CoinGlass Hyperliquid 浏览器，实时查看交易历史、余额以及当前状态。'
  },
  {
    question: '这些钱包部署在哪个网络？',
    answer: '所有 AI 交易模型的钱包均运行在 Hyperliquid 网络，确保透明与安全。'
  },
  {
    question: '钱包地址多久更新一次？',
    answer: '钱包地址为固定值；我们会每 5 分钟同步最新状态、余额以及相关指标。'
  },
  {
    question: '可以向这些地址转账吗？',
    answer: '这些地址由自动化算法托管，请勿汇入个人资金。如需交互，请先在浏览器中完成验证。'
  }
]

const formatUsd = (value: number | null | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(value)
}

const formatPercentage = (value: number | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `${value.toFixed(2)}%`
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      console.warn(`Request failed: ${url} -> ${res.status}`)
      return null
    }
    return (await res.json()) as T
  } catch (error) {
    console.warn(`Request error: ${url}`, error)
    return null
  }
}

const toIsoTimestamp = (value: unknown) => {
  try {
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'number') {
      const millis = value > 10_000_000_000 ? value : value * 1000
      return new Date(millis).toISOString()
    }
    if (typeof value === 'string') {
      const parsed = new Date(value)
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
    }
  } catch {
    // ignore
  }
  return new Date().toISOString()
}

function buildInitialModels(leaderboard?: LeaderboardResponse): ModelView[] {
  const list: ModelView[] = []

  const leaderboardMap = new Map<string, LeaderboardResponse['data'][number]>()
  if (leaderboard?.data) {
    leaderboard.data.forEach(entry => {
      leaderboardMap.set(entry.aiModelId, entry)
    })
  }

  Object.values(MODEL_METADATA).forEach(metadata => {
    const board = leaderboardMap.get(metadata.id)
    list.push({
      ...metadata,
      leaderboard: board
        ? {
            rank: board.rank ?? 0,
            currentPnL: board.currentPnL ?? 0,
            totalAssets: board.totalAssets ?? 0,
            winRate: board.winRate ?? 0,
            openPositions: board.openPositions ?? 0,
            timestamp: toIsoTimestamp(board.timestamp)
          }
        : undefined,
      analytics: undefined,
      recentTrades: []
    })
  })

  return list
}

export default function ModelWalletsPage() {
  const [models, setModels] = useState<ModelView[]>(() => buildInitialModels())
  const [loading, setLoading] = useState(true)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [expandedQr, setExpandedQr] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const leaderboard = await fetchJson<LeaderboardResponse>('/api/leaderboard')
      if (cancelled) return

      const baseModels = buildInitialModels(leaderboard ?? undefined)

      const enriched = await Promise.all(
        baseModels.map(async model => {
          const [analytics, trades] = await Promise.all([
            fetchJson<NOF1ModelAnalyticsResponse>(`/api/analytics/${model.id}`),
            fetchJson<NOF1TradesResponse>(
              `/api/trades/complete?model_id=${model.id}&limit=3&sort_by=entry_time&sort_order=DESC`
            )
          ])

          if (cancelled) return model

          let analyticsData: ModelView['analytics'] = undefined
          if (analytics) {
            const totalTrades = analytics.total_trades ?? 0
            const bestTrade = analytics.recent_trades?.length
              ? Math.max(
                  ...analytics.recent_trades.map(trade => trade.realized_net_pnl ?? 0)
                )
              : 0
            const worstTrade = analytics.recent_trades?.length
              ? Math.min(
                  ...analytics.recent_trades.map(trade => trade.realized_net_pnl ?? 0)
                )
              : 0

            analyticsData = {
              totalTrades,
              winRate: (analytics.win_rate ?? 0) * 100,
              avgNetPnl:
                totalTrades > 0 && typeof analytics.total_pnl === 'number'
                  ? analytics.total_pnl / totalTrades
                  : analytics.total_pnl ?? 0,
              sharpeRatio: analytics.sharpe_ratio ?? 0,
              bestTrade,
              worstTrade
            }
          }

          const recentTrades =
            trades?.trades?.slice(0, 3).map(trade => {
              const pnlValue =
                trade.realized_net_pnl ??
                trade.realized_gross_pnl ??
                trade.unrealized_pnl ??
                0
              return {
                id: trade.id ?? `${model.id}-${trade.entry_time ?? 0}`,
                symbol: trade.symbol ?? '—',
                side: trade.side?.toLowerCase() ?? '',
                pnl: pnlValue,
                entryTime: trade.entry_time ?? 0
              }
            }) ?? []

          return {
            ...model,
            analytics: analyticsData,
            recentTrades
          }
        })
      )

      if (!cancelled) {
        setModels(enriched)
        setLoading(false)
        setLastUpdated(new Date().toLocaleString())
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const quickStats = useMemo(() => {
    const active = models.filter(m => m.status === 'active').length
    const total = models.length
    const avgWinRate =
      models.reduce((acc, model) => acc + (model.leaderboard?.winRate ?? 0), 0) /
      (models.length || 1)
    const totalAssets = models.reduce(
      (acc, model) => acc + (model.leaderboard?.totalAssets ?? 0),
      0
    )

    return [
      { label: '活跃模型', value: active },
      { label: '总模型数', value: total },
      { label: '平均胜率', value: `${avgWinRate.toFixed(1)}%` },
      { label: '托管资产', value: formatUsd(totalAssets) }
    ]
  }, [models])

  const copyAddress = async (address: string, modelName: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(address)
      toast.success(`${modelName} 钱包地址已复制`)
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (error) {
      console.error('Failed to copy address', error)
      toast.error('复制失败，请重试')
    }
  }

  const openExplorer = (model: ModelMetadata) => {
    window.open(`${model.explorerUrl}${model.walletAddress}`, '_blank', 'noopener')
  }

  const formatAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(address.length - 4)}`

  return (
    <main className="min-h-screen bg-gradient-to-b from-dark-bg to-slate-900">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center">
            <Wallet className="mr-4 h-10 w-10 text-brand-blue" />
            AI 模型链上钱包
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-6">
            查看 Alpha Arena 六大 AI 交易模型的链上地址与实时表现，支持 Hyperliquid
            浏览器验证与链上追踪。
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="outline" className="text-green-400 border-green-400">
              <Activity className="mr-2 h-4 w-4" />
              实时状态
            </Badge>
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              <Shield className="mr-2 h-4 w-4" />
              Hyperliquid
            </Badge>
            <Badge variant="outline" className="text-purple-400 border-purple-400">
              <CheckCircle className="mr-2 h-4 w-4" />
              已验证地址
            </Badge>
          </div>
          {lastUpdated && (
            <div className="mt-4 text-sm text-text-muted">最近同步：{lastUpdated}</div>
          )}
        </div>

        {loading && models.length === 0 ? (
          <Card className="p-6 mb-12 text-center border-dark-border bg-dark-card">
            <p className="text-text-secondary">正在加载模型链上信息，请稍候…</p>
          </Card>
        ) : null}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {models.map(model => (
            <Card
              key={model.id}
              className="p-6 bg-dark-card border-dark-border hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span
                    aria-hidden
                    className="mr-3 inline-block h-4 w-4 rounded-full"
                    style={{ backgroundColor: model.color }}
                  />
                  <div>
                    <h2 className="text-xl font-semibold text-white">{model.name}</h2>
                    <p className="text-xs text-text-secondary">{model.useCase}</p>
                  </div>
                </div>
                <Badge
                  className="text-xs"
                  variant="outline"
                  style={{ borderColor: model.color, color: model.color }}
                >
                  {model.status === 'active'
                    ? 'ACTIVE'
                    : model.status === 'maintenance'
                    ? 'MAINTENANCE'
                    : 'INACTIVE'}
                </Badge>
              </div>

              <p className="text-sm text-text-secondary mb-4">{model.description}</p>

              <div className="rounded-lg bg-dark-bg/60 p-4 mb-4">
                <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                  <span>钱包地址</span>
                  <span>{model.network}</span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="font-mono text-sm text-white">
                    {formatAddress(model.walletAddress)}
                  </code>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => copyAddress(model.walletAddress, model.name)}
                    >
                      {copiedAddress === model.walletAddress ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4 text-text-secondary" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => setExpandedQr(expandedQr === model.id ? null : model.id)}
                    >
                      <QrCode className="h-4 w-4 text-text-secondary" />
                    </Button>
                  </div>
                </div>
              </div>

              {expandedQr === model.id && (
                <div className="mb-4 rounded-lg bg-white p-4 text-center text-sm text-black">
                  {/* TODO: replace with actual QR rendering when asset is ready */}
                  <div className="mb-2 font-medium">QR Code for {model.name}</div>
                  <div className="flex h-32 items-center justify-center rounded bg-gray-200 text-gray-600">
                    {formatAddress(model.walletAddress)}
                  </div>
                </div>
              )}

              {model.leaderboard ? (
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div>
                    <div className="text-text-secondary">资产规模</div>
                    <div className="font-semibold text-white">
                      {formatUsd(model.leaderboard.totalAssets)}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-secondary">胜率</div>
                    <div className="font-semibold text-white">
                      {formatPercentage(model.leaderboard.winRate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-secondary">当前收益</div>
                    <div className="font-semibold text-white">
                      {formatUsd(model.leaderboard.currentPnL)}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-secondary">持仓数量</div>
                    <div className="font-semibold text-white">
                      {model.leaderboard.openPositions}
                    </div>
                  </div>
                </div>
              ) : null}

              {model.analytics ? (
                <div className="rounded-lg border border-dark-border p-3 mb-4 text-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-white">表现速览</span>
                    <Badge variant="outline" className="text-xs text-text-secondary">
                      {model.analytics.totalTrades} 次交易
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                    <div>
                      胜率
                      <div className="text-base font-semibold text-white">
                        {formatPercentage(model.analytics.winRate)}
                      </div>
                    </div>
                    <div>
                      平均净收益
                      <div className="text-base font-semibold text-white">
                        {formatUsd(model.analytics.avgNetPnl)}
                      </div>
                    </div>
                    <div>
                      最佳交易
                      <div className="text-base font-semibold text-green-400">
                        {formatUsd(model.analytics.bestTrade)}
                      </div>
                    </div>
                    <div>
                      最差交易
                      <div className="text-base font-semibold text-red-400">
                        {formatUsd(model.analytics.worstTrade)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {model.recentTrades.length > 0 ? (
                <div className="mb-4 rounded-lg border border-dark-border p-3">
                  <div className="mb-2 text-sm font-semibold text-white">最近交易</div>
                  <div className="space-y-2 text-xs">
                    {model.recentTrades.map(trade => (
                      <div
                        key={trade.id}
                        className="flex items-center justify-between rounded bg-dark-bg/40 px-2 py-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant={trade.side === 'long' ? 'default' : 'secondary'}>
                            {trade.symbol}
                          </Badge>
                          <span className="capitalize text-text-secondary">{trade.side}</span>
                        </div>
                        <span
                          className={`font-semibold ${
                            trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {formatUsd(trade.pnl)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openExplorer(model)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  链上浏览器
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-12">
          {quickStats.map(stat => (
            <Card key={stat.label} className="p-6 text-center bg-dark-card border-dark-border">
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-text-secondary">{stat.label}</div>
            </Card>
          ))}
        </div>

        <Card className="p-8 bg-dark-card border-dark-border">
          <h2 className="mb-6 flex items-center text-2xl font-bold text-white">
            <HelpCircle className="mr-3 h-6 w-6 text-brand-blue" />
            常见问题
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const expanded = expandedFaq === index
              return (
                <div key={faq.question} className="border-b border-dark-border pb-4">
                  <button
                    className="flex w-full items-center justify-between text-left text-white"
                    onClick={() => setExpandedFaq(expanded ? null : index)}
                  >
                    <span className="text-lg font-semibold">{faq.question}</span>
                    {expanded ? (
                      <ChevronUp className="h-5 w-5 text-text-secondary" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-text-secondary" />
                    )}
                  </button>
                  {expanded ? (
                    <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                      {faq.answer}
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="mt-8 bg-yellow-500/10 p-6 text-yellow-400 border border-yellow-500/20">
          <div className="flex items-start gap-3">
            <Shield className="mt-1 h-6 w-6" />
            <div>
              <h3 className="mb-2 text-lg font-semibold">安全提示</h3>
              <p className="text-sm text-yellow-100/80">
                这些地址由自动化 AI 交易系统托管。请勿向上述地址转入个人资金；如需交互，请务必先在
                Hyperliquid 浏览器中完成验证。
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
