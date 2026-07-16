'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ReaderToolbar } from '@/app/book/components/ReaderToolbar'
import { ReaderSettingsPanel } from '@/app/book/components/ReaderSettingsPanel'
import { ChapterHeading } from '@/app/book/components/ChapterHeading'
import { SentencePairBlock } from '@/app/book/components/SentencePairBlock'
import { TextSelectionToolbar } from '@/app/book/components/TextSelectionToolbar'
import { useBookTextSelectionActions } from '@/app/book/hooks/useBookTextSelectionActions'
import { BookMarksPanel, type BookMarkListItem } from '@/app/book/components/BookMarksPanel'
import type { BookChapter, BookIndex } from '@/app/book/utils/bilingualParse'
import { useBookSettings } from '@/app/book/utils/settings'
import { useBookMarks } from '@/app/book/utils/bookMarks'
import type { ReaderSettings } from '@/app/book/types/reader'
import { getBookThemeStyle } from '@/app/book/utils/theme'
import { getTranslationMutedColor } from '@/app/book/utils/pairDisplay'
import {
  findScrollingAncestor,
  findNearestPairIndex,
  getReadingPosition,
  getSavedScrollPosition,
  scheduleBookJump,
  useScrollSaver,
} from '@/app/book/utils/scroll'
import {
  getBookAssetBaseUrl,
  getBookReaderStorageKey,
  BILINGUAL_BOOK_DEFAULTS,
} from '@/app/book/utils/registry'
import { useBookNarration, type BookNarrationMode } from '@/app/book/hooks/useBookNarration'

export interface BilingualBookReaderProps {
  bookId: string
  fallbackTitle?: string
  defaultChapterId?: number
}

