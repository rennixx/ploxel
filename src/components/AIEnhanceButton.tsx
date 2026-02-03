'use client'

import { useMemo, useState } from 'react'

interface AIEnhanceButtonProps {
  imageData: string
  onEnhanced: (enhancedImageData: string) => void
  disabled?: boolean
}

const styles = [
  { id: 'none', name: 'Natural Enhancement', icon: 'NE' },
  { id: 'watercolor', name: 'Watercolor', icon: 'WC' },
  { id: 'pixelart', name: 'Pixel Art', icon: 'PX' },
  { id: 'sketch', name: 'Sketch', icon: 'SK' },
  { id: 'vibrant', name: 'Vibrant', icon: 'VB' }
]

export default function AIEnhanceButton({ imageData, onEnhanced, disabled }: AIEnhanceButtonProps) {
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [showStylePicker, setShowStylePicker] = useState(false)
  const [originalImage, setOriginalImage] = useState<string | null>(null)

  const canEnhance = useMemo(() => !disabled && !!imageData, [disabled, imageData])

  const handleEnhance = async (styleId: string) => {
    if (!canEnhance) return
    setIsEnhancing(true)

    try {
      if (!originalImage) setOriginalImage(imageData)
      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
          style: styleId
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to enhance image')
      }

      if (data?.enhancedImageData) {
        onEnhanced(data.enhancedImageData)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Enhancement failed'
      alert(message)
    } finally {
      setIsEnhancing(false)
      setShowStylePicker(false)
    }
  }

  const handleUndo = () => {
    if (!originalImage) return
    onEnhanced(originalImage)
    setOriginalImage(null)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowStylePicker(true)}
          disabled={!canEnhance || isEnhancing}
          className="rounded-lg border border-neon-cyan/40 px-4 py-2 text-sm text-neon-cyan transition hover:border-neon-cyan hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isEnhancing ? 'Enhancing...' : 'AI Enhance'}
        </button>
        {originalImage ? (
          <button
            type="button"
            onClick={handleUndo}
            className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
          >
            Undo
          </button>
        ) : null}
      </div>

      {showStylePicker ? (
        <div className="absolute bottom-12 right-0 z-20 w-64 rounded-2xl border border-white/10 bg-black/90 p-3 shadow-2xl backdrop-blur">
          <div className="mb-2 text-xs uppercase tracking-wide text-white/50">Choose a style</div>
          <div className="grid grid-cols-2 gap-2">
            {styles.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => handleEnhance(style.id)}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-2 py-2 text-left text-xs text-white/80 transition hover:border-neon-cyan/40 hover:text-white"
              >
                <span className="text-base">{style.icon}</span>
                <span>{style.name}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowStylePicker(false)}
            className="mt-3 w-full rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:text-white"
          >
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  )
}
