import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ANALYTICS_API = 'https://nof1.ai/api/analytics'
const API_TIMEOUT = 30000 // 30 seconds

/**
 * Model Analytics API - Fetches data directly from NOF1 API
 *
 * Returns comprehensive analytics data including:
 * - P&L statistics (avg, std, biggest gain/loss)
 * - Win rate analysis
 * - Signal statistics
 * - Holding period analysis
 * - Leverage usage
 * - Sharpe ratio
 * - And 50+ other metrics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { modelId: string } }
) {
  try {
    const { modelId } = params

    // Fetch analytics data from NOF1 API
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    const response = await fetch(ANALYTICS_API, {
      headers: {
        'User-Agent': 'AlphaArena/1.0',
        'Accept': 'application/json'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`NOF1 API returned ${response.status}`)
    }

    const data = await response.json() as { analytics: any[] }

    // Find the analytics for the requested model
    const modelAnalytics = data.analytics?.find((item: any) => {
      const itemModelId = item.model_id?.toLowerCase()
      const searchModelId = modelId.toLowerCase()

      // Direct match
      if (itemModelId === searchModelId) return true

      // Try common mappings
      const mappings: Record<string, string[]> = {
        'claude-1': ['claude-sonnet-4-5', 'claude-sonnet', 'claude'],
        'deepseek-1': ['deepseek-chat-v3.1', 'deepseek-chat', 'deepseek'],
        'gemini-1': ['gemini-2.5-pro', 'gemini-pro', 'gemini'],
        'chatgpt-1': ['gpt-5', 'gpt-4', 'chatgpt'],
        'grok-1': ['grok-4', 'grok'],
        'qwen-1': ['qwen3-max', 'qwen'],
      }

      for (const [dbId, apiIds] of Object.entries(mappings)) {
        if (searchModelId === dbId && apiIds.some(id => id === itemModelId)) {
          return true
        }
        if (apiIds.some(id => id === searchModelId) && itemModelId === dbId) {
          return true
        }
      }

      return false
    })

    if (!modelAnalytics) {
      return NextResponse.json(
        { error: `No analytics data found for model ${modelId}` },
        { status: 404 }
      )
    }

    // Extract data from the different breakdown tables
    const feeData = modelAnalytics.fee_pnl_moves_breakdown_table || {}
    const winnersLosers = modelAnalytics.winners_losers_breakdown_table || {}
    const signals = modelAnalytics.signals_breakdown_table || {}
    const longsShorts = modelAnalytics.longs_shorts_breakdown_table || {}
    const overview = modelAnalytics.overall_trades_overview_table || {}

    // Transform to our standard format
    const analytics = {
      modelId: modelId,
      updatedAt: new Date(modelAnalytics.updated_at * 1000).toISOString(),
      lastTradeExitTime: modelAnalytics.last_trade_exit_time
        ? new Date(modelAnalytics.last_trade_exit_time * 1000).toISOString()
        : null,
      lastConvoTimestamp: modelAnalytics.last_convo_timestamp
        ? new Date(modelAnalytics.last_convo_timestamp * 1000).toISOString()
        : null,

      // P&L Statistics
      pnl: {
        overallWithFees: feeData.overall_pnl_with_fees || 0,
        overallWithoutFees: feeData.overall_pnl_without_fees || 0,
        totalFeesPaid: feeData.total_fees_paid || 0,
        feesAsPctOfPnl: feeData.total_fees_as_pct_of_pnl || 0,
        avgNet: feeData.avg_net_pnl || 0,
        avgGross: feeData.avg_gross_pnl || 0,
        stdNet: feeData.std_net_pnl || 0,
        stdGross: feeData.std_gross_pnl || 0,
        biggestGain: winnersLosers.biggest_net_gain || 0,
        biggestLoss: winnersLosers.biggest_net_loss || 0,
      },

      // Win Rate Analysis
      winRate: {
        overall: winnersLosers.win_rate || 0,
        avgWinnersNetPnl: winnersLosers.avg_winners_net_pnl || 0,
        avgLosersNetPnl: winnersLosers.avg_losers_net_pnl || 0,
        stdWinnersNetPnl: winnersLosers.std_winners_net_pnl || 0,
        stdLosersNetPnl: winnersLosers.std_losers_net_pnl || 0,
      },

      // Trading Statistics
      trading: {
        totalTrades: overview.total_trades || 0,
        numLongTrades: longsShorts.num_long_trades || 0,
        numShortTrades: longsShorts.num_short_trades || 0,
        longShortRatio: longsShorts.long_short_trades_ratio || 0,
      },

      // Holding Period
      holdingPeriod: {
        avgMins: overview.avg_holding_period_mins || 0,
        medianMins: overview.median_holding_period_mins || 0,
        stdMins: overview.std_holding_period_mins || 0,
        avgLongs: longsShorts.avg_longs_holding_period || 0,
        avgShorts: longsShorts.avg_shorts_holding_period || 0,
      },

      // Trade Size
      tradeSize: {
        avgNotional: overview.avg_size_of_trade_notional || 0,
        medianNotional: overview.median_size_of_trade_notional || 0,
        stdNotional: overview.std_size_of_trade_notional || 0,
      },

      // Signal Statistics
      signals: {
        total: signals.total_signals || 0,
        numLong: signals.num_long_signals || 0,
        numShort: signals.num_short_signals || 0,
        numClose: signals.num_close_signals || 0,
        numHold: signals.num_hold_signals || 0,
        longPct: signals.long_signal_pct || 0,
        shortPct: signals.short_signal_pct || 0,
        closePct: signals.close_signal_pct || 0,
        holdPct: signals.hold_signal_pct || 0,
      },

      // Confidence
      confidence: {
        avg: signals.avg_confidence || 0,
        median: signals.median_confidence || 0,
        std: signals.std_confidence || 0,
        avgLong: signals.avg_confidence_long || 0,
        avgShort: signals.avg_confidence_short || 0,
        avgClose: signals.avg_confidence_close || 0,
      },

      // Leverage
      leverage: {
        avg: overview.avg_leverage || 0,
        median: overview.median_leverage || 0,
        avgConvo: overview.avg_convo_leverage || 0,
      },

      // Risk Metrics
      risk: {
        sharpeRatio: modelAnalytics.sharpe_ratio || 0,
      },

      // Time Distribution
      timeDistribution: {
        minsLongCombined: longsShorts.mins_long_combined || 0,
        minsShortCombined: longsShorts.mins_short_combined || 0,
        minsFlatCombined: longsShorts.mins_flat_combined || 0,
        pctMinsLong: longsShorts.pct_mins_long_combined || 0,
        pctMinsShort: longsShorts.pct_mins_short_combined || 0,
        pctMinsFlat: longsShorts.pct_mins_flat_combined || 0,
      },

      // Invocation Stats
      invocations: {
        total: modelAnalytics.num_invocations || 0,
        avgBreakMins: modelAnalytics.avg_invocation_break_mins || 0,
        minBreakMins: modelAnalytics.min_invocation_break_mins || 0,
        maxBreakMins: modelAnalytics.max_invocation_break_mins || 0,
      },

      // Raw data for debugging
      rawData: modelAnalytics,
    }

    return NextResponse.json({
      data: analytics,
      source: 'nof1-api-direct',
      timestamp: new Date().toISOString(),
    })

  } catch (error: any) {
    console.error(`Error fetching analytics for model ${params.modelId}:`, error)

    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - NOF1 API took too long to respond' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch analytics data from NOF1 API', details: error.message },
      { status: 500 }
    )
  }
}
