'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookReader } from '@/app/book/components/BookReader'
import { useBookSettings } from '@/app/book/utils/settings'
import { useBookMarks } from '@/app/book/utils/bookMarks'
import type { BookReaderConfig } from '@/app/book/types'
import type { VolumeReaderSettings } from '@/app/book/types/reader'
import {
  getBookAssetBaseUrl,
  getBookReaderStorageKey,
  VOLUME_BOOK_DEFAULTS,
} from '@/app/book/utils/registry'

interface Volume {
  name: string
  chapters: { name: string; file: string }[]
}

interface BookIndex {
  title: string
  totalVolumes: number
  totalChapters: number
  volumes: Volume[]
}

export interface VolumeBookReaderProps {
  bookId: string
  fallbackTitle?: string
  chapterSelectPlaceholder?: string
  defaultChapterId?: string
}

function parseChapterPosition(chapterId: string): [number, number] {
  const [volIdx, chIdx] = chapterId.split('-').map(Number)
  return [volIdx, chIdx]
}

export function VolumeBookReader({
  bookId,
  fallbackTitle = '书目',
  chapterSelectPlaceholder = '选择篇目',
  defaultChapterId = '0-0',
}: VolumeBookReaderProps) {
  const bookBase = getBookAssetBaseUrl(bookId)
  const storageKey = getBookReaderStorageKey(bookId)

  const defaultSettings: VolumeReaderSettings = {
    ...VOLUME_BOOK_DEFAULTS,
    chapterId: defaultChapterId,
  }

  const { settings, patchSettings, hydrated } = useBookSettings<VolumeReaderSettings>({
    storageKey,
    defaults: defaultSettings,
  })
  const { marks, addPositionBookmark, addCollection, removeMark } = useBookMarks(bookId)

  const [index, setIndex] = useState<BookIndex | null>(null)
  const [chapterContent, setChapterContent] = useState<string | null>(null)
  const [indexError, setIndexError] = useState<string | null>(null)

  const currentChapterId = settings.chapterId

  const flatChapters = useMemo(() => {
    if (!index) return []
    const result: { id: string; title: string }[] = []
    index.volumes.forEach((vol, volIdx) => {
      vol.chapters.forEach((ch, chIdx) => {
        result.push({
          id: `${volIdx}-${chIdx}`,
          title: `${vol.name} · ${ch.name}`,
        })
      })
    })
    return result
  }, [index])

  const chapterGroups = useMemo(() => {
    if (!index) return []
    return index.volumes.map((vol, volIdx) => ({
      label: vol.name,
      chapters: vol.chapters.map((ch, chIdx) => ({
        id: `${volIdx}-${chIdx}`,
        title: ch.name,
      })),
    }))
  }, [index])

  const [currentVolIdx, currentChIdx] = parseChapterPosition(currentChapterId)
  const currentVol = index?.volumes[currentVolIdx]
  const currentCh = currentVol?.chapters[currentChIdx]

  const contentParagraphs = useMemo(() => {
    if (!chapterContent) return []
    return chapterContent.split(/\n{2,}/).filter(Boolean)
  }, [chapterContent])

  const loadChapter = useCallback(
    async (chapterId: string) => {
      if (!index) return

      const [volIdx, chIdx] = parseChapterPosition(chapterId)
      if (Number.isNaN(volIdx) || Number.isNaN(chIdx)) return

      const ch = index.volumes[volIdx]?.chapters[chIdx]
      if (!ch) return

      setChapterContent(null)

      const res = await fetch(`${bookBase}/${ch.file}`)
      if (!res.ok) throw new Error('章节加载失败')
      const text = await res.text()
      setChapterContent(text)
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
        console.error('Failed to load index:', err)
        setIndexError(err instanceof Error ? err.message : '书目索引加载失败')
      })
  }, [bookBase])

  const navigateChapter = useCallback(
    (direction: -1 | 1) => {
      const currentFlatIdx = flatChapters.findIndex(c => c.id === currentChapterId)
      if (currentFlatIdx < 0) return

      const newIdx = currentFlatIdx + direction
      if (newIdx >= 0 && newIdx < flatChapters.length) {
        patchSettings({ chapterId: flatChapters[newIdx].id })
      }
    },
    [flatChapters, currentChapterId, patchSettings]
  )

  const currentFlatIdx = flatChapters.findIndex(c => c.id === currentChapterId)
  const hasPrev = currentFlatIdx > 0
  const hasNext = currentFlatIdx >= 0 && currentFlatIdx < flatChapters.length - 1

  const onChapterIdChange = useCallback(
    (id: string) => {
      patchSettings({ chapterId: id })
    },
    [patchSettings]
  )

  const renderContent = useCallback(
    ({ themeColor }: { themeColor?: string }) => (
      <>
        {!chapterContent && <p className="text-sm opacity-70">正在加载章节…</p>}

        {chapterContent && (
          <>
            <header className="mb-8 border-b border-current/10 pb-6">
              <h1 className="text-2xl font-semibold" style={{ color: themeColor }}>
                {currentCh?.name ?? ''}
              </h1>
              {currentVol && (
                <p className="mt-1 text-sm" style={{ color: themeColor, opacity: 0.6 }}>
                  {currentVol.name}
                </p>
              )}
            </header>
            <div className="text-base leading-relaxed" style={{ color: themeColor }}>
              {contentParagraphs.map((paragraph, index) => (
                <p key={index} className="mb-4 whitespace-pre-wrap last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </>
        )}
      </>
    ),
    [chapterContent, contentParagraphs, currentCh?.name, currentVol]
  )

  const config = useMemo<
    BookReaderConfig<string, VolumeReaderSettings, ReturnType<typeof useBookMarks>['marks'][number]>
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
      chapters: flatChapters,
      chapterGroups,
      bookTitle: index?.title ?? fallbackTitle,
      currentChapterId,
      onChapterIdChange,
      onPrevChapter: hasPrev ? () => navigateChapter(-1) : undefined,
      onNextChapter: hasNext ? () => navigateChapter(1) : undefined,
      hasPrevChapter: hasPrev,
      hasNextChapter: hasNext,
      hasNarration: false,
      hasTextSelection: true,
      hasPairDisplayMode: false,
      hasContentMode: false,
      scrollStorageKey: storageKey,
      chapterSelectPlaceholder,
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
      flatChapters,
      chapterGroups,
      index?.title,
      fallbackTitle,
      currentChapterId,
      onChapterIdChange,
      hasPrev,
      hasNext,
      navigateChapter,
      storageKey,
      chapterSelectPlaceholder,
      renderContent,
    ]
  )

  if (!index) {
    return (
      <div className="text-destructive flex h-full items-center justify-center p-6 text-sm">
        {indexError ?? '正在加载书目…'}
      </div>
    )
  }

  return <BookReader config={config} />
}
