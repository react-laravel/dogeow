'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  useBook,
  useBookWords,
  useWordSettings,
  updateWordSettings,
  type WordFilter,
} from '../../hooks/useWord'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Check, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { mutate } from 'swr'
import { PageContainer } from '@/components/layout'
import type { Word } from '../../types'

const WORD_FILTERS: { value: WordFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'mastered', label: '已学会' },
  { value: 'difficult', label: '困难词' },
  { value: 'simple', label: '简单词' },
]

const PAGE_PICKER_ITEM_HEIGHT = 48
const PAGE_PICKER_VISIBLE_ROWS = 7
const PAGE_PICKER_CENTER_OFFSET = Math.floor(PAGE_PICKER_VISIBLE_ROWS / 2) * PAGE_PICKER_ITEM_HEIGHT

export default function BookDetailPage() {
  const params = useParams()
  const bookId = params.id ? Number(params.id) : null

  const [filter, setFilter] = useState<WordFilter>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedWord, setSelectedWord] = useState<Word | null>(null)
  const [pagePickerOpen, setPagePickerOpen] = useState(false)
  const [pickerPage, setPickerPage] = useState(1)
  const pickerScrollRef = useRef<HTMLDivElement>(null)
  const pickerScrollTimerRef = useRef<number | null>(null)
  const pickerDragStartYRef = useRef<number | null>(null)
  const lastPickerDismissAtRef = useRef(0)

  const { data: book, isLoading: bookLoading } = useBook(bookId ?? 0)
  const { data: settings } = useWordSettings()
  const isCurrentBook = settings?.current_book_id === bookId

  const handleSelectBook = async () => {
    if (!bookId || isCurrentBook) return
    setIsSelecting(true)
    try {
      await updateWordSettings({ current_book_id: bookId })
      toast.success('已选择此单词书')
      mutate('/word/settings')
      mutate('/word/stats')
    } catch (error) {
      toast.error('选择失败')
      console.error('选择单词书失败:', error)
    } finally {
      setIsSelecting(false)
    }
  }
  const { data: pagedWords, isLoading: wordsLoading } = useBookWords(bookId, page, 30, filter)

  useEffect(() => {
    setPage(1)
  }, [filter])

  const filteredWords = useMemo(() => {
    const words = pagedWords?.data ?? []
    const keyword = searchKeyword.trim().toLowerCase()
    if (!keyword) return words

    return words.filter(word => {
      const examples = word.example_sentences?.flatMap(example => [example.en, example.zh]) ?? []
      const haystacks = [word.content, word.phonetic_us, word.explanation, ...examples]
      return haystacks.some(text => text?.toLowerCase().includes(keyword))
    })
  }, [pagedWords?.data, searchKeyword])

  const pagination = pagedWords?.meta
  const total = pagination?.total ?? 0

  useEffect(() => {
    setPickerPage(page)
  }, [page])

  useEffect(() => {
    if (!pagePickerOpen || !pickerScrollRef.current) return

    const targetScrollTop = Math.max(0, (page - 1) * PAGE_PICKER_ITEM_HEIGHT)
    pickerScrollRef.current.scrollTo({ top: targetScrollTop, behavior: 'auto' })
    setPickerPage(page)
  }, [pagePickerOpen, page])

  useEffect(() => {
    return () => {
      if (pickerScrollTimerRef.current) {
        window.clearTimeout(pickerScrollTimerRef.current)
      }
    }
  }, [])

  const snapPickerToPage = (nextPage: number) => {
    const clampedPage = Math.min(Math.max(nextPage, 1), pagination?.last_page ?? 1)
    setPickerPage(clampedPage)
    pickerScrollRef.current?.scrollTo({
      top: (clampedPage - 1) * PAGE_PICKER_ITEM_HEIGHT,
      behavior: 'smooth',
    })
  }

  const handlePickerScroll = () => {
    if (!pickerScrollRef.current || !pagination) return

    const rawPage = Math.round(pickerScrollRef.current.scrollTop / PAGE_PICKER_ITEM_HEIGHT) + 1
    const nextPage = Math.min(Math.max(rawPage, 1), pagination.last_page)
    setPickerPage(nextPage)

    if (pickerScrollTimerRef.current) {
      window.clearTimeout(pickerScrollTimerRef.current)
    }

    pickerScrollTimerRef.current = window.setTimeout(() => {
      snapPickerToPage(nextPage)
    }, 120)
  }

  const closePagePicker = () => {
    lastPickerDismissAtRef.current = Date.now()
    setPagePickerOpen(false)
  }

  if (bookLoading) {
    return (
      <PageContainer maxWidth="2xl" className="py-6">
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </PageContainer>
    )
  }

  if (!book) {
    return (
      <PageContainer maxWidth="2xl" className="py-6">
        <div className="py-12 text-center">
          <p className="text-muted-foreground">单词书不存在</p>
          <Link href="/word/books">
            <Button variant="link">返回单词书</Button>
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col overflow-hidden px-3 py-4 sm:px-4"
      style={{ height: 'calc(100dvh - var(--app-header-height))' }}
    >
      {/* 标题栏 */}
      <div className="flex shrink-0 items-center gap-4">
        <Link href="/word/books">
          <Button variant="ghost" size="icon" aria-label="返回单词书列表">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="flex-1 text-2xl font-bold tracking-tight">{book.name}</h1>
        {isCurrentBook ? (
          <span className="text-primary flex items-center gap-1 text-sm">
            <Check className="h-4 w-4" />
            当前
          </span>
        ) : (
          <Button variant="outline" size="sm" onClick={handleSelectBook} disabled={isSelecting}>
            {isSelecting ? <LoadingSpinner className="h-4 w-4" /> : '选择此书'}
          </Button>
        )}
        <Link href="/word">
          <Button variant="ghost" size="icon" aria-label="关闭单词书详情">
            <X className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* 搜索框 */}
      <div className="shrink-0 py-2">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="搜索本单词书..."
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* 筛选按钮 */}
      <div className="flex shrink-0 flex-wrap gap-2 py-3">
        {WORD_FILTERS.map(f => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
        {total > 0 && (
          <span className="text-muted-foreground ml-auto self-center text-sm">{total} 个</span>
        )}
      </div>

      {/* 单词列表 */}
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {wordsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner className="h-6 w-6" />
          </div>
        ) : filteredWords.length > 0 ? (
          <div className="space-y-1">
            {filteredWords.map(word => (
              <button
                key={word.id}
                type="button"
                onClick={() => setSelectedWord(word)}
                className="hover:bg-accent/50 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
              >
                <span className="min-w-[80px] shrink-0 font-medium">{word.content}</span>
                {word.phonetic_us && (
                  <span className="text-muted-foreground shrink-0 text-sm">
                    /{word.phonetic_us}/
                  </span>
                )}
                {word.education_levels && word.education_levels.length > 0 && (
                  <div className="flex shrink-0 gap-1">
                    {word.education_levels.map(level => (
                      <span
                        key={level.id}
                        className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-xs font-medium"
                      >
                        {level.name}
                      </span>
                    ))}
                  </div>
                )}
                {word.explanation && (
                  <span className="text-muted-foreground truncate text-sm whitespace-pre-line">
                    {word.explanation.split('\n')[0]}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center">
            {searchKeyword.trim()
              ? '当前页未找到匹配的单词'
              : filter === 'all'
                ? '暂无单词'
                : filter === 'mastered'
                  ? '暂无已学会的单词'
                  : filter === 'difficult'
                    ? '暂无困难词'
                    : '暂无简单词'}
          </p>
        )}
      </div>

      {pagination && pagination.last_page > 1 && !searchKeyword.trim() && (
        <div className="flex shrink-0 items-center justify-between border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </Button>
          <button
            type="button"
            onClick={() => {
              if (Date.now() - lastPickerDismissAtRef.current < 1000) return
              setPagePickerOpen(true)
            }}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            第 {pagination.current_page} / {pagination.last_page} 页
          </button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.last_page}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      )}

      <Dialog open={selectedWord !== null} onOpenChange={open => !open && setSelectedWord(null)}>
        <DialogContent className="max-w-lg">
          {selectedWord && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-2xl font-bold">
                  {selectedWord.content}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="text-muted-foreground flex items-center justify-center gap-3 text-sm">
                  {selectedWord.phonetic_us && <span>/{selectedWord.phonetic_us}/</span>}
                </div>

                {selectedWord.education_levels && selectedWord.education_levels.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {selectedWord.education_levels.map(level => (
                      <span
                        key={level.id}
                        className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium"
                      >
                        {level.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="bg-muted/50 rounded-lg p-4">
                  {selectedWord.explanation ? (
                    <div className="text-base whitespace-pre-line">
                      {selectedWord.explanation.split('\n').map((line, idx) => (
                        <p key={idx} className={idx > 0 ? 'mt-1' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">暂无中文释义</p>
                  )}
                </div>

                {selectedWord.example_sentences && selectedWord.example_sentences.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-muted-foreground text-sm font-medium">例句</h4>
                    {selectedWord.example_sentences.slice(0, 2).map((example, index) => (
                      <div key={index} className="bg-muted/30 rounded p-3 text-sm">
                        <p className="mb-1">{example.en}</p>
                        <p className="text-muted-foreground text-xs">{example.zh}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {pagination && pagination.last_page > 1 && (
        <Sheet
          open={pagePickerOpen}
          onOpenChange={open => {
            if (!open) {
              closePagePicker()
              return
            }
            setPagePickerOpen(true)
          }}
        >
          <SheetContent
            side="bottom"
            className="h-auto max-h-[520px] rounded-t-3xl border-x-0 border-t p-0 [&>button:last-child]:hidden"
            style={{ top: 'auto' }}
            aria-describedby={undefined}
          >
            <div className="border-b bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                <div
                  className="col-start-2 flex w-16 cursor-grab items-center justify-center py-1 active:cursor-grabbing"
                  onPointerDown={event => {
                    pickerDragStartYRef.current = event.clientY
                  }}
                  onPointerUp={event => {
                    if (
                      pickerDragStartYRef.current !== null &&
                      event.clientY - pickerDragStartYRef.current > 36
                    ) {
                      closePagePicker()
                    }
                    pickerDragStartYRef.current = null
                  }}
                  onPointerCancel={() => {
                    pickerDragStartYRef.current = null
                  }}
                >
                  <div className="bg-muted h-1.5 w-10 rounded-full" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="col-start-3 justify-self-end px-2"
                  onClick={() => {
                    setPage(pickerPage)
                    closePagePicker()
                  }}
                >
                  确定
                </Button>
              </div>
            </div>
            <div className="relative px-4 pb-6">
              <div
                aria-hidden
                className="pointer-events-none absolute right-4 left-4 z-10 rounded-xl border border-primary/20 bg-primary/8"
                style={{
                  top: PAGE_PICKER_CENTER_OFFSET,
                  height: PAGE_PICKER_ITEM_HEIGHT,
                }}
              />
              <div
                ref={pickerScrollRef}
                onScroll={handlePickerScroll}
                className="no-scrollbar snap-y snap-mandatory overflow-y-auto"
                style={{
                  height: PAGE_PICKER_ITEM_HEIGHT * PAGE_PICKER_VISIBLE_ROWS,
                  paddingTop: PAGE_PICKER_CENTER_OFFSET,
                  paddingBottom: PAGE_PICKER_CENTER_OFFSET,
                }}
              >
                {Array.from({ length: pagination.last_page }, (_, index) => {
                  const pageNumber = index + 1
                  const isActive = pageNumber === pickerPage

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => snapPickerToPage(pageNumber)}
                      className={`flex w-full snap-center items-center justify-between px-4 text-left text-base transition-colors ${
                        isActive
                          ? 'text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      style={{ height: PAGE_PICKER_ITEM_HEIGHT }}
                    >
                      <span>第 {pageNumber} 页</span>
                      {isActive && <Check className="h-5 w-5 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
