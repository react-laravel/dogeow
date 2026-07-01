'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import useAuthStore from '@/stores/authStore'
import { fetchBookMarks, removeBookMark, storeBookMark } from './bookMarkApi'

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

function createBookMarkId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `mark-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function buildPositionKey(input: CreateBookMarkInput): string | null {
  if (input.kind !== 'position') return null

  const chapterId = String(input.chapterId)
  if (input.pairIndex != null) {
    return `chapter:${chapterId}:pair:${input.pairIndex}`
  }

  return `chapter:${chapterId}:scroll:${Math.round(input.scrollTop)}`
}

function buildBookMark(input: CreateBookMarkInput): BookMark {
  return {
    id: createBookMarkId(),
    bookId: '',
    kind: input.kind,
    chapterId: String(input.chapterId),
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

    fetchBookMarks(bookId)
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
      const positionKey = buildPositionKey(input)
      const duplicate =
        input.kind === 'position' && positionKey
          ? currentMarks.find(
              mark => mark.kind === 'position' && buildPositionKey(mark) === positionKey
            )
          : currentMarks.find(
              mark => mark.kind === input.kind && String(mark.chapterId) === String(input.chapterId)
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
        void storeBookMark(bookId, mark)
          .then(result => {
            setMarks(current => {
              const withoutOptimistic = current.filter(item => item.id !== mark.id)
              return sortBookMarks([result.mark, ...withoutOptimistic])
            })
          })
          .catch(error => {
            setMarks(current => current.filter(item => item.id !== mark.id))
            const message = error instanceof Error ? error.message : '保存书签失败，请稍后重试'
            toast.error(message)
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
        void removeBookMark(bookId, id).catch(() => {
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
