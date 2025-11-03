/**
 * Test Advanced Sync
 * Tests only the advanced sync endpoint with detailed output
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const WORKER_URL = process.env.WORKER_URL || 'https://www.alphaarena-live.com'
const CRON_SECRET = process.env.CRON_SECRET

async function testAdvancedSync() {
  console.log('🔬 Testing Advanced Sync Endpoint\n')
  console.log('=' .repeat(70))

  if (!CRON_SECRET) {
    console.error('❌ CRON_SECRET not set in environment')
    return
  }

  const url = `${WORKER_URL}/api/cron/sync-advanced`
  console.log(`URL: ${url}`)
  console.log(`Auth: Bearer ${CRON_SECRET.substring(0, 10)}...`)
  console.log('')

  try {
    const startTime = Date.now()

    console.log('⏳ Calling endpoint...')
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    })

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`✅ Response received (${elapsed}s)\n`)

    console.log('=' .repeat(70))
    console.log(`HTTP Status: ${response.status} ${response.statusText}`)
    console.log('=' .repeat(70))

    const contentType = response.headers.get('content-type')
    console.log(`Content-Type: ${contentType}\n`)

    // Get response as text first
    const text = await response.text()

    let data: any
    try {
      data = JSON.parse(text)
      console.log('📊 Response Data (JSON):\n')
      console.log(JSON.stringify(data, null, 2))
    } catch (parseError) {
      console.log('📄 Response Data (Raw Text):\n')
      console.log(text)
      data = { error: 'Not JSON', rawText: text }
    }

    console.log('\n' + '=' .repeat(70))

    if (response.ok) {
      console.log('✅ Advanced Sync Completed Successfully\n')

      if (data.analytics) {
        console.log('📊 Analytics Results:')
        console.log(`   Synced: ${data.analytics.synced}`)
        console.log(`   Skipped: ${data.analytics.skipped}`)
      }

      if (data.note) {
        console.log(`\n💡 Note: ${data.note}`)
      }
    } else {
      console.error('\n❌ Advanced Sync Failed')
      if (data.error) {
        console.error(`   Error: ${data.error}`)
      }
    }

  } catch (error: any) {
    console.error('\n❌ Request Failed:', error.message)
    if (error.stack) {
      console.error('\nStack Trace:')
      console.error(error.stack)
    }
  }
}

testAdvancedSync().catch(console.error)
