'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Clock, Calendar, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'
import type { Article } from '@/types'

interface ArticlePageClientProps {
  article: Article
}

export function ArticlePageClient({ article }: ArticlePageClientProps) {
  const { t, locale } = useTranslation()

  const publishedDate = new Date(article.publishedAt).toLocaleDateString(
    locale === 'zh' ? 'zh-CN' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  )

  const breadcrumbItems = [
    { name: 'Home', url: 'https://www.alphaarena-live.com' },
    { name: 'Analysis', url: 'https://www.alphaarena-live.com/analysis' },
    { name: article.title, url: `https://www.alphaarena-live.com/analysis/${article.slug}` },
  ]

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <main className="min-h-screen bg-gradient-to-b from-dark-bg to-slate-900">
        <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back Button */}
        <Link href="/analysis">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('analysis.backToAnalysis')}
          </Button>
        </Link>

        {/* Article Header */}
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="outline" className="capitalize">
              {article.category}
            </Badge>
            {article.tags.map(tag => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {article.title}
          </h1>

          <p className="text-xl text-text-secondary mb-6">
            {article.excerpt}
          </p>

          <div className="flex items-center gap-6 text-text-muted">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{publishedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{article.readTime} {t('analysis.readTime')}</span>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-invert prose-lg max-w-none
          prose-headings:text-text-primary
          prose-p:text-text-secondary
          prose-a:text-brand-blue prose-a:no-underline hover:prose-a:underline
          prose-strong:text-text-primary
          prose-code:text-brand-purple prose-code:bg-dark-card prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-dark-card prose-pre:border prose-pre:border-dark-border
          prose-blockquote:border-l-brand-blue prose-blockquote:text-text-secondary
          prose-table:text-text-secondary
          prose-th:text-text-primary
          prose-td:border-dark-border
          prose-hr:border-dark-border
          prose-ul:text-text-secondary
          prose-ol:text-text-secondary
          prose-li:text-text-secondary
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {article.content}
          </ReactMarkdown>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-dark-border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-text-secondary text-sm mb-2">
                {t('analysis.foundHelpful')}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" asChild>
                  <a href={`https://twitter.com/intent/tweet?text=Check%20out%20this%20analysis&url=https://www.alphaarena-live.com/analysis/${article.slug}`} target="_blank" rel="noopener noreferrer">
                    {t('analysis.shareOnTwitter')}
                  </a>
                </Button>
                <Link href="/">
                  <Button size="sm">
                    {t('analysis.viewLeaderboard')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </article>
    </main>
    </>
  )
}
