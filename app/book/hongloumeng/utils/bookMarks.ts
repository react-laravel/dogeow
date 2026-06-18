import type { BookMark, CreateBookMarkInput } from '../types/marks'
import { HONGLOUMENG_BOOK_ID } from '../types/marks'

export function createBookMarkId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `mark-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function buildBookMark(input: CreateBookMarkInput): BookMark {
  return {
    id: createBookMarkId(),
    bookId: HONGLOUMENG_BOOK_ID,
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

export function sortBookMarks(marks: BookMark[]): BookMark[] {
  return [...marks].sort((a, b) => b.createdAt - a.createdAt)
}

export function buildAiPromptForExcerpt(excerpt: string, chapterTitle: string): string {
  const trimmed = excerpt.trim()
  const chapterHint = chapterTitle.trim() ? `（${chapterTitle.trim()}）` : ''
  return `请解读《红楼梦》以下片段${chapterHint}，并回答我可能追问的问题：\n\n「${trimmed}」\n\n我的问题：`
}
