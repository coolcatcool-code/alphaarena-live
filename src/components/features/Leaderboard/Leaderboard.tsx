'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import type { AISnapshot } from '@/types'

interface LeaderboardProps {
  snapshots: AISnapshot[]
  loading?: boolean
}

export function Leaderboard({ snapshots, loading = false }: LeaderboardProps) {
  const sortedData = [...snapshots].sort((a, b) => a.rank - b.rank)

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="grid gap-4">
      {sortedData.map((snapshot, index) => (
        <LeaderboardCard
          key={snapshot.id}
          snapshot={snapshot}
          index={index}
        />
      ))}
    </div>
  )
}

interface LeaderboardCardProps {
  snapshot: AISnapshot
  index: number
}

function LeaderboardCard({ snapshot, index }: LeaderboardCardProps) {
  const { t } = useTranslation()

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          gradient: 'from-yellow-500/10 to-yellow-600/10',
          border: 'border-yellow-500/50',
          text: 'text-yellow-500',
          icon: '🥇'
        }
      case 2:
        return {
          gradient: 'from-gray-400/10 to-gray-500/10',
          border: 'border-gray-400/50',
          text: 'text-gray-400',
          icon: '🥈'
        }
      case 3:
        return {
          gradient: 'from-orange-500/10 to-orange-600/10',
          border: 'border-orange-600/50',
          text: 'text-orange-600',
          icon: '🥉'
        }
      default:
        return {
          gradient: '',
          border: 'border-dark-border',
          text: 'text-gray-500',
          icon: ''
        }
    }
  }

  const rankStyle = getRankStyle(snapshot.rank)
  const pnlPositive = snapshot.currentPnL >= 0

  return (
    <Card
      className={`p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-r ${rankStyle.gradient} ${rankStyle.border}`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* 左侧：排名 + AI信息 */}
        <div className="flex items-center gap-4">
          {/* 排名 */}
          <div className="flex flex-col items-center min-w-[60px]">
            <div className={`text-4xl font-bold ${rankStyle.text}`}>
              #{snapshot.rank}
            </div>
            {rankStyle.icon && (
              <span className="text-2xl mt-1">{rankStyle.icon}</span>
            )}
          </div>

          {/* AI信息 */}
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-text-primary">
              {snapshot.aiModel.name}
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              {snapshot.aiModel.description}
            </p>

            {/* PnL和排名变化 */}
            <div className="flex gap-2 mt-2">
              <Badge
                variant={pnlPositive ? 'default' : 'destructive'}
                className="font-mono"
              >
                {pnlPositive ? '+' : ''}{snapshot.currentPnL.toFixed(2)}%
              </Badge>

              {snapshot.rankChange !== 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {snapshot.rankChange > 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-green-500">
                        {snapshot.rankChange}
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3 h-3 text-red-500" />
                      <span className="text-red-500">
                        {Math.abs(snapshot.rankChange)}
                      </span>
                    </>
                  )}
                </Badge>
              )}

              {snapshot.rankChange === 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Minus className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-500">0</span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：数据指标 */}
        <div className="grid grid-cols-3 gap-4 md:gap-6 text-center md:text-right">
          <div>
            <p className="text-xs md:text-sm text-text-secondary">
              {t('leaderboard.totalAssets')}
            </p>
            <p className="text-lg md:text-xl font-semibold text-text-primary font-mono">
              ${snapshot.totalAssets.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs md:text-sm text-text-secondary">
              {t('leaderboard.positions')}
            </p>
            <p className="text-lg md:text-xl font-semibold text-text-primary">
              {snapshot.openPositions}
            </p>
          </div>

          <div>
            <p className="text-xs md:text-sm text-text-secondary">
              {t('leaderboard.winRate')}
            </p>
            <p className="text-lg md:text-xl font-semibold text-text-primary">
              {snapshot.winRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* 底部：时间戳 */}
      <div className="mt-4 pt-4 border-t border-dark-border">
        <p className="text-xs text-text-muted">
          {t('leaderboard.lastUpdated')}: {new Date(snapshot.timestamp).toLocaleString()}
        </p>
      </div>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-700 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-1/4" />
              <div className="h-3 bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
