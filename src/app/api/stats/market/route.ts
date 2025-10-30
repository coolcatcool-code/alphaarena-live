import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Market Statistics API - Provides real-time market statistics based on D1 database
 */
export async function GET(request: NextRequest) {
  try {
    // Get D1 database binding
    const env = (request as any).env
    const db = env?.DB

    if (!db) {
      // If no D1 database, return mock data
      return NextResponse.json({
        totalTrades: 0,
        totalVolume: 60000,
        bestPerformer: 'DeepSeek',
        bestPerformance: 52.59,
        worstPerformer: 'Gemini',
        worstPerformance: -67.03,
        activeModels: 6,
        avgWinRate: 0
      })
    }

    // Query leaderboard data
    const leaderboardQuery = await db.prepare(`
      SELECT 
        model_id,
        num_trades,
        return_pct,
        equity,
        num_wins,
        num_losses
      FROM leaderboard_cache 
      WHERE model_id != ''
      ORDER BY return_pct DESC
    `).all()

    // Query trading data
    const tradesQuery = await db.prepare(`
      SELECT COUNT(*) as total_trades
      FROM recent_trades_cache
    `).first()

    // Query model performance data
    const performanceQuery = await db.prepare(`
      SELECT 
        model_id,
        total_trades,
        total_pnl,
        overall_win_rate
      FROM model_performance_cache
      WHERE model_id != ''
    `).all()

    const leaderboard = leaderboardQuery.results || []
    const totalTrades = tradesQuery?.total_trades || 0
    const performance = performanceQuery.results || []

    // Calculate statistical data
    const totalVolume = leaderboard.reduce((sum: number, item: any) => 
      sum + (item.equity || 0), 0
    )

    const best = leaderboard.length > 0 ? leaderboard[0] : null
    const worst = leaderboard.length > 0 ? leaderboard[leaderboard.length - 1] : null

    const avgWinRate = performance.length > 0 
      ? performance.reduce((sum: number, item: any) => sum + (item.overall_win_rate || 0), 0) / performance.length
      : 0

    const stats = {
      totalTrades: Number(totalTrades),
      totalVolume: Number(totalVolume),
      bestPerformer: best?.model_id || 'N/A',
      bestPerformance: Number(best?.return_pct || 0),
      worstPerformer: worst?.model_id || 'N/A',
      worstPerformance: Number(worst?.return_pct || 0),
      activeModels: leaderboard.length,
      avgWinRate: Number(avgWinRate)
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching market stats:', error)
    
    // Return default data
    return NextResponse.json({
      totalTrades: 0,
      totalVolume: 60000,
      bestPerformer: 'DeepSeek',
      bestPerformance: 52.59,
      worstPerformer: 'Gemini',
      worstPerformance: -67.03,
      activeModels: 6,
      avgWinRate: 0
    })
  }
}