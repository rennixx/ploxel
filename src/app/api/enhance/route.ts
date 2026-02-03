import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { toFile } from 'openai/uploads'

export const runtime = 'nodejs'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_ENHANCE_PER_DAY = 3

type RateLimitEntry = { count: number; resetAt: number }
const rateLimit = new Map<string, RateLimitEntry>()

function checkDailyLimit(userKey: string) {
  const now = Date.now()
  const entry = rateLimit.get(userKey)
  if (!entry || now > entry.resetAt) {
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    rateLimit.set(userKey, { count: 1, resetAt: midnight.getTime() })
    return { allowed: true }
  }
  if (entry.count >= MAX_ENHANCE_PER_DAY) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }
  entry.count += 1
  rateLimit.set(userKey, entry)
  return { allowed: true }
}

function buildEnhancementPrompt(style?: string): string {
  const basePrompt =
    'Enhance this drawing to make it more artistic and visually appealing while maintaining the original content and intent.'

  if (!style || style === 'none') return basePrompt

  const stylePrompts: Record<string, string> = {
    watercolor: 'Transform into a beautiful watercolor painting.',
    pixelart: 'Convert to high-quality pixel art style.',
    sketch: 'Refine into a professional pencil sketch.',
    vibrant: 'Enhance with vibrant, saturated colors and bold lines.'
  }

  return stylePrompts[style] || basePrompt
}

export async function POST(request: NextRequest) {
  let originalImageData = ''
  try {
    const { imageData, style, userId } = await request.json()

    if (!imageData || typeof imageData !== 'string') {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 })
    }

    originalImageData = imageData

    const userKey =
      typeof userId === 'string' && userId.length > 0
        ? userId
        : request.headers.get('x-forwarded-for') || 'anonymous'

    const rate = checkDailyLimit(userKey)
    if (!rate.allowed) {
      const retryAfter = Math.ceil((rate.retryAfterMs ?? 0) / 1000)
      return NextResponse.json(
        { error: 'Daily enhancement limit reached', retryAfter },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    if (!imageData.startsWith('data:image/png;base64,')) {
      return NextResponse.json({ error: 'Invalid image format (PNG only)' }, { status: 400 })
    }

    const base64Data = imageData.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    if (buffer.length > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 413 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey })
    const prompt = buildEnhancementPrompt(style)
    const imageFile = await toFile(buffer, 'drawing.png', { type: 'image/png' })

    const enhancement = await Promise.race([
      openai.images.edit({
        model: 'gpt-image-1',
        image: imageFile,
        prompt,
        size: '1024x1024',
        user: userKey
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Enhancement timeout')), 30000)
      )
    ])

    const response = enhancement as Awaited<ReturnType<typeof openai.images.edit>>
    const b64 = response.data?.[0]?.b64_json

    if (!b64) {
      return NextResponse.json(
        { error: 'No enhanced image returned', enhancedImageData: imageData },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      enhancedImageData: `data:image/png;base64,${b64}`
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to enhance image'
    return NextResponse.json(
      { error: message, enhancedImageData: originalImageData || null },
      { status: 500 }
    )
  }
}
