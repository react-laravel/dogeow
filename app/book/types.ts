import type { ReactNode, RefObject } from 'react'

// ─── Generic BookReader Configuration ────────────────────────────────

export interface BookReaderConfig<ChapterId, Settings, BookMarkType> {
  /** Settings hook — provides current settings and a patch function */
  useSettings: () => {
    settings: Settings
    patchSettings: (patch: Partial<Settings>) => void
    hydrated: boolean
  }

  /** Bookmarks hook — provides marks and CRUD operations */
  useBookMarks: () => {
    marks: BookMarkType[]
    addPositionBookmark: (input: {
      chapterId: ChapterId
      chapterTitle: string
      scrollTop: number
      excerpt?: string
      pairIndex?: number | null
      note?: string
    }) => { mark: BookMarkType; created: boolean }
    addCollection: (input: {
      chapterId: ChapterId
      chapterTitle: string
      scrollTop: number
      excerpt?: string
    }) => { mark: BookMarkType; created: boolean }
    removeMark: (id: string) => void
  }

  /** Load chapter content by ID */
  loadChapter: (chapterId: ChapterId) => Promise<void>

  /** Flat chapter list for the toolbar dropdown */
  chapters: { id: ChapterId; title: string }[]

  /** Currently active chapter ID */
  currentChapterId: ChapterId

  /** Called when user selects a new chapter */
  onChapterIdChange: (id: ChapterId) => void

  /** Optional prev/next chapter navigation */
  onPrevChapter?: () => void
  onNextChapter?: () => void
  hasPrevChapter?: boolean
  hasNextChapter?: boolean

  /** Feature flags — control which UI sections are shown */
  hasNarration: boolean
  hasTextSelection: boolean
  hasPairDisplayMode: boolean
  hasContentMode: boolean

  /** Storage key for scroll position persistence */
  storageKey: string

  /** Called when the user clicks the bookmark button in the toolbar */
  onAddBookmark: () => void

  /** Called when the user clicks a bookmark in the panel to jump to it */
  onJumpToMark: (mark: BookMarkType) => void

  /** Render the book-specific content area */
  renderContent: (ctx: {
    contentRef: RefObject<HTMLDivElement | null>
    settings: Settings
    chapterContent: string | null
    loading: boolean
    error: string | null
  }) => ReactNode
}
