'use client'

import { Bookmark, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { BookMark } from '../types/marks'

interface BookMarksPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  marks: BookMark[]
  onJump: (mark: BookMark) => void
  onRemove: (id: string) => void
}

export function BookMarksPanel({
  open,
  onOpenChange,
  marks,
  onJump,
  onRemove,
}: BookMarksPanelProps) {
  const bookmarks = marks.filter(mark => mark.kind === 'position')
  const collections = marks.filter(mark => mark.kind === 'collection')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-4 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>书签与收藏</SheetTitle>
          <SheetDescription>点击条目可跳转到对应章节位置</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
          <MarkSection
            title="书签"
            emptyText="还没有书签，可在工具栏添加当前位置，或选中文字后添加。"
            marks={bookmarks}
            icon={Bookmark}
            onJump={mark => {
              onJump(mark)
              onOpenChange(false)
            }}
            onRemove={onRemove}
          />
          <MarkSection
            title="收藏"
            emptyText="选中文字后，点「收藏」即可保存片段。"
            marks={collections}
            icon={Star}
            onJump={mark => {
              onJump(mark)
              onOpenChange(false)
            }}
            onRemove={onRemove}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MarkSection({
  title,
  emptyText,
  marks,
  icon: Icon,
  onJump,
  onRemove,
}: {
  title: string
  emptyText: string
  marks: BookMark[]
  icon: typeof Bookmark
  onJump: (mark: BookMark) => void
  onRemove: (id: string) => void
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4" />
        <span>{title}</span>
        <span className="text-muted-foreground text-xs">({marks.length})</span>
      </div>

      {marks.length === 0 ? (
        <p className="text-muted-foreground text-xs leading-relaxed">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {marks.map(mark => (
            <li key={mark.id}>
              <button
                type="button"
                onClick={() => onJump(mark)}
                className="hover:bg-muted/60 w-full rounded-lg border px-3 py-2 text-left transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{mark.chapterTitle}</p>
                    {mark.excerpt ? (
                      <p className="text-muted-foreground mt-1 line-clamp-3 text-xs leading-relaxed">
                        {mark.excerpt}
                      </p>
                    ) : (
                      <p className="text-muted-foreground mt-1 text-xs">阅读位置</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    aria-label="删除"
                    onClick={event => {
                      event.stopPropagation()
                      onRemove(mark.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
