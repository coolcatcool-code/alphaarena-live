import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { Article } from '@/types'

const articlesDirectory = path.join(process.cwd(), 'content/articles')

export function getAllArticles(): Article[] {
  // 确保目录存在
  if (!fs.existsSync(articlesDirectory)) {
    return []
  }

  const fileNames = fs.readdirSync(articlesDirectory)
  const mdFiles = fileNames.filter(name => name.endsWith('.md'))

  const articles = mdFiles.map((fileName) => {
    const slug = fileName.replace(/\.md$/, '')
    const fullPath = path.join(articlesDirectory, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      slug,
      title: data.title || 'Untitled',
      excerpt: data.excerpt || '',
      category: data.category || 'analysis',
      tags: data.tags || [],
      publishedAt: data.publishedAt || new Date().toISOString(),
      readTime: data.readTime || 5,
      content
    }
  })

  // 按发布日期倒序排序
  return articles.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

export function getArticleBySlug(slug: string): Article | null {
  try {
    const fullPath = path.join(articlesDirectory, `${slug}.md`)

    if (!fs.existsSync(fullPath)) {
      return null
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      slug,
      title: data.title || 'Untitled',
      excerpt: data.excerpt || '',
      category: data.category || 'analysis',
      tags: data.tags || [],
      publishedAt: data.publishedAt || new Date().toISOString(),
      readTime: data.readTime || 5,
      content
    }
  } catch (error) {
    console.error(`Error reading article ${slug}:`, error)
    return null
  }
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(articlesDirectory)) {
    return []
  }

  const fileNames = fs.readdirSync(articlesDirectory)
  return fileNames
    .filter(name => name.endsWith('.md'))
    .map(name => name.replace(/\.md$/, ''))
}