export function BilingualBookReader({
  bookId,
  fallbackTitle = '书目',
  defaultChapterId = 1,
}: BilingualBookReaderProps) {
  const storageKey = getBookReaderStorageKey(bookId)
  const bookBase = getBookAssetBaseUrl(bookId)

  const defaultSettings: ReaderSettings = {
    ...BILINGUAL_BOOK_DEFAULTS,
    chapterId: defaultChapterId,
  }

  const { settings, patchSettings, hydrated } = useBookSettings<ReaderSettings>({
    storageKey,
    defaults: defaultSettings,
  })
  const { marks, addPositionBookmark, addCollection, removeMark } = useBookMarks(bookId)

  const [index, setIndex] = useState<BookIndex | null>(null)
  const [chapter, setChapter] = useState<BookChapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookmarksPanelOpen, setBookmarksPanelOpen] = useState(false)
  const [collectionsPanelOpen, setCollectionsPanelOpen] = useState(false)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)
  const [jumpRequest, setJumpRequest] = useState(0)
  const [narrationMode, setNarrationMode] = useState<BookNarrationMode>('original')
  const contentRef = useRef<HTMLDivElement>(null)
  const articleRef = useRef<HTMLElement>(null)
  const pendingJumpRef = useRef<{
    chapterId: number
    scrollTop: number
    pairIndex: number | null
  } | null>(null)

  const bookTitle = index?.title ?? fallbackTitle

  const narration = useBookNarration({
    chapter,
    narrationMode,
    contentRef,
  })

  useScrollSaver(contentRef, storageKey, settings.chapterId)

  const loadChapter = useCallback(
    async (chapterId: number, restoreScroll = false) => {
      setLoading(true)
      setError(null)
      try {
        const meta = index?.chapters.find(ch => ch.id === chapterId)
        const file = meta?.file ?? `chapters/${String(chapterId).padStart(3, '0')}.json`
        const response = await fetch(`${bookBase}/${file}`)
        if (!response.ok) throw new Error('章节加载失败')
        const data = (await response.json()) as BookChapter
        setChapter(data)

        if (!pendingJumpRef.current && restoreScroll && typeof window !== 'undefined') {
          requestAnimationFrame(() => {
            const scrollEl = contentRef.current ? findScrollingAncestor(contentRef.current) : null
            if (scrollEl) {
              scrollEl.scrollTop = getSavedScrollPosition(storageKey, chapterId)
            }
          })
        } else if (!pendingJumpRef.current) {
          const scrollEl = contentRef.current ? findScrollingAncestor(contentRef.current) : null
          if (scrollEl) scrollEl.scrollTop = 0
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '加载失败')
      } finally {
        setLoading(false)
      }
    },
    [index, bookBase, storageKey]
  )

  useEffect(() => {
    fetch(`${bookBase}/index.json`)
      .then(res => {
        if (!res.ok) throw new Error('书目索引加载失败')
        return res.json() as Promise<BookIndex>
      })
      .then(setIndex)
      .catch(err => setError(err instanceof Error ? err.message : '加载失败'))
  }, [bookBase])

  useEffect(() => {
    if (!hydrated || !index) return
    loadChapter(settings.chapterId, true)
  }, [hydrated, index, settings.chapterId, loadChapter])

  useEffect(() => {
    const pending = pendingJumpRef.current
    if (!pending || loading || !chapter || chapter.id !== pending.chapterId) return

    const container = contentRef.current
    if (!container) return

    return scheduleBookJump(container, pending, () => {
      if (pendingJumpRef.current === pending) {
        pendingJumpRef.current = null
      }
    })
  }, [loading, chapter, settings.chapterId, jumpRequest])

  const handleChapterChange = (chapterId: number) => {
    narration.stop()
    patchSettings({ chapterId })
  }

  const currentChapterIndex =
    index?.chapters.findIndex(chapterMeta => chapterMeta.id === settings.chapterId) ?? -1
  const hasPrevChapter = currentChapterIndex > 0
  const hasNextChapter = Boolean(
    index && currentChapterIndex >= 0 && currentChapterIndex < index.chapters.length - 1
  )

  const handlePrevChapter = () => {
    if (!index || !hasPrevChapter) return
    handleChapterChange(index.chapters[currentChapterIndex - 1].id)
  }

  const handleNextChapter = () => {
    if (!index || !hasNextChapter) return
    handleChapterChange(index.chapters[currentChapterIndex + 1].id)
  }

  const getChapterContext = useCallback(() => {
    const position = getReadingPosition(contentRef.current, findNearestPairIndex)
    const pair = position.pairIndex != null ? chapter?.pairs[position.pairIndex] : undefined
    const excerpt = pair ? (pair.o || pair.t).trim().slice(0, 80) : ''

    return {
      chapterId: String(settings.chapterId),
      chapterTitle:
        chapter?.title ?? index?.chapters.find(ch => ch.id === settings.chapterId)?.title ?? '',
      scrollTop: position.scrollTop,
      pairIndex: position.pairIndex,
      excerpt,
    }
  }, [chapter, index?.chapters, settings.chapterId])

  const handleAddCurrentBookmark = useCallback(() => {
    const context = getChapterContext()
    if (context.pairIndex == null) {
      toast.error('请稍候，正文加载完成后再添加书签')
      return
    }

    const result = addPositionBookmark({
      chapterId: context.chapterId,
      chapterTitle: context.chapterTitle,
      scrollTop: context.scrollTop,
      pairIndex: context.pairIndex,
      excerpt: context.excerpt,
    })
    toast[result.created ? 'success' : 'info'](result.created ? '已添加展示' : '该位置已有展示')
  }, [addPositionBookmark, getChapterContext])

  const handleStartNarration = useCallback(() => {
    const context = getChapterContext()
    const startPairIndex = context.pairIndex ?? 0
    if (!narration.start(startPairIndex)) {
      toast.error('当前浏览器不支持听书，或章节还没有加载完成')
    }
  }, [getChapterContext, narration])

  const { handleSelectionBookmark, handleAddCollection, handleAskAi, handlePlaySelection } =
    useBookTextSelectionActions({
      bookTitle,
      getContext: getChapterContext,
      addPositionBookmark,
      addCollection,
      onPlaySelection: selection => {
        const context = getChapterContext()
        const startPairIndex = selection.pairIndex ?? context.pairIndex ?? 0
        if (!narration.start(startPairIndex)) {
          toast.error('当前浏览器不支持听书，或章节还没有加载完成')
        }
      },
    })

  const handleJumpToMark = useCallback(
    (mark: BookMarkListItem) => {
      const chapterId = Number(mark.chapterId)
      pendingJumpRef.current = {
        chapterId,
        scrollTop: mark.scrollTop,
        pairIndex: mark.pairIndex ?? null,
      }

      if (chapterId !== settings.chapterId) {
        patchSettings({ chapterId })
        return
      }

      setJumpRequest(value => value + 1)
    },
    [patchSettings, settings.chapterId]
  )

  const themeStyle = getBookThemeStyle(settings.theme)
  const translationColor = getTranslationMutedColor(settings.theme)
  const positionBookmarks = marks.filter(mark => mark.kind === 'position')
  const collections = marks.filter(mark => mark.kind === 'collection')

  if (error && !index) {
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
      {index && (
        <ReaderToolbar
          chapters={index.chapters.map(ch => ({ id: String(ch.id), title: ch.title }))}
          currentChapterId={String(settings.chapterId)}
          settings={settings}
          bookmarkCount={positionBookmarks.length}
          collectionCount={collections.length}
          onChapterChange={chapterId => handleChapterChange(Number(chapterId))}
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
          onPrevChapter={handlePrevChapter}
          onNextChapter={handleNextChapter}
          hasPrevChapter={hasPrevChapter}
          hasNextChapter={hasNextChapter}
        />
      )}

      <ReaderSettingsPanel
        open={settingsPanelOpen}
        onOpenChange={setSettingsPanelOpen}
        settings={settings}
        onPatchSettings={patchSettings}
        hasDualFonts
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
          ref={articleRef}
          className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8"
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
          }}
        >
          {loading && <p className="text-sm opacity-70">正在加载章节…</p>}

          {!loading && chapter && (
            <header className="mb-8 border-b border-current/10 pb-6">
              <ChapterHeading
                title={chapter.title}
                translationTitle={chapter.translationTitle}
                contentMode={settings.contentMode}
                translationColor={translationColor}
                originalFontFamily={settings.originalFontFamily}
                translationFontFamily={settings.translationFontFamily}
              />
            </header>
          )}

          {!loading && chapter && (
            <div className={settings.pairDisplayMode === 'card' ? 'space-y-3' : 'space-y-5'}>
              {chapter.pairs.map((pair, pairIndex) => (
                <SentencePairBlock
                  key={`${chapter.id}-${pairIndex}`}
                  pair={pair}
                  pairIndex={pairIndex}
                  displayMode={settings.pairDisplayMode}
                  theme={settings.theme}
                  contentMode={settings.contentMode}
                  originalFontFamily={settings.originalFontFamily}
                  translationFontFamily={settings.translationFontFamily}
                  isNarrating={narration.activePairIndex === pairIndex}
                  narrationHighlight={
                    narration.activeHighlight?.pairIndex === pairIndex
                      ? narration.activeHighlight
                      : null
                  }
                />
              ))}
            </div>
          )}

          {error && index ? <p className="text-destructive mt-4 text-sm">{error}</p> : null}
        </article>

        <TextSelectionToolbar
          containerRef={contentRef}
          onAddBookmark={handleSelectionBookmark}
          onAddCollection={handleAddCollection}
          onAskAi={handleAskAi}
          onPlaySelection={handlePlaySelection}
          showNarration
        />
      </div>
    </div>
  )
}
