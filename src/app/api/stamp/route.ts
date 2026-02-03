import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_STAMPS_PER_HOUR = 10

type RateLimitEntry = { count: number; resetAt: number }
const rateLimit = new Map<string, RateLimitEntry>()

function checkRateLimit(userId: string) {
  const now = Date.now()
  const entry = rateLimit.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimit.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return { allowed: true }
  }
  if (entry.count >= MAX_STAMPS_PER_HOUR) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }
  entry.count += 1
  rateLimit.set(userId, entry)
  return { allowed: true }
}

function isPng(buffer: Buffer) {
  if (buffer.length < 8) return false
  return (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  )
}

export async function POST(request: NextRequest) {
  try {
    const { imageData, bounds, userId } = await request.json()

    if (!imageData || !bounds || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const rate = checkRateLimit(String(userId))
    if (!rate.allowed) {
      const retryAfter = Math.ceil((rate.retryAfterMs ?? 0) / 1000)
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    if (typeof imageData !== 'string' || !imageData.startsWith('data:image/png;base64,')) {
      return NextResponse.json({ error: 'Invalid image format (PNG only)' }, { status: 400 })
    }

    const base64Data = imageData.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    if (buffer.length > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 413 })
    }

    if (!isPng(buffer)) {
      return NextResponse.json({ error: 'Invalid PNG data' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const filename = `${userId}/${crypto.randomUUID()}.png`

    const { error: uploadError } = await supabase.storage.from('drawings').upload(filename, buffer, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: false
    })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicData } = supabase.storage.from('drawings').getPublicUrl(filename)
    const publicUrl = publicData.publicUrl

    const { data: drawing, error: dbError } = await supabase
      .from('drawings')
      .insert({
        user_id: userId,
        image_url: publicUrl,
        latitude: bounds.center.lat,
        longitude: bounds.center.long,
        bounds,
        enhanced: false
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    await supabase.from('activity').insert({
      drawing_id: drawing.id,
      user_id: userId,
      action: 'drawing_created',
      metadata: { location: bounds }
    })

    return NextResponse.json({ success: true, drawing })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to stamp drawing'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
