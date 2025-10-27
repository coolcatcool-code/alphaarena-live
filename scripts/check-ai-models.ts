/**
 * Check AI models in database
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkModels() {
  const { data, error } = await supabase
    .from('ai_models')
    .select('id, name')
    .order('name')

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log('\n📋 AI Models in database:\n')
  console.log('='.repeat(60))
  data?.forEach((model, idx) => {
    console.log(`${idx + 1}. ${model.name}`)
    console.log(`   ID: ${model.id}`)
    console.log('')
  })
  console.log('='.repeat(60))
  console.log(`Total: ${data?.length || 0} models\n`)
}

checkModels()
