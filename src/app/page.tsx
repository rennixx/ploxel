'use client'

import { useEffect, useMemo, useState } from 'react'
import Globe3D from '@/components/Globe3D'
import DrawingCanvas from '@/components/DrawingCanvas'
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
    <main className="min-h-screen bg-space-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-5xl font-semibold tracking-tight">Ploxel 3D</h1>
        <p className="mt-4 text-lg text-white/80">Draw on Earth, Share with the World</p>
        <div className="mt-10 h-[60vh] w-full overflow-hidden rounded-2xl border border-neon-cyan/30 bg-white/5">
          <Globe3D onRegionSelect={handleRegionSelect} />
        </div>
        {lastError ? <p className="mt-4 text-sm text-red-300">{lastError}</p> : null}
      </div>

      {selectedBounds ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-space-950/95 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Draw on this region</h2>
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
