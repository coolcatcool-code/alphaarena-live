# Alpha Arena Live

> Real-time tracking and analysis of 6 AI models trading cryptocurrency with $60,000 real money.

![Alpha Arena Live](https://alphaarena-live.com/og-image.png)

## 🎯 Project Overview

**Alpha Arena Live** is a real-time tracker and analysis platform for the Alpha Arena experiment by [nof1.ai](https://nof1.ai), where 6 AI models (Claude Sonnet, DeepSeek, ChatGPT, Gemini, Grok, and Qwen) autonomously trade cryptocurrency on Hyperliquid exchange.

### Key Features

- 🏆 **Live Leaderboard** - Real-time rankings with PnL, assets, and win rates
- 📊 **Performance Charts** - Interactive visualizations of trading trends
- 📝 **Deep Analysis** - Expert insights into AI trading strategies
- 🔄 **Auto-Updates** - Data refreshed every 5 minutes via Vercel Cron
- 🤖 **AI-Powered Articles** - Daily automated content generation with GPT-4
- 📱 **Responsive Design** - Optimized for desktop, tablet, and mobile
- 🔍 **SEO Optimized** - Built for maximum search visibility

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- pnpm (`npm install -g pnpm`)
- Git
- Supabase account ([Sign up](https://supabase.com))
- Vercel account ([Sign up](https://vercel.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/alphaarena-live.git
cd alphaarena-live

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Set up database
pnpm prisma generate
pnpm prisma db push

# Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
alphaarena/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Home page
│   │   ├── api/                # API routes
│   │   └── analysis/           # Article pages
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── features/           # Feature components
│   │   └── layout/             # Layout components
│   ├── lib/                    # Utilities & logic
│   │   ├── database/           # Prisma client
│   │   ├── scraper/            # Data scraping
│   │   └── articles/           # Article parsing
│   ├── types/                  # TypeScript types
│   └── hooks/                  # Custom React hooks
├── prisma/
│   └── schema.prisma           # Database schema
├── content/
│   └── articles/               # Markdown articles
├── public/                     # Static assets
└── vercel.json                 # Vercel config
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Charts**: Chart.js
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js 18+
- **API**: Next.js API Routes (Serverless)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Cron**: Vercel Cron Jobs
- **AI**: OpenAI GPT-4 (Content Generation)

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase
- **CDN**: Cloudflare
- **Analytics**: Google Analytics 4 + Vercel Analytics

## 📚 Documentation

### Getting Started
- **[QUICK-START.md](./QUICK-START.md)** - ⚡ 5-minute setup for AI automation
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide

### AI Content Automation
- **[AI-AUTOMATION-SETUP.md](./AI-AUTOMATION-SETUP.md)** - Complete AI article generation guide
- **[ARTICLE-AUTOMATION.md](./ARTICLE-AUTOMATION.md)** - Basic article automation docs

### Database & Infrastructure
- **[SUPABASE-SETUP.md](./SUPABASE-SETUP.md)** - Database setup and configuration
- **[CRON-JOB-SETUP.md](./CRON-JOB-SETUP.md)** - Auto-sync setup with Vercel Cron

### SEO & Marketing
- **[SEO-OPTIMIZATION-PLAN.md](./SEO-OPTIMIZATION-PLAN.md)** - SEO strategy and implementation
- **[SEO-IMPLEMENTATION-SUMMARY.md](./SEO-IMPLEMENTATION-SUMMARY.md)** - What's been implemented

### Development
- **[DEVELOPMENT-GUIDE.md](./DEVELOPMENT-GUIDE.md)** - Technical documentation and best practices
- **[SECURITY-AUDIT.md](./SECURITY-AUDIT.md)** - Security review and best practices
- **[alpha-arena-prd.md](./alpha-arena-prd.md)** - Original product requirements

## 🗄️ Database Schema

```prisma
model AIModel {
  id          String        @id @default(uuid())
  name        String        @unique
  avatar      String?
  description String?
  snapshots   AISnapshot[]
  trades      Trade[]
}

model AISnapshot {
  id             String   @id @default(uuid())
  aiModelId      String
  currentPnL     Decimal
  totalAssets    Decimal
  openPositions  Int
  winRate        Decimal
  rank           Int
  rankChange     Int
  timestamp      DateTime @default(now())
  aiModel        AIModel  @relation(...)
}

model Trade {
  id        String   @id @default(uuid())
  aiModelId String
  action    String   // BUY, SELL, CLOSE
  symbol    String
  amount    Decimal
  price     Decimal
  pnl       Decimal
  timestamp DateTime
  aiModel   AIModel  @relation(...)
}
```

## 🚀 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Add custom domain
vercel domains add alphaarena-live.com
```

### Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database URL

**Optional:**
- `OPENAI_API_KEY` - For AI article generation (see [QUICK-START.md](./QUICK-START.md))
- `NEXT_PUBLIC_GA_ID` - Google Analytics ID
- `CRON_SECRET` - Secure your cron endpoints

## 📊 API Endpoints

### GET `/api/leaderboard`
Get current leaderboard data.

**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "rank": 1,
      "aiModel": { "name": "DeepSeek", ... },
      "currentPnL": 40.5,
      "totalAssets": 14050,
      "openPositions": 3,
      "winRate": 68.2,
      "rankChange": 0,
      "timestamp": "2025-10-21T10:00:00Z"
    }
  ],
  "timestamp": "2025-10-21T10:00:00Z"
}
```

### GET `/api/trades`
Get trade history.

**Query Params:**
- `limit` (default: 100)
- `aiModelId` (optional)
- `symbol` (optional)
- `action` (optional: BUY, SELL, CLOSE)

**Response:**
```json
{
  "data": [...],
  "meta": {
    "total": 500,
    "returned": 100,
    "totalVolume": 1234567,
    "totalPnL": 12345
  }
}
```

## 🔍 SEO Strategy

### Target Keywords

**Primary:**
- alpha arena
- ai trading competition
- deepseek trading

**Long-tail:**
- "alpha arena live tracker"
- "ai trading performance comparison"
- "deepseek vs chatgpt trading"

### On-Page SEO

Every page includes:
- Optimized meta titles (<60 chars)
- Meta descriptions (150-160 chars)
- Open Graph tags
- Twitter Card tags
- Schema.org markup
- Semantic HTML structure

## 📈 Performance Optimization

- **Image Optimization**: Next.js Image component with WebP
- **Code Splitting**: Dynamic imports for heavy components
- **Caching**: 5-minute revalidation on API routes
- **CDN**: Cloudflare for static assets
- **Lighthouse Score**: Target 90+ on all metrics

## 🧪 Testing

```bash
# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Format code
pnpm format

# Test database connection
pnpm prisma db pull
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [nof1.ai](https://nof1.ai) for the Alpha Arena experiment
- [Hyperliquid](https://hyperliquid.xyz) for the trading platform
- [Vercel](https://vercel.com) for hosting
- [Supabase](https://supabase.com) for database

## 📞 Contact

- **Website**: [alphaarena-live.com](https://alphaarena-live.com)
- **Twitter**: [@alphaarena_live](https://twitter.com/alphaarena_live)
- **Email**: contact@alphaarena-live.com

---

**Built with ❤️ for the AI trading community**
