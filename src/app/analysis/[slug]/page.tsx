import { notFound } from 'next/navigation'
import { getArticleBySlug, getAllSlugs } from '@/lib/articles/reader'
import { ArticlePageClient } from './ArticlePageClient'
import type { Metadata } from 'next'

interface ArticlePageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const slugs = getAllSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = getArticleBySlug(params.slug)

  if (!article) {
    return {
      title: 'Article Not Found',
    }
  }

  // JSON-LD Structured Data for Article
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    author: {
      '@type': 'Organization',
      name: 'Alpha Arena Live',
      url: 'https://alphaarena-live.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Alpha Arena Live',
      logo: {
        '@type': 'ImageObject',
        url: 'https://alphaarena-live.com/logo.png',
      },
    },
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    image: 'https://alphaarena-live.com/og-image.png',
    articleSection: article.category,
    keywords: article.tags.join(', '),
    wordCount: Math.ceil(article.content.split(' ').length),
    timeRequired: `PT${article.readTime}M`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://alphaarena-live.com/analysis/${params.slug}`,
    },
  }

  return {
    title: article.title,
    description: article.excerpt,
    keywords: article.tags,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.publishedAt,
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
    },
    other: {
      'script:ld+json': JSON.stringify(jsonLd),
    },
  }
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const article = getArticleBySlug(params.slug)

  if (!article) {
    notFound()
  }

  return <ArticlePageClient article={article} />
}
