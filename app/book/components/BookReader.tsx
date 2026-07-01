'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ReaderToolbar } from '@/app/book/components/ReaderToolbar'
import { ReaderSettingsPanel } from '@/app/book/components/ReaderSettingsPanel'
import { BookMarksPanel } from '@/app/book/components/BookMarksPanel'
import {
  type BookJumpTarget,
  findScrollingAncestor,
  getReadingPosition,
  getSavedScrollPosition,
  scheduleBookJump,
  useScrollSaver,
} from '@/app/book/utils/scroll'
import { TextSelectionToolbar } from '@/app/book/components/TextSelectionToolbar'
import { useBookTextSelectionActions } from '@/app/book/hooks/useBookTextSelectionActions'
import type { BookReaderConfig } from '@/app/book/types'
import { getBookFontFamily, getBookThemeStyle } from '@/app/book/utils/theme'
import type { BookTheme } from '@/app/book/utils/theme'

interface BookReaderProps<
  ChapterId,
  Settings extends { theme: BookTheme; fontSize: number; lineHeight: number },
> {
  config: BookReaderConfig<ChapterId, Settings, any>
}

export function BookReader({ config }: BookReaderProps<any, any>) {
  const { settings, patchSettings, hydrated } = config.useSettings()
  const { marks, addPositionBookmark, addCollection, removeMark } = config.useBookMarks()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [bookmarksPanelOpen, setBookmarksPanelOpen] = useState(false)
  const [collectionsPanelOpen, setCollectionsPanelOpen] = useState(false)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)
  const [jumpRequest, setJumpRequest] = useState(0)

  const contentRef = useRef<HTMLDivElement>(null)
  const pendingJumpRef = useRef<BookJumpTarget | null>(null)

  const {
    loadChapter: loadChapterFromConfig,
    currentChapterId,
    chapters,
    chapterGroups,
    onChapterIdChange,
    onPrevChapter,
    onNextChapter,
    hasPrevChapter,
    hasNextChapter,
    hasNarration,
    hasTextSelection,
    hasPairDisplayMode,
    hasContentMode,
    chapterSelectPlaceholder,
    bookTitle,
    renderContent,
    scrollStorageKey,
  } = config

  const themeStyle = getBookThemeStyle(settings.theme)

  // ─── Scroll position persistence ──────────────────────────────────

  useScrollSaver(contentRef, scrollStorageKey ?? 'book-reader', currentChapterId)

  // ─── Chapter loading ──────────────────────────────────────────────

  const loadChapter = useCallback(
    async (chapterId: typeof currentChapterId) => {
      setLoading(true)
      setError(null)
      try {
        await loadChapterFromConfig(chapterId)

        requestAnimationFrame(() => {
          const scrollEl = contentRef.current ? findScrollingAncestor(contentRef.current) : null
          if (!scrollEl) return

          if (scrollStorageKey) {
            scrollEl.scrollTop = getSavedScrollPosition(scrollStorageKey, chapterId)
          } else {
            scrollEl.scrollTop = 0
          }
        })
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '加载失败')
      } finally {
        setLoading(false)
      }
    },
    [loadChapterFromConfig, scrollStorageKey]
  )

  // Auto-load chapter when hydrated or chapterId changes
  useEffect(() => {
    if (!hydrated) return
    loadChapter(currentChapterId)
  }, [hydrated, currentChapterId, loadChapter])

  // ─── Jump to bookmark ─────────────────────────────────────────────

  useEffect(() => {
    const pending = pendingJumpRef.current
    if (!pending || loading) return

    const container = contentRef.current
    if (!container) return

    return scheduleBookJump(container, pending, () => {
      if (pendingJumpRef.current === pending) {
        pendingJumpRef.current = null
      }
    })
  }, [loading, jumpRequest])

  // ─── Handlers ─────────────────────────────────────────────────────

  const handleChapterChange = useCallback(
    (chapterId: string) => {
      const resolvedId = chapters.find((c: { id: unknown }) => String(c.id) === chapterId)?.id
      if (resolvedId !== undefined) {
        onChapterIdChange(resolvedId)
      }
    },
    [chapters, onChapterIdChange]
  )

  const getChapterContext = useCallback(() => {
    const position = getReadingPosition(contentRef.current)
    const chapter = chapters.find((c: { id: unknown }) => c.id === currentChapterId)
    const chapterTitle = (chapter as { title?: string })?.title ?? ''

    return {
      chapterId: currentChapterId,
      chapterTitle,
      scrollTop: position.scrollTop,
      pairIndex: position.pairIndex ?? null,
    }
  }, [chapters, currentChapterId])

  const { handleSelectionBookmark, handleAddCollection, handleAskAi, handlePlaySelection } =
    useBookTextSelectionActions({
      bookTitle,
      getContext: getChapterContext,
      addPositionBookmark,
      addCollection,
    })

  const handleAddCurrentBookmark = useCallback(() => {
    const context = getChapterContext()
    const result = addPositionBookmark({
      chapterId: context.chapterId,
      chapterTitle: context.chapterTitle,
      scrollTop: context.scrollTop,
    })
    toast[result.created ? 'success' : 'info'](result.created ? '已添加展示' : '该位置已有展示')
  }, [addPositionBookmark, getChapterContext])

  const handleJumpToMark = useCallback(
    (mark: {
      chapterId: typeof currentChapterId
      scrollTop: number
      pairIndex?: number | null
    }) => {
      pendingJumpRef.current = {
        chapterId: mark.chapterId,
        scrollTop: mark.scrollTop,
        pairIndex: mark.pairIndex ?? null,
      }

      if (mark.chapterId !== currentChapterId) {
        onChapterIdChange(mark.chapterId)
        return
      }

      setJumpRequest(value => value + 1)
    },
    [currentChapterId, onChapterIdChange]
  )

  // ─── Render ───────────────────────────────────────────────────────

  const positionBookmarks = marks.filter((mark: { kind: string }) => mark.kind === 'position')
  const collections = marks.filter((mark: { kind: string }) => mark.kind === 'collection')

  if (error && chapters.length === 0) {
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
      {chapters.length > 0 && (
        <ReaderToolbar
          chapters={chapters.map((c: { id: unknown; title: string }) => ({
            id: String(c.id),
            title: c.title,
          }))}
          chapterGroups={chapterGroups?.map(group => ({
            label: group.label,
            chapters: group.chapters.map((c: { id: unknown; title: string }) => ({
              id: String(c.id),
              title: c.title,
            })),
          }))}
          currentChapterId={String(currentChapterId)}
          settings={settings as any}
          bookmarkCount={positionBookmarks.length}
          collectionCount={collections.length}
          onChapterChange={handleChapterChange}
          onOpenBookmarks={() => setBookmarksPanelOpen(true)}
          onOpenCollections={() => setCollectionsPanelOpen(true)}
          onOpenSettings={() => setSettingsPanelOpen(true)}
          narrationStatus="idle"
          narrationMode="original"
          onNarrationModeChange={() => {}}
          onStartNarration={() => {}}
          onPauseNarration={() => {}}
          onResumeNarration={() => {}}
          onStopNarration={() => {}}
          hideNarration={!hasNarration}
          onPrevChapter={onPrevChapter}
          onNextChapter={onNextChapter}
          hasPrevChapter={hasPrevChapter}
          hasNextChapter={hasNextChapter}
          chapterSelectPlaceholder={chapterSelectPlaceholder}
        />
      )}

      <ReaderSettingsPanel
        open={settingsPanelOpen}
        onOpenChange={setSettingsPanelOpen}
        settings={settings as any}
        onPatchSettings={patchSettings as any}
        hasPairDisplayMode={hasPairDisplayMode}
        hasContentMode={hasContentMode}
      />

      <BookMarksPanel
        kind="position"
        open={bookmarksPanelOpen}
        onOpenChange={setBookmarksPanelOpen}
        marks={marks as any}
        onJump={handleJumpToMark}
        onRemove={removeMark}
        onAddCurrent={handleAddCurrentBookmark}
      />

      <BookMarksPanel
        kind="collection"
        open={collectionsPanelOpen}
        onOpenChange={setCollectionsPanelOpen}
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
            color: themeStyle?.color,
          }}
        >
          {renderContent({ contentRef, settings, themeColor: themeStyle?.color })}
        </article>

        {hasTextSelection ? (
          <TextSelectionToolbar
            containerRef={contentRef}
            onAddBookmark={handleSelectionBookmark}
            onAddCollection={handleAddCollection}
            onAskAi={handleAskAi}
            onPlaySelection={hasNarration ? handlePlaySelection : undefined}
            showNarration={hasNarration}
          />
        ) : null}
      </div>
    </div>
  )
}
