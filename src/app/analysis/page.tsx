import { getAllArticles } from '@/lib/articles/reader'
import { ArticleCard } from '@/components/features/Articles/ArticleCard'
import { AnalysisPageClient } from './AnalysisPageClient'

export default function AnalysisPage() {
  const articles = getAllArticles()

  return <AnalysisPageClient articles={articles} />
}
