'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ReaderToolbar } from './ReaderToolbar'
import { ReaderSettingsPanel } from './ReaderSettingsPanel'
import { ChapterHeading } from './ChapterHeading'
import { SentencePairBlock } from './SentencePairBlock'
import { TextSelectionToolbar, type TextSelectionState } from './TextSelectionToolbar'
import { BookMarksPanel } from './BookMarksPanel'
import type { BookMark } from '../types/marks'
import type { BookChapter, BookIndex } from '../utils/parseBook'
import {
  getReaderThemeStyle,
  getTranslationMutedColor,
  useReaderSettings,
} from '../hooks/useReaderSettings'
import { useBookMarks } from '../hooks/useBookMarks'
import { buildAiPromptForExcerpt } from '../utils/bookMarks'
import {
  getReadingPosition,
  scheduleReaderJump,
  findScrollingAncestor,
  type ReaderJumpTarget,
} from '../utils/readerScroll'
import { getHongloumengBookUrl } from '../utils/bookAssetUrls'
import { useAiDialogStore } from '@/stores/aiDialogStore'

const SCROLL_KEY = 'dogeow-hongloumeng-scroll'

export function HongloumengReader() {
  const { settings, patchSettings, hydrated } = useReaderSettings()
  const { marks, addPositionBookmark, addCollection, removeMark } = useBookMarks()
  const requestOpenAi = useAiDialogStore(state => state.requestOpen)
  const [index, setIndex] = useState<BookIndex | null>(null)
  const [chapter, setChapter] = useState<BookChapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [marksPanelOpen, setMarksPanelOpen] = useState(false)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)
  const [jumpRequest, setJumpRequest] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const articleRef = useRef<HTMLElement>(null)
  const scrollSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingJumpRef = useRef<ReaderJumpTarget | null>(null)

  const loadChapter = useCallback(
    async (chapterId: number, restoreScroll = false) => {
      setLoading(true)
      setError(null)
      try {
        const meta = index?.chapters.find(ch => ch.id === chapterId)
        const file = meta?.file ?? `chapters/${String(chapterId).padStart(3, '0')}.json`
        const response = await fetch(getHongloumengBookUrl(file))
        if (!response.ok) throw new Error('章节加载失败')
        const data = (await response.json()) as BookChapter
        setChapter(data)

        if (!pendingJumpRef.current && restoreScroll && typeof window !== 'undefined') {
          const saved = sessionStorage.getItem(`${SCROLL_KEY}:${chapterId}`)
          requestAnimationFrame(() => {
            const scrollEl = contentRef.current ? findScrollingAncestor(contentRef.current) : null
            if (scrollEl) {
              scrollEl.scrollTop = saved ? Number(saved) || 0 : 0
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
    [index]
  )

  useEffect(() => {
    fetch(getHongloumengBookUrl('index.json'))
      .then(res => {
        if (!res.ok) throw new Error('书目索引加载失败')
        return res.json() as Promise<BookIndex>
      })
      .then(setIndex)
      .catch(err => setError(err instanceof Error ? err.message : '加载失败'))
  }, [])

  useEffect(() => {
    if (!hydrated || !index) return
    loadChapter(settings.chapterId, true)
  }, [hydrated, index, settings.chapterId, loadChapter])

  useEffect(() => {
    const pending = pendingJumpRef.current
    if (!pending || loading || !chapter || chapter.id !== pending.chapterId) return

    const container = contentRef.current
    if (!container) return

    return scheduleReaderJump(container, pending, () => {
      if (pendingJumpRef.current === pending) {
        pendingJumpRef.current = null
      }
    })
  }, [loading, chapter, settings.chapterId, jumpRequest])

  useEffect(() => {
    const onScroll = () => {
      if (!contentRef.current) return
      if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current)
      scrollSaveTimer.current = setTimeout(() => {
        const scrollEl = findScrollingAncestor(contentRef.current)
        sessionStorage.setItem(
          `${SCROLL_KEY}:${settings.chapterId}`,
          String(scrollEl?.scrollTop ?? contentRef.current?.scrollTop ?? 0)
        )
      }, 200)
    }

    const scrollEl = contentRef.current ? findScrollingAncestor(contentRef.current) : null
    const node = scrollEl || contentRef.current
    node?.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      node?.removeEventListener('scroll', onScroll)
      if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current)
    }
  }, [settings.chapterId, chapter])

  const handleChapterChange = (chapterId: number) => {
    patchSettings({ chapterId })
  }

  const getChapterContext = useCallback(() => {
    const position = getReadingPosition(contentRef.current)
    const pair = position.pairIndex != null ? chapter?.pairs[position.pairIndex] : undefined
    const excerpt = pair ? (pair.o || pair.t).trim().slice(0, 80) : ''

    return {
      chapterId: settings.chapterId,
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

    addPositionBookmark({
      chapterId: context.chapterId,
      chapterTitle: context.chapterTitle,
      scrollTop: context.scrollTop,
      pairIndex: context.pairIndex,
      excerpt: context.excerpt,
    })
    toast.success('已添加书签')
  }, [addPositionBookmark, getChapterContext])

  const handleSelectionBookmark = useCallback(
    (selection: TextSelectionState) => {
      const context = getChapterContext()
      addPositionBookmark({
        chapterId: context.chapterId,
        chapterTitle: context.chapterTitle,
        scrollTop: context.scrollTop,
        pairIndex: selection.pairIndex ?? context.pairIndex,
        excerpt: selection.text,
      })
      toast.success('已添加书签')
    },
    [addPositionBookmark, getChapterContext]
  )

  const handleAddCollection = useCallback(
    (selection: TextSelectionState) => {
      const context = getChapterContext()
      addCollection({
        chapterId: context.chapterId,
        chapterTitle: context.chapterTitle,
        scrollTop: context.scrollTop,
        pairIndex: selection.pairIndex,
        excerpt: selection.text,
      })
      toast.success('已加入收藏')
    },
    [addCollection, getChapterContext]
  )

  const handleAskAi = useCallback(
    (selection: TextSelectionState) => {
      const context = getChapterContext()
      const prompt = buildAiPromptForExcerpt(selection.text, context.chapterTitle)
      requestOpenAi(prompt)
    },
    [getChapterContext, requestOpenAi]
  )

  const handleJumpToMark = useCallback(
    (mark: BookMark) => {
      pendingJumpRef.current = {
        chapterId: mark.chapterId,
        scrollTop: mark.scrollTop,
        pairIndex: mark.pairIndex,
      }

      if (mark.chapterId !== settings.chapterId) {
        patchSettings({ chapterId: mark.chapterId })
        return
      }

      // Same chapter: use setTimeout to let Sheet close animation + layout settle
      // then try the jump via scheduleReaderJump
      setJumpRequest(value => value + 1)
    },
    [patchSettings, settings.chapterId]
  )

  const themeStyle = getReaderThemeStyle(settings.theme)
  const translationColor = getTranslationMutedColor(settings.theme)

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
          chapters={index.chapters}
          settings={settings}
          markCount={marks.length}
          onChapterChange={handleChapterChange}
          onAddBookmark={handleAddCurrentBookmark}
          onOpenMarks={() => setMarksPanelOpen(true)}
          onOpenSettings={() => setSettingsPanelOpen(true)}
        />
      )}

      <ReaderSettingsPanel
        open={settingsPanelOpen}
        onOpenChange={setSettingsPanelOpen}
        settings={settings}
        onPatchSettings={patchSettings}
      />

      <BookMarksPanel
        open={marksPanelOpen}
        onOpenChange={setMarksPanelOpen}
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
        />
      </div>
    </div>
  )
}
