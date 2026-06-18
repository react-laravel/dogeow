'use client'

import { useCallback } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { BookMark, CreateBookMarkInput } from '../types/marks'
import { HONGLOUMENG_BOOK_ID } from '../types/marks'
import { buildBookMark, sortBookMarks } from '../utils/bookMarks'

interface BookMarksState {
  marks: BookMark[]
  addMark: (input: CreateBookMarkInput) => BookMark
  removeMark: (id: string) => void
  clearMarks: () => void
}

const useBookMarksStore = create<BookMarksState>()(
  persist(
    (set, get) => ({
      marks: [],
      addMark: input => {
        const mark = buildBookMark(input)
        set({ marks: sortBookMarks([mark, ...get().marks]) })
        return mark
      },
      removeMark: id => {
        set({ marks: get().marks.filter(mark => mark.id !== id) })
      },
      clearMarks: () => set({ marks: [] }),
    }),
    {
      name: 'dogeow-hongloumeng-marks',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ marks: state.marks }),
    }
  )
)

export function useBookMarks() {
  const marks = useBookMarksStore(state => state.marks)
  const addMark = useBookMarksStore(state => state.addMark)
  const removeMark = useBookMarksStore(state => state.removeMark)
  const clearMarks = useBookMarksStore(state => state.clearMarks)

  const bookMarks = marks.filter(mark => mark.bookId === HONGLOUMENG_BOOK_ID)

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
