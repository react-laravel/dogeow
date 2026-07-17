import * as React from 'react'

import { cn } from '@/lib/helpers'

// ✅ 显式导出类型供外部使用
export type CardProps = React.ComponentProps<'div'>
export type CardHeaderProps = React.ComponentProps<'div'>
export type CardTitleProps = React.ComponentProps<'div'>
export type CardDescriptionProps = React.ComponentProps<'div'>
export type CardActionProps = React.ComponentProps<'div'>

function Card({ className, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        'border-border/70 bg-card/85 text-card-foreground flex flex-col gap-4 rounded-2xl border py-5 shadow-[var(--surface-shadow)] backdrop-blur-xl',
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-5 has-[data-slot=card-action]:grid-cols-[1fr_auto] sm:px-6 [.border-b]:pb-5',
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: CardActionProps) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-5 sm:px-6', className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-5 sm:px-6 [.border-t]:pt-5', className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
