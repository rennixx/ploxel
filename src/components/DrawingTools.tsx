'use client'

import { useState } from 'react'

type Tool = 'pencil' | 'brush' | 'eraser'

interface DrawingToolsProps {
  currentTool: Tool
  currentColor: string
  brushSize: number
  onToolChange: (tool: Tool) => void
  onColorChange: (color: string) => void
  onBrushSizeChange: (size: number) => void
  onClear: () => void
}

const PRESET_COLORS = ['#000000', '#FFFFFF', '#FF0000', '#0000FF', '#00FF00', '#FFFF00']

export default function DrawingTools({
  currentTool,
  currentColor,
  brushSize,
  onToolChange,
  onColorChange,
  onBrushSizeChange,
  onClear
}: DrawingToolsProps) {
  const [confirmingClear, setConfirmingClear] = useState(false)

  const handleClear = () => {
    if (!confirmingClear) {
      setConfirmingClear(true)
      return
    }
    setConfirmingClear(false)
    onClear()
  }

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-black/70 p-4 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          {(['pencil', 'brush', 'eraser'] as Tool[]).map((tool) => (
            <button
              key={tool}
              type="button"
              onClick={() => onToolChange(tool)}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                currentTool === tool
                  ? 'border-neon-cyan text-neon-cyan'
                  : 'border-white/20 text-white/70 hover:border-white/40 hover:text-white'
              }`}
            >
              {tool === 'pencil' && 'Pencil'}
              {tool === 'brush' && 'Brush'}
              {tool === 'eraser' && 'Eraser'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs uppercase tracking-wide text-white/50">Color</label>
          <input
            type="color"
            value={currentColor}
            onChange={(event) => onColorChange(event.target.value)}
            className="h-9 w-9 cursor-pointer rounded border border-white/20 bg-transparent"
            aria-label="Select color"
          />
          <div className="flex items-center gap-1">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onColorChange(color)}
                className={`h-6 w-6 rounded-full border ${
                  currentColor.toLowerCase() === color.toLowerCase()
                    ? 'border-neon-cyan'
                    : 'border-white/20'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Pick ${color}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs uppercase tracking-wide text-white/50">Size</label>
          <input
            type="range"
            min={1}
            max={50}
            value={brushSize}
            onChange={(event) => onBrushSizeChange(Number(event.target.value))}
            className="w-36 accent-neon-cyan"
          />
          <span className="w-8 text-sm text-white/70">{brushSize}</span>
          <div
            className="rounded-full border border-white/20 bg-white/70"
            style={{ width: Math.max(6, brushSize), height: Math.max(6, brushSize) }}
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 transition hover:border-red-500 hover:text-red-200"
          >
            {confirmingClear ? 'Confirm clear' : 'Clear'}
          </button>
        </div>
      </div>
    </div>
  )
}
