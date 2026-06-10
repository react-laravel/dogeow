import { useEffect } from 'react'

const SCROLL_CONTAINER_IDS = ['main-scroll', 'main-container'] as const

/** 锁定应用级滚动容器，避免子页面（如商店）出现整体下拉滚动 */
export function useLockAppScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return

    const elements = SCROLL_CONTAINER_IDS.map(id => document.getElementById(id)).filter(
      (el): el is HTMLElement => el != null
    )

    if (elements.length === 0) return

    const previous = elements.map(el => ({
      el,
      overflow: el.style.overflow,
      overscrollBehavior: el.style.overscrollBehavior,
    }))

    elements.forEach(el => {
      el.style.overflow = 'hidden'
      el.style.overscrollBehavior = 'none'
    })

    return () => {
      previous.forEach(({ el, overflow, overscrollBehavior }) => {
        el.style.overflow = overflow
        el.style.overscrollBehavior = overscrollBehavior
      })
    }
  }, [locked])
}
