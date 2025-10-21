'use client'

import { ArticleCard } from '@/components/features/Articles/ArticleCard'
import { useTranslation } from '@/hooks/useTranslation'
import type { Article } from '@/types'

interface AnalysisPageClientProps {
  articles: Article[]
}

export function AnalysisPageClient({ articles }: AnalysisPageClientProps) {
  const { t } = useTranslation()

  return (
    <main className="min-h-screen bg-gradient-to-b from-dark-bg to-slate-900">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('analysis.title')}
          </h1>
          <p className="text-xl text-text-secondary">
            {t('analysis.subtitle')}
          </p>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="container mx-auto px-4 pb-20">
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary text-lg">
              {t('analysis.noArticles')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
