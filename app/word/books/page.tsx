'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Check, Search } from 'lucide-react'
import { useBooks, useWordSettings, updateWordSettings } from '../hooks/useWord'
import { useWordStore } from '../stores/wordStore'
import { WordPageHeader } from '../components/WordPageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PageContainer } from '@/components/layout'
import { toast } from 'sonner'
import { mutate } from 'swr'

export default function BooksPage() {
  const { data: books, isLoading, error, mutate: reload } = useBooks()
  const { data: settings } = useWordSettings()
  const [keyword, setKeyword] = useState('')
  const [selectingId, setSelectingId] = useState<number | null>(null)
  const visibleBooks =
    books?.filter(book =>
      (book.name + (book.description ?? '')).toLowerCase().includes(keyword.trim().toLowerCase())
    ) ?? []

  const selectBook = async (bookId: number) => {
    if (selectingId !== null) return
    setSelectingId(bookId)
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
      setSelectingId(null)
    }
  }

  return (
    <PageContainer maxWidth="5xl" className="space-y-6">
      <WordPageHeader title="单词书" description="找到适合自己的词书，循序渐进地学习。" />
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          type="search"
          aria-label="搜索单词书"
          placeholder="搜索词书名称或介绍"
          className="h-11 pl-10"
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
        />
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="space-y-3 rounded-2xl border p-8 text-center">
          <p>单词书加载失败</p>
          <Button variant="outline" onClick={() => void reload()}>
            重试
          </Button>
        </div>
      ) : visibleBooks.length === 0 ? (
        <div className="text-muted-foreground rounded-2xl border border-dashed p-8 text-center">
          {keyword ? '没有找到匹配的单词书，试试其他关键词。' : '暂时还没有单词书。'}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleBooks.map(book => {
            const current = settings?.current_book_id === book.id
            return (
              <article
                key={book.id}
                className={
                  current
                    ? 'bg-card border-primary/50 flex min-w-0 flex-col rounded-2xl border p-5'
                    : 'bg-card flex min-w-0 flex-col rounded-2xl border p-5'
                }
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                    <BookOpen className="size-5" />
                  </span>
                  {current && (
                    <span className="text-primary flex items-center gap-1 text-xs font-medium">
                      <Check className="size-4" />
                      正在学习
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold break-words">{book.name}</h2>
                <p className="text-muted-foreground mt-2 flex-1 text-sm leading-relaxed">
                  {book.description || '从熟悉的词开始，逐步拓展词汇。'}
                </p>
                <p className="text-muted-foreground mt-4 text-xs">
                  {book.total_words.toLocaleString()} 个单词
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4">
                  <Button asChild variant="outline">
                    <Link href={`/word/books/${book.id}`}>浏览单词</Link>
                  </Button>
                  {current ? (
                    <Button asChild>
                      <Link href="/word/learn">开始学习</Link>
                    </Button>
                  ) : (
                    <Button
                      disabled={selectingId !== null}
                      onClick={() => void selectBook(book.id)}
                    >
                      {selectingId === book.id ? '切换中…' : '选择此书'}
                    </Button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}
