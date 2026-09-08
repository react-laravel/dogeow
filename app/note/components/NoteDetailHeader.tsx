import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, ArrowLeft, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NoteDetailHeaderProps {
  title: string
  isDraft: boolean
  noteId: string | string[] | undefined
  onDelete: () => void
}

export const NoteDetailHeader = memo<NoteDetailHeaderProps>(
  ({ title, isDraft, noteId, onDelete }) => {
    const router = useRouter()

    return (
      <header className="mb-5 space-y-5 border-b border-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="ghost"
            className="h-11 gap-1.5 rounded-xl px-2 text-muted-foreground"
            onClick={() => router.back()}
            aria-label="返回"
          >
            <ArrowLeft className="size-4" />
            返回
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-11 rounded-xl shadow-none"
              onClick={() => {
                const id = Array.isArray(noteId) ? noteId[0] : noteId
                router.push(`/note/edit/${id}`)
              }}
              aria-label="编辑"
            >
              <Edit className="size-4" />
              编辑
            </Button>
            <Button
              variant="ghost"
              className="h-11 rounded-xl text-destructive"
              onClick={onDelete}
              aria-label="删除"
            >
              <Trash2 className="size-4" />
              删除
            </Button>
          </div>
        </div>
        <div className="min-w-0 space-y-2">
          <h1 className="break-words text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            {title}
          </h1>
          {isDraft && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3" />
              私密笔记
            </p>
          )}
        </div>
      </header>
    )
  }
)

NoteDetailHeader.displayName = 'NoteDetailHeader'

export default NoteDetailHeader
