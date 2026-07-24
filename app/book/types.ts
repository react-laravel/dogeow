import type { ReactNode, RefObject } from 'react'
import type { BookChapter } from '@/app/book/utils/bilingualParse'

export interface BookChapterOption<ChapterId = string | number> {
  id: ChapterId
  title: string
}

/** 多卷书目：按卷分组展示篇目选择器 */
export interface BookChapterGroup<ChapterId = string | number> {
  label: string
  chapters: BookChapterOption<ChapterId>[]
}

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
      pairIndex?: number | null
      excerpt?: string
    }) => { mark: BookMarkType; created: boolean }
    addCollection: (input: {
      chapterId: ChapterId
      chapterTitle: string
      scrollTop: number
      pairIndex?: number | null
      excerpt?: string
    }) => { mark: BookMarkType; created: boolean }
    removeMark: (id: string) => void
  }

  /** 书名，用于滑词问 AI */
  bookTitle: string

  /** Load chapter content by ID */
  loadChapter: (chapterId: ChapterId) => Promise<void>

  /** Flat chapter list（上一章/下一章、书签等） */
  chapters: BookChapterOption<ChapterId>[]

  /** 按卷分组；有值时篇目选择器显示卷标题 + 章名，否则平铺 chapters */
  chapterGroups?: BookChapterGroup<ChapterId>[]

  /** Toolbar chapter picker placeholder; default「选择章节」，多卷书目可用「选择篇目」 */
  chapterSelectPlaceholder?: string

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
  /** Chapter text supplied to the browser TTS narrator when narration is enabled */
  narrationChapter?: BookChapter | null
  hasTextSelection: boolean
  hasPairDisplayMode: boolean
  hasContentMode: boolean
  /** 设置面板是否显示原文/译文字体分别选择 */
  hasDualFonts?: boolean
  /** 听书模式选择是否隐藏译文/全部（仅原文书） */
  narrationOriginalOnly?: boolean

  /** sessionStorage key for scroll position; omit to reset scroll on chapter change */
  scrollStorageKey?: string

  /** Render the book-specific content area */
  renderContent: (ctx: {
    contentRef: RefObject<HTMLDivElement | null>
    settings: Settings
    themeColor?: string
    activePairIndex?: number | null
    activeHighlight?: {
      pairIndex: number
      role: 'original' | 'translation'
      start: number
      end: number
    } | null
  }) => ReactNode
}
