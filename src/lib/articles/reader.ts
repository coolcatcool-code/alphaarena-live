import type { Article } from '@/types'
import { articlesData } from '@/data/articles-data'

/**
 * 获取所有文章（从构建时生成的静态数据）
 * 兼容 Cloudflare Workers 环境
 */
export function getAllArticles(): Article[] {
  return articlesData
}

/**
 * 根据 slug 获取单篇文章
 */
export function getArticleBySlug(slug: string): Article | null {
  const article = articlesData.find(article => article.slug === slug)
  return article || null
}

/**
 * 获取所有文章的 slugs（用于生成静态路由）
 */
export function getAllSlugs(): string[] {
  return articlesData.map(article => article.slug)
}
