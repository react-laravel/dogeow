'use client'

import { useState } from 'react'
import { Bookmark, BookmarkPlus, Search, Star, Trash2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ReaderPanel } from './ReaderPanel'
import type { BookTheme } from '@/app/book/types/reader'

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
  theme?: BookTheme
}

export function BookMarksPanel({
  kind,
  open,
  onOpenChange,
  marks,
  onJump,
  onRemove,
  onAddCurrent,
  theme = 'auto',
}: BookMarksPanelProps) {
  const [query, setQuery] = useState('')
  const bookmark = kind === 'position'
  const title = bookmark ? '书签' : '收藏'
  const Icon = bookmark ? Bookmark : Star
  const all = marks.filter(mark => mark.kind === kind)
  const needle = query.trim().toLocaleLowerCase()
  const filtered = all.filter(mark =>
    `${mark.chapterTitle} ${mark.excerpt ?? ''}`.toLocaleLowerCase().includes(needle)
  )
  return (
    <ReaderPanel
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen) setQuery('')
        onOpenChange(nextOpen)
      }}
      title={title}
      description={
        bookmark
          ? `保存阅读位置，下次接着读 · ${all.length} 个书签`
          : `留下喜欢的文字，随时回看 · ${all.length} 条收藏`
      }
      theme={theme}
      bodyClassName="flex flex-col gap-4 overflow-hidden p-0"
    >
      <div className="space-y-3 px-5 pt-4">
        {bookmark && onAddCurrent && (
          <Button className="h-11 w-full rounded-xl shadow-none" onClick={onAddCurrent}>
            <BookmarkPlus className="size-4" />
            记录当前位置
          </Button>
        )}
        {all.length > 0 && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
            <Input
              aria-label={`搜索${title}`}
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="搜索章节或文字"
              className="h-11 rounded-xl bg-muted/40 pl-9 shadow-none"
            />
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
        {!filtered.length ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Icon className="size-6" />
            </span>
            <p className="text-sm font-medium">{needle ? '没有找到相关内容' : `还没有${title}`}</p>
            <p className="max-w-56 text-xs leading-6 text-muted-foreground">
              {needle
                ? '试试其他关键词，或清空搜索查看全部。'
                : bookmark
                  ? '记录当前位置，或选中文字添加书签。'
                  : '在正文中选中文字，点「收藏」即可保存。'}
            </p>
            {needle && (
              <Button variant="ghost" size="sm" onClick={() => setQuery('')}>
                清空搜索
              </Button>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map(mark => (
              <li
                key={mark.id}
                className="overflow-hidden rounded-2xl border border-border bg-muted/20"
              >
                <button
                  type="button"
                  onClick={() => {
                    onJump(mark)
                    setQuery('')
                    onOpenChange(false)
                  }}
                  className="block w-full p-4 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <span className="flex items-start gap-3">
                    <span className="min-w-0 flex-1 break-words text-sm font-medium leading-6">
                      {mark.chapterTitle}
                    </span>
                    <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  </span>
                  {mark.excerpt && (
                    <p className="mt-2 line-clamp-3 border-l-2 border-primary/25 pl-3 text-sm leading-7 text-muted-foreground">
                      {mark.excerpt}
                    </p>
                  )}
                </button>
                <div className="flex items-center justify-between border-t border-border px-4 py-1">
                  <span className="text-[11px] text-muted-foreground">
                    {mark.pairIndex != null ? `第 ${mark.pairIndex + 1} 段` : '已保存阅读位置'}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="-mr-2 size-10 rounded-xl text-muted-foreground hover:text-destructive"
                    aria-label={`删除${title}：${mark.chapterTitle}`}
                    onClick={() => onRemove(mark.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ReaderPanel>
  )
}
