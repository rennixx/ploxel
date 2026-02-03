'use client'

import { useEffect, useMemo, useState } from 'react'
import Globe3D from '@/components/Globe3D'
import DrawingCanvas from '@/components/DrawingCanvas'
import ActivityFeed from '@/components/ActivityFeed'
import { calculateRegionBounds, type Bounds } from '@/lib/globe-utils'

const DEFAULT_RADIUS_KM = 200

export default function HomePage() {
  const [selectedBounds, setSelectedBounds] = useState<Bounds | null>(null)
  const [isStamping, setIsStamping] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  const guestId = useMemo(() => {
    if (typeof window === 'undefined') return 'guest'
    const key = 'ploxel_guest_id'
    const existing = window.localStorage.getItem(key)
    if (existing) return existing
    const fresh = `guest_${crypto.randomUUID()}`
    window.localStorage.setItem(key, fresh)
    return fresh
  }, [])

  useEffect(() => {
    if (!selectedBounds) return
    setLastError(null)
  }, [selectedBounds])

  const handleRegionSelect = (lat: number, long: number) => {
    const bounds = calculateRegionBounds(lat, long, DEFAULT_RADIUS_KM)
    setSelectedBounds(bounds)
  }

  const handleCancel = () => {
    setSelectedBounds(null)
  }

  const handleComplete = async (imageData: string) => {
    if (!selectedBounds || isStamping) return
    setIsStamping(true)
    setLastError(null)

    try {
      const response = await fetch('/api/stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
          bounds: selectedBounds,
          userId: guestId
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to stamp drawing')
      }

      setSelectedBounds(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error'
      setLastError(message)
    } finally {
      setIsStamping(false)
    }
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-space-950 text-white">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Ploxel 3D</h1>
          <p className="mt-0.5 text-sm text-white/60">Draw on Earth, Share with the World</p>
        </div>
        {lastError ? (
          <p className="rounded-lg bg-red-500/20 px-3 py-1.5 text-sm text-red-300">{lastError}</p>
        ) : null}
      </header>

      {/* Full-screen content: globe + sidebar */}
      <div className="flex min-h-0 flex-1">
        {/* Globe fills all remaining space */}
        <section className="relative min-w-0 flex-1" aria-label="3D Globe">
          <Globe3D onRegionSelect={handleRegionSelect} />
        </section>
        {/* Activity sidebar */}
        <ActivityFeed />
      </div>

      {/* Drawing modal */}
      {selectedBounds ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-space-950/95 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Draw on this region</h2>
              {isStamping ? (
                <span className="text-sm text-neon-cyan">Stamping...</span>
              ) : null}
            </div>
            <DrawingCanvas bounds={selectedBounds} onComplete={handleComplete} onCancel={handleCancel} />
          </div>
        </div>
      ) : null}
    </main>
  )
}
