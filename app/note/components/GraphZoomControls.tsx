'use client'

import { memo } from 'react'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import type { ThemeColors } from '../types/graph'

interface GraphZoomControlsProps {
  themeColors: ThemeColors
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
}

export const GraphZoomControls = memo(function GraphZoomControls({
  themeColors,
  onZoomIn,
  onZoomOut,
  onFit,
}: GraphZoomControlsProps) {
  const buttonStyle = {
    backgroundColor: themeColors.card,
    borderColor: themeColors.border,
    color: themeColors.foreground,
  } as const

  return (
    <div
      className="absolute right-3 bottom-3 z-10 flex flex-col items-end gap-2"
      data-testid="graph-zoom-controls"
    >
      <p
        className="rounded-md border px-2 py-1 text-[11px] shadow-sm"
        style={{
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
          color: themeColors.mutedForeground,
        }}
      >
        滚轮缩放 · 拖拽平移
      </p>
      <div
        className="flex flex-col overflow-hidden rounded-lg border shadow-sm"
        style={buttonStyle}
      >
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center border-b transition-colors hover:opacity-80"
          style={{ borderColor: themeColors.border }}
          onClick={onZoomIn}
          aria-label="放大图谱"
          title="放大"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center border-b transition-colors hover:opacity-80"
          style={{ borderColor: themeColors.border }}
          onClick={onZoomOut}
          aria-label="缩小图谱"
          title="缩小"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center transition-colors hover:opacity-80"
          onClick={onFit}
          aria-label="适应画布"
          title="适应画布"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
})
