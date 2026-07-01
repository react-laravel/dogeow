import { Noto_Serif_SC } from 'next/font/google'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { BookReader } from '@/app/book/components/BookReader'
import { getBookFontFamily, getBookThemeStyle, getBookToolbarTheme } from '@/app/book/utils/theme'
import { useBookSettings } from '@/app/book/utils/settings'
import { useBookMarks, type BookMark } from '@/app/book/utils/bookMarks'
import { getSavedScrollPosition } from '@/app/book/utils/scroll'

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
  const [loading, setLoading] = useState(true)
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

      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${BOOK_BASE}/${ch.file}`)
        if (!res.ok) throw new Error('章节加载失败')
        const text = await res.text()
        setChapterContent(text)
        setSelectedVolume(volIdx)
        setSelectedChapter(chIdx)

        const saved = getSavedScrollPosition(STORAGE_KEY, chapterId)
        requestAnimationFrame(() => {
          const el = document.getElementById('luxun-content')
          if (el) el.scrollTop = saved
        })
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '加载失败')
      } finally {
        setLoading(false)
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
      .catch(err => setError(err.message))
  }, [])

  useEffect(() => {
    if (!hydrated || !index || !chapterContent) return
    if (loading) return

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
  }, [hydrated, index, chapterContent, loading, settings, loadChapter])

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

  const handleAddBookmark = () => {
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
  }

  const handleJumpToMark = (mark: BookMark) => {
    patchSettings({ chapterId: mark.chapterId })
    loadChapter(mark.chapterId)
  }

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
    storageKey: STORAGE_KEY,
    onAddBookmark: handleAddBookmark,
    onJumpToMark: handleJumpToMark,
    renderContent: () => (
      <>
        {loading && <p className="text-sm opacity-70">正在加载章节…</p>}

        {!loading && chapterContent && (
          <>
            <header className="mb-8 border-b border-current/10 pb-6">
              <h1 className="text-2xl font-semibold text-foreground">{currentCh?.name ?? ''}</h1>
              {currentVol && (
                <p className="text-muted-foreground mt-1 text-sm">{currentVol.name}</p>
              )}
            </header>
            <div
              id="luxun-content"
              className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90"
            >
              {chapterContent}
            </div>
          </>
        )}

        {error && index ? <p className="text-destructive mt-4 text-sm">{error}</p> : null}
      </>
    ),
  }

  if (error && !index) {
    return (
      <div className="text-destructive flex h-full items-center justify-center p-6 text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className={`${notoSerif.variable} h-full min-h-0`}>
      <BookReader config={config as any} />
    </div>
  )
}
