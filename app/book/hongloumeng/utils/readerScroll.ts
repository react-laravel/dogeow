/** 在指定滚动容器内定位元素，避免 scrollIntoView 误滚外层页面 */
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

export interface ReadingPosition {
  scrollTop: number
  pairIndex: number | null
}

export interface ReaderJumpTarget {
  chapterId: number
  scrollTop: number
  pairIndex: number | null
}

const READING_ANCHOR_RATIO = 0.28

/** 取当前阅读位置：定位视口内最接近阅读线的句块 */
export function getReadingPosition(container: HTMLElement | null): ReadingPosition {
  if (!container) return { scrollTop: 0, pairIndex: null }

  const scrollContainer = findScrollingAncestor(container) ?? container
  const viewportRect = scrollContainer.getBoundingClientRect()
  const viewportHeight = scrollContainer.clientHeight || viewportRect.height
  const anchorY = viewportRect.top + viewportHeight * READING_ANCHOR_RATIO
  const pairs = container.querySelectorAll('[data-pair-index]')

  let pairIndex: number | null = null
  let bestDistance = Infinity

  pairs.forEach(node => {
    if (!(node instanceof HTMLElement)) return

    const rect = node.getBoundingClientRect()
    if (rect.bottom < viewportRect.top || rect.top > viewportRect.bottom) return

    const centerY = rect.top + rect.height / 2
    const distance = Math.abs(centerY - anchorY)
    if (distance >= bestDistance) return

    const parsed = Number(node.getAttribute('data-pair-index'))
    if (!Number.isFinite(parsed)) return

    bestDistance = distance
    pairIndex = parsed
  })

  return {
    scrollTop: scrollContainer.scrollTop,
    pairIndex,
  }
}

/** 句块可能因阅读模式未渲染，回退到最近的可定位句块 */
export function findPairElement(container: HTMLElement, pairIndex: number): HTMLElement | null {
  for (let index = pairIndex; index >= 0; index--) {
    const node = container.querySelector(`[data-pair-index="${index}"]`)
    if (node instanceof HTMLElement) return node
  }

  return null
}

export function applyReaderJump(container: HTMLElement, target: ReaderJumpTarget): void {
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

const MAX_JUMP_ATTEMPTS = 20
const JUMP_RETRY_INTERVAL = 80

function canScrollY(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el)
  const overflowY = style.overflowY
  return (
    (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
    el.scrollHeight > el.clientHeight
  )
}

/** 找到实际滚动容器；优先用最近的容器，避免误滚外层页面 */
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

/**
 * 跳转到指定书签位置。
 * 章节内容和外层布局可能各自有滚动容器，所以这里始终先解析真实滚动容器。
 */
export function scheduleReaderJump(
  container: HTMLElement,
  target: ReaderJumpTarget,
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
