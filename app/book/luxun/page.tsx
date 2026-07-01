'use client'

import { Noto_Serif_SC } from 'next/font/google'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { BookReader } from '@/app/book/components/BookReader'
import { getBookFontFamily, getBookThemeStyle, getBookToolbarTheme } from '@/app/book/utils/theme'
import { useBookSettings } from '@/app/book/utils/settings'
import { useBookMarks, type BookMark } from '@/app/book/utils/bookMarks'
import { getSavedScrollPosition, saveScrollPosition } from '@/app/book/utils/scroll'

const notoSerif = Noto_Serif_SC({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
  preload: false,
})

const BOOK_BASE =
  (process.env.NEXT_PUBLIC_ASSET_BASE_URL?.trim() || 'https://upyun.dogeow.com') + '/books/luxun'

const STORAGE_KEY = 'dogeow-luxun-reader'

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

export default function LuxunBookPage() {
  const { settings, patchSettings, hydrated } = useBookSettings({
    storageKey: STORAGE_KEY,
    defaults: {
      originalFontFamily: 'yahei',
      translationFontFamily: 'yahei',
      fontSize: 20,
      lineHeight: 1.9,
      theme: 'sepia',
      pairDisplayMode: 'muted',
      contentMode: 'both',
      chapterId: '0-0',
    } as any,
  })
  const { marks, addPositionBookmark, removeMark } = useBookMarks('luxun')

  const [index, setIndex] = useState<BookIndex | null>(null)
  const [chapterContent, setChapterContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedVolume, setSelectedVolume] = useState(0)
  const [selectedChapter, setSelectedChapter] = useState(0)

  const flatChapters = useMemo(() => {
    if (!index) return []
    const result: { id: string; name: string; volIdx: number; chIdx: number }[] = []
    index.volumes.forEach((vol, volIdx) => {
      vol.chapters.forEach((ch, chIdx) => {
        result.push({
          id: `${volIdx}-${chIdx}`,
          name: ch.name,
          volIdx,
          chIdx,
        })
      })
    })
    return result
  }, [index])

  const currentChapterId = `${selectedVolume}-${selectedChapter}`

  const loadChapter = useCallback(
    async (chapterId: string) => {
      if (!index) return

      const [volIdx, chIdx] = chapterId.split('-').map(Number)
      if (isNaN(volIdx) || isNaN(chIdx)) return

      const vol = index.volumes[volIdx]
      const ch = vol?.chapters[chIdx]
      if (!ch) return

      try {
        const res = await fetch(`${BOOK_BASE}/${ch.file}`)
        if (!res.ok) throw new Error('章节加载失败')
        const text = await res.text()
        setChapterContent(text)
        setSelectedVolume(volIdx)
        setSelectedChapter(chIdx)
      } catch (loadError) {
        console.error('Failed to load chapter:', loadError)
        throw loadError instanceof Error ? loadError : new Error('加载失败')
      }
    },
    [index]
  )

  useEffect(() => {
    fetch(`${BOOK_BASE}/index.json`)
      .then(res => {
        if (!res.ok) throw new Error('书目索引加载失败')
        return res.json() as Promise<BookIndex>
      })
      .then(setIndex)
      .catch(err => console.error('Failed to load index:', err))
  }, [])

  // Auto-load chapter when settings are hydrated and index is ready
  useEffect(() => {
    if (!hydrated || !index) return

    const savedChapterId = (settings as any).chapterId as string
    const [savedVol, savedCh] = savedChapterId.split('-').map(Number)
    if (!isNaN(savedVol) && !isNaN(savedCh) && savedVol < index.volumes.length) {
      const vol = index.volumes[savedVol]
      if (savedCh < vol.chapters.length) {
        setSelectedVolume(savedVol)
        setSelectedChapter(savedCh)
        loadChapter(savedChapterId)
        return
      }
    }

    loadChapter('0-0')
  }, [hydrated, index, settings, loadChapter])

  // Save scroll position
  useEffect(() => {
    const el = document.getElementById('luxun-content')
    if (!el) return

    const onScroll = () => {
      saveScrollPosition(STORAGE_KEY, currentChapterId, el.scrollTop)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [currentChapterId, chapterContent])

  // Restore scroll position after chapter loads
  useEffect(() => {
    if (!chapterContent) return
    const saved = getSavedScrollPosition(STORAGE_KEY, currentChapterId)
    const el = document.getElementById('luxun-content')
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = saved
      })
    }
  }, [chapterContent, currentChapterId])

  const navigateChapter = useCallback(
    (direction: -1 | 1) => {
      const currentFlatIdx = flatChapters.findIndex(c => c.id === currentChapterId)
      if (currentFlatIdx < 0) return

      const newIdx = currentFlatIdx + direction
      if (newIdx >= 0 && newIdx < flatChapters.length) {
        const next = flatChapters[newIdx]
        patchSettings({ chapterId: next.id })
        loadChapter(next.id)
      }
    },
    [flatChapters, currentChapterId, loadChapter, patchSettings]
  )

  const currentVol = index?.volumes[selectedVolume]
  const currentCh = currentVol?.chapters[selectedChapter]
  const currentFlatIdx = flatChapters.findIndex(c => c.id === currentChapterId)
  const hasPrev = currentFlatIdx > 0
  const hasNext = currentFlatIdx >= 0 && currentFlatIdx < flatChapters.length - 1

  const handleAddBookmark = useCallback(() => {
    if (!chapterContent) {
      toast.error('请稍候，正文加载完成后再添加书签')
      return
    }

    const ch = currentVol?.chapters[selectedChapter]
    const chapterTitle = ch?.name ?? `第${selectedVolume + 1}卷`

    const result = addPositionBookmark({
      chapterId: currentChapterId,
      chapterTitle,
      scrollTop: 0,
      excerpt: chapterContent.slice(0, 80),
    })
    toast[result.created ? 'success' : 'info'](result.created ? '已添加书签' : '该位置已有书签')
  }, [
    chapterContent,
    currentVol,
    selectedChapter,
    selectedVolume,
    currentChapterId,
    addPositionBookmark,
  ])

  const handleJumpToMark = useCallback(
    (mark: BookMark) => {
      patchSettings({ chapterId: mark.chapterId })
      loadChapter(mark.chapterId)
    },
    [patchSettings, loadChapter]
  )

  const config = {
    useSettings: () => ({ settings, patchSettings, hydrated }),
    useBookMarks: () => ({
      marks,
      addPositionBookmark,
      addCollection: addPositionBookmark,
      removeMark,
    }),
    loadChapter,
    chapters: flatChapters,
    currentChapterId,
    onChapterIdChange: (id: string) => {
      patchSettings({ chapterId: id })
      loadChapter(id)
    },
    onPrevChapter: hasPrev ? () => navigateChapter(-1) : undefined,
    onNextChapter: hasNext ? () => navigateChapter(1) : undefined,
    hasPrevChapter: hasPrev,
    hasNextChapter: hasNext,
    hasNarration: false,
    hasTextSelection: false,
    hasPairDisplayMode: false,
    hasContentMode: false,
    renderContent: ({ themeColor }: { themeColor?: string }) => (
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
            <div
              id="luxun-content"
              className="whitespace-pre-wrap text-base leading-relaxed"
              style={{ color: themeColor }}
            >
              {chapterContent}
            </div>
          </>
        )}
      </>
    ),
  }

  if (!index) {
    return (
      <div className="text-destructive flex h-full items-center justify-center p-6 text-sm">
        {error ?? '正在加载书目…'}
      </div>
    )
  }

  return (
    <div className={`${notoSerif.variable} h-full min-h-0`}>
      <BookReader config={config as any} />
    </div>
  )
}
