'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { asset } from '@/lib/helpers/assets'

const SCROLL_HEIGHT = 500
const DEFAULT_BOTTOM = -400
/** bfr.png 原始尺寸 48×316，按宽度等比缩放 */
const BFR_WIDTH = 22
const BFR_HEIGHT = Math.round((316 / 48) * BFR_WIDTH)

function getDisplayBottom(): number {
  if (typeof window === 'undefined') return 40
  const isMobile = window.matchMedia('(max-width: 1023px)').matches
  // 移动端预留底部导航栏高度，避免火箭被裁切
  return isMobile ? 88 : 40
}

function getScrollContainer(): Element | null {
  if (typeof document === 'undefined') return null
  return document.querySelector('[data-scroll-container]')
}

export function ScrollButton() {
  const [bottom, setBottom] = useState(DEFAULT_BOTTOM)
  const [delay, setDelay] = useState('1.5s')

  useEffect(() => {
    const el = getScrollContainer()
    if (!el) return

    const toggleVisible = () => {
      const scrolled = el.scrollTop
      if (scrolled > SCROLL_HEIGHT) {
        setBottom(getDisplayBottom())
        setDelay('1.5s')
      } else {
        setBottom(DEFAULT_BOTTOM)
        setDelay('3s')
      }
    }

    const handleResize = () => {
      if (el.scrollTop > SCROLL_HEIGHT) {
        setBottom(getDisplayBottom())
      }
    }

    toggleVisible()
    el.addEventListener('scroll', toggleVisible)
    window.addEventListener('resize', handleResize)
    return () => {
      el.removeEventListener('scroll', toggleVisible)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const scrollToTop = useCallback(() => {
    const el = getScrollContainer()
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="回到顶部"
      style={{
        position: 'fixed',
        right: 12,
        bottom,
        outline: 'none',
        transition: `bottom ${delay}`,
        cursor: 'pointer',
        zIndex: 60,
      }}
      onClick={scrollToTop}
      onKeyDown={e => e.key === 'Enter' && scrollToTop()}
    >
      <Image
        src={asset('/bfr.png')}
        width={BFR_WIDTH}
        height={BFR_HEIGHT}
        alt="回到顶部"
        className="block h-auto"
        style={{ width: BFR_WIDTH, height: 'auto' }}
      />
    </div>
  )
}
