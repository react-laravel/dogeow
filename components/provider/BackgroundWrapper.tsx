'use client'

import React, { useEffect, useState } from 'react'
import { useBackgroundStore } from '@/stores/backgroundStore'
import { cn } from '@/lib/helpers'

interface BackgroundWrapperProps {
  children: React.ReactNode
}

export function BackgroundWrapper({ children }: BackgroundWrapperProps) {
  const { backgroundImage } = useBackgroundStore()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger fade-in after mount
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    })
  }, [])

  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col',
        backgroundImage && 'bg-background/76 backdrop-blur-[1px]',
        'transition-opacity duration-200',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
    >
      {children}
    </div>
  )
}
