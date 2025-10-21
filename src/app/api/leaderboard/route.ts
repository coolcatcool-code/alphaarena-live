import { NextResponse } from 'next/server'
import type { AISnapshot } from '@/types'

// 模拟数据（MVP阶段）
const mockSnapshots: AISnapshot[] = [
  {
    id: '1',
    aiModelId: 'deepseek-1',
    currentPnL: 40.5,
    totalAssets: 14050,
    openPositions: 3,
    winRate: 68.2,
    rank: 1,
    rankChange: 0,
    timestamp: new Date(),
    aiModel: {
      id: 'deepseek-1',
      name: 'DeepSeek',
      avatar: null,
      description: 'Open-source AI model',
      color: '#10B981',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  },
  {
    id: '2',
    aiModelId: 'claude-1',
    currentPnL: 12.3,
    totalAssets: 11230,
    openPositions: 2,
    winRate: 58.5,
    rank: 2,
    rankChange: 1,
    timestamp: new Date(),
    aiModel: {
      id: 'claude-1',
      name: 'Claude Sonnet',
      avatar: null,
      description: 'Anthropic Claude Sonnet 3.5',
      color: '#3B82F6',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  },
  {
    id: '3',
    aiModelId: 'chatgpt-1',
    currentPnL: -5.2,
    totalAssets: 9480,
    openPositions: 1,
    winRate: 45.8,
    rank: 3,
    rankChange: -1,
    timestamp: new Date(),
    aiModel: {
      id: 'chatgpt-1',
      name: 'ChatGPT',
      avatar: null,
      description: 'OpenAI GPT-4',
      color: '#8B5CF6',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  },
  {
    id: '4',
    aiModelId: 'qwen-1',
    currentPnL: -12.8,
    totalAssets: 8720,
    openPositions: 4,
    winRate: 38.2,
    rank: 4,
    rankChange: 0,
    timestamp: new Date(),
    aiModel: {
      id: 'qwen-1',
      name: 'Qwen',
      avatar: null,
      description: 'Alibaba Qwen',
      color: '#06B6D4',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  },
  {
    id: '5',
    aiModelId: 'grok-1',
    currentPnL: -28.5,
    totalAssets: 7150,
    openPositions: 2,
    winRate: 32.1,
    rank: 5,
    rankChange: 1,
    timestamp: new Date(),
    aiModel: {
      id: 'grok-1',
      name: 'Grok',
      avatar: null,
      description: 'xAI Grok',
      color: '#F59E0B',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  },
  {
    id: '6',
    aiModelId: 'gemini-1',
    currentPnL: -35.2,
    totalAssets: 6480,
    openPositions: 1,
    winRate: 28.7,
    rank: 6,
    rankChange: -1,
    timestamp: new Date(),
    aiModel: {
      id: 'gemini-1',
      name: 'Gemini',
      avatar: null,
      description: 'Google Gemini',
      color: '#EF4444',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }
]

export const revalidate = 300 // 5分钟缓存

export async function GET() {
  try {
    // MVP: 返回模拟数据
    // TODO: 后续接入真实数据抓取
    return NextResponse.json({
      data: mockSnapshots,
      timestamp: new Date().toISOString(),
      count: mockSnapshots.length,
      source: 'mock' // 标识数据来源
    })
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch leaderboard data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
