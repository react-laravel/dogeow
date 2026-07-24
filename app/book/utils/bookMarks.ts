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
  chapterId: string | number
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

function buildPositionKey(
  input: Pick<CreateBookMarkInput, 'kind' | 'chapterId' | 'pairIndex' | 'scrollTop'>
): string | null {
  if (input.kind !== 'position') return null

  const chapterId = String(input.chapterId)
  if (input.pairIndex != null) {
    return `chapter:${chapterId}:pair:${input.pairIndex}`
  }

  return `chapter:${chapterId}:scroll:${Math.round(input.scrollTop)}`
}

function buildBookMark(bookId: string, input: CreateBookMarkInput): BookMark {
  return {
    id: createBookMarkId(),
    bookId,
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

function findDuplicateMark(marks: BookMark[], input: CreateBookMarkInput): BookMark | undefined {
  if (input.kind === 'position') {
    const positionKey = buildPositionKey(input)
    if (!positionKey) return undefined
    return marks.find(mark => mark.kind === 'position' && buildPositionKey(mark) === positionKey)
  }

  const excerpt = input.excerpt?.trim() ?? ''
  return marks.find(
    mark =>
      mark.kind === 'collection' &&
      String(mark.chapterId) === String(input.chapterId) &&
      mark.excerpt === excerpt
  )
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
      .then(remoteMarks => {
        if (cancelled) return
        setMarks(sortBookMarks(remoteMarks))
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
      const currentMarks = marksRef.current.filter(mark => mark.bookId === bookId)
      const duplicate = findDuplicateMark(currentMarks, input)
      if (duplicate) {
        return { mark: duplicate, created: false }
      }

      const mark = buildBookMark(bookId, input)
      const optimisticMarks = sortBookMarks([mark, ...marksRef.current])
      marksRef.current = optimisticMarks
      setMarks(optimisticMarks)

      if (tokenRef.current) {
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
      const removed = marksRef.current.find(mark => mark.id === id)
      if (!removed) return

      setMarks(current => current.filter(mark => mark.id !== id))

      if (!tokenRef.current) return

      void removeBookMark(bookId, id).catch(() => {
        setMarks(current => sortBookMarks([removed, ...current]))
      })
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

  const positionBookmarks = useMemo(
    () => bookMarks.filter(mark => mark.kind === 'position'),
    [bookMarks]
  )
  const collections = useMemo(
    () => bookMarks.filter(mark => mark.kind === 'collection'),
    [bookMarks]
  )

  return {
    marks: bookMarks,
    positionBookmarks,
    collections,
    addPositionBookmark,
    addCollection,
    removeMark,
  }
}
