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

/** 取当前阅读位置：定位视口内最接近阅读线的句块 */
export function getReadingPosition(container: HTMLElement | null): ReadingPosition {
  if (!container) return { scrollTop: 0, pairIndex: null }

  const containerRect = container.getBoundingClientRect()
  const anchorY = containerRect.top + container.clientHeight * 0.28
  const pairs = container.querySelectorAll('[data-pair-index]')

  let pairIndex: number | null = null
  let bestDistance = Infinity

  pairs.forEach(node => {
    if (!(node instanceof HTMLElement)) return

    const rect = node.getBoundingClientRect()
    if (rect.bottom < containerRect.top || rect.top > containerRect.bottom) return

    const centerY = rect.top + rect.height / 2
    const distance = Math.abs(centerY - anchorY)
    if (distance >= bestDistance) return

    const parsed = Number(node.getAttribute('data-pair-index'))
    if (!Number.isFinite(parsed)) return

    bestDistance = distance
    pairIndex = parsed
  })

  return {
    scrollTop: container.scrollTop,
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
  if (target.pairIndex != null) {
    const pair = findPairElement(container, target.pairIndex)
    if (pair) {
      scrollElementIntoContainer(container, pair, 'center')
      return
    }
  }

  container.scrollTop = target.scrollTop
}

const MAX_JUMP_ATTEMPTS = 16

/** 章节渲染完成后多次尝试，避免 DOM 尚未就绪导致跳转失败 */
export function scheduleReaderJump(
  container: HTMLElement,
  target: ReaderJumpTarget,
  onComplete?: () => void
): () => void {
  let attempts = 0
  let frame = 0
  let cancelled = false

  const tick = () => {
    if (cancelled) return
    attempts++

    if (target.pairIndex != null) {
      const pair = findPairElement(container, target.pairIndex)
      if (pair) {
        scrollElementIntoContainer(container, pair, 'center')
        onComplete?.()
        return
      }
    } else {
      container.scrollTop = target.scrollTop
      onComplete?.()
      return
    }

    if (attempts >= MAX_JUMP_ATTEMPTS) {
      container.scrollTop = target.scrollTop
      onComplete?.()
      return
    }

    frame = requestAnimationFrame(tick)
  }

  frame = requestAnimationFrame(tick)

  return () => {
    cancelled = true
    cancelAnimationFrame(frame)
  }
}
