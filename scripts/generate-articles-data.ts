import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

interface Article {
  slug: string
  title: string
  excerpt: string
  category: string
  tags: string[]
  publishedAt: string
  readTime: number
  content: string
}

const articlesDirectory = path.join(process.cwd(), 'content/articles')
const outputTsPath = path.join(process.cwd(), 'src/data/articles-data.ts')
const outputJsonPath = path.join(process.cwd(), 'public/articles-data.json')

function generateArticlesData() {
  console.log('📚 Generating articles data...')

  // 确保目录存在
  if (!fs.existsSync(articlesDirectory)) {
    console.warn('⚠️  Articles directory not found:', articlesDirectory)
    const emptyData = '[]'
    fs.writeFileSync(outputJsonPath, emptyData)

    // 确保输出目录存在
    const outputDir = path.dirname(outputTsPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const tsContent = `// Auto-generated file - do not edit manually
import type { Article } from '@/types'

export const articlesData: Article[] = []
`
    fs.writeFileSync(outputTsPath, tsContent)
    return
  }

  const fileNames = fs.readdirSync(articlesDirectory)
  const mdFiles = fileNames.filter(name => name.endsWith('.md'))

  console.log(`📄 Found ${mdFiles.length} articles`)

  const articles: Article[] = mdFiles.map((fileName) => {
    const slug = fileName.replace(/\.md$/, '')
    const fullPath = path.join(articlesDirectory, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    console.log(`  ✓ Processing: ${slug}`)

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
  const sortedArticles = articles.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )

  // 写入 JSON 文件（用于 public 访问）
  fs.writeFileSync(outputJsonPath, JSON.stringify(sortedArticles, null, 2))

  // 写入 TypeScript 模块（直接嵌入到代码中）
  const outputDir = path.dirname(outputTsPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const tsContent = `// Auto-generated file - do not edit manually
// Generated at: ${new Date().toISOString()}
import type { Article } from '@/types'

export const articlesData: Article[] = ${JSON.stringify(sortedArticles, null, 2)}
`
  fs.writeFileSync(outputTsPath, tsContent)

  console.log(`✅ Generated TypeScript module: ${outputTsPath}`)
  console.log(`✅ Generated JSON file: ${outputJsonPath}`)
  console.log(`📊 Total articles: ${sortedArticles.length}`)
}

generateArticlesData()
