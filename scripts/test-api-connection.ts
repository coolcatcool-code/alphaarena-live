/**
 * Test API Connection
 * Diagnose connection issues to nof1.ai
 */

import axios from 'axios'
import * as https from 'https'

const ANALYTICS_API = 'https://nof1.ai/api/analytics'

async function testConnection() {
  console.log('🔍 Testing connection to nof1.ai API...\n')

  // Test 1: Basic axios request
  console.log('Test 1: Basic axios request (60s timeout)')
  try {
    const response = await axios.get(ANALYTICS_API, {
      timeout: 60000,
      headers: {
        'User-Agent': 'AlphaArena-Test/1.0',
        'Accept': 'application/json'
      }
    })
    console.log('✅ Success!')
    console.log('Status:', response.status)
    console.log('Data length:', JSON.stringify(response.data).length)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log('❌ Failed:',error.code || error.message)
      if (error.response) {
        console.log('  Status:', error.response.status)
      }
    } else {
      console.log('❌ Failed:', error)
    }
  }

  console.log('\n' + '-'.repeat(60) + '\n')

  // Test 2: Axios with SSL verification disabled
  console.log('Test 2: Axios with SSL verification disabled')
  try {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false
    })

    const response = await axios.get(ANALYTICS_API, {
      timeout: 60000,
      httpsAgent,
      headers: {
        'User-Agent': 'AlphaArena-Test/1.0',
        'Accept': 'application/json'
      }
    })
    console.log('✅ Success!')
    console.log('Status:', response.status)
    console.log('Data length:', JSON.stringify(response.data).length)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log('❌ Failed:', error.code || error.message)
    } else {
      console.log('❌ Failed:', error)
    }
  }

  console.log('\n' + '-'.repeat(60) + '\n')

  // Test 3: Native Node.js HTTPS
  console.log('Test 3: Native Node.js https.get()')
  try {
    await new Promise((resolve, reject) => {
      const startTime = Date.now()

      https.get(ANALYTICS_API, {
        headers: {
          'User-Agent': 'AlphaArena-Test/1.0',
          'Accept': 'application/json'
        },
        timeout: 60000
      }, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
          console.log('✅ Success!')
          console.log('Status:', res.statusCode)
          console.log('Data length:', data.length)
          console.log('Time:', elapsed + 's')
          resolve(data)
        })
      }).on('error', (error) => {
        reject(error)
      }).on('timeout', () => {
        reject(new Error('Request timed out'))
      })
    })
  } catch (error) {
    console.log('❌ Failed:', error instanceof Error ? error.message : error)
  }

  console.log('\n' + '='.repeat(60))
  console.log('Test complete!')
}

testConnection()
