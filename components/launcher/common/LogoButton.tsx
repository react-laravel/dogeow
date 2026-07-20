import React, { memo } from 'react'
import Image from 'next/image'
import Logo from '@/public/80.png'

interface LogoButtonProps {
  onClick: () => void
  className?: string
}

export const LogoButton = memo(({ onClick, className = 'size-10 sm:size-11' }: LogoButtonProps) => {
  return (
    <button
      type="button"
      className={`hover:bg-accent/70 flex shrink-0 items-center justify-center rounded-xl transition-colors ${className}`}
      onClick={onClick}
      aria-label="返回首页"
    >
      <Image
        src={Logo}
        alt="DogeOW"
        width={40}
        height={40}
        loading="eager"
        fetchPriority="high"
        className="h-[88%] w-[88%] object-contain"
      />
    </button>
  )
})

LogoButton.displayName = 'LogoButton'
