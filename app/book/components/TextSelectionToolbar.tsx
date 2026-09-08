'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Bot, Bookmark, Play, Star, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/helpers'
import type { BookTheme } from '@/app/book/types/reader'
import { getReaderUiStyle } from '@/app/book/utils/theme'

export interface TextSelectionState {
  text: string
  pairIndex: number | null
  top: number
  left: number
}

interface TextSelectionToolbarProps {
  containerRef: React.RefObject<HTMLElement | null>
  onAddBookmark: (selection: TextSelectionState) => void
  onAddCollection: (selection: TextSelectionState) => void
  onAskAi: (selection: TextSelectionState) => void
  onPlaySelection?: (selection: TextSelectionState) => void
  showNarration?: boolean
  showAi?: boolean
  theme?: BookTheme
}

function getPairIndexFromNode(node: Node | null): number | null {
  if (!node) return null
  const element = node instanceof Element ? node : node.parentElement
  const section = element?.closest('[data-pair-index]')
  if (!section) return null
  const value = section.getAttribute('data-pair-index')
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getSelectionRect(range: Range): DOMRect | null {
  const rect = range.getBoundingClientRect()
  if (rect.width || rect.height) return rect

  for (const clientRect of Array.from(range.getClientRects())) {
    if (clientRect.width || clientRect.height) return clientRect
  }

  return null
}

export function TextSelectionToolbar({
  containerRef,
  onAddBookmark,
  onAddCollection,
  onAskAi,
  onPlaySelection,
  showNarration = false,
  showAi = true,
  theme = 'auto',
}: TextSelectionToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [selection, setSelection] = useState<TextSelectionState | null>(null)

  useLayoutEffect(() => {
    const toolbar = toolbarRef.current
    if (!toolbar || !selection) return
    const halfWidth = toolbar.getBoundingClientRect().width / 2
    const left = Math.max(
      12 + halfWidth,
      Math.min(window.innerWidth - 12 - halfWidth, selection.left)
    )
    toolbar.style.left = `${left}px`
  }, [selection])

  const hide = useCallback(() => setSelection(null), [])

  const updateSelection = useCallback(() => {
    const container = containerRef.current
    if (!container) {
      hide()
      return
    }

    const activeSelection = window.getSelection()
    if (!activeSelection || activeSelection.isCollapsed || activeSelection.rangeCount === 0) {
      hide()
      return
    }

    const text = activeSelection.toString().trim()
    if (!text) {
      hide()
      return
    }

    const range = activeSelection.getRangeAt(0)
    const commonNode = range.commonAncestorContainer
    if (!container.contains(commonNode)) {
      hide()
      return
    }

    const rect = getSelectionRect(range)
    if (!rect) {
      hide()
      return
    }

    setSelection({
      text,
      pairIndex: getPairIndexFromNode(commonNode),
      top: Math.max(12, rect.top - 48),
      left: rect.left + rect.width / 2,
    })
  }, [containerRef, hide])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let frame: number | undefined
    let timer: number | undefined
    const updateAfterSelectionSettles = () => {
      if (frame != null) cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      frame = requestAnimationFrame(updateSelection)
      timer = window.setTimeout(updateSelection, 80)
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide()
    }

    document.addEventListener('mouseup', updateAfterSelectionSettles)
    document.addEventListener('pointerup', updateAfterSelectionSettles)
    document.addEventListener('touchend', updateAfterSelectionSettles, { passive: true })
    document.addEventListener('selectionchange', updateAfterSelectionSettles)
    document.addEventListener('keyup', handleKeyUp)
    container.addEventListener('scroll', hide, { passive: true })

    return () => {
      if (frame != null) cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      document.removeEventListener('mouseup', updateAfterSelectionSettles)
      document.removeEventListener('pointerup', updateAfterSelectionSettles)
      document.removeEventListener('touchend', updateAfterSelectionSettles)
      document.removeEventListener('selectionchange', updateAfterSelectionSettles)
      document.removeEventListener('keyup', handleKeyUp)
      container.removeEventListener('scroll', hide)
    }
  }, [containerRef, hide, updateSelection])

  if (!selection) return null

  return (
    <div
      ref={toolbarRef}
      className="pointer-events-none fixed z-40 max-w-[calc(100vw-1.5rem)] -translate-x-1/2"
      style={{ ...getReaderUiStyle(theme), top: selection.top, left: selection.left }}
      role="toolbar"
      aria-label="选中文本操作"
    >
      <div className="bg-background text-foreground pointer-events-auto flex items-center gap-0.5 rounded-2xl border border-border p-1 shadow-lg">
        {showNarration && onPlaySelection ? (
          <ToolbarButton
            label="朗读"
            icon={Play}
            onClick={() => {
              onPlaySelection(selection)
              hide()
              window.getSelection()?.removeAllRanges()
            }}
          />
        ) : null}
        <ToolbarButton
          label="书签"
          icon={Bookmark}
          onClick={() => {
            onAddBookmark(selection)
            hide()
            window.getSelection()?.removeAllRanges()
          }}
        />
        <ToolbarButton
          label="收藏"
          icon={Star}
          onClick={() => {
            onAddCollection(selection)
            hide()
            window.getSelection()?.removeAllRanges()
          }}
        />
        {showAi && (
          <ToolbarButton
            label="问 AI"
            icon={Bot}
            onClick={() => {
              onAskAi(selection)
              hide()
              window.getSelection()?.removeAllRanges()
            }}
          />
        )}
      </div>
    </div>
  )
}

function ToolbarButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string
  icon: LucideIcon
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('h-10 rounded-xl px-2.5 text-xs')}
      onPointerDown={event => {
        if (event.pointerType === 'mouse') event.preventDefault()
        event.stopPropagation()
      }}
      onClick={event => {
        event.stopPropagation()
        onClick()
      }}
    >
      <Icon className="mr-1 h-3.5 w-3.5" />
      {label}
    </Button>
  )
}
