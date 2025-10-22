import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mockSnapshots } from '@/lib/mock/data'

export const revalidate = 0 // 不缓存，始终读取最新数据

export async function GET() {
  try {
    const supabase = createClient()

    // 从Supabase读取snapshots和AI models
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('snapshots')
      .select(`
        *,
        aiModel:ai_models(*)
      `)
      .order('rank', { ascending: true })

    if (snapshotsError) {
      console.error('Supabase snapshots error:', snapshotsError)
      throw snapshotsError
    }

    // 转换数据格式
    const enrichedSnapshots = (snapshots || []).map(s => ({
      id: s.id,
      aiModelId: s.ai_model_id,
      currentPnL: Number(s.current_pnl),
      totalAssets: Number(s.total_assets),
      openPositions: s.open_positions,
      winRate: Number(s.win_rate),
      rank: s.rank,
      rankChange: s.rank_change,
      timestamp: new Date(s.timestamp),
      aiModel: {
        id: s.aiModel.id,
        name: s.aiModel.name,
        avatar: s.aiModel.avatar,
        description: s.aiModel.description,
        color: s.aiModel.color,
        createdAt: new Date(s.aiModel.created_at),
        updatedAt: new Date(s.aiModel.updated_at),
      }
    }))

    return NextResponse.json({
      data: enrichedSnapshots,
      timestamp: new Date().toISOString(),
      count: enrichedSnapshots.length,
      source: 'supabase' // 标记数据源为Supabase
    })
  } catch (error) {
    console.error('Supabase API error:', error)
    // 降级到 mock 数据
    return NextResponse.json({
      data: mockSnapshots,
      timestamp: new Date().toISOString(),
      count: mockSnapshots.length,
      source: 'mock-fallback'
    }, { status: 200 })
  }
}
