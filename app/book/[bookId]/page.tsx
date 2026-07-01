'use client'

import { useParams } from 'next/navigation'
import { Long_Cang, Noto_Serif_SC } from 'next/font/google'
import { configs } from '@/app/configs'
import { VolumeBookReader } from '@/app/book/components/VolumeBookReader'
import { BilingualBookReader } from '@/app/book/components/BilingualBookReader'
import type { BookCatalogEntry } from '@/app/book/utils/registry'

const longCang = Long_Cang({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-long-cang',
  display: 'swap',
  preload: false,
})

const notoSerif = Noto_Serif_SC({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
  preload: false,
})

function findBook(bookId: string): BookCatalogEntry | undefined {
  return (configs.books as BookCatalogEntry[]).find(book => book.id === bookId)
}

export default function BookReaderPage() {
  const params = useParams<{ bookId: string }>()
  const bookId = params.bookId
  const book = findBook(bookId)

  if (!book) {
    return (
      <div className="text-destructive flex h-full items-center justify-center p-6 text-sm">
        未找到该书目
      </div>
    )
  }

  if (book.kind === 'volume') {
    return (
      <div className={`${notoSerif.variable} h-full min-h-0`}>
        <VolumeBookReader
          bookId={book.id}
          fallbackTitle={book.fallbackTitle}
          chapterSelectPlaceholder={book.chapterSelectPlaceholder}
          defaultChapterId={book.defaultChapterId}
        />
      </div>
    )
  }

  if (book.kind === 'bilingual') {
    return (
      <div className={`${longCang.variable} ${notoSerif.variable} h-full min-h-0`}>
        <BilingualBookReader
          bookId={book.id}
          fallbackTitle={book.fallbackTitle}
          defaultChapterId={book.defaultChapterId ? Number(book.defaultChapterId) : undefined}
        />
      </div>
    )
  }

  return (
    <div className="text-destructive flex h-full items-center justify-center p-6 text-sm">
      暂不支持该阅读模式
    </div>
  )
}
