'use client'

import { useRef, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/helpers'
import type { BookTheme } from '@/app/book/types/reader'
import { getReaderUiStyle, useSystemColorScheme } from '@/app/book/utils/theme'

interface ReaderPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  theme?: BookTheme
  children: ReactNode
  footer?: ReactNode
  headerAction?: ReactNode
  className?: string
  bodyClassName?: string
}

/** 阅读器内的工具共用一个面板：手机底部展开，桌面右侧显示。 */
export function ReaderPanel({
  open,
  onOpenChange,
  title,
  description,
  theme = 'auto',
  children,
  footer,
  headerAction,
  className,
  bodyClassName,
}: ReaderPanelProps) {
  useSystemColorScheme()
  const openerRef = useRef<HTMLElement | null>(null)
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-x-0 bottom-0 top-[var(--app-header-total-height,56px)] z-[135] bg-black/30 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          onOpenAutoFocus={() => {
            openerRef.current = document.activeElement as HTMLElement | null
          }}
          onCloseAutoFocus={event => {
            if (openerRef.current?.isConnected) {
              event.preventDefault()
              openerRef.current.focus()
            }
          }}
          style={getReaderUiStyle(theme)}
          className={cn(
            'fixed inset-x-0 bottom-0 z-[140] flex max-h-[calc(100dvh-var(--app-header-total-height,56px)-1rem)] flex-col overflow-hidden rounded-t-3xl border border-border bg-background text-foreground shadow-2xl outline-none',
            'sm:inset-x-auto sm:right-5 sm:bottom-5 sm:top-[calc(var(--app-header-total-height,56px)+1.25rem)] sm:w-[26rem] sm:rounded-2xl',
            'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 motion-reduce:animate-none',
            className
          )}
        >
          <div
            aria-hidden
            className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-foreground/15 sm:hidden"
          />
          <div className="flex shrink-0 items-start gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0 flex-1 space-y-1">
              <Dialog.Title className="text-lg font-semibold tracking-tight">{title}</Dialog.Title>
              <Dialog.Description className="text-xs leading-5 text-muted-foreground">
                {description}
              </Dialog.Description>
            </div>
            {headerAction}
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="-mr-2 -mt-1 size-10 rounded-xl"
                aria-label={`关闭${title}`}
              >
                <X className="size-5" />
              </Button>
            </Dialog.Close>
          </div>
          <div
            className={cn(
              'min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5',
              bodyClassName
            )}
          >
            {children}
          </div>
          {footer ? (
            <div className="shrink-0 border-t border-border px-5 py-3">{footer}</div>
          ) : null}
          <div aria-hidden className="h-[env(safe-area-inset-bottom,0px)] shrink-0 sm:hidden" />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
