'use client'

import { Eye, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export interface BookMarkListItem {
  id: string
  kind: 'position' | 'collection'
  chapterId: string | number
  chapterTitle: string
  scrollTop: number
  pairIndex?: number | null
  excerpt?: string
}

interface BookMarksPanelProps {
  kind: 'position' | 'collection'
  open: boolean
  onOpenChange: (open: boolean) => void
  marks: BookMarkListItem[]
  onJump: (mark: BookMarkListItem) => void
  onRemove: (id: string) => void
  onAddCurrent?: () => void
}

const panelConfig = {
  position: {
    title: '展示',
    description: '点击条目可跳转到对应阅读位置',
    emptyText: '选中文字后点「展示」可保存位置。',
    addCurrentLabel: '记录当前位置',
    icon: Eye,
  },
  collection: {
    title: '收藏',
    description: '点击条目可跳转到对应章节位置',
    emptyText: '选中文字后，点「收藏」即可保存片段。',
    addCurrentLabel: null,
    icon: Star,
  },
} as const

export function BookMarksPanel({
  kind,
  open,
  onOpenChange,
  marks,
  onJump,
  onRemove,
  onAddCurrent,
}: BookMarksPanelProps) {
  const config = panelConfig[kind]
  const Icon = config.icon
  const filteredMarks = marks.filter(mark => mark.kind === kind)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[min(75vw,34rem)] max-w-none flex-col gap-3 px-3 pt-4 pb-4 sm:w-[min(56vw,38rem)] sm:max-w-none md:px-4 lg:w-[min(42vw,42rem)]"
      >
        <SheetHeader className="p-0 pr-9">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <SheetTitle className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                {config.title}
                <span className="text-muted-foreground text-sm font-normal">
                  ({filteredMarks.length})
                </span>
              </SheetTitle>
              <SheetDescription className="text-xs">{config.description}</SheetDescription>
            </div>
            {kind === 'position' && onAddCurrent ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={onAddCurrent}
              >
                {config.addCurrentLabel}
              </Button>
            ) : null}
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {filteredMarks.length === 0 ? (
            <p className="text-muted-foreground text-xs leading-relaxed">{config.emptyText}</p>
          ) : (
            <ul className="space-y-1.5">
              {filteredMarks.map(mark => (
                <li key={mark.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      onJump(mark)
                      onOpenChange(false)
                    }}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onJump(mark)
                        onOpenChange(false)
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
        </div>
      </SheetContent>
    </Sheet>
  )
}
