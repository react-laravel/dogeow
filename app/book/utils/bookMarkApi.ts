import { apiRequest } from '@/lib/api/core'
import { ApiRequestError } from '@/lib/api/errors'
import type { BookMark } from './bookMarks'

interface StoreBookMarkResponse {
  mark: BookMark
  created: boolean
}

const silentApiOptions = { handleError: false } as const

export async function fetchBookMarks(bookId: string): Promise<BookMark[]> {
  return apiRequest<BookMark[]>(`books/${bookId}/marks`, 'GET', undefined, silentApiOptions)
}

export async function storeBookMark(
  bookId: string,
  mark: BookMark
): Promise<StoreBookMarkResponse> {
  return apiRequest<StoreBookMarkResponse>(
    `books/${bookId}/marks`,
    'POST',
    {
      id: mark.id,
      kind: mark.kind,
      chapterId: String(mark.chapterId),
      chapterTitle: mark.chapterTitle,
      scrollTop: mark.scrollTop,
      pairIndex: mark.pairIndex,
      excerpt: mark.excerpt,
      note: mark.note,
      createdAt: mark.createdAt,
    },
    silentApiOptions
  )
}

export async function removeBookMark(bookId: string, id: string): Promise<void> {
  try {
    await apiRequest<null>(`books/${bookId}/marks/${id}`, 'DELETE', undefined, silentApiOptions)
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return
    }

    throw error
  }
}
