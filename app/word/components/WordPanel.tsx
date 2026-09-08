'use client'

import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/helpers'

export function WordPanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        {...(!description ? { 'aria-describedby': undefined } : {})}
        className={cn(
          'bg-card inset-x-0 top-auto bottom-0 flex max-h-[90dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-t-2xl rounded-b-none p-0 sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl',
          className
        )}
      >
        <DialogHeader className="shrink-0 border-b p-5 pr-12 text-left">
          <DialogTitle className="break-words">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
