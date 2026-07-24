'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ReaderToolbar } from '@/app/book/components/ReaderToolbar'
import { ReaderSettingsPanel } from '@/app/book/components/ReaderSettingsPanel'
import { BookMarksPanel, type BookMarkListItem } from '@/app/book/components/BookMarksPanel'
import {
  type BookJumpTarget,
  findNearestPairIndex,
  findScrollingAncestor,
  getReadingPosition,
  getSavedScrollPosition,
  scheduleBookJump,
  useScrollSaver,
} from '@/app/book/utils/scroll'
import { TextSelectionToolbar } from '@/app/book/components/TextSelectionToolbar'
import { useBookTextSelectionActions } from '@/app/book/hooks/useBookTextSelectionActions'
import { useBookNarration, type BookNarrationMode } from '@/app/book/hooks/useBookNarration'
import type { BookReaderConfig } from '@/app/book/types'
import type { BaseReaderSettings } from '@/app/book/types/reader'
import { getBookFontFamily, getBookThemeStyle, useSystemColorScheme } from '@/app/book/utils/theme'

interface BookReaderProps<
  ChapterId extends string | number,
  Settings extends BaseReaderSettings,
  BookMarkType extends BookMarkListItem,
> {
  config: BookReaderConfig<ChapterId, Settings, BookMarkType>
}

export function BookReader<
  ChapterId extends string | number,
  Settings extends BaseReaderSettings,
  BookMarkType extends BookMarkListItem,
