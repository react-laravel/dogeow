'use client'

import { useEffect, useRef, useState } from 'react'

/** Canvas 以容器的真实尺寸绘制，不能使用屏幕宽度撑开笔记页面。 */
export function useGraphSize() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 1, height: 1 })
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const update = () => {
      const rect = container.getBoundingClientRect()
      const width = Math.max(1, Math.floor(rect.width)),
        height = Math.max(1, Math.floor(rect.height))
      setSize(current =>
        current.width === width && current.height === height ? current : { width, height }
      )
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])
  return { containerRef, ...size }
}
