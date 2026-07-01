'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { API_URL } from '@/lib/api'
import useAuthStore from '@/stores/authStore'

export interface BookMark {
  id: string
  bookId: string
  kind: 'position' | 'collection'
  chapterId: string
  chapterTitle: string
  scrollTop: number
  pairIndex: number | null
  excerpt: string
  note: string
  createdAt: number
}

export interface CreateBookMarkInput {
  kind: 'position' | 'collection'
  chapterId: string
  chapterTitle: string
  scrollTop: number
  pairIndex?: number | null
  excerpt?: string
  note?: string
}

interface StoreBookMarkResponse {
  mark: BookMark
  created: boolean
}

function createBookMarkId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `mark-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function buildBookMark(input: CreateBookMarkInput): BookMark {
  return {
    id: createBookMarkId(),
    bookId: '',
    kind: input.kind,
    chapterId: input.chapterId,
    chapterTitle: input.chapterTitle,
    scrollTop: input.scrollTop,
    pairIndex: input.pairIndex ?? null,
    excerpt: input.excerpt?.trim() ?? '',
    note: input.note?.trim() ?? '',
    createdAt: Date.now(),
  }
}

function sortBookMarks(marks: BookMark[]): BookMark[] {
  return [...marks].sort((a, b) => b.createdAt - a.createdAt)
}

async function requestBookMarks(token: string, bookId: string): Promise<BookMark[]> {
  const response = await fetch(`${API_URL}/api/books/${bookId}/marks`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`读取书签失败：${response.status}`)
  }

  return (await response.json()) as BookMark[]
}

async function createBookMark(
  token: string,
  bookId: string,
  mark: BookMark
): Promise<StoreBookMarkResponse> {
  const response = await fetch(`${API_URL}/api/books/${bookId}/marks`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: mark.id,
      kind: mark.kind,
      chapterId: mark.chapterId,
      chapterTitle: mark.chapterTitle,
      scrollTop: mark.scrollTop,
      excerpt: mark.excerpt,
      note: mark.note,
      createdAt: mark.createdAt,
    }),
  })

  if (!response.ok) {
    throw new Error(`保存书签失败：${response.status}`)
  }

  return (await response.json()) as StoreBookMarkResponse
}

async function deleteBookMark(token: string, bookId: string, id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/books/${bookId}/marks/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok && response.status !== 404) {
    throw new Error(`删除书签失败：${response.status}`)
  }
}

export function useBookMarks(bookId: string) {
  const token = useAuthStore(state => state.token)
  const [marks, setMarks] = useState<BookMark[]>([])
  const tokenRef = useRef<string | null>(token)
  const marksRef = useRef<BookMark[]>([])

  useEffect(() => {
    tokenRef.current = token
  }, [token])

  useEffect(() => {
    marksRef.current = marks
  }, [marks])

  useEffect(() => {
    let cancelled = false

    if (!token) {
      if (marksRef.current.length > 0) {
        queueMicrotask(() => {
          if (!cancelled) setMarks([])
        })
      }
      return
    }

    requestBookMarks(token, bookId)
      .then(async remoteMarks => {
        if (cancelled) return
        const nextMarks = sortBookMarks(remoteMarks)
        setMarks(nextMarks)
      })
      .catch(() => {
        if (!cancelled) setMarks([])
      })

    return () => {
      cancelled = true
    }
  }, [token, bookId])

  const bookMarks = useMemo(() => marks.filter(mark => mark.bookId === bookId), [marks, bookId])

  const addMark = useCallback(
    (input: CreateBookMarkInput): { mark: BookMark; created: boolean } => {
      const currentMarks = marksRef.current
      const duplicate = currentMarks.find(
        mark => mark.kind === input.kind && mark.chapterId === input.chapterId
      )

      if (duplicate) {
        return { mark: duplicate, created: false }
      }

      const mark = buildBookMark(input)
      const optimisticMarks = sortBookMarks([mark, ...currentMarks])
      marksRef.current = optimisticMarks
      setMarks(optimisticMarks)

      const currentToken = tokenRef.current
      if (currentToken) {
        void createBookMark(currentToken, bookId, mark)
          .then(result => {
            setMarks(current => {
              const withoutOptimistic = current.filter(item => item.id !== mark.id)
              return sortBookMarks([result.mark, ...withoutOptimistic])
            })
          })
          .catch(() => {
            setMarks(current => current.filter(item => item.id !== mark.id))
          })
      }

      return { mark, created: true }
    },
    [bookId]
  )

  const removeMark = useCallback(
    (id: string) => {
      let removed: BookMark | undefined
      setMarks(current => {
        removed = current.find(mark => mark.id === id)
        return current.filter(mark => mark.id !== id)
      })

      const currentToken = tokenRef.current
      if (currentToken) {
        void deleteBookMark(currentToken, bookId, id).catch(() => {
          if (removed) {
            setMarks(current => sortBookMarks([removed as BookMark, ...current]))
          }
        })
      }
    },
    [bookId]
  )

  const addPositionBookmark = useCallback(
    (input: Omit<CreateBookMarkInput, 'kind'>) => addMark({ ...input, kind: 'position' }),
    [addMark]
  )

  const addCollection = useCallback(
    (input: Omit<CreateBookMarkInput, 'kind'>) => addMark({ ...input, kind: 'collection' }),
    [addMark]
  )

  return {
    marks: bookMarks,
    positionBookmarks: bookMarks.filter(mark => mark.kind === 'position'),
    collections: bookMarks.filter(mark => mark.kind === 'collection'),
    addPositionBookmark,
    addCollection,
    removeMark,
  }
}
