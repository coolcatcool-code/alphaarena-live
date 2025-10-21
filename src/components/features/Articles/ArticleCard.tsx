import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import type { Article } from '@/types'

interface ArticleCardProps {
  article: Article
}

export function ArticleCard({ article }: ArticleCardProps) {
  const { t, locale } = useTranslation()
  const publishedDate = new Date(article.publishedAt).toLocaleDateString(
    locale === 'zh' ? 'zh-CN' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  )

  return (
    <Link href={`/analysis/${article.slug}`}>
      <Card className="h-full hover:shadow-xl transition-all duration-300 hover:border-brand-blue cursor-pointer">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="capitalize">
              {article.category}
            </Badge>
            {article.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <h3 className="text-xl font-bold text-text-primary line-clamp-2 hover:text-brand-blue transition-colors">
            {article.title}
          </h3>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary line-clamp-3 mb-4">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-4 text-sm text-text-muted">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{publishedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{article.readTime} {t('analysis.readTime')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
