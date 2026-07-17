import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import type { PlayerControlButtonProps } from '../types'

// 控制按钮组件
export const PlayerControlButton = memo(
  ({ onClick, disabled, title, icon, className = 'h-9 w-9' }: PlayerControlButtonProps) => (
    <div className="shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className={`rounded-lg ${className}`}
        onClick={onClick}
        disabled={disabled}
        title={title}
        aria-label={title}
      >
        {icon}
      </Button>
    </div>
  )
)

PlayerControlButton.displayName = 'PlayerControlButton'
