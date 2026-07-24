'use client'

import type { ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { configs } from '@/app/configs'
import { VolumeBookReader } from '@/app/book/components/VolumeBookReader'
import { BilingualBookReader } from '@/app/book/components/BilingualBookReader'
import type { BookCatalogEntry } from '@/app/book/utils/registry'

function findBook(bookId: string | string[] | undefined): BookCatalogEntry | undefined {
  if (typeof bookId !== 'string' || !bookId) return undefined
  return (configs.books as BookCatalogEntry[]).find(book => book.id === bookId)
}

function ReaderShell({ children }: { children: ReactNode }) {
  return <div className="h-full min-h-0">{children}</div>
}

function ReaderMessage({ children }: { children: ReactNode }) {
  return (
    <div className="text-destructive flex h-full items-center justify-center p-6 text-sm">
      {children}
    </div>
  )
}

export default function BookReaderPage() {
  const params = useParams<{ bookId: string }>()
  const book = findBook(params.bookId)

  if (!book) {
    return <ReaderMessage>未找到该书目</ReaderMessage>
  }

  if (book.kind === 'volume') {
    return (
      <ReaderShell>
        <VolumeBookReader
          bookId={book.id}
          fallbackTitle={book.fallbackTitle}
          chapterSelectPlaceholder={book.chapterSelectPlaceholder}
          defaultChapterId={book.defaultChapterId}
        />
      </ReaderShell>
    )
  }

  if (book.kind === 'bilingual') {
    const defaultChapterId = book.defaultChapterId ? Number(book.defaultChapterId) : undefined

    return (
      <ReaderShell>
        <BilingualBookReader
          bookId={book.id}
          fallbackTitle={book.fallbackTitle}
          defaultChapterId={Number.isFinite(defaultChapterId) ? defaultChapterId : undefined}
        />
      </ReaderShell>
    )
  }

  return <ReaderMessage>暂不支持该阅读模式</ReaderMessage>
}
