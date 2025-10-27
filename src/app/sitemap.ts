import { MetadataRoute } from 'next'
import { getAllArticles } from '@/lib/articles/reader'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.alphaarena-live.com'

  // Get all articles
  const articles = getAllArticles()

  // Generate article URLs
  const articleUrls = articles.map((article) => ({
    url: `${baseUrl}/analysis/${article.slug}`,
    lastModified: new Date(article.publishedAt),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/analysis`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...articleUrls,
  ]
}
