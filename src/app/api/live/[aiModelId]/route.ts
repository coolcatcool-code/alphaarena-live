import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: Promise<{ aiModelId: string }> }
) {
  try {
    const { aiModelId } = await params
    const supabase = await createClient()

    // Get AI model
    const { data: aiModel, error: aiError } = await supabase
      .from('ai_models')
      .select('*')
      .eq('id', aiModelId)
      .single()

    if (aiError || !aiModel) {
      return NextResponse.json(
        { error: 'AI Model not found' },
        { status: 404 }
      )
    }

    // Get snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from('snapshots')
      .select('*')
      .eq('ai_model_id', aiModelId)
      .single()

    if (snapshotError || !snapshot) {
      return NextResponse.json(
        { error: 'Snapshot not found' },
        { status: 404 }
      )
    }

    // Get positions
    const { data: positions, error: posError } = await supabase
      .from('positions')
      .select('*')
      .eq('ai_model_id', aiModelId)
      .eq('status', 'OPEN')
      .order('opened_at', { ascending: false })

    // Get recent trades
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('ai_model_id', aiModelId)
      .order('timestamp', { ascending: false })
      .limit(20)

    // Transform positions
    const transformedPositions = (positions || []).map(p => ({
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
    }))

    // Transform trades
    const recentTrades = (trades || []).map(t => ({
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
    }))

    // Calculate statistics
    const totalTrades = recentTrades.length
    const avgHoldTime = transformedPositions.length > 0
      ? transformedPositions.reduce((sum, p) => {
          const holdTime = (Date.now() - p.openedAt.getTime()) / (1000 * 60 * 60)
          return sum + holdTime
        }, 0) / transformedPositions.length
      : 0

    const assetCounts: Record<string, number> = {}
    recentTrades.forEach(t => {
      assetCounts[t.symbol] = (assetCounts[t.symbol] || 0) + 1
    })
    const favoriteAsset = Object.entries(assetCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

    const avgLeverage = transformedPositions.length > 0
      ? transformedPositions.reduce((sum, p) => sum + p.leverage, 0) / transformedPositions.length
      : 0

    return NextResponse.json({
      aiModel: {
        id: aiModel.id,
        name: aiModel.name,
        avatar: aiModel.avatar,
        description: aiModel.description,
        color: aiModel.color,
        createdAt: new Date(aiModel.created_at),
        updatedAt: new Date(aiModel.updated_at),
      },
      snapshot: {
        id: snapshot.id,
        aiModelId: snapshot.ai_model_id,
        currentPnL: Number(snapshot.current_pnl),
        totalAssets: Number(snapshot.total_assets),
        openPositions: transformedPositions.length,
        winRate: Number(snapshot.win_rate),
        rank: snapshot.rank,
        rankChange: snapshot.rank_change,
        timestamp: new Date(snapshot.timestamp),
      },
      positions: transformedPositions,
      recentTrades,
      stats: {
        totalTrades,
        avgHoldTime: Math.round(avgHoldTime * 10) / 10,
        favoriteAsset,
        avgLeverage: Math.round(avgLeverage * 10) / 10,
      },
      timestamp: new Date().toISOString(),
      source: 'supabase'
    })
  } catch (error) {
    console.error('AI Detail API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch AI detail',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
