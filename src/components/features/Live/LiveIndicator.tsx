'use client'

import { useEffect, useState } from 'react'

interface LiveIndicatorProps {
  lastUpdate?: Date
}

export function LiveIndicator({ lastUpdate }: LiveIndicatorProps) {
  const [secondsAgo, setSecondsAgo] = useState(0)

  useEffect(() => {
    if (!lastUpdate) return

    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - lastUpdate.getTime()) / 1000)
      setSecondsAgo(diff)
    }, 1000)

    return () => clearInterval(interval)
  }, [lastUpdate])

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="w-2 h-2 bg-danger rounded-full animate-pulse" />
          <div className="absolute inset-0 w-2 h-2 bg-danger rounded-full animate-ping" />
        </div>
        <span className="text-danger font-semibold text-sm">LIVE</span>
      </div>
      {lastUpdate && (
        <span className="text-text-muted text-sm">
          Updated {secondsAgo}s ago
        </span>
      )}
    </div>
  )
}
