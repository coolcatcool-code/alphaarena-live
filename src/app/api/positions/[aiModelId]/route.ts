import { NextResponse } from 'next/server'
import { mockPositions } from '@/lib/mock/data'

export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: Promise<{ aiModelId: string }> }
) {
  try {
    const { aiModelId } = await params

    const positions = mockPositions.filter(
      p => p.aiModelId === aiModelId && p.status === 'OPEN'
    )

    return NextResponse.json({
      data: positions,
      timestamp: new Date().toISOString(),
      count: positions.length,
    })
  } catch (error) {
    console.error('AI Positions API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch AI positions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
