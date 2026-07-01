export type BookReaderKind = 'bilingual' | 'volume'

export interface BookCatalogEntry {
  id: string
  kind: BookReaderKind
  href: string
  nameKey: string
  descriptionKey: string
  color: string
  icon: string
  chapterSelectPlaceholder?: string
  defaultChapterId?: string
  fallbackTitle?: string
}

const ASSET_BASE =
  (process.env.NEXT_PUBLIC_ASSET_BASE_URL?.trim() || 'https://upyun.dogeow.com') + '/books'

export function getBookAssetBaseUrl(bookId: string): string {
  return `${ASSET_BASE}/${bookId}`
}

export function getBookReaderStorageKey(bookId: string): string {
  return `dogeow-book-reader:${bookId}`
}

export const VOLUME_BOOK_DEFAULTS = {
  originalFontFamily: 'yahei' as const,
  translationFontFamily: 'yahei' as const,
  fontSize: 20,
  lineHeight: 1.9,
  theme: 'sepia' as const,
  pairDisplayMode: 'muted' as const,
  contentMode: 'both' as const,
}

export const BILINGUAL_BOOK_DEFAULTS = {
  ...VOLUME_BOOK_DEFAULTS,
  chapterId: 1,
}
