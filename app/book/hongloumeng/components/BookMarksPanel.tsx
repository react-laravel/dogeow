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
      <SheetContent
        side="right"
        className="flex w-[min(75vw,34rem)] max-w-none flex-col gap-3 px-3 pt-4 pb-4 sm:w-[min(56vw,38rem)] sm:max-w-none md:px-4 lg:w-[min(42vw,42rem)]"
      >
        <SheetHeader className="p-0 pr-9">
          <SheetTitle>书签与收藏</SheetTitle>
          <SheetDescription className="text-xs">点击条目可跳转到对应章节位置</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
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
      <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <span>{title}</span>
          <span className="text-muted-foreground text-xs"> ({marks.length})</span>
        </div>
      </div>

      {marks.length === 0 ? (
        <p className="text-muted-foreground text-xs leading-relaxed">{emptyText}</p>
      ) : (
        <ul className="space-y-1.5">
          {marks.map(mark => (
            <li key={mark.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onJump(mark)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onJump(mark)
                  }
                }}
                className="hover:bg-muted/60 w-full rounded-md border px-2.5 py-1.5 text-left transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{mark.chapterTitle}</p>
                    {mark.excerpt ? (
                      <p className="text-muted-foreground mt-0.5 line-clamp-3 text-xs leading-relaxed">
                        {mark.excerpt}
                      </p>
                    ) : mark.pairIndex != null ? (
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        第 {mark.pairIndex + 1} 句
                      </p>
                    ) : (
                      <p className="text-muted-foreground mt-0.5 text-xs">阅读位置</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    aria-label="删除"
                    onClick={event => {
                      event.stopPropagation()
                      onRemove(mark.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
