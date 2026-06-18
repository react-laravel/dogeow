import { memo, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/helpers'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Render children alongside the spinner (e.g. overlay on content) */
  children?: ReactNode
  /** Full-page centered loading overlay */
  fullPage?: boolean
  /** Semi-transparent overlay covering parent content */
  overlay?: boolean
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export const LoadingState = memo(
  ({
    message = '加载中...',
    size = 'md',
    className,
    children,
    fullPage,
    overlay,
  }: LoadingStateProps) => {
    const containerClass = cn(
      fullPage &&
        'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
      overlay &&
        'absolute inset-0 z-40 flex items-center justify-center bg-background/60 backdrop-blur-sm',
      !fullPage && !overlay && 'flex items-center justify-center',
      className
    )

    return (
      <div className={containerClass} role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className={cn('text-muted-foreground animate-spin', sizeMap[size])} />
          {message && <span className="text-muted-foreground text-sm">{message}</span>}
        </div>
        {children}
      </div>
    )
  }
)

LoadingState.displayName = 'LoadingState'
