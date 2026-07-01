'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ReaderToolbar } from '@/app/book/hongloumeng/components/ReaderToolbar'
import { ReaderSettingsPanel } from '@/app/book/hongloumeng/components/ReaderSettingsPanel'
import { BookMarksPanel } from '@/app/book/hongloumeng/components/BookMarksPanel'
import {
  type BookJumpTarget,
  findScrollingAncestor,
  getReadingPosition,
  getSavedScrollPosition,
  scheduleBookJump,
  useScrollSaver,
} from '@/app/book/utils/scroll'
import type { BookReaderConfig } from '@/app/book/types'
import { getBookFontFamily, getBookThemeStyle, getBookToolbarTheme } from '@/app/book/utils/theme'
import type { BookFont, BookTheme } from '@/app/book/utils/theme'

interface BookReaderProps<
  ChapterId,
  Settings extends { theme: BookTheme; fontSize: number; lineHeight: number },
> {
  config: BookReaderConfig<ChapterId, Settings, any>
}

export function BookReader({ config }: BookReaderProps<any, any>) {
  const { settings, patchSettings, hydrated } = config.useSettings()
  const { marks, addPositionBookmark, removeMark } = config.useBookMarks()

  const [chapterContent, setChapterContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [marksPanelOpen, setMarksPanelOpen] = useState(false)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)
  const [jumpRequest, setJumpRequest] = useState(0)

  const contentRef = useRef<HTMLDivElement>(null)
  const pendingJumpRef = useRef<BookJumpTarget | null>(null)

  const themeStyle = getBookThemeStyle(settings.theme)

  // ─── Scroll position persistence ──────────────────────────────────

  useScrollSaver(contentRef, config.storageKey, config.currentChapterId)

  // ─── Chapter loading ──────────────────────────────────────────────

  const loadChapter = useCallback(
    async (chapterId: any) => {
      setLoading(true)
      setError(null)
      try {
        await config.loadChapter(chapterId)

        const saved = getSavedScrollPosition(config.storageKey, chapterId as string | number)
        requestAnimationFrame(() => {
          const scrollEl = contentRef.current ? findScrollingAncestor(contentRef.current) : null
          if (scrollEl) {
            scrollEl.scrollTop = saved
          }
        })
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '加载失败')
      } finally {
        setLoading(false)
      }
    },
    [config]
  )

  // Auto-load chapter when hydrated or chapterId changes
  useEffect(() => {
    if (!hydrated || loading) return
    loadChapter(config.currentChapterId)
  }, [hydrated, config.currentChapterId, loadChapter, loading])

  // ─── Jump to bookmark ─────────────────────────────────────────────

  useEffect(() => {
    const pending = pendingJumpRef.current
    if (!pending || loading || !chapterContent) return

    const container = contentRef.current
    if (!container) return

    return scheduleBookJump(container, pending, () => {
      if (pendingJumpRef.current === pending) {
        pendingJumpRef.current = null
      }
    })
  }, [loading, chapterContent, jumpRequest])

  // ─── Handlers ─────────────────────────────────────────────────────

  const handleChapterChange = useCallback(
    (chapterId: string) => {
      const resolvedId = config.chapters.find((c: any) => c.id === chapterId)?.id
      if (resolvedId !== undefined) {
        config.onChapterIdChange(resolvedId)
      }
    },
    [config]
  )

  const handleAddCurrentBookmark = useCallback(() => {
    if (!chapterContent) {
      toast.error('请稍候，正文加载完成后再添加书签')
      return
    }

    const position = getReadingPosition(contentRef.current)
    const chapter = config.chapters.find((c: any) => c.id === config.currentChapterId)
    const chapterTitle = chapter?.title ?? ''

    const result = addPositionBookmark({
      chapterId: config.currentChapterId,
      chapterTitle,
      scrollTop: position.scrollTop,
      excerpt: chapterContent.slice(0, 80),
    })
    toast[result.created ? 'success' : 'info'](result.created ? '已添加书签' : '该位置已有书签')
  }, [chapterContent, config, addPositionBookmark])

  const handleJumpToMark = useCallback(
    (mark: any) => {
      pendingJumpRef.current = {
        chapterId: mark.chapterId,
        scrollTop: mark.scrollTop,
        pairIndex: mark.pairIndex ?? null,
      }

      if (mark.chapterId !== config.currentChapterId) {
        config.onChapterIdChange(mark.chapterId)
        return
      }

      setJumpRequest(value => value + 1)
    },
    [config]
  )

  // ─── Render ───────────────────────────────────────────────────────

  if (error && config.chapters.length === 0) {
    return (
      <div className="text-destructive flex h-full items-center justify-center p-6 text-sm">
        {error}
      </div>
    )
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden"
      style={themeStyle}
      data-reader-theme={settings.theme}
    >
      {config.chapters.length > 0 && (
        <ReaderToolbar
          chapters={config.chapters.map((c: any) => ({ id: String(c.id), title: c.title }))}
          settings={settings as any}
          markCount={marks.length}
          onChapterChange={handleChapterChange}
          onAddBookmark={handleAddCurrentBookmark}
          onOpenMarks={() => setMarksPanelOpen(true)}
          onOpenSettings={() => setSettingsPanelOpen(true)}
          narrationStatus="idle"
          narrationMode="original"
          onNarrationModeChange={() => {}}
          onStartNarration={() => {}}
          onPauseNarration={() => {}}
          onResumeNarration={() => {}}
          onStopNarration={() => {}}
          hideNarration={!config.hasNarration}
          onPrevChapter={config.onPrevChapter}
          onNextChapter={config.onNextChapter}
          hasPrevChapter={config.hasPrevChapter}
          hasNextChapter={config.hasNextChapter}
        />
      )}

      <ReaderSettingsPanel
        open={settingsPanelOpen}
        onOpenChange={setSettingsPanelOpen}
        settings={settings as any}
        onPatchSettings={patchSettings as any}
        isLuxun={!config.hasPairDisplayMode}
      />

      <BookMarksPanel
        open={marksPanelOpen}
        onOpenChange={setMarksPanelOpen}
        marks={marks as any}
        onJump={handleJumpToMark}
        onRemove={removeMark}
      />

      <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto pb-20">
        <article
          className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8"
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            fontFamily: getBookFontFamily((settings as any).fontFamily ?? 'yahei'),
          }}
        >
          {config.renderContent({
            contentRef,
            settings,
            chapterContent,
            loading,
            error,
          })}
        </article>
      </div>
    </div>
  )
}
