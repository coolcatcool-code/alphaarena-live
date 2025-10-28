import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mockTrades } from '@/lib/mock/data'

export const revalidate = 0

export async function GET() {
  try {
    const supabase = createClient()

    const { data: trades, error } = await supabase
      .from('trades')
      .select(`
        *,
        aiModel:ai_models(*)
      `)
      .order('timestamp', { ascending: false })
      .limit(20)

    if (error) throw error

    const enrichedTrades = (trades || []).map(t => ({
      id: t.id,
      aiModelId: t.ai_model_id,
      action: t.action,
      symbol: t.symbol,
      side: t.side,
      amount: Number(t.amount),
      price: Number(t.price),
      leverage: t.leverage,
      pnl: Number(t.pnl),
      fee: Number(t.fee),
      timestamp: new Date(t.timestamp),
      aiModel: {
        id: t.aiModel.id,
        name: t.aiModel.name,
        avatar: t.aiModel.avatar,
        description: t.aiModel.description,
        color: t.aiModel.color,
        createdAt: new Date(t.aiModel.created_at),
        updatedAt: new Date(t.aiModel.updated_at),
      }
    }))

    return NextResponse.json({
      data: enrichedTrades,
      timestamp: new Date().toISOString(),
      count: enrichedTrades.length,
      source: 'supabase'
    })
  } catch (error) {
    console.error('Trades API error:', error)
    return NextResponse.json({
      data: mockTrades.slice(0, 20),
      timestamp: new Date().toISOString(),
      count: 20,
      source: 'mock-fallback'
    })
  }
}
