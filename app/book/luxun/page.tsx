'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { PageContainer } from '@/components/layout'
import { ChevronLeft, ChevronRight, BookOpen, Menu, X } from 'lucide-react'

const UPYUN_CDN = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.trim() || 'https://upyun.dogeow.com'
const BOOK_BASE = `${UPYUN_CDN}/books/luxun`

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
  const { t } = useTranslation()
  const [index, setIndex] = useState<BookIndex | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedVolume, setSelectedVolume] = useState<number>(0)
  const [selectedChapter, setSelectedChapter] = useState<number>(0)
  const [chapterContent, setChapterContent] = useState<string>('')
  const [contentLoading, setContentLoading] = useState(false)

  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Load index
  useEffect(() => {
    fetch(`${BOOK_BASE}/index.json`)
      .then(res => {
        if (!res.ok) throw new Error('书目加载失败')
        return res.json()
      })
      .then((data: BookIndex) => {
        setIndex(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // Load chapter content
  const loadChapter = useCallback(
    async (volIdx: number, chIdx: number) => {
      if (!index) return

      const vol = index.volumes[volIdx]
      const ch = vol.chapters[chIdx]
      if (!ch) return

      setContentLoading(true)
      try {
        const res = await fetch(`${BOOK_BASE}/${ch.file}`)
        if (!res.ok) throw new Error('章节加载失败')
        const text = await res.text()
        setChapterContent(text)
        setSelectedVolume(volIdx)
        setSelectedChapter(chIdx)
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setContentLoading(false)
        setSidebarOpen(false)
      }
    },
    [index]
  )

  // Auto-load first chapter
  useEffect(() => {
    if (index && !chapterContent && !loading) {
      loadChapter(0, 0)
    }
  }, [index, loading, chapterContent, loadChapter])

  const currentVolume = index?.volumes[selectedVolume]
  const currentChapter = currentVolume?.chapters[selectedChapter]

  // Find prev/next chapter
  const navigateChapter = (direction: -1 | 1) => {
    if (!currentVolume) return
    const newChIdx = selectedChapter + direction
    if (newChIdx >= 0 && newChIdx < currentVolume.chapters.length) {
      loadChapter(selectedVolume, newChIdx)
    }
  }

  if (loading) {
    return (
      <PageContainer className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{t('common.loading', '加载中...')}</p>
      </PageContainer>
    )
  }

  if (error || !index) {
    return (
      <PageContainer className="flex items-center justify-center py-20">
        <p className="text-destructive">{error || '加载失败'}</p>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="py-0">
      <div className="flex h-[calc(100vh-8rem)]">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-72 transform border-r border-white/10 bg-background/95 backdrop-blur-sm transition-transform lg:relative lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 className="text-lg font-semibold">{index.title}</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden rounded-lg p-1.5 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {index.volumes.map((vol, volIdx) => (
                <div key={vol.name} className="mb-2">
                  <button
                    onClick={() => {
                      setSelectedVolume(volIdx)
                      if (vol.chapters.length > 0) {
                        loadChapter(volIdx, 0)
                      }
                    }}
                    className={`
                      w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors
                      ${
                        volIdx === selectedVolume
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-white/5'
                      }
                    `}
                  >
                    {vol.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({vol.chapters.length})
                    </span>
                  </button>

                  {volIdx === selectedVolume && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                      {vol.chapters.map((ch, chIdx) => (
                        <button
                          key={ch.file}
                          onClick={() => loadChapter(volIdx, chIdx)}
                          className={`
                            block w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors
                            ${
                              chIdx === selectedChapter
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                            }
                          `}
                        >
                          {ch.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-white/10 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              {currentVolume && currentChapter && (
                <span>
                  {currentVolume.name} / {currentChapter.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateChapter(-1)}
                disabled={selectedChapter <= 0}
                className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigateChapter(1)}
                disabled={!currentVolume || selectedChapter >= currentVolume.chapters.length - 1}
                className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Chapter content */}
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 lg:px-12">
            {contentLoading ? (
              <p className="text-muted-foreground">{t('common.loading', '加载中...')}</p>
            ) : (
              <div className="mx-auto max-w-3xl">
                <h1 className="mb-8 text-2xl font-semibold text-foreground">
                  {currentChapter?.name}
                </h1>
                <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
                  {chapterContent}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </PageContainer>
  )
}
