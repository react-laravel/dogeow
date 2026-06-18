'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ReaderToolbar } from './ReaderToolbar'
import { SentencePairBlock } from './SentencePairBlock'
import { TextSelectionToolbar, type TextSelectionState } from './TextSelectionToolbar'
import { BookMarksPanel } from './BookMarksPanel'
import type { BookMark } from '../types/marks'
import type { BookChapter, BookIndex } from '../utils/parseBook'
import {
  getReaderFontFamily,
  getReaderThemeStyle,
  getTranslationMutedColor,
  useReaderSettings,
} from '../hooks/useReaderSettings'
import { useBookMarks } from '../hooks/useBookMarks'
import { buildAiPromptForExcerpt } from '../utils/bookMarks'
import { getHongloumengBookUrl } from '../utils/bookAssetUrls'
import { useAiDialogStore } from '@/stores/aiDialogStore'

const SCROLL_KEY = 'dogeow-hongloumeng-scroll'

interface PendingJump {
  scrollTop?: number
  pairIndex?: number | null
}

export function HongloumengReader() {
  const { settings, patchSettings, bumpFontSize, hydrated } = useReaderSettings()
  const { marks, addPositionBookmark, addCollection, removeMark } = useBookMarks()
  const requestOpenAi = useAiDialogStore(state => state.requestOpen)
  const [index, setIndex] = useState<BookIndex | null>(null)
  const [chapter, setChapter] = useState<BookChapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [marksPanelOpen, setMarksPanelOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const articleRef = useRef<HTMLElement>(null)
  const scrollSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingJumpRef = useRef<PendingJump | null>(null)

  const applyPendingJump = useCallback(() => {
    const pending = pendingJumpRef.current
    if (!pending || !contentRef.current) return

    pendingJumpRef.current = null

    requestAnimationFrame(() => {
      if (!contentRef.current) return

      if (pending.pairIndex != null) {
        const target = contentRef.current.querySelector(`[data-pair-index="${pending.pairIndex}"]`)
        if (target instanceof HTMLElement) {
          target.scrollIntoView({ block: 'center', behavior: 'smooth' })
          return
        }
      }

      if (typeof pending.scrollTop === 'number') {
        contentRef.current.scrollTop = pending.scrollTop
      }
    })
  }, [])

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

        if (pendingJumpRef.current) {
          requestAnimationFrame(() => applyPendingJump())
        } else if (restoreScroll && typeof window !== 'undefined') {
          const saved = sessionStorage.getItem(`${SCROLL_KEY}:${chapterId}`)
          requestAnimationFrame(() => {
            if (contentRef.current) {
              contentRef.current.scrollTop = saved ? Number(saved) || 0 : 0
            }
          })
        } else if (contentRef.current) {
          contentRef.current.scrollTop = 0
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '加载失败')
      } finally {
        setLoading(false)
      }
    },
    [index, applyPendingJump]
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
    const onScroll = () => {
      if (!contentRef.current) return
      if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current)
      scrollSaveTimer.current = setTimeout(() => {
        sessionStorage.setItem(
          `${SCROLL_KEY}:${settings.chapterId}`,
          String(contentRef.current?.scrollTop ?? 0)
        )
      }, 200)
    }

    const node = contentRef.current
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
    return {
      chapterId: settings.chapterId,
      chapterTitle:
        chapter?.title ?? index?.chapters.find(ch => ch.id === settings.chapterId)?.title ?? '',
      scrollTop: contentRef.current?.scrollTop ?? 0,
    }
  }, [chapter?.title, index?.chapters, settings.chapterId])

  const handleAddCurrentBookmark = useCallback(() => {
    const context = getChapterContext()
    addPositionBookmark({
      chapterId: context.chapterId,
      chapterTitle: context.chapterTitle,
      scrollTop: context.scrollTop,
      excerpt: '',
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
        pairIndex: selection.pairIndex,
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
        scrollTop: mark.scrollTop,
        pairIndex: mark.pairIndex,
      }

      if (mark.chapterId !== settings.chapterId) {
        patchSettings({ chapterId: mark.chapterId })
        return
      }

      applyPendingJump()
    },
    [applyPendingJump, patchSettings, settings.chapterId]
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
      className="flex h-full min-h-0 flex-col"
      style={themeStyle}
      data-reader-theme={settings.theme}
    >
      {index && (
        <ReaderToolbar
          bookTitle={index.title}
          chapters={index.chapters}
          settings={settings}
          markCount={marks.length}
          onChapterChange={handleChapterChange}
          onPatchSettings={patchSettings}
          onBumpFontSize={bumpFontSize}
          onAddBookmark={handleAddCurrentBookmark}
          onOpenMarks={() => setMarksPanelOpen(true)}
        />
      )}

      <BookMarksPanel
        open={marksPanelOpen}
        onOpenChange={setMarksPanelOpen}
        marks={marks}
        onJump={handleJumpToMark}
        onRemove={removeMark}
      />

      <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto">
        <article
          ref={articleRef}
          className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8"
          style={{
            fontFamily: getReaderFontFamily(settings.fontFamily),
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
          }}
        >
          {loading && <p className="text-sm opacity-70">正在加载章节…</p>}

          {!loading && chapter && (
            <header className="mb-8 space-y-2 border-b border-current/10 pb-6">
              {settings.contentMode !== 'translation' ? (
                <h1 className="text-[1.15em] font-semibold tracking-wide">{chapter.title}</h1>
              ) : null}
              {settings.contentMode !== 'original' && chapter.translationTitle ? (
                settings.contentMode === 'translation' ? (
                  <h1 className="text-[1.15em] font-semibold tracking-wide">
                    {chapter.translationTitle}
                  </h1>
                ) : (
                  <p style={{ color: translationColor }}>{chapter.translationTitle}</p>
                )
              ) : settings.contentMode === 'translation' ? (
                <h1 className="text-[1.15em] font-semibold tracking-wide">{chapter.title}</h1>
              ) : null}
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
