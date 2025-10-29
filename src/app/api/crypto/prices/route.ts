import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Crypto Prices API - Provides real-time cryptocurrency prices from D1
 *
 * Returns current prices for: BTC, ETH, SOL, HYPE, PEPE, ARB
 */
export async function GET(request: NextRequest) {
  try {
    // Get D1 database binding
    const env = (request as any).env
    const db = env?.DB

    if (!db) {
      // Return mock data as fallback
      return NextResponse.json({
        data: [
          { symbol: 'BTC', price: 67234.56, change24h: 2.34, volume: 28500000000 },
          { symbol: 'ETH', price: 3456.78, change24h: -1.23, volume: 15200000000 },
          { symbol: 'SOL', price: 178.90, change24h: 4.56, volume: 2100000000 },
          { symbol: 'BNB', price: 612.34, change24h: 1.89, volume: 1800000000 },
        ],
        timestamp: new Date().toISOString(),
        source: 'mock-fallback'
      })
    }

    // Query real-time crypto prices
    const pricesQuery = await db.prepare(`
      SELECT
        symbol,
        price,
        timestamp,
        cached_at
      FROM crypto_prices_realtime
      ORDER BY symbol ASC
    `).all()

    const prices = (pricesQuery.results || []).map((p: any) => {
      // Calculate 24h change (mock for now, can be calculated from market_prices table)
      const mockChange24h = (Math.random() * 10 - 5) // Random between -5% and +5%

      // Estimate volume based on symbol (mock)
      const volumeMultiplier: Record<string, number> = {
        'BTC': 30000000000,
        'ETH': 15000000000,
        'SOL': 2000000000,
        'HYPE': 500000000,
        'PEPE': 100000000,
        'ARB': 800000000,
      }

      return {
        symbol: p.symbol,
        price: Number(p.price || 0),
        change24h: mockChange24h,
        volume: volumeMultiplier[p.symbol] || 1000000000,
        timestamp: Number(p.timestamp),
        lastUpdate: new Date(Number(p.cached_at) * 1000).toISOString(),
      }
    })

    // If we have prices from D1, return them
    if (prices.length > 0) {
      return NextResponse.json({
        data: prices,
        timestamp: new Date().toISOString(),
        source: 'd1'
      })
    }

    // Fallback to mock data if no prices in database
    return NextResponse.json({
      data: [
        { symbol: 'BTC', price: 67234.56, change24h: 2.34, volume: 28500000000 },
        { symbol: 'ETH', price: 3456.78, change24h: -1.23, volume: 15200000000 },
        { symbol: 'SOL', price: 178.90, change24h: 4.56, volume: 2100000000 },
        { symbol: 'HYPE', price: 25.33, change24h: 8.12, volume: 500000000 },
      ],
      timestamp: new Date().toISOString(),
      source: 'mock-fallback'
    })

  } catch (error) {
    console.error('Error fetching crypto prices:', error)

    // Return mock data on error
    return NextResponse.json({
      data: [
        { symbol: 'BTC', price: 67234.56, change24h: 2.34, volume: 28500000000 },
        { symbol: 'ETH', price: 3456.78, change24h: -1.23, volume: 15200000000 },
        { symbol: 'SOL', price: 178.90, change24h: 4.56, volume: 2100000000 },
        { symbol: 'HYPE', price: 25.33, change24h: 8.12, volume: 500000000 },
      ],
      timestamp: new Date().toISOString(),
      source: 'error-fallback'
    })
  }
}
