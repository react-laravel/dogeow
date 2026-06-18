'use client'

import { BookOpen, Bookmark, BookmarkCheck, Minus, Plus, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import type { BookChapterMeta } from '../utils/parseBook'
import { PAIR_DISPLAY_LABELS } from '../utils/pairDisplay'
import {
  READER_CONTENT_MODE_LABELS,
  READER_FONT_LABELS,
  READER_THEME_LABELS,
  type PairDisplayMode,
  type ReaderContentMode,
  type ReaderFont,
  type ReaderSettings,
  type ReaderTheme,
} from '../hooks/useReaderSettings'

interface ReaderToolbarProps {
  bookTitle: string
  chapters: BookChapterMeta[]
  settings: ReaderSettings
  markCount: number
  onChapterChange: (chapterId: number) => void
  onPatchSettings: (patch: Partial<ReaderSettings>) => void
  onBumpFontSize: (delta: number) => void
  onAddBookmark: () => void
  onOpenMarks: () => void
}

export function ReaderToolbar({
  bookTitle,
  chapters,
  settings,
  markCount,
  onChapterChange,
  onPatchSettings,
  onBumpFontSize,
  onAddBookmark,
  onOpenMarks,
}: ReaderToolbarProps) {
  return (
    <header className="border-border/60 bg-background/90 sticky top-0 z-20 border-b backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <BookOpen className="text-muted-foreground h-4 w-4 shrink-0" />
          <span className="truncate text-sm font-medium">{bookTitle}</span>
        </div>

        <Select
          value={String(settings.chapterId)}
          onValueChange={value => onChapterChange(Number(value))}
        >
          <SelectTrigger size="sm" className="max-w-[min(100%,14rem)]">
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
            className="gap-1.5"
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
            className="relative gap-1.5"
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

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="缩小字号"
            onClick={() => onBumpFontSize(-1)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-muted-foreground w-8 text-center text-xs tabular-nums">
            {settings.fontSize}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="放大字号"
            onClick={() => onBumpFontSize(1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
              <Settings2 className="h-4 w-4" />
              阅读设置
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 space-y-4" align="end">
            <div className="space-y-2">
              <Label>字体</Label>
              <Select
                value={settings.fontFamily}
                onValueChange={value => onPatchSettings({ fontFamily: value as ReaderFont })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(READER_FONT_LABELS) as ReaderFont[]).map(key => (
                    <SelectItem key={key} value={key}>
                      {READER_FONT_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>字号</Label>
                <span className="text-muted-foreground text-xs">{settings.fontSize}px</span>
              </div>
              <Slider
                min={14}
                max={32}
                step={1}
                value={[settings.fontSize]}
                onValueChange={([fontSize]) => onPatchSettings({ fontSize })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>行距</Label>
                <span className="text-muted-foreground text-xs">
                  {settings.lineHeight.toFixed(1)}
                </span>
              </div>
              <Slider
                min={1.4}
                max={2.6}
                step={0.1}
                value={[settings.lineHeight]}
                onValueChange={([lineHeight]) => onPatchSettings({ lineHeight })}
              />
            </div>

            <div className="space-y-2">
              <Label>背景模式</Label>
              <Select
                value={settings.theme}
                onValueChange={value => onPatchSettings({ theme: value as ReaderTheme })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(READER_THEME_LABELS) as ReaderTheme[]).map(key => (
                    <SelectItem key={key} value={key}>
                      {READER_THEME_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>原文译文区分</Label>
              <Select
                value={settings.pairDisplayMode}
                onValueChange={value =>
                  onPatchSettings({ pairDisplayMode: value as PairDisplayMode })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PAIR_DISPLAY_LABELS) as PairDisplayMode[]).map(key => (
                    <SelectItem key={key} value={key}>
                      {PAIR_DISPLAY_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>阅读内容</Label>
              <Select
                value={settings.contentMode}
                onValueChange={value =>
                  onPatchSettings({ contentMode: value as ReaderContentMode })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(READER_CONTENT_MODE_LABELS) as ReaderContentMode[]).map(key => (
                    <SelectItem key={key} value={key}>
                      {READER_CONTENT_MODE_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
