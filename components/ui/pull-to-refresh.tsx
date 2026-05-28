'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/helpers'
import { LoadingSpinner } from './loading-spinner'

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void> | void
  className?: string
  disabled?: boolean
  threshold?: number
}

const MAX_PULL_DISTANCE = 120
const DRAG_FACTOR = 0.45
const DEFAULT_THRESHOLD = 72

export function PullToRefresh({
  children,
  onRefresh,
  className,
  disabled = false,
  threshold = DEFAULT_THRESHOLD,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [pulling, setPulling] = useState(false)

  const startYRef = useRef(0)
  const canPullRef = useRef(false)

  const resetPullState = useCallback(() => {
    setPullDistance(0)
    setPulling(false)
    canPullRef.current = false
    startYRef.current = 0
  }, [])

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (disabled || refreshing) return
      if (window.scrollY > 0) return

      const firstTouch = event.touches[0]
      if (!firstTouch) return

      canPullRef.current = true
      startYRef.current = firstTouch.clientY
      setPulling(true)
    },
    [disabled, refreshing]
  )

  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (!canPullRef.current) return

    const firstTouch = event.touches[0]
    if (!firstTouch) return

    const deltaY = firstTouch.clientY - startYRef.current
    if (deltaY <= 0) {
      setPullDistance(0)
      return
    }

    const nextDistance = Math.min(MAX_PULL_DISTANCE, deltaY * DRAG_FACTOR)
    setPullDistance(nextDistance)
    event.preventDefault()
  }, [])

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) {
      resetPullState()
      return
    }

    const shouldRefresh = pullDistance >= threshold
    resetPullState()

    if (!shouldRefresh) return

    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }, [onRefresh, pullDistance, pulling, resetPullState, threshold])

  const indicatorVisible = refreshing || pullDistance > 0
  const indicatorTranslateY = refreshing ? 12 : Math.max(-40, pullDistance - 40)
  const hintText = useMemo(() => {
    if (refreshing) return '刷新中...'
    if (pullDistance >= threshold) return '释放即可刷新'
    return '下拉刷新'
  }, [pullDistance, refreshing, threshold])

  return (
    <div
      data-testid="pull-to-refresh-root"
      className={cn('relative', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={resetPullState}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center transition-all duration-200"
        style={{
          transform: `translateY(${indicatorTranslateY}px)`,
          opacity: indicatorVisible ? 1 : 0,
        }}
      >
        <div className="bg-background/90 text-muted-foreground flex items-center gap-2 rounded-full border px-3 py-1 text-xs shadow-sm backdrop-blur-sm">
          {refreshing ? <LoadingSpinner size="sm" /> : <span aria-hidden="true">↓</span>}
          <span>{hintText}</span>
        </div>
      </div>

      <div
        className="transition-transform duration-200 will-change-transform"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  )
}
