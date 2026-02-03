'use client'

import { useEffect, useRef, useState } from 'react'
import { useActivityFeed, useLocationNameCache } from '@/lib/realtime'
import type { Activity } from '@/types/activity'
import type { Bounds } from '@/lib/globe-utils'

function formatTimeAgo(timestamp: string) {
  const date = new Date(timestamp)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

async function resolveLocation(bounds?: Bounds, cache?: Map<string, string>) {
  if (!bounds) return 'Unknown location'
  const key = `${bounds.center.lat.toFixed(2)},${bounds.center.long.toFixed(2)}`
  if (cache?.has(key)) return cache.get(key) as string

  // Best-effort fallback without external calls
  const fallback = `${bounds.center.lat.toFixed(2)}°, ${bounds.center.long.toFixed(2)}°`
  cache?.set(key, fallback)
  return fallback
}

function formatActivityMessage(activity: Activity, location: string): string {
  switch (activity.action) {
    case 'drawing_created':
      return `New drawing near ${location}`
    case 'drawing_enhanced':
      return `AI-enhanced art near ${location}`
    default:
      return `Activity near ${location}`
  }
}

function ActivityItem({ activity }: { activity: Activity }) {
  const cache = useLocationNameCache()
  const [location, setLocation] = useState<string>('Loading...')

  useEffect(() => {
    const bounds = activity.metadata?.location as Bounds | undefined
    resolveLocation(bounds, cache).then(setLocation).catch(() => setLocation('Unknown location'))
  }, [activity, cache])

  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs">
        ART
      </div>
      <div className="flex-1">
        <p className="text-sm text-white/90">{formatActivityMessage(activity, location)}</p>
        <span className="text-xs text-white/40">{formatTimeAgo(activity.created_at)}</span>
      </div>
    </div>
  )
}

export default function ActivityFeed() {
  const activities = useActivityFeed(50)
  const listRef = useRef<HTMLDivElement | null>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (!autoScroll || !listRef.current) return
    listRef.current.scrollTop = 0
  }, [activities, autoScroll])

  const handleScroll = () => {
    const list = listRef.current
    if (!list) return
    setAutoScroll(list.scrollTop < 20)
  }

  return (
    <aside className="hidden h-full w-[320px] shrink-0 flex-col gap-4 border-l border-white/10 bg-black/40 p-4 text-left backdrop-blur-sm lg:flex">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">Live Activity</h3>
        <span className="text-xs text-white/40">{activities.length} events</span>
      </div>
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex h-full flex-col gap-3 overflow-y-auto pr-2"
      >
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </aside>
  )
}
