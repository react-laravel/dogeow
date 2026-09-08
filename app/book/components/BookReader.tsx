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
import { BookAiChatPanel } from '@/app/book/components/BookAiChatPanel'
import { useBookTextSelectionActions } from '@/app/book/hooks/useBookTextSelectionActions'
import { useAiDialogStore } from '@/stores/aiDialogStore'
import useAuthStore from '@/stores/authStore'
import { canUseAi } from '@/lib/ai/access'
import { useBookNarration, type BookNarrationMode } from '@/app/book/hooks/useBookNarration'
import type { BookReaderConfig } from '@/app/book/types'
import type { BaseReaderSettings } from '@/app/book/types/reader'
import {
  getBookFontFamily,
  getBookThemeStyle,
  resolveBookTheme,
  useSystemColorScheme,
} from '@/app/book/utils/theme'

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

  const [panel, setPanel] = useState<'bookmarks' | 'collections' | 'settings' | null>(null)
  const [jumpRequest, setJumpRequest] = useState(0)
  const [narrationMode, setNarrationMode] = useState<BookNarrationMode>('original')
  const [narrationRate, setNarrationRate] = useState(1)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [aiSeedPrompt, setAiSeedPrompt] = useState<string | null>(null)

  const aiUser = useAuthStore(state => state.user)
  const canAskAi = canUseAi(aiUser)
  const requestOpenAiDialog = useAiDialogStore(state => state.requestOpen)

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
  const systemScheme = useSystemColorScheme()
  const themeStyle = getBookThemeStyle(settings.theme)
  const resolvedTheme = resolveBookTheme(settings.theme, systemScheme)
  const narration = useBookNarration({
    chapter: narrationChapter ?? null,
    narrationMode,
    rate: narrationRate,
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

  const handleOpenAiPanel = useCallback(
    (prompt: string) => {
      if (!canAskAi) return
      setAiSeedPrompt(prompt)
      setAiPanelOpen(true)
    },
    [canAskAi]
  )

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
      onAskAi: handleOpenAiPanel,
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
    toast[result.created ? 'success' : 'info'](result.created ? '已添加书签' : '该位置已有书签')
  }, [addPositionBookmark, getChapterContext])

  const handleJumpToMark = useCallback(
    (mark: { chapterId: string | number; scrollTop: number; pairIndex?: number | null }) => {
      const resolvedChapterId =
        chapters.find(c => String(c.id) === String(mark.chapterId))?.id ??
        (mark.chapterId as ChapterId)

      narration.stop()
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
    [chapters, currentChapterId, onChapterIdChange, narration]
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
      className="relative flex h-full min-h-0 flex-col overflow-hidden"
      style={themeStyle}
      data-reader-theme={resolvedTheme}
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
          settings={{ theme: resolvedTheme }}
          bookmarkCount={positionBookmarks.length}
          collectionCount={collections.length}
          onChapterChange={handleChapterChange}
          onOpenBookmarks={() => setPanel('bookmarks')}
          onOpenCollections={() => setPanel('collections')}
          onOpenSettings={() => setPanel('settings')}
          narrationStatus={narration.status}
          narrationMode={narrationMode}
          onNarrationModeChange={setNarrationMode}
          onStartNarration={handleStartNarration}
          onPauseNarration={narration.pause}
          onResumeNarration={narration.resume}
          onStopNarration={narration.stop}
          narrationPairIndex={narration.activePairIndex}
          narrationPairCount={narrationChapter?.pairs.length ?? 0}
          narrationPreview={narration.activeText}
          narrationRate={narrationRate}
          onNarrationRateChange={setNarrationRate}
          onNarrationSeek={index => {
            narration.start(index)
          }}
          narrationUnavailableReason={
            !narration.supported
              ? '当前浏览器不支持语音朗读'
              : loading || !narrationChapter
                ? '章节正在加载，请稍候'
                : !narrationChapter.pairs.length
                  ? '当前章节没有可朗读的内容'
                  : undefined
          }
          hideNarration={!hasNarration}
          narrationOriginalOnly={narrationOriginalOnly}
          onPrevChapter={
            onPrevChapter
              ? () => {
                  narration.stop()
                  onPrevChapter()
                }
              : undefined
          }
          onNextChapter={
            onNextChapter
              ? () => {
                  narration.stop()
                  onNextChapter()
                }
              : undefined
          }
          hasPrevChapter={hasPrevChapter}
          hasNextChapter={hasNextChapter}
          chapterSelectPlaceholder={chapterSelectPlaceholder}
        />
      )}

      <ReaderSettingsPanel
        open={panel === 'settings'}
        onOpenChange={open => setPanel(open ? 'settings' : null)}
        settings={settings}
        onPatchSettings={patch => patchSettings(patch as Partial<Settings>)}
        hasPairDisplayMode={hasPairDisplayMode}
        hasContentMode={hasContentMode}
        hasDualFonts={hasDualFonts}
      />

      <BookMarksPanel
        kind="position"
        open={panel === 'bookmarks'}
        onOpenChange={open => setPanel(open ? 'bookmarks' : null)}
        theme={resolvedTheme}
        marks={marks}
        onJump={handleJumpToMark}
        onRemove={removeMark}
        onAddCurrent={handleAddCurrentBookmark}
      />

      <BookMarksPanel
        kind="collection"
        open={panel === 'collections'}
        onOpenChange={open => setPanel(open ? 'collections' : null)}
        theme={resolvedTheme}
        marks={marks}
        onJump={handleJumpToMark}
        onRemove={removeMark}
      />

      <div
        ref={contentRef}
        className="min-h-0 flex-1 overflow-y-auto pb-[calc(9rem+env(safe-area-inset-bottom,0px))]"
      >
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
            showAi={canAskAi}
            theme={resolvedTheme}
          />
        ) : null}
      </div>

      {canAskAi ? (
        <BookAiChatPanel
          open={aiPanelOpen}
          theme={resolvedTheme}
          seedPrompt={aiSeedPrompt}
          onClose={() => setAiPanelOpen(false)}
          onExpand={pendingPrompt => {
            setAiPanelOpen(false)
            requestOpenAiDialog(pendingPrompt)
          }}
        />
      ) : null}
    </div>
  )
}
