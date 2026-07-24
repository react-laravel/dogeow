'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookReader } from '@/app/book/components/BookReader'
import { ChapterHeading } from '@/app/book/components/ChapterHeading'
import { SentencePairBlock } from '@/app/book/components/SentencePairBlock'
import type { BookReaderConfig } from '@/app/book/types'
import type { ReaderSettings } from '@/app/book/types/reader'
import type { BookChapter, BookIndex } from '@/app/book/utils/bilingualParse'
import { useBookMarks } from '@/app/book/utils/bookMarks'
import { getTranslationMutedColor } from '@/app/book/utils/pairDisplay'
import {
  BILINGUAL_BOOK_DEFAULTS,
  getBookAssetBaseUrl,
  getBookReaderStorageKey,
} from '@/app/book/utils/registry'
import { useBookSettings } from '@/app/book/utils/settings'

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
  const [indexError, setIndexError] = useState<string | null>(null)

  const currentChapterId = settings.chapterId

  const chapters = useMemo(
    () => (index?.chapters ?? []).map(ch => ({ id: ch.id, title: ch.title })),
    [index]
  )

  const currentChapterIndex = useMemo(
    () => chapters.findIndex(ch => ch.id === currentChapterId),
    [chapters, currentChapterId]
  )
  const hasPrev = currentChapterIndex > 0
  const hasNext = currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1

  const loadChapter = useCallback(
    async (chapterId: number) => {
      if (!index) {
        throw new Error('书目索引尚未加载完成')
      }

      const meta = index.chapters.find(ch => ch.id === chapterId)
      if (!meta) {
        throw new Error('未找到该章节')
      }

      setChapter(null)
      const response = await fetch(`${bookBase}/${meta.file}`)
      if (!response.ok) throw new Error('章节加载失败')
      const data = (await response.json()) as BookChapter
      setChapter(data)
    },
    [index, bookBase]
  )

  useEffect(() => {
    fetch(`${bookBase}/index.json`)
      .then(res => {
        if (!res.ok) throw new Error('书目索引加载失败')
        return res.json() as Promise<BookIndex>
      })
      .then(setIndex)
      .catch(err => {
        setIndexError(err instanceof Error ? err.message : '书目索引加载失败')
      })
  }, [bookBase])

  const onChapterIdChange = useCallback(
    (id: number) => {
      patchSettings({ chapterId: id })
    },
    [patchSettings]
  )

  const navigateChapter = useCallback(
    (direction: -1 | 1) => {
      const next = chapters[currentChapterIndex + direction]
      if (next) patchSettings({ chapterId: next.id })
    },
    [chapters, currentChapterIndex, patchSettings]
  )

  const renderContent = useCallback(
    ({
      settings: readerSettings,
      activePairIndex = null,
      activeHighlight = null,
    }: {
      settings: ReaderSettings
      activePairIndex?: number | null
      activeHighlight?: {
        pairIndex: number
        role: 'original' | 'translation'
        start: number
        end: number
      } | null
    }) => {
      const translationColor = getTranslationMutedColor(readerSettings.theme)

      return (
        <>
          {!chapter && <p className="text-sm opacity-70">正在加载章节…</p>}

          {chapter && (
            <>
              <header className="mb-8 border-b border-current/10 pb-6">
                <ChapterHeading
                  title={chapter.title}
                  translationTitle={chapter.translationTitle}
                  contentMode={readerSettings.contentMode}
                  translationColor={translationColor}
                  originalFontFamily={readerSettings.originalFontFamily}
                  translationFontFamily={readerSettings.translationFontFamily}
                />
              </header>
              <div
                className={readerSettings.pairDisplayMode === 'card' ? 'space-y-3' : 'space-y-5'}
              >
                {chapter.pairs.map((pair, pairIndex) => (
                  <SentencePairBlock
                    key={`${chapter.id}-${pairIndex}`}
                    pair={pair}
                    pairIndex={pairIndex}
                    displayMode={readerSettings.pairDisplayMode}
                    theme={readerSettings.theme}
                    contentMode={readerSettings.contentMode}
                    originalFontFamily={readerSettings.originalFontFamily}
                    translationFontFamily={readerSettings.translationFontFamily}
                    isNarrating={activePairIndex === pairIndex}
                    narrationHighlight={
                      activeHighlight?.pairIndex === pairIndex ? activeHighlight : null
                    }
                  />
                ))}
              </div>
            </>
          )}
        </>
      )
    },
    [chapter]
  )

  const config = useMemo<
    BookReaderConfig<number, ReaderSettings, ReturnType<typeof useBookMarks>['marks'][number]>
  >(
    () => ({
      useSettings: () => ({ settings, patchSettings, hydrated }),
      useBookMarks: () => ({
        marks,
        addPositionBookmark,
        addCollection,
        removeMark,
      }),
      loadChapter,
      chapters,
      bookTitle: index?.title ?? fallbackTitle,
      currentChapterId,
      onChapterIdChange,
      onPrevChapter: hasPrev ? () => navigateChapter(-1) : undefined,
      onNextChapter: hasNext ? () => navigateChapter(1) : undefined,
      hasPrevChapter: hasPrev,
      hasNextChapter: hasNext,
      hasNarration: true,
      narrationChapter: chapter,
      hasTextSelection: true,
      hasPairDisplayMode: true,
      hasContentMode: true,
      hasDualFonts: true,
      scrollStorageKey: storageKey,
      renderContent,
    }),
    [
      settings,
      patchSettings,
      hydrated,
      marks,
      addPositionBookmark,
      addCollection,
      removeMark,
      loadChapter,
      chapters,
      index?.title,
      fallbackTitle,
      currentChapterId,
      onChapterIdChange,
      hasPrev,
      hasNext,
      navigateChapter,
      chapter,
      storageKey,
      renderContent,
    ]
  )

  if (!index) {
    return (
      <div
        className={`flex h-full items-center justify-center p-6 text-sm ${indexError ? 'text-destructive' : 'text-muted-foreground'}`}
      >
        {indexError ?? '正在加载书目…'}
      </div>
    )
  }

  return <BookReader config={config} />
}
