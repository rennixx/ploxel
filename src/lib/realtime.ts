import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Drawing } from '@/types/drawing'
import type { Activity } from '@/types/activity'
import type { Bounds } from '@/lib/globe-utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function getClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

export function useRealtimeStatus() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>(
    'connecting'
  )

  useEffect(() => {
    const supabase = getClient()
    setStatus('connecting')
    const channel = supabase.channel('status')
    channel.subscribe((state) => {
      if (state === 'SUBSCRIBED') setStatus('connected')
      if (state === 'CLOSED' || state === 'CHANNEL_ERROR') setStatus('disconnected')
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return status
}

export function useRealtimeDrawings() {
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [latestDrawing, setLatestDrawing] = useState<Drawing | null>(null)

  useEffect(() => {
    const supabase = getClient()

    const channel = supabase
      .channel('drawings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'drawings'
        },
        (payload) => {
          const newDrawing = payload.new as Drawing
          setDrawings((prev) => [newDrawing, ...prev])
          setLatestDrawing(newDrawing)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { drawings, latestDrawing }
}

export function useRegionalDrawings(bounds: Bounds | null) {
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const boundsRef = useRef(bounds)

  useEffect(() => {
    boundsRef.current = bounds
  }, [bounds])

  useEffect(() => {
    const supabase = getClient()

    const channel = supabase
      .channel('drawings-regional')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'drawings'
        },
        (payload) => {
          const newDrawing = payload.new as Drawing
          const current = boundsRef.current
          if (!current) return
          if (
            newDrawing.latitude <= current.north &&
            newDrawing.latitude >= current.south &&
            newDrawing.longitude <= current.east &&
            newDrawing.longitude >= current.west
          ) {
            setDrawings((prev) => [newDrawing, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return drawings
}

export function useActivityFeed(limit: number = 50) {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    const supabase = getClient()

    const bootstrap = async () => {
      const { data } = await supabase
        .from('activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (data) setActivities(data as Activity[])
    }

    bootstrap()

    const channel = supabase
      .channel('activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity'
        },
        (payload) => {
          const newActivity = payload.new as Activity
          setActivities((prev) => [newActivity, ...prev].slice(0, limit))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [limit])

  return activities
}

export function useLocationNameCache() {
  const cacheRef = useRef<Map<string, string>>(new Map())
  return useMemo(() => cacheRef.current, [])
}
