'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { API_URL } from '@/lib/api'
import useAuthStore from '@/stores/authStore'
import type { BookMark, CreateBookMarkInput } from '../types/marks'
import { HONGLOUMENG_BOOK_ID } from '../types/marks'
import { buildBookMark, sortBookMarks } from '../utils/bookMarks'

const LEGACY_STORAGE_KEY = 'dogeow-hongloumeng-marks'
const LEGACY_MIGRATED_KEY = 'dogeow-hongloumeng-marks-migrated'

interface AddBookMarkResult {
  mark: BookMark
  created: boolean
}

interface StoreBookMarkResponse {
  mark: BookMark
  created: boolean
}

function isSamePositionMark(mark: BookMark, input: CreateBookMarkInput): boolean {
  if (
    mark.bookId !== HONGLOUMENG_BOOK_ID ||
    mark.kind !== 'position' ||
    input.kind !== 'position' ||
    mark.chapterId !== input.chapterId
  ) {
    return false
  }

  const inputPairIndex = input.pairIndex ?? null
  if (mark.pairIndex != null || inputPairIndex != null) {
    return mark.pairIndex === inputPairIndex
  }

  return Math.round(mark.scrollTop) === Math.round(input.scrollTop)
}

function readLegacyMarks(): BookMark[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { state?: { marks?: BookMark[] } }
    return Array.isArray(parsed.state?.marks)
      ? parsed.state.marks.filter(mark => mark.bookId === HONGLOUMENG_BOOK_ID)
      : []
  } catch {
    return []
  }
}

function hasMigratedLegacyMarks(): boolean {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(LEGACY_MIGRATED_KEY) === '1'
}

function markLegacyMarksMigrated() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LEGACY_MIGRATED_KEY, '1')
}

async function requestBookMarks(token: string): Promise<BookMark[]> {
  const response = await fetch(`${API_URL}/api/books/${HONGLOUMENG_BOOK_ID}/marks`, {
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

async function createBookMark(token: string, mark: BookMark): Promise<StoreBookMarkResponse> {
  const response = await fetch(`${API_URL}/api/books/${HONGLOUMENG_BOOK_ID}/marks`, {
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
      pairIndex: mark.pairIndex,
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

async function deleteBookMark(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/books/${HONGLOUMENG_BOOK_ID}/marks/${id}`, {
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

export function useBookMarks() {
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

    requestBookMarks(token)
      .then(async remoteMarks => {
        if (cancelled) return

        let nextMarks = sortBookMarks(remoteMarks)
        setMarks(nextMarks)

        if (!hasMigratedLegacyMarks()) {
          const legacyMarks = readLegacyMarks()
          for (const legacyMark of legacyMarks) {
            const duplicate =
              legacyMark.kind === 'position'
                ? nextMarks.find(mark => isSamePositionMark(mark, legacyMark))
                : undefined

            if (duplicate) continue

            try {
              const result = await createBookMark(token, legacyMark)
              nextMarks = sortBookMarks([result.mark, ...nextMarks])
              if (!cancelled) setMarks(nextMarks)
            } catch {
              // Keep migration retryable on the next load.
              return
            }
          }

          markLegacyMarksMigrated()
        }
      })
      .catch(() => {
        if (!cancelled) setMarks([])
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const bookMarks = useMemo(
    () => marks.filter(mark => mark.bookId === HONGLOUMENG_BOOK_ID),
    [marks]
  )

  const addMark = useCallback((input: CreateBookMarkInput): AddBookMarkResult => {
    const currentMarks = marksRef.current
    const duplicate =
      input.kind === 'position'
        ? currentMarks.find(mark => isSamePositionMark(mark, input))
        : undefined

    if (duplicate) {
      return { mark: duplicate, created: false }
    }

    const mark = buildBookMark(input)
    const optimisticMarks = sortBookMarks([mark, ...currentMarks])
    marksRef.current = optimisticMarks
    setMarks(optimisticMarks)

    const currentToken = tokenRef.current
    if (currentToken) {
      void createBookMark(currentToken, mark)
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
  }, [])

  const removeMark = useCallback((id: string) => {
    let removed: BookMark | undefined
    setMarks(current => {
      removed = current.find(mark => mark.id === id)
      return current.filter(mark => mark.id !== id)
    })

    const currentToken = tokenRef.current
    if (currentToken) {
      void deleteBookMark(currentToken, id).catch(() => {
        if (removed) {
          setMarks(current => sortBookMarks([removed as BookMark, ...current]))
        }
      })
    }
  }, [])

  const clearMarks = useCallback(() => {
    const currentToken = tokenRef.current
    const removed = marks
    setMarks([])

    if (currentToken) {
      void Promise.all(removed.map(mark => deleteBookMark(currentToken, mark.id))).catch(() => {
        setMarks(removed)
      })
    }
  }, [marks])

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
    clearMarks,
  }
}
