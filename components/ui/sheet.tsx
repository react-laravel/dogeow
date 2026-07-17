'use client'

import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/helpers'

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  style,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[135] bg-black/55 backdrop-blur-[3px]',
        className
      )}
      style={{ top: 'var(--app-header-total-height, var(--app-header-height, 56px))', ...style }}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = 'right',
  style,
  overlayClassName,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left'
  overlayClassName?: string
}) {
  const safeAreaPosition: React.CSSProperties =
    side === 'right'
      ? { right: 'env(safe-area-inset-right, 0px)' }
      : side === 'left'
        ? { left: 'env(safe-area-inset-left, 0px)' }
        : {
            left: 'env(safe-area-inset-left, 0px)',
            right: 'env(safe-area-inset-right, 0px)',
          }

  return (
    <SheetPortal>
      <SheetOverlay className={overlayClassName} />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        style={{
          top:
            side === 'bottom'
              ? 'auto'
              : 'var(--app-header-total-height, var(--app-header-height, 56px))',
          ...safeAreaPosition,
          ...style,
        }}
        className={cn(
          'border-border/70 bg-popover/97 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-[140] flex flex-col gap-4 shadow-2xl backdrop-blur-xl transition ease-in-out data-[state=closed]:duration-200 data-[state=open]:duration-300',
          side === 'right' &&
            'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right right-0 bottom-0 w-[min(24rem,90vw)] border-l',
          side === 'left' &&
            'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left bottom-0 left-0 w-[min(24rem,90vw)] border-r',
          side === 'top' &&
            'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 h-auto max-h-[calc(100dvh-var(--app-header-total-height)-0.75rem)] overflow-y-auto overscroll-contain rounded-b-2xl border-b',
          side === 'bottom' &&
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 max-h-[calc(100dvh-var(--app-header-total-height)-0.75rem)] h-auto rounded-t-2xl border-t pb-[env(safe-area-inset-bottom)]',
          className
        )}
        {...props}
      >
        {children}
        {(side === 'right' || side === 'left') && (
          <div aria-hidden className="h-[env(safe-area-inset-bottom)] shrink-0" />
        )}
        <SheetPrimitive.Close className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring absolute top-3 right-3 flex size-8 items-center justify-center rounded-lg transition-colors before:absolute before:-inset-1.5 before:content-[''] focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">关闭</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-1.5 p-4', className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-foreground font-semibold', className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
