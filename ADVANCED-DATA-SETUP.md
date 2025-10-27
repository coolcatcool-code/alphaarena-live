# Advanced Data Integration Setup Guide

This guide walks you through setting up the new analytics and conversations data integration from nof1.ai.

## 📚 What's New

We've integrated two powerful data sources from nof1.ai:

### 1. `/api/analytics` - Deep Trading Analytics
- Complete trading statistics (win rate, volume, etc.)
- Detailed PnL analysis (realized/unrealized, profit factor)
- Fee analysis and cost tracking
- Signal distribution (buy/sell/hold patterns)
- Risk metrics (Sharpe ratio, max drawdown, volatility)
- Time analysis (hold time, active hours)
- Performance breakdown by asset

### 2. `/api/conversations` - AI Decision Making Process
- Real-time market data seen by each AI
- Chain of Thought reasoning
- Key observations and risk assessments
- Trading decisions with confidence levels
- Current positions
- Proposed actions with entry/exit strategies

## 🔧 Setup Steps

### Step 1: Apply Database Migration

The database schema has been extended with two new tables. You need to run the SQL migration in your Supabase dashboard.

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to https://supabase.com/dashboard
2. Select your project: `kqalqqnuliuszwljfosz`
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire content from `prisma/migrations/add_analytics_and_conversations.sql`
6. Paste it into the SQL editor
7. Click "Run" or press `Ctrl+Enter`
8. Verify the tables were created:
   ```sql
   SELECT * FROM information_schema.tables
   WHERE table_name IN ('analytics_snapshots', 'ai_conversations');
   ```

**Option B: Via Prisma CLI (If direct connection works)**

```bash
pnpm prisma db push
```

Note: This may fail due to firewall restrictions. If it does, use Option A.

### Step 2: Verify Prisma Client

After creating the tables, regenerate the Prisma client:

```bash
pnpm prisma generate
```

This ensures TypeScript has the latest database types.

### Step 3: Test API Proxy Routes

The new API proxy routes are at:
- `http://localhost:3000/api/external/analytics`
- `http://localhost:3000/api/external/conversations`

Start your dev server and test:

```bash
pnpm dev
```

Then open in browser or use curl:
```bash
curl http://localhost:3000/api/external/analytics
curl http://localhost:3000/api/external/conversations
```

### Step 4: Run Data Sync Script

Sync the latest data from nof1.ai to your Supabase database:

```bash
pnpm sync-advanced-data
```

You should see output like:
```
🚀 Starting advanced data synchronization...

🔌 Testing Supabase connection...
✅ Supabase connected

📊 Fetching analytics data from nof1.ai...
✅ Fetched analytics for 6 AI models

💬 Fetching conversations data from nof1.ai...
✅ Fetched conversations for 6 AI models

📊 Syncing analytics data to Supabase...
✅ Analytics synced: 6 records

💬 Syncing conversations data to Supabase...
✅ Conversations synced: 6 records

============================================================
✅ Sync completed successfully!
============================================================
📊 Analytics: 6 synced, 0 skipped
💬 Conversations: 6 synced, 0 skipped
⏱️  Time elapsed: 2.34s
============================================================
```

## 📊 Database Schema

### `analytics_snapshots` Table

Stores comprehensive trading analytics snapshots:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `ai_model_id` | TEXT | Reference to ai_models table |
| `total_trades` | INTEGER | Total number of trades |
| `winning_trades` | INTEGER | Number of profitable trades |
| `losing_trades` | INTEGER | Number of losing trades |
| `win_rate` | DECIMAL(5,2) | Win rate percentage |
| `total_pnl` | DECIMAL(15,2) | Total profit/loss |
| `realized_pnl` | DECIMAL(15,2) | Realized PnL |
| `unrealized_pnl` | DECIMAL(15,2) | Unrealized PnL |
| `total_fees` | DECIMAL(10,2) | Total trading fees |
| `avg_fee_per_trade` | DECIMAL(10,4) | Average fee per trade |
| `buy_signals` | INTEGER | Number of buy signals |
| `sell_signals` | INTEGER | Number of sell signals |
| `hold_signals` | INTEGER | Number of hold signals |
| `sharpe_ratio` | DECIMAL(8,4) | Risk-adjusted return metric |
| `max_drawdown` | DECIMAL(8,4) | Maximum drawdown percentage |
| `volatility` | DECIMAL(8,4) | Portfolio volatility |
| `raw_data` | JSONB | Complete API response |
| `timestamp` | TIMESTAMP | When data was captured |
| `created_at` | TIMESTAMP | Record creation time |

