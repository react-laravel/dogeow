import type { ReactNode } from 'react'
import { cn } from '@/lib/helpers'

export function NoteSectionHeader({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('mb-4 shrink-0 space-y-4 sm:mb-5', className)}>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </header>
  )
}
