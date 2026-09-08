import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function WordPageHeader({
  title,
  description,
  backHref,
  backLabel = '返回背单词首页',
  actions,
}: {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-start gap-3">
      {backHref && (
        <Button asChild variant="outline" size="icon" className="shrink-0">
          <Link href={backHref} aria-label={backLabel}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
      )}
      <div className="min-w-0 flex-1 basis-36">
        <h1 className="text-xl font-semibold tracking-tight break-words sm:text-2xl">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function StudyHeader({
  title,
  completed,
  total,
  description,
  backHref,
}: {
  title: string
  completed: number
  total: number
  description?: string
  backHref?: string
}) {
  const progress = total > 0 ? Math.min(100, Math.max(0, (completed / total) * 100)) : 0
  return (
    <div className="mb-5 space-y-4">
      <WordPageHeader
        title={title}
        description={description}
        backHref={backHref}
        actions={
          <span className="bg-muted rounded-lg px-3 py-2 text-sm tabular-nums">
            <strong>{completed}</strong>
            <span className="text-muted-foreground"> / {total}</span>
          </span>
        }
      />
      <div
        role="progressbar"
        aria-label={`${title}进度`}
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
        className="bg-muted h-1.5 overflow-hidden rounded-full"
      >
        <div
          className="bg-primary h-full rounded-full transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
