'use client'

import { memo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowUpRight, Clock3, Lock } from 'lucide-react'
import type { Note } from '../types/note'
import { formatDate, getNotePreviewText } from '../utils/noteUtils'

const NoteCard = memo(({ note }: { note: Note }) => {
  const preview = getNotePreviewText(note)
  return (
    <Link
      href={`/note/${note.id}`}
      className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="flex h-full min-w-0 flex-col gap-0 overflow-hidden rounded-2xl border-border/70 bg-card py-0 shadow-none transition-colors hover:border-primary/40 hover:bg-accent/20">
        <CardHeader className="gap-0 px-4 pt-4 pb-0">
          <div className="flex min-w-0 items-start gap-3">
            <h3 className="min-w-0 flex-1 break-words text-base font-semibold leading-6 line-clamp-2">
              {note.title || '(无标题)'}
            </h3>
            {note.is_draft && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                <Lock className="size-3" />
                私密
              </span>
            )}
            <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 px-4 pt-3 pb-4">
          <p className="min-h-12 break-words text-sm leading-6 text-muted-foreground line-clamp-3">
            {preview || <span className="italic">(无内容)</span>}
          </p>
          <p className="mt-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock3 className="size-3 shrink-0" />
            <span>更新于 {formatDate(note.updated_at)}</span>
          </p>
        </CardContent>
      </Card>
    </Link>
  )
})
NoteCard.displayName = 'NoteCard'
export default NoteCard
