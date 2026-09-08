'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Check, ChevronRight, Search, Volume2 } from 'lucide-react'
import { mutate } from 'swr'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useDebounce } from '@/hooks/useDebounce'
import {
  useBook,
  useBookWords,
  useWordSettings,
  updateWordSettings,
  type WordFilter,
} from '../../hooks/useWord'
import { useWordStore } from '../../stores/wordStore'
import { useWordPronunciation } from '../../hooks/useWordPronunciation'
import { WordPageHeader } from '../../components/WordPageHeader'
import { WordPanel } from '../../components/WordPanel'
import type { Word } from '../../types'

const filters: { value: WordFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'mastered', label: '已学会' },
  { value: 'difficult', label: '困难词' },
  { value: 'simple', label: '简单词' },
]

export default function BookDetailPage() {
  const params = useParams()
  const bookId = Number(params.id) || 0
  const [filter, setFilter] = useState<WordFilter>('all')
  const [keyword, setKeyword] = useState('')
  const search = useDebounce(keyword.trim(), 300)
  // Keep each page number tied to its search/filter so a new query always starts on page one.
  const [paginationState, setPaginationState] = useState({ key: '', page: 1 })
  const queryKey = `${bookId}:${filter}:${search}`
  const page = paginationState.key === queryKey ? paginationState.page : 1
  const setPage = (next: number) => setPaginationState({ key: queryKey, page: next })
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedWord, setSelectedWord] = useState<Word | null>(null)
  const [jumpOpen, setJumpOpen] = useState(false)
  const [jumpPage, setJumpPage] = useState('')
  const {
    data: book,
    isLoading: bookLoading,
    error: bookError,
    mutate: reloadBook,
  } = useBook(bookId)
  const { data: settings } = useWordSettings()
  const {
    data: result,
    isLoading: wordsLoading,
    error: wordsError,
    mutate: reloadWords,
  } = useBookWords(bookId, page, 30, filter, search)
  const { playAmericanPronunciation, cancel } = useWordPronunciation()
  const current = settings?.current_book_id === bookId
  const totalPages = result?.meta.last_page ?? 1

  const selectBook = async () => {
    if (current || isSelecting) return
    setIsSelecting(true)
    try {
      const { setting } = await updateWordSettings({ current_book_id: bookId })
      useWordStore.getState().reset()
      useWordStore.getState().setSettings(setting)
      await mutate('/word/settings', setting, { revalidate: false })
      void mutate('/word/stats')
      void mutate('/word/daily')
      toast.success('已切换学习词书')
    } catch {
      toast.error('选择失败，请重试')
    } finally {
      setIsSelecting(false)
    }
  }

  return (
    <PageContainer maxWidth="3xl" className="space-y-5">
      <WordPageHeader
        title={book?.name ?? '单词书'}
        description={book ? `共 ${book.total_words.toLocaleString()} 个单词` : undefined}
        backHref="/word/books"
        backLabel="返回单词书列表"
      />
      {bookLoading ? (
        <div className="flex justify-center p-12">
          <LoadingSpinner />
        </div>
      ) : bookError || !book ? (
        <div className="space-y-3 rounded-2xl border p-8 text-center">
          <p>暂时无法加载这本单词书</p>
          <Button variant="outline" onClick={() => void reloadBook()}>
            重试
          </Button>
        </div>
      ) : (
        <>
          <div className="bg-card flex flex-wrap items-center gap-3 rounded-xl border p-4">
            <p className="text-muted-foreground min-w-0 flex-1 basis-40 text-sm leading-relaxed">
              {book.description || '浏览词汇，查看释义与例句。'}
            </p>
            {current ? (
              <Button asChild variant="secondary">
                <Link href="/word/learn">
                  <Check className="size-4" />
                  当前词书 · 去学习
                </Link>
              </Button>
            ) : (
              <Button disabled={isSelecting} onClick={() => void selectBook()}>
                {isSelecting ? '切换中…' : '选择此书'}
              </Button>
            )}
          </div>
          <div className="space-y-3">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                type="search"
                aria-label="搜索本书单词"
                placeholder="搜索本书全部英文单词"
                className="h-11 pl-10"
                value={keyword}
                onChange={event => setKeyword(event.target.value)}
              />
            </div>
            <div
              className="bg-muted/60 grid grid-cols-4 gap-1 rounded-xl p-1"
              aria-label="单词筛选"
            >
              {filters.map(item => (
                <Button
                  key={item.value}
                  variant={filter === item.value ? 'secondary' : 'ghost'}
                  aria-pressed={filter === item.value}
                  className="px-1 text-sm"
                  onClick={() => setFilter(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{search ? '搜索结果' : filters.find(item => item.value === filter)?.label}</span>
            <span>{result?.meta.total ?? 0} 个单词</span>
          </div>
          {wordsLoading || keyword.trim() !== search ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : wordsError ? (
            <div className="space-y-3 p-8 text-center">
              <p>单词加载失败</p>
              <Button variant="outline" onClick={() => void reloadWords()}>
                重试
              </Button>
            </div>
          ) : result?.data.length ? (
            <div className="bg-card divide-y overflow-hidden rounded-2xl border">
              {result.data.map(word => (
                <button
                  key={word.id}
                  onClick={() => setSelectedWord(word)}
                  className="hover:bg-accent/60 focus-visible:ring-ring flex w-full min-w-0 items-center gap-3 p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-semibold break-all">{word.content}</span>
                      {word.phonetic_us && (
                        <span className="text-muted-foreground text-xs break-all">
                          /{word.phonetic_us}/
                        </span>
                      )}
                    </span>
                    <span className="text-muted-foreground mt-1 block line-clamp-2 text-sm break-words">
                      {word.explanation || '暂无中文释义'}
                    </span>
                    {!!word.education_levels?.length && (
                      <span className="mt-2 flex flex-wrap gap-1">
                        {word.education_levels.map(level => (
                          <span
                            key={level.id}
                            className="bg-muted rounded px-1.5 py-0.5 text-[11px] text-muted-foreground"
                          >
                            {level.name}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                  <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground rounded-2xl border border-dashed p-8 text-center text-sm">
              {search ? '没有找到匹配的单词，试试其他拼写。' : '这个分类还没有单词。'}
            </p>
          )}
          {totalPages > 1 && (
            <div className="bg-background/95 sticky bottom-0 flex items-center justify-between gap-2 rounded-xl border p-2 backdrop-blur">
              <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                上一页
              </Button>
              <Button
                variant="ghost"
                className="px-2 tabular-nums"
                aria-label={`跳转页码，当前第 ${page} 页，共 ${totalPages} 页`}
                onClick={() => {
                  setJumpPage(String(page))
                  setJumpOpen(true)
                }}
              >
                {page} / {totalPages}
              </Button>
              <Button
                variant="ghost"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
      <WordPanel
        open={selectedWord !== null}
        onOpenChange={open => {
          if (!open) {
            setSelectedWord(null)
            cancel()
          }
        }}
        title={selectedWord?.content ?? '单词详情'}
      >
        {selectedWord && (
          <div className="space-y-5 p-5 break-words">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-muted-foreground text-sm">
                {selectedWord.phonetic_us ? `/${selectedWord.phonetic_us}/` : '暂无音标'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void playAmericanPronunciation(selectedWord.content)}
              >
                <Volume2 className="size-4" />
                美式发音
              </Button>
            </div>
            <section>
              <h3 className="mb-2 text-sm font-medium">释义</h3>
              <p className="bg-muted/50 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line">
                {selectedWord.explanation || '暂无中文释义'}
              </p>
            </section>
            {!!selectedWord.example_sentences?.length && (
              <section className="space-y-3">
                <h3 className="text-sm font-medium">例句</h3>
                {selectedWord.example_sentences.map((example, index) => (
                  <div
                    key={index}
                    className="space-y-2 border-l-2 border-primary/30 pl-3 text-sm leading-relaxed"
                  >
                    <p>{example.en}</p>
                    <p className="text-muted-foreground">{example.zh}</p>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </WordPanel>
      <WordPanel
        open={jumpOpen}
        onOpenChange={setJumpOpen}
        title="跳转页码"
        description={`共 ${totalPages} 页`}
      >
        <form
          className="flex gap-3 p-5"
          onSubmit={event => {
            event.preventDefault()
            const next = Number(jumpPage)
            if (Number.isInteger(next) && next >= 1 && next <= totalPages) {
              setPage(next)
              setJumpOpen(false)
            }
          }}
        >
          <Input
            aria-label="页码"
            type="number"
            inputMode="numeric"
            min={1}
            max={totalPages}
            required
            value={jumpPage}
            onChange={event => setJumpPage(event.target.value)}
          />
          <Button type="submit">跳转</Button>
        </form>
      </WordPanel>
    </PageContainer>
  )
}
