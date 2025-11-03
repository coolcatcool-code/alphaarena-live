/**
 * Manual Sync Trigger
 *
 * Manually triggers both sync-all and sync-advanced endpoints
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const WORKER_URL = process.env.WORKER_URL || 'https://www.alphaarena-live.com'
const CRON_SECRET = process.env.CRON_SECRET

async function triggerSync(endpoint: string, name: string) {
  console.log(`\n🔄 Triggering ${name}...`)
  console.log(`URL: ${WORKER_URL}${endpoint}`)

  if (!CRON_SECRET) {
    console.error('❌ CRON_SECRET not set in environment')
    console.log('Please set CRON_SECRET in your .env.local file')
    return false
  }

  try {
    const startTime = Date.now()
    const response = await fetch(`${WORKER_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json() as any
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log(`Status: ${response.status} (${elapsed}s)`)
    console.log('Response:', JSON.stringify(data, null, 2))

    if (response.ok) {
      console.log(`✅ ${name} completed successfully`)

      // Show detailed results if available
      if (data.analytics) {
        console.log(`   📊 Analytics: ${data.analytics.synced} synced, ${data.analytics.skipped} skipped`)
      }
      if (data.results) {
        console.log(`   📋 Tasks completed: ${data.results.length}`)
        data.results.forEach((r: any) => {
          if (r.status === 'success') {
            console.log(`      ✅ ${r.task}`)
          } else {
            console.log(`      ❌ ${r.task}: ${r.error}`)
          }
        })
      }

      return true
    } else {
      console.error(`❌ ${name} failed`)
      return false
    }
  } catch (error: any) {
    console.error(`❌ ${name} error:`, error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Manual Data Sync Script')
  console.log('=' .repeat(60))

  // 1. Trigger basic sync
  const basicSuccess = await triggerSync('/api/cron/sync-all', 'Basic Sync')

  // 2. Wait a bit
  console.log('\n⏳ Waiting 5 seconds before advanced sync...')
  await new Promise(resolve => setTimeout(resolve, 5000))

  // 3. Trigger advanced sync
  const advancedSuccess = await triggerSync('/api/cron/sync-advanced', 'Advanced Sync')

  console.log('\n' + '=' .repeat(60))
  console.log('📊 Sync Summary:')
  console.log(`   Basic Sync: ${basicSuccess ? '✅' : '❌'}`)
  console.log(`   Advanced Sync: ${advancedSuccess ? '✅' : '❌'}`)

  if (basicSuccess && advancedSuccess) {
    console.log('\n✨ All syncs completed! Run `pnpm exec tsx scripts/check-d1-data.ts` to verify.')
  }
}

main().catch(console.error)
