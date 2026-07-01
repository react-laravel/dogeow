import type { BookFont, BookTheme } from '@/app/book/utils/theme'
import { BOOK_FONT_LABELS, BOOK_THEME_LABELS } from '@/app/book/utils/theme'

export type { BookFont, BookTheme }
export type ReaderFont = BookFont
export type ReaderTheme = BookTheme

export const READER_FONT_LABELS = BOOK_FONT_LABELS
export const READER_THEME_LABELS = BOOK_THEME_LABELS

export type PairDisplayMode = 'muted' | 'contrast' | 'color' | 'label' | 'card' | 'border'

export type ReaderContentMode = 'both' | 'original' | 'translation'

export const PAIR_DISPLAY_LABELS: Record<PairDisplayMode, string> = {
  muted: '深浅对比',
  contrast: '强对比',
  color: '双色区分',
  label: '文字标注',
  card: '底色分块',
  border: '译文侧栏',
}

export const READER_CONTENT_MODE_LABELS: Record<ReaderContentMode, string> = {
  both: '对照',
  original: '原文',
  translation: '译文',
}

/** 阅读器通用设置（不含章节 ID） */
export interface BaseReaderSettings {
  originalFontFamily: BookFont
  translationFontFamily: BookFont
  fontSize: number
  lineHeight: number
  theme: BookTheme
  pairDisplayMode: PairDisplayMode
  contentMode: ReaderContentMode
}

/** 章节 ID 为数字的书目（如双语对照 JSON） */
export type ReaderSettings = BaseReaderSettings & { chapterId: number }

/** 章节 ID 为字符串的书目（如多卷「卷-章」） */
export type VolumeReaderSettings = BaseReaderSettings & { chapterId: string }
