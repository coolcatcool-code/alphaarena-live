import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchNof1Leaderboard, fetchNof1Positions, fetchNof1Trades, transformLeaderboard, transformPositions, transformTrades } from '@/lib/nof1/client'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = createClient()

    // Fetch real-time data from nof1.ai
    let leaderboard, rawPositions, rawTrades

    try {
      const results = await Promise.all([
        fetchNof1Leaderboard(),
        fetchNof1Positions(),
        fetchNof1Trades()
      ])
      leaderboard = results[0].leaderboard
      rawPositions = results[1].positions
      rawTrades = results[2].trades
    } catch (fetchError) {
      console.error('Error fetching from nof1.ai:', fetchError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch data from nof1.ai',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

    // Transform data
    const snapshots = transformLeaderboard(leaderboard)
    const positions = transformPositions(rawPositions)
    const trades = transformTrades(rawTrades, 100)

    // Calculate position counts
    const positionCounts: Record<string, number> = {}
    positions.forEach(pos => {
      positionCounts[pos.aiModelId] = (positionCounts[pos.aiModelId] || 0) + 1
    })

    // 1. Sync Snapshots
    const snapshotsToInsert = snapshots.map(s => ({
      id: s.id,
      ai_model_id: s.aiModelId,
      current_pnl: s.currentPnL,
      total_assets: s.totalAssets,
      open_positions: positionCounts[s.aiModelId] || 0,
      win_rate: s.winRate,
      rank: s.rank,
      rank_change: s.rankChange,
      timestamp: new Date().toISOString()
    }))

    const { error: snapshotsError } = await supabase
      .from('snapshots')
      .upsert(snapshotsToInsert, { onConflict: 'id' })

    if (snapshotsError) {
      console.error('Error syncing snapshots:', snapshotsError)
      throw snapshotsError
    }

    // 2. Sync Positions (delete old, insert new)
    const { error: deleteError } = await supabase
      .from('positions')
      .delete()
      .eq('status', 'OPEN')

    if (deleteError) {
      console.error('Error deleting old positions:', deleteError)
    }

    const positionsToInsert = positions.map(p => ({
      id: p.id,
      ai_model_id: p.aiModelId,
      symbol: p.symbol,
      side: p.side,
      entry_price: p.entryPrice,
      current_price: p.currentPrice,
      size: p.size,
      leverage: p.leverage,
      pnl: p.pnl,
      pnl_percentage: p.pnlPercentage,
      status: p.status,
      opened_at: p.openedAt,
      closed_at: p.closedAt || null
    }))

    const { error: positionsError } = await supabase
      .from('positions')
      .insert(positionsToInsert)

    if (positionsError) {
      console.error('Error syncing positions:', positionsError)
      throw positionsError
    }

    // 3. Sync Trades (only insert new ones)
    const tradesToInsert = trades.map(t => ({
      id: t.id,
      ai_model_id: t.aiModelId,
      action: t.action,
      symbol: t.symbol,
      side: t.side,
      amount: t.amount,
      price: t.price,
      leverage: t.leverage,
      pnl: t.pnl,
      fee: t.fee,
      timestamp: t.timestamp
    }))

    const { error: tradesError } = await supabase
      .from('trades')
      .upsert(tradesToInsert, { onConflict: 'id', ignoreDuplicates: true })

    if (tradesError) {
      console.error('Error syncing trades:', tradesError)
      throw tradesError
    }

    return NextResponse.json({
      success: true,
      synced: {
        snapshots: snapshotsToInsert.length,
        positions: positionsToInsert.length,
        trades: tradesToInsert.length
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check sync status
export async function GET() {
  try {
    const supabase = createClient()

    const [
      { count: snapshotsCount },
      { count: positionsCount },
      { count: tradesCount }
    ] = await Promise.all([
      supabase.from('snapshots').select('*', { count: 'exact', head: true }),
      supabase.from('positions').select('*', { count: 'exact', head: true }),
      supabase.from('trades').select('*', { count: 'exact', head: true })
    ])

    return NextResponse.json({
      counts: {
        snapshots: snapshotsCount || 0,
        positions: positionsCount || 0,
        trades: tradesCount || 0
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
