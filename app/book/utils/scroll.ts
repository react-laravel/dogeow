'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────

export interface ReadingPosition {
  scrollTop: number
}

export interface BookJumpTarget<ChapterId = string | number> {
  chapterId: ChapterId
  scrollTop: number
  pairIndex?: number | null
}

// ─── Scroll container detection ──────────────────────────────────────

function canScrollY(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el)
  const overflowY = style.overflowY
  return (
    (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
    el.scrollHeight > el.clientHeight
  )
}

/** Walk up the DOM to find the element that actually scrolls. */
export function findScrollingAncestor(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null

  let current: HTMLElement | null = el
  while (current) {
    if (canScrollY(current)) return current

    if (current.hasAttribute('data-scroll-container')) {
      return current
    }

    current = current.parentElement
  }

  const knownContainer =
    document.getElementById('main-scroll') ?? document.getElementById('main-container')
  if (knownContainer instanceof HTMLElement) return knownContainer

  return null
}

// ─── Reading position ────────────────────────────────────────────────

const READING_ANCHOR_RATIO = 0.28

/** Return the current scroll position. For pair-based books, pass `findPairIndex` to also capture the nearest pair. */
export function getReadingPosition(
  container: HTMLElement | null,
  findPairIndex?: (container: HTMLElement) => number | null
): ReadingPosition & { pairIndex: number | null } {
  if (!container) return { scrollTop: 0, pairIndex: null }

  const scrollContainer = findScrollingAncestor(container) ?? container
  const result: ReadingPosition & { pairIndex: number | null } = {
    scrollTop: scrollContainer.scrollTop,
    pairIndex: null,
  }

  if (findPairIndex) {
    result.pairIndex = findPairIndex(container)
  }

  return result
}

// ─── Element scrolling ───────────────────────────────────────────────

export function scrollElementIntoContainer(
  container: HTMLElement,
  element: HTMLElement,
  block: 'center' | 'start' = 'center'
): void {
  const elementTop = element.getBoundingClientRect().top
  const containerTop = container.getBoundingClientRect().top
  const delta = elementTop - containerTop

  if (block === 'center') {
    container.scrollTop += delta - (container.clientHeight - element.clientHeight) / 2
    return
  }

  container.scrollTop += delta
}

// ─── Jump scheduling ────────────────────────────────────────────────

const MAX_JUMP_ATTEMPTS = 20
const JUMP_RETRY_INTERVAL = 80

function findPairElement(container: HTMLElement, pairIndex: number): HTMLElement | null {
  for (let index = pairIndex; index >= 0; index--) {
    const node = container.querySelector<HTMLElement>(`[data-pair-index="${index}"]`)
    if (node) return node
  }
  return null
}

export function applyBookJump(container: HTMLElement, target: BookJumpTarget): void {
  const scrollContainer = findScrollingAncestor(container) ?? container

  if (target.pairIndex != null) {
    const pair = findPairElement(container, target.pairIndex)
    if (pair) {
      scrollElementIntoContainer(scrollContainer, pair, 'start')
      return
    }
  }

  scrollContainer.scrollTop = target.scrollTop
}

export function scheduleBookJump<ChapterId>(
  container: HTMLElement,
  target: BookJumpTarget<ChapterId>,
  onComplete?: () => void
): () => void {
  let attempts = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let cancelled = false

  const tryJump = () => {
    if (cancelled) return
    attempts++

    const scrollContainer = findScrollingAncestor(container)
    if (!scrollContainer) {
      onComplete?.()
      return
    }

    const viewportRect = scrollContainer.getBoundingClientRect()
    const viewportHeight = scrollContainer.clientHeight || viewportRect.height

    if (viewportHeight <= 0) {
      if (attempts < MAX_JUMP_ATTEMPTS) {
        timer = setTimeout(tryJump, JUMP_RETRY_INTERVAL)
        return
      }
    }

    if (target.pairIndex != null) {
      const pair = findPairElement(container, target.pairIndex)
      if (pair) {
        const elementRect = pair.getBoundingClientRect()

        if (elementRect.height > 0) {
          const elementOffset = elementRect.top - viewportRect.top
          const anchorOffset = viewportHeight * READING_ANCHOR_RATIO
          const targetScroll = scrollContainer.scrollTop + elementOffset - anchorOffset
          scrollContainer.scrollTop = Math.max(0, Math.round(targetScroll))

          onComplete?.()
          return
        }
      } else if (attempts < MAX_JUMP_ATTEMPTS) {
        timer = setTimeout(tryJump, JUMP_RETRY_INTERVAL)
        return
      }
    }

    if (target.scrollTop > 0) {
      scrollContainer.scrollTop = target.scrollTop
    }

    onComplete?.()
  }

  timer = setTimeout(() => {
    requestAnimationFrame(() => {
      if (!cancelled) tryJump()
    })
  }, 350)

  return () => {
    cancelled = true
    if (timer) clearTimeout(timer)
  }
}

// ─── Session storage for scroll positions ────────────────────────────

const SCROLL_STORAGE_PREFIX = 'dogeow-book-scroll'

export function saveScrollPosition(
  storageKey: string,
  chapterId: string | number,
  scrollTop: number
): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(`${SCROLL_STORAGE_PREFIX}:${storageKey}:${chapterId}`, String(scrollTop))
  } catch {
    // ignore
  }
}

export function getSavedScrollPosition(storageKey: string, chapterId: string | number): number {
  if (typeof window === 'undefined') return 0
  try {
    const saved = sessionStorage.getItem(`${SCROLL_STORAGE_PREFIX}:${storageKey}:${chapterId}`)
    return saved ? Number(saved) || 0 : 0
  } catch {
    return 0
  }
}

// ─── Auto-save scroll on scroll events ───────────────────────────────

export function useScrollSaver(
  contentRef: React.RefObject<HTMLDivElement | null>,
  storageKey: string,
  chapterId: string | number,
  debounceMs = 200
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onScroll = () => {
      if (!contentRef.current) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        const scrollEl = findScrollingAncestor(contentRef.current)
        saveScrollPosition(
          storageKey,
          chapterId,
          scrollEl?.scrollTop ?? contentRef.current?.scrollTop ?? 0
        )
      }, debounceMs)
    }

    const scrollEl = contentRef.current ? findScrollingAncestor(contentRef.current) : null
    const node = scrollEl || contentRef.current
    node?.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      node?.removeEventListener('scroll', onScroll)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [contentRef, storageKey, chapterId, debounceMs])
}
