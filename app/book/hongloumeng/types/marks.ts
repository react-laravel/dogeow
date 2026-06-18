export const HONGLOUMENG_BOOK_ID = 'hongloumeng' as const

export type BookMarkKind = 'position' | 'collection'

export interface BookMark {
  id: string
  bookId: typeof HONGLOUMENG_BOOK_ID
  kind: BookMarkKind
  chapterId: number
  chapterTitle: string
  scrollTop: number
  pairIndex: number | null
  excerpt: string
  note: string
  createdAt: number
}

export interface CreateBookMarkInput {
  kind: BookMarkKind
  chapterId: number
  chapterTitle: string
  scrollTop: number
  pairIndex?: number | null
  excerpt?: string
  note?: string
}