>({ config }: BookReaderProps<ChapterId, Settings, BookMarkType>) {
  const { settings, patchSettings, hydrated } = config.useSettings()
  const { marks, addPositionBookmark, addCollection, removeMark } = config.useBookMarks()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [bookmarksPanelOpen, setBookmarksPanelOpen] = useState(false)
  const [collectionsPanelOpen, setCollectionsPanelOpen] = useState(false)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)
  const [jumpRequest, setJumpRequest] = useState(0)
  const [narrationMode, setNarrationMode] = useState<BookNarrationMode>('original')

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
    narrationChapter,
    hasTextSelection,
    hasPairDisplayMode,
    hasContentMode,
    hasDualFonts,
    narrationOriginalOnly,
    chapterSelectPlaceholder,
    bookTitle,
    renderContent,
    scrollStorageKey,
  } = config

  // Re-render when OS color scheme changes while theme is `auto`
  useSystemColorScheme()
  const themeStyle = getBookThemeStyle(settings.theme)
  const narration = useBookNarration({
    chapter: narrationChapter ?? null,
    narrationMode,
    contentRef,
  })

  useScrollSaver(contentRef, scrollStorageKey ?? 'book-reader', currentChapterId)

  const loadChapter = useCallback(
    async (chapterId: ChapterId) => {
      setLoading(true)
      setError(null)
      try {
        await loadChapterFromConfig(chapterId)

        requestAnimationFrame(() => {
          const scrollEl = contentRef.current ? findScrollingAncestor(contentRef.current) : null
          if (!scrollEl) return

          // 跨章跳书签时由 scheduleBookJump 负责定位，避免先恢复旧 scroll 再跳
          if (pendingJumpRef.current) return

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

  useEffect(() => {
    if (!hydrated) return
    void loadChapter(currentChapterId)
  }, [hydrated, currentChapterId, loadChapter])

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

  const handleChapterChange = useCallback(
    (chapterId: string) => {
      const resolvedId = chapters.find(c => String(c.id) === chapterId)?.id
      if (resolvedId !== undefined) {
        narration.stop()
        onChapterIdChange(resolvedId)
      }
    },
    [chapters, narration, onChapterIdChange]
  )

  const getChapterContext = useCallback(() => {
    const position = getReadingPosition(contentRef.current, findNearestPairIndex)
    const chapter = chapters.find(c => c.id === currentChapterId)

    return {
      chapterId: currentChapterId,
      chapterTitle: chapter?.title ?? '',
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
      onPlaySelection: selection => {
        if (!narration.start(selection.pairIndex ?? 0)) {
          toast.error('当前浏览器不支持听书，或章节还没有加载完成')
        }
      },
    })

  const handleStartNarration = useCallback(() => {
    const startPairIndex = getChapterContext().pairIndex ?? 0
    if (!narration.start(startPairIndex)) {
      toast.error('当前浏览器不支持听书，或章节还没有加载完成')
    }
  }, [getChapterContext, narration])

  const handleAddCurrentBookmark = useCallback(() => {
    const context = getChapterContext()
    const result = addPositionBookmark({
      chapterId: context.chapterId,
      chapterTitle: context.chapterTitle,
      scrollTop: context.scrollTop,
      pairIndex: context.pairIndex,
    })
    toast[result.created ? 'success' : 'info'](result.created ? '已添加展示' : '该位置已有展示')
  }, [addPositionBookmark, getChapterContext])

  const handleJumpToMark = useCallback(
    (mark: { chapterId: string | number; scrollTop: number; pairIndex?: number | null }) => {
      const resolvedChapterId =
        chapters.find(c => String(c.id) === String(mark.chapterId))?.id ??
        (mark.chapterId as ChapterId)

      pendingJumpRef.current = {
        chapterId: resolvedChapterId,
        scrollTop: mark.scrollTop,
        pairIndex: mark.pairIndex ?? null,
      }

      if (String(resolvedChapterId) !== String(currentChapterId)) {
        onChapterIdChange(resolvedChapterId)
        return
      }

      setJumpRequest(value => value + 1)
    },
    [chapters, currentChapterId, onChapterIdChange]
  )

  const positionBookmarks = marks.filter(mark => mark.kind === 'position')
  const collections = marks.filter(mark => mark.kind === 'collection')

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
      {error ? (
        <div className="text-destructive border-destructive/20 bg-destructive/5 shrink-0 border-b px-4 py-2 text-sm">
          {error}
        </div>
      ) : null}
      {chapters.length > 0 && (
        <ReaderToolbar
          chapters={chapters.map(c => ({
            id: String(c.id),
            title: c.title,
          }))}
          chapterGroups={chapterGroups?.map(group => ({
            label: group.label,
            chapters: group.chapters.map(c => ({
              id: String(c.id),
              title: c.title,
            })),
          }))}
          currentChapterId={String(currentChapterId)}
          settings={{ theme: settings.theme }}
          bookmarkCount={positionBookmarks.length}
          collectionCount={collections.length}
          onChapterChange={handleChapterChange}
          onOpenBookmarks={() => setBookmarksPanelOpen(true)}
          onOpenCollections={() => setCollectionsPanelOpen(true)}
          onOpenSettings={() => setSettingsPanelOpen(true)}
          narrationStatus={narration.status}
          narrationMode={narrationMode}
          onNarrationModeChange={setNarrationMode}
          onStartNarration={handleStartNarration}
          onPauseNarration={narration.pause}
          onResumeNarration={narration.resume}
          onStopNarration={narration.stop}
          hideNarration={!hasNarration}
          narrationOriginalOnly={narrationOriginalOnly}
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
        settings={settings}
        onPatchSettings={patch => patchSettings(patch as Partial<Settings>)}
        hasPairDisplayMode={hasPairDisplayMode}
        hasContentMode={hasContentMode}
        hasDualFonts={hasDualFonts}
      />

      <BookMarksPanel
        kind="position"
        open={bookmarksPanelOpen}
        onOpenChange={setBookmarksPanelOpen}
        marks={marks}
        onJump={handleJumpToMark}
        onRemove={removeMark}
        onAddCurrent={handleAddCurrentBookmark}
      />

      <BookMarksPanel
        kind="collection"
        open={collectionsPanelOpen}
        onOpenChange={setCollectionsPanelOpen}
        marks={marks}
        onJump={handleJumpToMark}
        onRemove={removeMark}
      />

      <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto pb-20">
        <article
          className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8"
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            fontFamily: getBookFontFamily(settings.originalFontFamily ?? 'yahei'),
            color: themeStyle?.color,
          }}
        >
          {renderContent({
            contentRef,
            settings,
            themeColor: themeStyle?.color,
            activePairIndex: narration.activePairIndex,
            activeHighlight: narration.activeHighlight,
          })}
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
