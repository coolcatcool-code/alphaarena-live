# Alpha Arena Live - 开发文档与技术规范

## 📚 目录
1. [项目概述](#项目概述)
2. [技术栈](#技术栈)
3. [项目结构](#项目结构)
4. [开发环境设置](#开发环境设置)
5. [核心功能实现](#核心功能实现)
6. [数据模型与API](#数据模型与api)
7. [组件库与UI规范](#组件库与ui规范)
8. [性能优化](#性能优化)
9. [测试策略](#测试策略)
10. [部署流程](#部署流程)

---

## 项目概述

**项目名称**: Alpha Arena Live
**域名**: alphaarena-live.com
**技术类型**: Full-stack Web Application
**开发周期**: 48小时 MVP → 持续迭代

### 核心功能
- 🏆 实时AI交易排行榜
- 📊 数据可视化图表
- 📝 深度分析文章系统
- 🔄 自动数据抓取（5分钟间隔）
- 📱 完全响应式设计

---

## 技术栈

### 前端
```json
{
  "framework": "Next.js 14.2+",
  "language": "TypeScript 5.x",
  "styling": "Tailwind CSS 3.x",
  "ui-components": "shadcn/ui + Radix UI",
  "charts": "Chart.js 4.x / react-chartjs-2",
  "animations": "Framer Motion",
  "state-management": "@tanstack/react-query",
  "markdown": "react-markdown + remark-gfm"
}
```

### 后端
```json
{
  "runtime": "Node.js 18+",
  "api": "Next.js API Routes (Serverless)",
  "database": "PostgreSQL (Supabase)",
  "orm": "Prisma 5.x",
  "scraping": "Puppeteer",
  "cron": "Vercel Cron Jobs"
}
```

### 基础设施
```json
{
  "hosting": "Vercel",
  "database": "Supabase",
  "cdn": "Cloudflare",
  "analytics": "Google Analytics 4 + Vercel Analytics",
  "monitoring": "Sentry",
  "domain": "Cloudflare DNS"
}
```

---

## 项目结构

```
alphaarena/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (routes)/                 # 路由组
│   │   │   ├── page.tsx              # 首页
│   │   │   ├── layout.tsx            # 根布局
│   │   │   ├── globals.css           # 全局样式
│   │   │   ├── analysis/             # 文章路由组
│   │   │   │   ├── page.tsx          # 文章列表
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx      # 文章详情
│   │   │   ├── ai/                   # AI详情路由组
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # AI详情页
│   │   │   └── about/
│   │   │       └── page.tsx          # 关于页面
│   │   ├── api/                      # API路由
│   │   │   ├── leaderboard/
│   │   │   │   └── route.ts          # GET 排行榜
│   │   │   ├── trades/
│   │   │   │   └── route.ts          # GET 交易历史
│   │   │   ├── scrape/
│   │   │   │   └── route.ts          # POST 手动触发抓取
│   │   │   └── cron/
│   │   │       └── scrape/
│   │   │           └── route.ts      # Cron Job抓取
│   │   ├── sitemap.ts                # 动态sitemap
│   │   ├── robots.ts                 # 动态robots.txt
│   │   └── not-found.tsx             # 404页面
│   ├── components/                   # React组件
│   │   ├── ui/                       # shadcn/ui基础组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── select.tsx
│   │   │   └── ...
│   │   ├── layout/                   # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── features/                 # 功能组件
│   │   │   ├── Leaderboard/
│   │   │   │   ├── Leaderboard.tsx
│   │   │   │   ├── LeaderboardCard.tsx
│   │   │   │   └── RankBadge.tsx
│   │   │   ├── Charts/
│   │   │   │   ├── TrendChart.tsx
│   │   │   │   ├── PnLChart.tsx
│   │   │   │   └── VolumeChart.tsx
│   │   │   ├── TradeHistory/
│   │   │   │   ├── TradeHistory.tsx
│   │   │   │   └── TradeRow.tsx
│   │   │   └── Articles/
│   │   │       ├── ArticleList.tsx
│   │   │       ├── ArticleCard.tsx
│   │   │       └── ArticleContent.tsx
│   │   └── common/                   # 通用组件
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── SEOHead.tsx
│   ├── lib/                          # 工具库
│   │   ├── api/                      # API客户端
│   │   │   ├── leaderboard.ts
│   │   │   └── trades.ts
│   │   ├── scraper/                  # 数据抓取
│   │   │   ├── puppeteer-scraper.ts
│   │   │   ├── parser.ts
│   │   │   └── validator.ts
│   │   ├── database/                 # 数据库
│   │   │   ├── client.ts             # Prisma客户端
│   │   │   ├── queries.ts            # 数据库查询
│   │   │   └── mutations.ts          # 数据库写入
│   │   ├── articles/                 # 文章处理
│   │   │   ├── reader.ts             # 读取Markdown
│   │   │   ├── parser.ts             # 解析frontmatter
│   │   │   └── renderer.ts           # 渲染Markdown
│   │   └── utils/                    # 工具函数
│   │       ├── formatters.ts         # 格式化函数
│   │       ├── validators.ts         # 验证函数
│   │       ├── date.ts               # 日期处理
│   │       └── cn.ts                 # className合并
│   ├── types/                        # TypeScript类型
│   │   ├── index.ts                  # 导出所有类型
│   │   ├── models.ts                 # 数据模型类型
│   │   ├── api.ts                    # API类型
│   │   └── components.ts             # 组件Props类型
│   ├── hooks/                        # 自定义Hooks
│   │   ├── useLeaderboard.ts
│   │   ├── useTrades.ts
│   │   └── useArticles.ts
│   ├── config/                       # 配置文件
│   │   ├── site.ts                   # 网站配置
│   │   ├── seo.ts                    # SEO配置
│   │   └── constants.ts              # 常量定义
│   └── styles/                       # 样式文件
│       ├── globals.css               # 全局样式
│       └── chart.css                 # 图表样式
├── prisma/                           # Prisma ORM
│   ├── schema.prisma                 # 数据库Schema
│   └── migrations/                   # 数据库迁移
├── content/                          # 内容文件
│   └── articles/                     # Markdown文章
│       ├── deepseek-leading-strategy.md
│       ├── gemini-loss-case-study.md
│       └── ai-models-comparison.md
├── public/                           # 静态资源
│   ├── images/                       # 图片
│   │   ├── og-image.png              # OG图片
│   │   ├── logo.svg
│   │   └── ai-avatars/               # AI头像
│   ├── fonts/                        # 字体（如需自定义）
│   ├── favicon.ico
│   ├── robots.txt                    # 静态robots.txt（可选）
│   └── manifest.json                 # PWA配置（可选）
├── scripts/                          # 脚本
│   ├── seed.ts                       # 数据库初始化
│   └── test-scraper.ts               # 测试抓取器
├── .env.local                        # 环境变量（本地）
├── .env.example                      # 环境变量示例
├── .gitignore
├── next.config.js                    # Next.js配置
├── tailwind.config.ts                # Tailwind配置
├── tsconfig.json                     # TypeScript配置
├── postcss.config.js                 # PostCSS配置
├── prettier.config.js                # Prettier配置
├── package.json
├── pnpm-lock.yaml
├── vercel.json                       # Vercel配置（Cron等）
├── README.md                         # 项目说明
├── EXECUTION-PLAN.md                 # 执行方案
└── DEVELOPMENT-GUIDE.md              # 本文档
```

---

## 开发环境设置

### 1. 前置要求

```bash
# 检查Node.js版本（需要18+）
node -v
# 输出：v18.17.0 或更高

# 检查包管理器（推荐pnpm）
pnpm -v
# 如果未安装：npm install -g pnpm

# 检查Git
git --version
```

### 2. 克隆与安装

```bash
# 进入项目目录
cd C:\Users\Zero\trae\alphaarena

# 初始化Next.js项目（如果还未初始化）
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"

# 安装所有依赖
pnpm install

# 安装shadcn/ui
npx shadcn-ui@latest init

# 安装必要组件
npx shadcn-ui@latest add button card badge table tabs select
```

### 3. 环境变量配置

创建 `.env.local`:
```env
# 数据库（Supabase）
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Vercel Analytics（自动提供）
# NEXT_PUBLIC_VERCEL_ANALYTICS_ID=xxx

# Cron Job密钥（自己生成）
CRON_SECRET="your-random-secret-key-here"

# Sentry（可选）
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"

# 其他API密钥（如需要）
HYPERLIQUID_API_KEY=""
NOF1_API_KEY=""
```

创建 `.env.example`（提交到Git）:
```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
CRON_SECRET="your-secret"
```

### 4. 数据库设置

```bash
# 初始化Prisma
npx prisma init

# 编辑 prisma/schema.prisma（见下文）

# 生成Prisma Client
npx prisma generate

# 推送Schema到数据库
npx prisma db push

# 打开Prisma Studio查看数据
npx prisma studio
```

### 5. 启动开发服务器

```bash
# 启动开发服务器
pnpm dev

# 访问 http://localhost:3000
```

---

## 核心功能实现

### 1. Leaderboard组件

#### `src/components/features/Leaderboard/Leaderboard.tsx`

```typescript
'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { motion } from 'framer-motion'
import type { AISnapshot } from '@/types'

interface LeaderboardProps {
  snapshots: AISnapshot[]
  loading?: boolean
}

export function Leaderboard({ snapshots, loading = false }: LeaderboardProps) {
  const sortedData = [...snapshots].sort((a, b) => a.rank - b.rank)

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="grid gap-4">
      {sortedData.map((snapshot, index) => (
        <LeaderboardCard
          key={snapshot.id}
          snapshot={snapshot}
          index={index}
        />
      ))}
    </div>
  )
}

interface LeaderboardCardProps {
  snapshot: AISnapshot
  index: number
}

function LeaderboardCard({ snapshot, index }: LeaderboardCardProps) {
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          gradient: 'from-yellow-500/10 to-yellow-600/10',
          border: 'border-yellow-500/50',
          text: 'text-yellow-500',
          icon: '🥇'
        }
      case 2:
        return {
          gradient: 'from-gray-400/10 to-gray-500/10',
          border: 'border-gray-400/50',
          text: 'text-gray-400',
          icon: '🥈'
        }
      case 3:
        return {
          gradient: 'from-orange-500/10 to-orange-600/10',
          border: 'border-orange-600/50',
          text: 'text-orange-600',
          icon: '🥉'
        }
      default:
        return {
          gradient: '',
          border: 'border-dark-border',
          text: 'text-gray-500',
          icon: ''
        }
    }
  }

  const rankStyle = getRankStyle(snapshot.rank)
  const pnlPositive = snapshot.currentPnL >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={`p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-r ${rankStyle.gradient} ${rankStyle.border}`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* 左侧：排名 + AI信息 */}
          <div className="flex items-center gap-4">
            {/* 排名 */}
            <div className="flex flex-col items-center">
              <div className={`text-4xl font-bold ${rankStyle.text}`}>
                #{snapshot.rank}
              </div>
              {rankStyle.icon && (
                <span className="text-2xl">{rankStyle.icon}</span>
              )}
            </div>

            {/* AI信息 */}
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-text-primary">
                {snapshot.aiModel.name}
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                {snapshot.aiModel.description}
              </p>

              {/* PnL和排名变化 */}
              <div className="flex gap-2 mt-2">
                <Badge
                  variant={pnlPositive ? 'default' : 'destructive'}
                  className="font-mono"
                >
                  {pnlPositive ? '+' : ''}{snapshot.currentPnL.toFixed(2)}%
                </Badge>

                {snapshot.rankChange !== 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {snapshot.rankChange > 0 ? (
                      <>
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-green-500">
                          {snapshot.rankChange}
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-3 h-3 text-red-500" />
                        <span className="text-red-500">
                          {Math.abs(snapshot.rankChange)}
                        </span>
                      </>
                    )}
                  </Badge>
                )}

                {snapshot.rankChange === 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Minus className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-500">0</span>
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：数据指标 */}
          <div className="grid grid-cols-3 gap-4 md:gap-6 text-center md:text-right">
            <div>
              <p className="text-xs md:text-sm text-text-secondary">
                Total Assets
              </p>
              <p className="text-lg md:text-xl font-semibold text-text-primary font-mono">
                ${snapshot.totalAssets.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs md:text-sm text-text-secondary">
                Positions
              </p>
              <p className="text-lg md:text-xl font-semibold text-text-primary">
                {snapshot.openPositions}
              </p>
            </div>

            <div>
              <p className="text-xs md:text-sm text-text-secondary">
                Win Rate
              </p>
              <p className="text-lg md:text-xl font-semibold text-text-primary">
                {snapshot.winRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* 底部：时间戳 */}
        <div className="mt-4 pt-4 border-t border-dark-border">
          <p className="text-xs text-text-muted">
            Last updated: {new Date(snapshot.timestamp).toLocaleString()}
          </p>
        </div>
      </Card>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-700 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-1/4" />
              <div className="h-3 bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
```

### 2. 趋势图表组件

#### `src/components/features/Charts/TrendChart.tsx`

```typescript
'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState, useMemo } from 'react'
import type { AISnapshot } from '@/types'

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface TrendChartProps {
  snapshots: AISnapshot[]
}

type TimeRange = '24h' | '7d' | 'all'

export function TrendChart({ snapshots }: TrendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')

  // 按时间范围过滤数据
  const filteredSnapshots = useMemo(() => {
    const now = new Date()
    let cutoffTime: Date

    switch (timeRange) {
      case '24h':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'all':
        return snapshots
    }

    return snapshots.filter(
      (s) => new Date(s.timestamp) >= cutoffTime
    )
  }, [snapshots, timeRange])

  // 按AI分组
  const groupedData = useMemo(() => {
    const grouped: Record<string, AISnapshot[]> = {}

    filteredSnapshots.forEach((snapshot) => {
      const aiName = snapshot.aiModel.name
      if (!grouped[aiName]) {
        grouped[aiName] = []
      }
      grouped[aiName].push(snapshot)
    })

    // 按时间排序
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    })

    return grouped
  }, [filteredSnapshots])

  // 准备图表数据
  const chartData = useMemo(() => {
    const allTimestamps = [
      ...new Set(
        filteredSnapshots.map((s) =>
          new Date(s.timestamp).toISOString()
        )
      )
    ].sort()

    return {
      labels: allTimestamps.map((ts) =>
        new Date(ts).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: timeRange === '24h' ? '2-digit' : undefined
        })
      ),
      datasets: Object.entries(groupedData).map(([aiName, data]) => ({
        label: aiName,
        data: data.map((s) => s.currentPnL),
        borderColor: getAIColor(aiName),
        backgroundColor: getAIColor(aiName, 0.1),
        borderWidth: 2,
        tension: 0.4,
        pointRadius: timeRange === '24h' ? 3 : 2,
        pointHoverRadius: 5,
        fill: false
      }))
    }
  }, [groupedData, timeRange])

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#F1F5F9',
          font: {
            size: 12,
            family: 'Inter'
          },
          usePointStyle: true,
          padding: 15
        }
      },
      title: {
        display: true,
        text: 'PnL Performance Over Time',
        color: '#F1F5F9',
        font: {
          size: 16,
          weight: 'bold',
          family: 'Inter'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#F1F5F9',
        bodyColor: '#94A3B8',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawBorder: false
        },
        ticks: {
          color: '#94A3B8',
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawBorder: false
        },
        ticks: {
          color: '#94A3B8',
          font: {
            size: 11
          },
          callback: (value) => `${value}%`
        }
      }
    }
  }

  return (
    <Card className="p-6 bg-dark-card border-dark-border">
      {/* 时间范围选择 */}
      <Tabs
        value={timeRange}
        onValueChange={(value) => setTimeRange(value as TimeRange)}
        className="mb-4"
      >
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="24h">24 Hours</TabsTrigger>
          <TabsTrigger value="7d">7 Days</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 图表 */}
      <div className="h-[400px] md:h-[500px]">
        <Line data={chartData} options={options} />
      </div>
    </Card>
  )
}

// AI颜色映射
function getAIColor(aiName: string, alpha: number = 1): string {
  const colors: Record<string, string> = {
    'Claude Sonnet': `rgba(59, 130, 246, ${alpha})`,    // Blue
    'DeepSeek': `rgba(16, 185, 129, ${alpha})`,         // Green
    'ChatGPT': `rgba(139, 92, 246, ${alpha})`,          // Purple
    'Gemini': `rgba(239, 68, 68, ${alpha})`,            // Red
    'Grok': `rgba(245, 158, 11, ${alpha})`,             // Orange
    'Qwen': `rgba(6, 182, 212, ${alpha})`               // Cyan
  }

  return colors[aiName] || `rgba(100, 116, 139, ${alpha})`
}
```

### 3. 交易历史组件

#### `src/components/features/TradeHistory/TradeHistory.tsx`

```typescript
'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowUpRight, ArrowDownRight, X } from 'lucide-react'
import { useState, useMemo } from 'react'
import type { Trade } from '@/types'

interface TradeHistoryProps {
  trades: Trade[]
  limit?: number
}

export function TradeHistory({ trades, limit = 100 }: TradeHistoryProps) {
  const [filterAI, setFilterAI] = useState<string>('all')
  const [filterAction, setFilterAction] = useState<string>('all')

  // 获取唯一的AI列表
  const aiModels = useMemo(() => {
    const models = [...new Set(trades.map((t) => t.aiModel.name))]
    return models.sort()
  }, [trades])

  // 过滤和排序
  const filteredTrades = useMemo(() => {
    let filtered = [...trades]

    if (filterAI !== 'all') {
      filtered = filtered.filter((t) => t.aiModel.name === filterAI)
    }

    if (filterAction !== 'all') {
      filtered = filtered.filter((t) => t.action === filterAction)
    }

    // 按时间倒序排序
    filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return filtered.slice(0, limit)
  }, [trades, filterAI, filterAction, limit])

  return (
    <Card className="p-6 bg-dark-card border-dark-border">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-text-primary">
          Trade History
        </h2>

        {/* 过滤器 */}
        <div className="flex gap-2">
          <Select value={filterAI} onValueChange={setFilterAI}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All AI Models" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All AI Models</SelectItem>
              {aiModels.map((ai) => (
                <SelectItem key={ai} value={ai}>
                  {ai}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="BUY">Buy</SelectItem>
              <SelectItem value="SELL">Sell</SelectItem>
              <SelectItem value="CLOSE">Close</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 交易表格 */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>AI</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Side</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">PnL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell className="font-mono text-xs">
                  {new Date(trade.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>

                <TableCell>
                  <span
                    className="font-semibold"
                    style={{ color: getAIColor(trade.aiModel.name) }}
                  >
                    {trade.aiModel.name}
                  </span>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={getActionVariant(trade.action)}
                    className="font-semibold"
                  >
                    {trade.action}
                  </Badge>
                </TableCell>

                <TableCell className="font-mono font-semibold">
                  {trade.symbol}
                </TableCell>

                <TableCell>
                  {trade.side && (
                    <div className="flex items-center gap-1">
                      {trade.side === 'LONG' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                      <span
                        className={
                          trade.side === 'LONG'
                            ? 'text-green-500'
                            : 'text-red-500'
                        }
                      >
                        {trade.side}
                      </span>
                    </div>
                  )}
                </TableCell>

                <TableCell className="text-right font-mono">
                  ${trade.amount.toLocaleString()}
                </TableCell>

                <TableCell className="text-right font-mono">
                  ${trade.price.toLocaleString()}
                </TableCell>

                <TableCell className="text-right">
                  <span
                    className={`font-mono font-semibold ${
                      trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredTrades.length === 0 && (
        <div className="text-center py-12 text-text-secondary">
          No trades found matching your filters.
        </div>
      )}
    </Card>
  )
}

function getActionVariant(action: string) {
  switch (action) {
    case 'BUY':
      return 'default'
    case 'SELL':
      return 'secondary'
    case 'CLOSE':
      return 'outline'
    default:
      return 'outline'
  }
}

function getAIColor(aiName: string): string {
  const colors: Record<string, string> = {
    'Claude Sonnet': '#3B82F6',
    'DeepSeek': '#10B981',
    'ChatGPT': '#8B5CF6',
    'Gemini': '#EF4444',
    'Grok': '#F59E0B',
    'Qwen': '#06B6D4'
  }
  return colors[aiName] || '#64748B'
}
```

---

## 数据模型与API

### Prisma Schema

#### `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model AIModel {
  id          String        @id @default(uuid())
  name        String        @unique
  avatar      String?
  description String?
  color       String?
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  snapshots   AISnapshot[]
  trades      Trade[]

  @@map("ai_models")
}

model AISnapshot {
  id             String   @id @default(uuid())
  aiModelId      String   @map("ai_model_id")
  currentPnL     Decimal  @map("current_pnl") @db.Decimal(10, 2)
  totalAssets    Decimal  @map("total_assets") @db.Decimal(10, 2)
  openPositions  Int      @map("open_positions")
  winRate        Decimal  @map("win_rate") @db.Decimal(5, 2)
  rank           Int
  rankChange     Int      @map("rank_change") @default(0)
  timestamp      DateTime @default(now())

  aiModel AIModel @relation(fields: [aiModelId], references: [id], onDelete: Cascade)

  @@index([timestamp(sort: Desc)])
  @@index([aiModelId, timestamp(sort: Desc)])
  @@map("ai_snapshots")
}

model Trade {
  id        String   @id @default(uuid())
  aiModelId String   @map("ai_model_id")
  action    String   // BUY, SELL, CLOSE
  symbol    String
  side      String?  // LONG, SHORT
  amount    Decimal  @db.Decimal(15, 2)
  price     Decimal  @db.Decimal(15, 2)
  leverage  Int      @default(1)
  pnl       Decimal  @db.Decimal(15, 2)
  fee       Decimal  @db.Decimal(10, 2) @default(0)
  timestamp DateTime @default(now())

  aiModel AIModel @relation(fields: [aiModelId], references: [id], onDelete: Cascade)

  @@index([aiModelId, timestamp(sort: Desc)])
  @@index([timestamp(sort: Desc)])
  @@index([symbol])
  @@map("trades")
}
```

### API路由实现

#### `src/app/api/leaderboard/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/client'

export const revalidate = 300 // 5分钟缓存

export async function GET(request: Request) {
  try {
    // 获取最新时间戳的快照
    const latestSnapshot = await prisma.aISnapshot.findFirst({
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true }
    })

    if (!latestSnapshot) {
      return NextResponse.json({
        data: [],
        timestamp: new Date().toISOString(),
        message: 'No data available'
      })
    }

    // 获取该时间戳的所有快照
    const snapshots = await prisma.aISnapshot.findMany({
      where: {
        timestamp: latestSnapshot.timestamp
      },
      include: {
        aiModel: {
          select: {
            id: true,
            name: true,
            avatar: true,
            description: true,
            color: true
          }
        }
      },
      orderBy: {
        rank: 'asc'
      }
    })

    return NextResponse.json({
      data: snapshots,
      timestamp: latestSnapshot.timestamp.toISOString(),
      count: snapshots.length
    })
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch leaderboard data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
```

#### `src/app/api/trades/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/client'

export const revalidate = 300 // 5分钟缓存

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const limit = parseInt(searchParams.get('limit') || '100')
    const aiModelId = searchParams.get('aiModelId')
    const symbol = searchParams.get('symbol')
    const action = searchParams.get('action')

    // 构建查询条件
    const where: any = {}
    if (aiModelId) where.aiModelId = aiModelId
    if (symbol) where.symbol = symbol
    if (action) where.action = action

    // 查询交易
    const trades = await prisma.trade.findMany({
      where,
      include: {
        aiModel: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: Math.min(limit, 500) // 最多500条
    })

    // 统计信息
    const totalTrades = await prisma.trade.count({ where })
    const totalVolume = trades.reduce((sum, t) => sum + Number(t.amount), 0)
    const totalPnL = trades.reduce((sum, t) => sum + Number(t.pnl), 0)

    return NextResponse.json({
      data: trades,
      meta: {
        total: totalTrades,
        returned: trades.length,
        totalVolume,
        totalPnL
      }
    })
  } catch (error) {
    console.error('Trades API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch trades',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
```

#### `src/app/api/cron/scrape/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { scrapeAlphaArenaData } from '@/lib/scraper/puppeteer-scraper'
import { saveSnapshots } from '@/lib/database/mutations'

export const maxDuration = 300 // 5分钟超时

export async function GET(request: Request) {
  try {
    // 验证Cron密钥
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Cron] Starting data scrape...')

    // 抓取数据
    const scrapedData = await scrapeAlphaArenaData()

    console.log('[Cron] Scraped data:', {
      count: scrapedData.length,
      timestamp: new Date().toISOString()
    })

    // 保存到数据库
    await saveSnapshots(scrapedData)

    console.log('[Cron] Data saved successfully')

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: scrapedData.length
    })
  } catch (error) {
    console.error('[Cron] Scrape failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
```

---

## 组件库与UI规范

### Tailwind配置

#### `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          blue: '#3B82F6',
          purple: '#8B5CF6',
        },
        // AI colors
        ai: {
          claude: '#3B82F6',
          deepseek: '#10B981',
          chatgpt: '#8B5CF6',
          gemini: '#EF4444',
          grok: '#F59E0B',
          qwen: '#06B6D4',
        },
        // Functional
        success: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
        info: '#06B6D4',
        // Dark theme
        dark: {
          bg: '#0F172A',
          card: '#1E293B',
          border: '#334155',
        },
        text: {
          primary: '#F1F5F9',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        // shadcn/ui colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

---

## 性能优化

### 1. 图片优化

```typescript
// 使用Next.js Image组件
import Image from 'next/image'

<Image
  src="/images/ai-avatars/claude.png"
  alt="Claude Sonnet"
  width={64}
  height={64}
  priority // 首屏图片
/>
```

### 2. 代码分割

```typescript
// 动态导入非关键组件
import dynamic from 'next/dynamic'

const TrendChart = dynamic(
  () => import('@/components/features/Charts/TrendChart'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false // Chart.js不需要SSR
  }
)
```

### 3. 数据缓存

```typescript
// API路由缓存
export const revalidate = 300 // 5分钟

// React Query缓存
const { data } = useQuery({
  queryKey: ['leaderboard'],
  queryFn: fetchLeaderboard,
  staleTime: 5 * 60 * 1000, // 5分钟
  cacheTime: 10 * 60 * 1000 // 10分钟
})
```

---

## 测试策略

### 单元测试（可选）

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

```typescript
// __tests__/utils/formatters.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency } from '@/lib/utils/formatters'

describe('formatCurrency', () => {
  it('formats positive numbers', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('formats negative numbers', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56')
  })
})
```

---

## 部署流程

### 1. Vercel部署

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod

# 绑定域名
vercel domains add alphaarena-live.com
```

### 2. 环境变量设置

在Vercel Dashboard:
1. 项目设置 → Environment Variables
2. 添加所有 `.env.local` 中的变量
3. 重新部署

### 3. Cron Job配置

#### `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/scrape",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## 常见问题排查

### 构建失败
```bash
# 清除缓存
rm -rf .next
pnpm install
pnpm build
```

### 数据库连接失败
```bash
# 测试连接
npx prisma db pull

# 重新生成客户端
npx prisma generate
```

### 环境变量未生效
```bash
# 检查变量名
# 确保NEXT_PUBLIC_开头的变量在客户端使用
# 重启开发服务器
```

---

## 开发最佳实践

1. **组件命名**: PascalCase
2. **文件命名**: kebab-case或PascalCase
3. **TypeScript**: 严格模式，禁用any
4. **Git提交**: 使用conventional commits
5. **代码格式化**: Prettier自动格式化

---

**完整开发文档到此结束。祝开发顺利！**