### `ai_conversations` Table

Stores AI decision-making process:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `ai_model_id` | TEXT | Reference to ai_models table |
| `market_data` | JSONB | Market prices and indicators |
| `chain_of_thought` | TEXT | AI's reasoning process |
| `decision` | TEXT | BUY, SELL, HOLD, or CLOSE |
| `reasoning` | TEXT | Explanation for decision |
| `current_positions` | JSONB | AI's open positions |
| `target_symbol` | TEXT | Symbol being considered |
| `confidence` | DECIMAL(5,2) | Confidence level (0-100) |
| `raw_data` | JSONB | Complete API response |
| `timestamp` | TIMESTAMP | When data was captured |
| `created_at` | TIMESTAMP | Record creation time |

## 🔄 Automation Options

### Option 1: Manual Sync (Current)

Run the sync script manually when needed:
```bash
pnpm sync-advanced-data
```

### Option 2: Cron Job (Recommended)

Add to GitHub Actions workflow (`.github/workflows/sync-data.yml`):

```yaml
name: Sync Advanced Data

on:
  schedule:
    - cron: '*/3 * * * *' # Every 3 minutes
  workflow_dispatch: # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Sync data
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: pnpm sync-advanced-data
```

### Option 3: Vercel Cron (For Production)

Create `src/app/api/cron/sync-advanced/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { syncAnalytics, syncConversations, fetchAnalyticsData, fetchConversationsData } from '@/scripts/sync-advanced-data'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [analyticsData, conversationsData] = await Promise.all([
      fetchAnalyticsData(),
      fetchConversationsData()
    ])

    const analyticsResult = await syncAnalytics(analyticsData)
    const conversationsResult = await syncConversations(conversationsData)

    return NextResponse.json({
      success: true,
      analytics: analyticsResult,
      conversations: conversationsResult
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}
```

Then add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/sync-advanced",
    "schedule": "*/3 * * * *"
  }]
}
```

## 📈 Using the Data

### In Your Application

```typescript
import { createClient } from '@/lib/supabase/server'

// Get latest analytics
const supabase = createClient()
const { data: analytics } = await supabase
  .from('analytics_snapshots')
  .select('*')
  .order('timestamp', { ascending: false })
  .limit(1)

// Get AI conversations
const { data: conversations } = await supabase
  .from('ai_conversations')
  .select('*')
  .eq('decision', 'BUY')
  .order('confidence', { ascending: false })
  .limit(10)
```

### Via API Routes

The proxy routes provide cached access:

```typescript
// Fetch analytics (cached for 3 minutes)
const response = await fetch('/api/external/analytics')
const { data } = await response.json()

// Fetch conversations
const response = await fetch('/api/external/conversations')
const { data } = await response.json()
```

## 🎯 Next Steps

Now that you have the data infrastructure set up, refer to:

1. **`QUICK-ACTION-PLAN.md`** - Implementation roadmap for features
2. **`API-CONTENT-STRATEGY.md`** - Comprehensive content and monetization strategy

Key features to build:
- 📊 Decision Transparency Page (`/insights/decision-process`)
- 📝 Enhanced AI article generator (using new data)
- 📈 Advanced Analytics Dashboard (`/insights/advanced-analytics`)

## 🔍 Troubleshooting

### Sync Script Fails

**Error: `AI model not found`**
- Make sure you have AI models in your `ai_models` table
- Run the existing sync first: `POST /api/sync`

**Error: `Supabase connection failed`**
- Check `.env.local` has correct Supabase credentials
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)

**Error: `Failed to fetch from nof1.ai`**
- Check internet connection
- Verify nof1.ai is accessible: `curl https://nof1.ai/api/analytics`
- API might be temporarily down - retry later

### Tables Don't Exist

If you get `relation "analytics_snapshots" does not exist`:
1. The SQL migration wasn't applied
2. Go back to Step 1 and run the SQL in Supabase dashboard
3. Verify tables exist with:
   ```sql
   \dt analytics_snapshots
   \dt ai_conversations
   ```

### Type Errors

After schema changes, always run:
```bash
pnpm prisma generate
```

This regenerates the Prisma client with updated types.

## 📞 Support

- Check GitHub Issues: https://github.com/anthropics/claude-code/issues
- Review API docs: https://nof1.ai/api/docs (if available)
- Supabase docs: https://supabase.com/docs

---

**Version:** 1.0
**Last Updated:** 2025-10-27
**Compatibility:** Next.js 14, Prisma 6, Supabase
