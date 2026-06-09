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
          'border-border/60 bg-card/80 mb-4 flex items-center gap-2 rounded-2xl border p-2 shadow-sm backdrop-blur-sm',
          className
        )}
      >
        <Input
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="笔记标题"
          disabled={isSaving}
          className="h-11 flex-1 border-0 bg-transparent px-2 text-lg font-medium shadow-none focus-visible:ring-0"
        />
        <Button
          onClick={onTogglePrivacy}
          variant="ghost"
          size="icon"
          disabled={!canAct}
          className="text-muted-foreground hover:text-foreground h-10 w-10 shrink-0"
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
        </Button>
        <Button
          onClick={onSave}
          size="icon"
          disabled={!canAct}
          className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 shrink-0"
          title="保存 (Ctrl+S)"
          aria-label="保存笔记"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        </Button>
      </div>
    )
  }
)

NoteEditorToolbar.displayName = 'NoteEditorToolbar'
