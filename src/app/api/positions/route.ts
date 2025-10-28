import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mockPositions } from '@/lib/mock/data'

export const revalidate = 0

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: positions, error } = await supabase
      .from('positions')
      .select(`
        *,
        aiModel:ai_models(*)
      `)
      .eq('status', 'OPEN')
      .order('created_at', { ascending: false })

    if (error) throw error

    const enrichedPositions = (positions || []).map(p => ({
      id: p.id,
      aiModelId: p.ai_model_id,
      symbol: p.symbol,
      side: p.side,
      entryPrice: Number(p.entry_price),
      currentPrice: Number(p.current_price),
      size: Number(p.size),
      leverage: p.leverage,
      pnl: Number(p.pnl),
      pnlPercentage: Number(p.pnl_percentage),
      status: p.status,
      openedAt: new Date(p.opened_at),
      closedAt: p.closed_at ? new Date(p.closed_at) : undefined,
      aiModel: {
        id: p.aiModel.id,
        name: p.aiModel.name,
        avatar: p.aiModel.avatar,
        description: p.aiModel.description,
        color: p.aiModel.color,
        createdAt: new Date(p.aiModel.created_at),
        updatedAt: new Date(p.aiModel.updated_at),
      }
    }))

    return NextResponse.json({
      data: enrichedPositions,
      timestamp: new Date().toISOString(),
      count: enrichedPositions.length,
      source: 'supabase'
    })
  } catch (error) {
    console.error('Positions API error:', error)
    return NextResponse.json({
      data: mockPositions.filter(p => p.status === 'OPEN'),
      timestamp: new Date().toISOString(),
      count: mockPositions.filter(p => p.status === 'OPEN').length,
      source: 'mock-fallback'
    })
  }
}
