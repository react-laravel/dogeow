import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, Loader2, Lock, Unlock } from 'lucide-react'
import { cn } from '@/lib/helpers'

interface NoteEditorToolbarProps {
  title: string
  isPrivate: boolean
  isSaving: boolean
  onTitleChange: (value: string) => void
  onSave: () => void
  onTogglePrivacy: () => void
  className?: string
}

export const NoteEditorToolbar = memo<NoteEditorToolbarProps>(
  ({ title, isPrivate, isSaving, onTitleChange, onSave, onTogglePrivacy, className }) => {
    const canAct = Boolean(title.trim()) && !isSaving

    return (
      <div
        className={cn(
          'border-border/60 bg-card sticky top-0 z-10 mb-4 flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center rounded-2xl border p-3 shadow-none',
          className
        )}
      >
        <Input
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="笔记标题"
          aria-label="笔记标题"
          disabled={isSaving}
          className="h-11 min-w-0 flex-1 border-0 bg-transparent px-2 text-lg font-medium shadow-none focus-visible:ring-0"
        />
        <div className="flex shrink-0 items-center justify-end gap-2">
          <Button
            onClick={onTogglePrivacy}
            variant="ghost"
            disabled={!canAct}
            className="text-muted-foreground hover:text-foreground h-11 gap-2 rounded-xl px-3"
            title={`${isPrivate ? '切换为公开' : '切换为私密'} (Ctrl+Shift+P)`}
            aria-label={isPrivate ? '切换为公开' : '切换为私密'}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPrivate ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
            <span>{isPrivate ? '私密' : '公开'}</span>
          </Button>
          <Button
            onClick={onSave}
            disabled={!canAct}
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 gap-2 rounded-xl px-3"
            title="保存 (Ctrl+S)"
            aria-label="保存笔记"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? '保存中' : '保存'}</span>
          </Button>
        </div>
      </div>
    )
  }
)

NoteEditorToolbar.displayName = 'NoteEditorToolbar'
