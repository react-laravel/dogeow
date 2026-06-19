'use client'

import { Bookmark, BookmarkCheck, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BookChapterMeta } from '../utils/parseBook'
import { type ReaderSettings, getReaderToolbarTheme } from '../hooks/useReaderSettings'

interface ReaderToolbarProps {
  chapters: BookChapterMeta[]
  settings: ReaderSettings
  markCount: number
  onChapterChange: (chapterId: number) => void
  onAddBookmark: () => void
  onOpenMarks: () => void
  onOpenSettings: () => void
}

export function ReaderToolbar({
  chapters,
  settings,
  markCount,
  onChapterChange,
  onAddBookmark,
  onOpenMarks,
  onOpenSettings,
}: ReaderToolbarProps) {
  const toolbarTheme = getReaderToolbarTheme(settings.theme)
  const controlClass = toolbarTheme
    ? 'border-current/25 bg-transparent text-inherit shadow-none hover:bg-current/10'
    : undefined

  return (
    <header
      className={
        toolbarTheme
          ? 'fixed bottom-0 left-0 right-0 z-10 border-t backdrop-blur-sm'
          : 'border-border/60 bg-background/95 fixed bottom-0 left-0 right-0 z-10 border-t backdrop-blur-sm'
      }
      style={
        toolbarTheme
          ? { ...toolbarTheme.headerStyle, borderColor: toolbarTheme.borderColor }
          : undefined
      }
    >
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
        <Select
          value={String(settings.chapterId)}
          onValueChange={value => onChapterChange(Number(value))}
        >
          <SelectTrigger
            size="sm"
            className={`min-w-0 flex-1 basis-[min(100%,14rem)] ${controlClass ?? ''}`}
          >
            <SelectValue placeholder="选择章节" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {chapters.map(ch => (
              <SelectItem key={ch.id} value={String(ch.id)}>
                {ch.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={`gap-1.5 ${controlClass ?? ''}`}
            onClick={onAddBookmark}
            aria-label="添加当前位置书签"
          >
            <Bookmark className="h-4 w-4" />
            <span className="hidden sm:inline">书签</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={`relative gap-1.5 ${controlClass ?? ''}`}
            onClick={onOpenMarks}
            aria-label="打开书签与收藏"
          >
            <BookmarkCheck className="h-4 w-4" />
            <span className="hidden sm:inline">列表</span>
            {markCount > 0 ? (
              <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]">
                {markCount > 99 ? '99+' : markCount}
              </span>
            ) : null}
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className={`gap-1.5 ${controlClass ?? ''}`}
          onClick={onOpenSettings}
          aria-label="打开阅读设置"
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">设置</span>
        </Button>
      </div>
    </header>
  )
}
