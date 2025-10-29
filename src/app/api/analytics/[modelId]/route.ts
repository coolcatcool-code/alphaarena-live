import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Model Analytics API - Provides 50+ professional quantitative metrics
 *
 * Returns comprehensive analytics data including:
 * - P&L statistics (avg, std, biggest gain/loss)
 * - Win rate analysis
 * - Signal statistics
 * - Holding period analysis
 * - Leverage usage
 * - Sharpe ratio
 * - Invocation stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { modelId: string } }
) {
  try {
    const { modelId } = params

    // Get D1 database binding
    const env = (request as any).env
    const db = env?.DB

    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Query analytics data from D1
    const analyticsQuery = await db.prepare(`
      SELECT
        model_id,
        updated_at,
        last_trade_exit_time,
        last_convo_timestamp,

        -- P&L Statistics
        overall_pnl_with_fees,
        overall_pnl_without_fees,
        total_fees_paid,
        total_fees_as_pct_of_pnl,
        avg_net_pnl,
        avg_gross_pnl,
        std_net_pnl,
        std_gross_pnl,
        biggest_net_gain,
        biggest_net_loss,

        -- Win Rate Analysis
        win_rate,
        avg_winners_net_pnl,
        avg_losers_net_pnl,
        std_winners_net_pnl,
        std_losers_net_pnl,

        -- Trading Statistics
        total_trades,
        num_long_trades,
        num_short_trades,
        long_short_trades_ratio,

        -- Holding Period
        avg_holding_period_mins,
        median_holding_period_mins,
        std_holding_period_mins,
        avg_longs_holding_period,
        avg_shorts_holding_period,

        -- Trade Size
        avg_size_of_trade_notional,
        median_size_of_trade_notional,
        std_size_of_trade_notional,

        -- Signal Statistics
        total_signals,
        num_long_signals,
        num_short_signals,
        num_close_signals,
        num_hold_signals,
        long_signal_pct,
        short_signal_pct,
        close_signal_pct,
        hold_signal_pct,

        -- Confidence
        avg_confidence,
        median_confidence,
        std_confidence,
        avg_confidence_long,
        avg_confidence_short,
        avg_confidence_close,

        -- Leverage
        avg_leverage,
        median_leverage,
        avg_convo_leverage,

        -- Sharpe Ratio
        sharpe_ratio,

        -- Time Distribution
        mins_long_combined,
        mins_short_combined,
        mins_flat_combined,
        pct_mins_long_combined,
        pct_mins_short_combined,
        pct_mins_flat_combined,

        -- Invocation Stats
        num_invocations,
        avg_invocation_break_mins,
        min_invocation_break_mins,
        max_invocation_break_mins,

        cached_at
      FROM model_analytics
      WHERE model_id = ?
      LIMIT 1
    `).bind(modelId).first()

    if (!analyticsQuery) {
      return NextResponse.json(
        { error: `No analytics data found for model ${modelId}` },
        { status: 404 }
      )
    }

    // Transform to readable format
    const analytics = {
      modelId: analyticsQuery.model_id,
      updatedAt: new Date(Number(analyticsQuery.updated_at) * 1000).toISOString(),
      lastTradeExitTime: analyticsQuery.last_trade_exit_time
        ? new Date(Number(analyticsQuery.last_trade_exit_time) * 1000).toISOString()
        : null,
      lastConvoTimestamp: analyticsQuery.last_convo_timestamp
        ? new Date(Number(analyticsQuery.last_convo_timestamp) * 1000).toISOString()
        : null,

      // P&L Statistics
      pnl: {
        overallWithFees: Number(analyticsQuery.overall_pnl_with_fees || 0),
        overallWithoutFees: Number(analyticsQuery.overall_pnl_without_fees || 0),
        totalFeesPaid: Number(analyticsQuery.total_fees_paid || 0),
        feesAsPctOfPnl: Number(analyticsQuery.total_fees_as_pct_of_pnl || 0),
        avgNet: Number(analyticsQuery.avg_net_pnl || 0),
        avgGross: Number(analyticsQuery.avg_gross_pnl || 0),
        stdNet: Number(analyticsQuery.std_net_pnl || 0),
        stdGross: Number(analyticsQuery.std_gross_pnl || 0),
        biggestGain: Number(analyticsQuery.biggest_net_gain || 0),
        biggestLoss: Number(analyticsQuery.biggest_net_loss || 0),
      },

      // Win Rate Analysis
      winRate: {
        overall: Number(analyticsQuery.win_rate || 0),
        avgWinnersNetPnl: Number(analyticsQuery.avg_winners_net_pnl || 0),
        avgLosersNetPnl: Number(analyticsQuery.avg_losers_net_pnl || 0),
        stdWinnersNetPnl: Number(analyticsQuery.std_winners_net_pnl || 0),
        stdLosersNetPnl: Number(analyticsQuery.std_losers_net_pnl || 0),
      },

      // Trading Statistics
      trading: {
        totalTrades: Number(analyticsQuery.total_trades || 0),
        numLongTrades: Number(analyticsQuery.num_long_trades || 0),
        numShortTrades: Number(analyticsQuery.num_short_trades || 0),
        longShortRatio: Number(analyticsQuery.long_short_trades_ratio || 0),
      },

      // Holding Period
      holdingPeriod: {
        avgMins: Number(analyticsQuery.avg_holding_period_mins || 0),
        medianMins: Number(analyticsQuery.median_holding_period_mins || 0),
        stdMins: Number(analyticsQuery.std_holding_period_mins || 0),
        avgLongs: Number(analyticsQuery.avg_longs_holding_period || 0),
        avgShorts: Number(analyticsQuery.avg_shorts_holding_period || 0),
      },

      // Trade Size
      tradeSize: {
        avgNotional: Number(analyticsQuery.avg_size_of_trade_notional || 0),
        medianNotional: Number(analyticsQuery.median_size_of_trade_notional || 0),
        stdNotional: Number(analyticsQuery.std_size_of_trade_notional || 0),
      },

      // Signal Statistics
      signals: {
        total: Number(analyticsQuery.total_signals || 0),
        numLong: Number(analyticsQuery.num_long_signals || 0),
        numShort: Number(analyticsQuery.num_short_signals || 0),
        numClose: Number(analyticsQuery.num_close_signals || 0),
        numHold: Number(analyticsQuery.num_hold_signals || 0),
        longPct: Number(analyticsQuery.long_signal_pct || 0),
        shortPct: Number(analyticsQuery.short_signal_pct || 0),
        closePct: Number(analyticsQuery.close_signal_pct || 0),
        holdPct: Number(analyticsQuery.hold_signal_pct || 0),
      },

      // Confidence
      confidence: {
        avg: Number(analyticsQuery.avg_confidence || 0),
        median: Number(analyticsQuery.median_confidence || 0),
        std: Number(analyticsQuery.std_confidence || 0),
        avgLong: Number(analyticsQuery.avg_confidence_long || 0),
        avgShort: Number(analyticsQuery.avg_confidence_short || 0),
        avgClose: Number(analyticsQuery.avg_confidence_close || 0),
      },

      // Leverage
      leverage: {
        avg: Number(analyticsQuery.avg_leverage || 0),
        median: Number(analyticsQuery.median_leverage || 0),
        avgConvo: Number(analyticsQuery.avg_convo_leverage || 0),
      },

      // Risk Metrics
      risk: {
        sharpeRatio: Number(analyticsQuery.sharpe_ratio || 0),
      },

      // Time Distribution
      timeDistribution: {
        minsLongCombined: Number(analyticsQuery.mins_long_combined || 0),
        minsShortCombined: Number(analyticsQuery.mins_short_combined || 0),
        minsFlatCombined: Number(analyticsQuery.mins_flat_combined || 0),
        pctMinsLong: Number(analyticsQuery.pct_mins_long_combined || 0),
        pctMinsShort: Number(analyticsQuery.pct_mins_short_combined || 0),
        pctMinsFlat: Number(analyticsQuery.pct_mins_flat_combined || 0),
      },

      // Invocation Stats
      invocations: {
        total: Number(analyticsQuery.num_invocations || 0),
        avgBreakMins: Number(analyticsQuery.avg_invocation_break_mins || 0),
        minBreakMins: Number(analyticsQuery.min_invocation_break_mins || 0),
        maxBreakMins: Number(analyticsQuery.max_invocation_break_mins || 0),
      },

      cachedAt: new Date(Number(analyticsQuery.cached_at) * 1000).toISOString(),
    }

    return NextResponse.json({
      data: analytics,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error(`Error fetching analytics for model ${params.modelId}:`, error)

    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
