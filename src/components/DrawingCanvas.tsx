'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Bounds } from '@/lib/globe-utils'
import DrawingTools from '@/components/DrawingTools'

type Tool = 'pencil' | 'brush' | 'eraser'

interface DrawingCanvasProps {
  bounds: Bounds
  onComplete: (imageData: string) => void
  onCancel: () => void
}

interface DrawingState {
  tool: Tool
  color: string
  brushSize: number
  isDrawing: boolean
}

interface Point {
  x: number
  y: number
}

const CANVAS_SIZE = 1024

export default function DrawingCanvas({ bounds, onComplete, onCancel }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastPointRef = useRef<Point | null>(null)
  const pendingPointRef = useRef<Point | null>(null)

  const [state, setState] = useState<DrawingState>({
    tool: 'pencil',
    color: '#000000',
    brushSize: 8,
    isDrawing: false
  })

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  useEffect(() => {
    setupCanvas()
  }, [setupCanvas])

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height
    }
  }

  const drawToPoint = useCallback(
    (point: Point) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.lineWidth = state.brushSize
      ctx.strokeStyle = state.tool === 'eraser' ? '#ffffff' : state.color
      ctx.globalCompositeOperation = state.tool === 'eraser' ? 'destination-out' : 'source-over'

      if (state.tool === 'brush') {
        ctx.shadowColor = state.color
        ctx.shadowBlur = Math.max(2, state.brushSize * 0.25)
      } else {
        ctx.shadowBlur = 0
      }

      ctx.beginPath()
      const last = lastPointRef.current ?? point
      ctx.moveTo(last.x, last.y)
      ctx.lineTo(point.x, point.y)
      ctx.stroke()
      lastPointRef.current = point
    },
    [state.brushSize, state.color, state.tool]
  )

  const scheduleDraw = useCallback(() => {
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const point = pendingPointRef.current
      if (point) {
        drawToPoint(point)
        pendingPointRef.current = null
      }
    })
  }, [drawToPoint])

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = getPoint(event)
    if (!point) return
    event.currentTarget.setPointerCapture(event.pointerId)
    lastPointRef.current = point
    pendingPointRef.current = point
    setState((prev) => ({ ...prev, isDrawing: true }))
    scheduleDraw()
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!state.isDrawing) return
    const point = getPoint(event)
    if (!point) return
    pendingPointRef.current = point
    scheduleDraw()
  }

  const endDrawing = () => {
    setState((prev) => ({ ...prev, isDrawing: false }))
    lastPointRef.current = null
    pendingPointRef.current = null
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const exportDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas) return ''
    return canvas.toDataURL('image/png')
  }

  const handleStamp = () => {
    const imageData = exportDrawing()
    if (!imageData) return
    onComplete(imageData)
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <div className="rounded-2xl border border-white/10 bg-black/60 p-3 text-left text-xs uppercase tracking-wide text-white/50">
        Drawing bounds: N {bounds.north.toFixed(2)}°, S {bounds.south.toFixed(2)}°, E{' '}
        {bounds.east.toFixed(2)}°, W {bounds.west.toFixed(2)}°
      </div>

      <DrawingTools
        currentTool={state.tool}
        currentColor={state.color}
        brushSize={state.brushSize}
        onToolChange={(tool) => setState((prev) => ({ ...prev, tool }))}
        onColorChange={(color) => setState((prev) => ({ ...prev, color }))}
        onBrushSizeChange={(brushSize) => setState((prev) => ({ ...prev, brushSize }))}
        onClear={clearCanvas}
      />

      <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white shadow-lg">
        <canvas
          ref={canvasRef}
          className="h-[60vh] w-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrawing}
          onPointerLeave={endDrawing}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleStamp}
          className="rounded-lg border border-neon-cyan/40 px-4 py-2 text-sm text-neon-cyan transition hover:border-neon-cyan hover:text-white"
        >
          Stamp
        </button>
      </div>
    </section>
  )
}
