# GitHub Actions Cron Setup Guide

## Overview

This project uses GitHub Actions to automatically synchronize data from the NOF1 API to the Cloudflare D1 database every 5 minutes.

## Setup Steps

### 1. Set up CRON_SECRET in GitHub

You need to add the `CRON_SECRET` to both GitHub Secrets and Cloudflare environment variables.

#### Generate a Secret Key

First, generate a secure random secret key:

```bash
# Option 1: Using OpenSSL (recommended)
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://www.random.org/strings/
```

#### Add to GitHub Secrets

1. Go to your GitHub repository: https://github.com/coolcatcool-code/alphaarena-live
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `CRON_SECRET`
5. Value: Paste the secret key you generated
6. Click **Add secret**

#### Add to Cloudflare Environment Variables

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your `alphaarena-live` project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - Name: `CRON_SECRET`
   - Value: Same secret key as GitHub
   - Apply to: **Production** and **Preview**
5. Click **Save**

### 2. Verify the Workflow is Running

After adding the secret, the cron will automatically run every 5 minutes:

1. Go to **Actions** tab in your GitHub repository
2. Look for the "Sync Data Every 5 Minutes" workflow
3. You should see runs every 5 minutes

### 3. Manual Trigger

You can also trigger the sync manually:

1. Go to **Actions** → **Sync Data Every 5 Minutes**
2. Click **Run workflow**
3. Select branch (main) and click **Run workflow**

### 4. Monitor Sync Status

Check the workflow logs to see if data is syncing successfully:

```bash
# Expected output in logs:
Starting data sync at [timestamp]
HTTP Status: 200
Response: {"success":7,"failed":0,"totalDuration":...}
✅ Data sync completed successfully
```

## Troubleshooting

### Issue: 401 Unauthorized

**Cause**: CRON_SECRET mismatch or not set

**Solution**:
1. Verify the secret is identical in both GitHub and Cloudflare
2. Redeploy the Cloudflare Pages project to pick up the new environment variable
3. Re-run the GitHub Action

### Issue: 503 Database not available

**Cause**: D1 database binding not configured in Cloudflare

**Solution**:
1. Check `wrangler.toml` has the correct D1 binding
2. Verify the D1 database exists in your Cloudflare account
3. Redeploy the project

### Issue: Workflow not running every 5 minutes

**Cause**: GitHub Actions cron can be delayed during high traffic

**Solution**:
- This is normal GitHub behavior during peak times
- The workflow will catch up once resources are available
- Manual triggers always work immediately

## API Endpoints

The sync workflow calls:

```
GET https://alphaarena-live.pages.dev/api/cron/sync-all
Authorization: Bearer [CRON_SECRET]
```

This endpoint synchronizes:
- ✅ Leaderboard data → D1 `leaderboard_cache`
- ✅ Trade records → Supabase `trades` + D1 `recent_trades_cache`
- ✅ Analytics → Supabase `analytics_snapshots`
- ✅ Conversations → Supabase `ai_conversations`
- ✅ Account totals → Processing
- ✅ Since inception values → Processing
- ✅ Crypto prices → D1 `crypto_prices_cache`

## Next Steps

1. **Set up CRON_SECRET** (follow steps above)
2. **Wait for first sync** (runs automatically every 5 minutes)
3. **Verify data** on https://alphaarena-live.pages.dev
4. **Monitor workflow** in GitHub Actions tab

---

**Note**: The first sync may take 30-60 seconds to complete all 7 data sources. Subsequent syncs will be faster as only new data is fetched.
