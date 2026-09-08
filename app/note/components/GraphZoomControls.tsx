'use client'

import { memo } from 'react'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import type { ThemeColors } from '../types/graph'

interface GraphZoomControlsProps {
  themeColors: ThemeColors
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  /** When true, labels are in LOD hide mode — remind users dots are placeholders. */
  nodeCount?: number
  linkCount?: number
  labelsHidden?: boolean
}

export const GraphZoomControls = memo(function GraphZoomControls({
  themeColors,
  onZoomIn,
  onZoomOut,
  onFit,
  labelsHidden = false,
  nodeCount,
  linkCount,
}: GraphZoomControlsProps) {
  const surfaceStyle = {
    backgroundColor: themeColors.card,
    borderColor: themeColors.border,
    color: themeColors.foreground,
  } as const

  return (
    <div
      className="relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-background p-2"
      data-testid="graph-zoom-controls"
    >
      <div className="min-w-0 text-xs text-muted-foreground">
        {nodeCount != null && (
          <p className="tabular-nums">
            {nodeCount} 节点<span className="hidden sm:inline"> · {linkCount ?? 0} 条链接</span>
          </p>
        )}
        <p className="text-[10px] leading-4 text-muted-foreground" data-testid="graph-zoom-hint">
          <span className="md:hidden">{labelsHidden ? '放大查看名称' : '双指缩放 · 拖动'}</span>
          <span className="hidden md:inline">
            {labelsHidden ? '点位占位 · 点击放大查看标签' : '滚轮缩放 · 拖拽平移'}
          </span>
        </p>
      </div>
      <div
        className="flex items-stretch overflow-hidden rounded-lg border shadow-sm"
        style={surfaceStyle}
      >
        <button
          type="button"
          disabled={nodeCount === 0}
          className="flex h-11 w-11 items-center justify-center border-r transition-colors hover:opacity-80 disabled:pointer-events-none disabled:opacity-40"
          style={{ borderColor: themeColors.border }}
          onClick={onZoomOut}
          aria-label="缩小图谱"
          title="缩小"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={nodeCount === 0}
          className="flex h-11 w-11 items-center justify-center border-r transition-colors hover:opacity-80 disabled:pointer-events-none disabled:opacity-40"
          style={{ borderColor: themeColors.border }}
          onClick={onZoomIn}
          aria-label="放大图谱"
          title="放大"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={nodeCount === 0}
          className="flex h-11 items-center gap-1.5 px-3 text-xs font-medium transition-colors hover:opacity-80 disabled:pointer-events-none disabled:opacity-40"
          onClick={onFit}
          aria-label="适应画布"
          title="适应画布"
        >
          <Maximize2 className="h-3.5 w-3.5 shrink-0" />
          适应画布
        </button>
      </div>
    </div>
  )
})
