'use client'

import { useEffect } from 'react'

/**
 * Locks the app's real scroll container (`#main-scroll`).
 * Radix Dialog only locks `document.body`, but this app scrolls inside
 * `#main-scroll` (see LayoutRenderer), so drawers must lock that node.
 */
export function useLockMainScroll(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') {
      return
    }

    const scroller =
      document.getElementById('main-scroll') ?? document.getElementById('main-container')
    if (!scroller) {
      return
    }

    const previousOverflowY = scroller.style.overflowY
    const previousOverscrollBehavior = scroller.style.overscrollBehavior

    scroller.style.overflowY = 'hidden'
    scroller.style.overscrollBehavior = 'none'

    const preventBackgroundTouch = (event: TouchEvent) => {
      const target = event.target
      if (
        target instanceof Element &&
        target.closest('[data-slot="sheet-content"], [data-slot="sheet-overlay"]')
      ) {
        return
      }
      event.preventDefault()
    }

    scroller.addEventListener('touchmove', preventBackgroundTouch, { passive: false })

    return () => {
      scroller.style.overflowY = previousOverflowY
      scroller.style.overscrollBehavior = previousOverscrollBehavior
      scroller.removeEventListener('touchmove', preventBackgroundTouch)
    }
  }, [locked])
}
