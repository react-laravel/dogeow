'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import type { TextSelectionState } from '@/app/book/components/TextSelectionToolbar'
import { buildAiPromptForExcerpt } from '@/app/book/utils/aiPrompt'
import { useAiDialogStore } from '@/stores/aiDialogStore'

export interface BookSelectionContext<ChapterId = string | number> {
  chapterId: ChapterId
  chapterTitle: string
  scrollTop: number
  pairIndex: number | null
}

interface UseBookTextSelectionActionsOptions<ChapterId> {
  bookTitle: string
  getContext: () => BookSelectionContext<ChapterId>
  addPositionBookmark: (input: {
    chapterId: ChapterId
    chapterTitle: string
    scrollTop: number
    pairIndex?: number | null
    excerpt?: string
  }) => { created: boolean }
  addCollection: (input: {
    chapterId: ChapterId
    chapterTitle: string
    scrollTop: number
    pairIndex?: number | null
    excerpt?: string
  }) => { created: boolean }
  onPlaySelection?: (selection: TextSelectionState) => void
  /**
   * Handles the built prompt when "问 AI" is tapped. Defaults to opening the
   * global full-screen AI dialog; the reader passes its own handler to show an
   * in-page chat panel instead.
   */
  onAskAi?: (prompt: string) => void
}

export function useBookTextSelectionActions<ChapterId>({
  bookTitle,
  getContext,
  addPositionBookmark,
  addCollection,
  onPlaySelection,
  onAskAi,
}: UseBookTextSelectionActionsOptions<ChapterId>) {
  const requestOpenAi = useAiDialogStore(state => state.requestOpen)

  const handleSelectionBookmark = useCallback(
    (selection: TextSelectionState) => {
      const context = getContext()
      const result = addPositionBookmark({
        chapterId: context.chapterId,
        chapterTitle: context.chapterTitle,
        scrollTop: context.scrollTop,
        pairIndex: selection.pairIndex ?? context.pairIndex,
        excerpt: selection.text,
      })
      toast[result.created ? 'success' : 'info'](result.created ? '已添加展示' : '该位置已有展示')
    },
    [addPositionBookmark, getContext]
  )

  const handleAddCollection = useCallback(
    (selection: TextSelectionState) => {
      const context = getContext()
      const result = addCollection({
        chapterId: context.chapterId,
        chapterTitle: context.chapterTitle,
        scrollTop: context.scrollTop,
        pairIndex: selection.pairIndex,
        excerpt: selection.text,
      })
      toast[result.created ? 'success' : 'info'](result.created ? '已加入收藏' : '该片段已在收藏中')
    },
    [addCollection, getContext]
  )

  const handleAskAi = useCallback(
    (selection: TextSelectionState) => {
      const context = getContext()
      const prompt = buildAiPromptForExcerpt(selection.text, context.chapterTitle, bookTitle)
      if (onAskAi) {
        onAskAi(prompt)
        return
      }
      requestOpenAi(prompt)
    },
    [bookTitle, getContext, onAskAi, requestOpenAi]
  )

  const handlePlaySelection = useCallback(
    (selection: TextSelectionState) => {
      onPlaySelection?.(selection)
    },
    [onPlaySelection]
  )

  return {
    handleSelectionBookmark,
    handleAddCollection,
    handleAskAi,
    handlePlaySelection,
  }
}
