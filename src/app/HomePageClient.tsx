'use client'

import { useEffect, useState } from 'react'
import { Leaderboard } from '@/components/features/Leaderboard/Leaderboard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import type { LeaderboardResponse } from '@/types'

export function HomePageClient() {
  const { t } = useTranslation()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/leaderboard')
        const data = await res.json() as LeaderboardResponse
        setLeaderboardData(data)
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchData()

    // Refresh every 1 minute (60000ms)
    const interval = setInterval(fetchData, 60000)

    return () => clearInterval(interval)
  }, [])

  const topPerformer = leaderboardData?.data[0]?.currentPnL.toFixed(1) || '0'

  return (
    <main className="min-h-screen bg-gradient-to-b from-dark-bg to-slate-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            {t('home.title')}{' '}
            <span className="bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent">
              {t('home.titleHighlight')}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            {t('home.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#leaderboard">
              <Button size="lg" className="w-full sm:w-auto">
                {t('home.viewLeaderboard')}
              </Button>
            </a>
            <Link href="/analysis">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t('home.readAnalysis')}
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            <div className="bg-dark-card p-4 rounded-lg border border-dark-border">
              <div className="text-3xl font-bold text-brand-blue">6</div>
              <div className="text-sm text-text-secondary mt-1">
                {t('home.stats.aiModels')}
              </div>
            </div>
            <div className="bg-dark-card p-4 rounded-lg border border-dark-border">
              <div className="text-3xl font-bold text-brand-purple">$60K</div>
              <div className="text-sm text-text-secondary mt-1">
                {t('home.stats.totalCapital')}
              </div>
            </div>
            <div className="bg-dark-card p-4 rounded-lg border border-dark-border">
              <div className="text-3xl font-bold text-success">
                {topPerformer}%
              </div>
              <div className="text-sm text-text-secondary mt-1">
                {t('home.stats.topPerformer')}
              </div>
            </div>
            <div className="bg-dark-card p-4 rounded-lg border border-dark-border">
              <div className="text-3xl font-bold text-text-primary">
                {t('home.stats.liveData')}
              </div>
              <div className="text-sm text-text-secondary mt-1">Real-time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section id="leaderboard" className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {t('home.leaderboard.title')}
          </h2>
          <p className="text-text-secondary">
            {t('home.leaderboard.updatedEvery')} • {t('home.leaderboard.lastUpdate')}:{' '}
            {leaderboardData?.timestamp
              ? new Date(leaderboardData.timestamp).toLocaleString()
              : '-'}
          </p>
        </div>
        {loading ? (
          <Leaderboard snapshots={[]} loading={true} />
        ) : (
          <Leaderboard snapshots={leaderboardData?.data || []} />
        )}
      </section>

      {/* About Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-dark-card p-8 rounded-lg border border-dark-border">
          <h2 className="text-2xl font-bold text-white mb-4">
            {t('home.about.title')}
          </h2>
          <p className="text-text-secondary mb-4">
            {t('home.about.description')}
          </p>
          <p className="text-text-secondary mb-4">
            {t('home.about.features')}
          </p>
          <div className="flex gap-4 mt-6">
            <Link href="/analysis">
              <Button variant="outline">
                {t('home.about.readFullAnalysis')}
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="ghost">
                {t('home.about.learnMore')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
