'use client'

import { Eye, Pause, Play, Settings2, Square, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GroupedChapterPicker } from '@/app/book/components/GroupedChapterPicker'
import type { BookNarrationMode, BookNarrationStatus } from '@/app/book/types/narration'
import type { BookTheme } from '@/app/book/types/reader'
import { getBookToolbarTheme } from '@/app/book/utils/theme'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ReaderToolbarProps {
  chapters: { id: string; title: string }[]
  chapterGroups?: { label: string; chapters: { id: string; title: string }[] }[]
  currentChapterId: string
  settings: { theme: BookTheme }
  bookmarkCount: number
  collectionCount: number
  chapterSelectPlaceholder?: string
  onChapterChange: (chapterId: string) => void
  onOpenBookmarks: () => void
  onOpenCollections: () => void
  onOpenSettings: () => void
  narrationStatus: BookNarrationStatus
  narrationMode: BookNarrationMode
  onNarrationModeChange: (mode: BookNarrationMode) => void
  onStartNarration: () => void
  onPauseNarration: () => void
  onResumeNarration: () => void
  onStopNarration: () => void
  hideNarration?: boolean
  onPrevChapter?: () => void
  onNextChapter?: () => void
  hasPrevChapter?: boolean
  hasNextChapter?: boolean
}

export function ReaderToolbar({
  chapters,
  chapterGroups,
  currentChapterId,
  settings,
  bookmarkCount,
  collectionCount,
  onChapterChange,
  onOpenBookmarks,
  onOpenCollections,
  onOpenSettings,
  narrationStatus,
  narrationMode,
  onNarrationModeChange,
  onStartNarration,
  onPauseNarration,
  onResumeNarration,
  onStopNarration,
  hideNarration,
  onPrevChapter,
  onNextChapter,
  hasPrevChapter,
  hasNextChapter,
  chapterSelectPlaceholder = '选择章节',
}: ReaderToolbarProps) {
  const toolbarTheme = getBookToolbarTheme(settings.theme)
  const controlClass = toolbarTheme
    ? 'border-current/25 bg-transparent text-inherit shadow-none hover:bg-current/10'
    : undefined

  const selectedChapterTitle = chapterGroups?.length
    ? chapterGroups.flatMap(group => group.chapters).find(ch => ch.id === currentChapterId)?.title
    : chapters.find(ch => ch.id === currentChapterId)?.title

  const chapterPicker = chapterGroups?.length ? (
    <GroupedChapterPicker
      chapterGroups={chapterGroups}
      currentChapterId={currentChapterId}
      selectedTitle={selectedChapterTitle}
      placeholder={chapterSelectPlaceholder}
      controlClass={controlClass}
      onChapterChange={onChapterChange}
    />
  ) : (
    <Select value={currentChapterId} onValueChange={value => onChapterChange(value)}>
      <SelectTrigger
        size="sm"
        className={`min-w-0 flex-1 basis-[min(100%,14rem)] ${controlClass ?? ''}`}
      >
        <SelectValue placeholder={chapterSelectPlaceholder}>{selectedChapterTitle}</SelectValue>
      </SelectTrigger>
      <SelectContent
        side="top"
        sideOffset={8}
        className="max-h-[min(80dvh,36rem)] min-w-[var(--radix-select-trigger-width)]"
      >
        {chapters.map(ch => (
          <SelectItem key={ch.id} value={ch.id}>
            {ch.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

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
        {!hideNarration && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`h-8 w-8 p-0 shrink-0 ${controlClass ?? ''}`}
              onClick={onPrevChapter}
              disabled={!hasPrevChapter}
              aria-label="上一章"
            >
              ‹
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`h-8 w-8 p-0 shrink-0 ${controlClass ?? ''}`}
              onClick={onNextChapter}
              disabled={!hasNextChapter}
              aria-label="下一章"
            >
              ›
            </Button>
          </>
        )}

        {chapterPicker}

        <div className="flex items-center gap-1">
          {!hideNarration && (
            <>
              <Select
                value={narrationMode}
                onValueChange={value => onNarrationModeChange(value as BookNarrationMode)}
              >
                <SelectTrigger
                  size="sm"
                  className={`w-[6.25rem] shrink-0 ${controlClass ?? ''}`}
                  aria-label="选择朗读内容"
                >
                  <SelectValue placeholder="朗读" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">原文</SelectItem>
                  <SelectItem value="translation">译文</SelectItem>
                  <SelectItem value="both">全部</SelectItem>
                </SelectContent>
              </Select>
              {narrationStatus === 'idle' ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={`gap-1.5 ${controlClass ?? ''}`}
                  onClick={onStartNarration}
                  aria-label="从当前位置开始听书"
                >
                  <Play className="h-4 w-4" />
                  <span className="hidden sm:inline">听书</span>
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`gap-1.5 ${controlClass ?? ''}`}
                    onClick={narrationStatus === 'playing' ? onPauseNarration : onResumeNarration}
                    aria-label={narrationStatus === 'playing' ? '暂停听书' : '继续听书'}
                  >
                    {narrationStatus === 'playing' ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">
                      {narrationStatus === 'playing' ? '暂停' : '继续'}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`gap-1.5 ${controlClass ?? ''}`}
                    onClick={onStopNarration}
                    aria-label="停止听书"
                  >
                    <Square className="h-4 w-4" />
                    <span className="hidden sm:inline">停止</span>
                  </Button>
                </>
              )}
            </>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className={`relative gap-1.5 ${controlClass ?? ''}`}
            onClick={onOpenBookmarks}
            aria-label="打开展示列表"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">展示</span>
            {bookmarkCount > 0 ? (
              <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]">
                {bookmarkCount > 99 ? '99+' : bookmarkCount}
              </span>
            ) : null}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={`relative gap-1.5 ${controlClass ?? ''}`}
            onClick={onOpenCollections}
            aria-label="打开收藏列表"
          >
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">收藏</span>
            {collectionCount > 0 ? (
              <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]">
                {collectionCount > 99 ? '99+' : collectionCount}
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
