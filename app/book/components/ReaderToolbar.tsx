'use client'

import { useState } from 'react'
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Headphones,
  List,
  Pause,
  Play,
  Settings2,
  Square,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/helpers'
import {
  ReaderChapterPanel,
  type ReaderChapter,
  type ReaderChapterGroup,
} from './ReaderChapterPanel'
import { ReaderNarrationPanel, type ReaderNarrationControls } from './ReaderNarrationPanel'
import type { BookTheme } from '@/app/book/types/reader'
import { getReaderUiStyle } from '@/app/book/utils/theme'

interface ReaderToolbarProps extends ReaderNarrationControls {
  chapters: ReaderChapter[]
  chapterGroups?: ReaderChapterGroup[]
  currentChapterId: string
  settings: { theme: BookTheme }
  bookmarkCount: number
  collectionCount: number
  chapterSelectPlaceholder?: string
  onChapterChange: (chapterId: string) => void
  onOpenBookmarks: () => void
  onOpenCollections: () => void
  onOpenSettings: () => void
  hideNarration?: boolean
  onPrevChapter?: () => void
  onNextChapter?: () => void
  hasPrevChapter?: boolean
  hasNextChapter?: boolean
}

export function ReaderToolbar(props: ReaderToolbarProps) {
  const {
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
    hideNarration,
    onPrevChapter,
    onNextChapter,
    hasPrevChapter,
    hasNextChapter,
    narrationStatus,
    onPauseNarration,
    onResumeNarration,
    onStopNarration,
    narrationPairIndex,
    narrationPairCount = 0,
    chapterSelectPlaceholder = '选择章节',
  } = props
  const [panel, setPanel] = useState<'chapters' | 'narration' | null>(null)
  const allChapters = chapterGroups?.length
    ? chapterGroups.flatMap(group => group.chapters)
    : chapters
  const chapterIndex = allChapters.findIndex(chapter => chapter.id === currentChapterId)
  const chapterTitle = allChapters[chapterIndex]?.title ?? chapterSelectPlaceholder
  const active = !hideNarration && narrationStatus !== 'idle'
  const actions = [
    {
      label: '目录',
      aria: '打开目录',
      icon: List,
      onClick: () => setPanel('chapters'),
      selected: panel === 'chapters',
      count: 0,
    },
    ...(!hideNarration
      ? [
          {
            label: '听书',
            aria: '打开听书控制',
            icon: Headphones,
            onClick: () => setPanel('narration'),
            selected: active || panel === 'narration',
            count: 0,
          },
        ]
      : []),
    {
      label: '书签',
      aria: '打开书签列表',
      icon: Bookmark,
      onClick: onOpenBookmarks,
      count: bookmarkCount,
    },
    {
      label: '收藏',
      aria: '打开收藏列表',
      icon: Star,
      onClick: onOpenCollections,
      count: collectionCount,
    },
    { label: '设置', aria: '打开阅读设置', icon: Settings2, onClick: onOpenSettings, count: 0 },
  ]
  return (
    <>
      <footer
        data-reader-toolbar
        aria-label="阅读工具栏"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background pb-[env(safe-area-inset-bottom,0px)] text-foreground sm:inset-x-4 sm:bottom-3 sm:mx-auto sm:max-w-3xl sm:rounded-2xl sm:border sm:pb-0 sm:shadow-lg"
        style={getReaderUiStyle(settings.theme)}
      >
        <div className="mx-auto max-w-3xl px-2 pt-1.5 sm:px-3">
          {active ? (
            <div className="flex min-h-14 items-center gap-2 px-1">
              <button
                type="button"
                onClick={() => setPanel('narration')}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="展开听书控制"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Headphones className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{chapterTitle}</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {narrationStatus === 'playing' ? '正在朗读' : '已暂停'}
                    {narrationPairIndex != null && narrationPairCount > 0
                      ? ` · ${narrationPairIndex + 1}/${narrationPairCount} 段`
                      : ''}
                  </span>
                </span>
              </button>
              <Button
                size="icon"
                className="size-10 rounded-full shadow-none"
                onClick={narrationStatus === 'playing' ? onPauseNarration : onResumeNarration}
                aria-label={narrationStatus === 'playing' ? '暂停听书' : '继续听书'}
              >
                {narrationStatus === 'playing' ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-10 rounded-full text-muted-foreground"
                onClick={onStopNarration}
                aria-label="停止听书"
              >
                <Square className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex min-h-14 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 rounded-xl"
                onClick={onPrevChapter}
                disabled={!hasPrevChapter || !onPrevChapter}
                aria-label="上一章"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <button
                type="button"
                aria-label="选择章节"
                onClick={() => setPanel('chapters')}
                className="min-w-0 flex-1 rounded-xl px-2 py-1.5 text-center hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="block truncate text-sm font-medium">{chapterTitle}</span>
                <span className="mt-0.5 block text-[10px] tabular-nums text-muted-foreground">
                  {chapterIndex >= 0
                    ? `${chapterIndex + 1} / ${allChapters.length} 章`
                    : chapterSelectPlaceholder}
                </span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 rounded-xl"
                onClick={onNextChapter}
                disabled={!hasNextChapter || !onNextChapter}
                aria-label="下一章"
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          )}
          <nav
            aria-label="阅读工具"
            className="grid gap-1 border-t border-border py-1"
            style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}
          >
            {actions.map(({ label, aria, icon: Icon, onClick, selected, count }) => (
              <button
                type="button"
                key={label}
                aria-label={aria}
                aria-haspopup="dialog"
                aria-pressed={Boolean(selected)}
                onClick={onClick}
                className={cn(
                  'flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <span className="relative">
                  <Icon className="size-[19px]" />
                  {count > 0 && (
                    <span className="absolute -right-3 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] leading-none text-primary-foreground">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </span>
                {label}
              </button>
            ))}
          </nav>
        </div>
      </footer>
      <ReaderChapterPanel
        open={panel === 'chapters'}
        onOpenChange={open => setPanel(open ? 'chapters' : null)}
        theme={settings.theme}
        chapters={chapters}
        chapterGroups={chapterGroups}
        currentChapterId={currentChapterId}
        onChapterChange={onChapterChange}
      />
      {!hideNarration && (
        <ReaderNarrationPanel
          {...props}
          open={panel === 'narration'}
          onOpenChange={open => setPanel(open ? 'narration' : null)}
          theme={settings.theme}
          chapterTitle={chapterTitle}
        />
      )}
    </>
  )
}
