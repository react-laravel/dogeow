import { splitChapterHeading } from '../utils/parseBook'
import type { ReaderContentMode, ReaderFont } from '../hooks/useReaderSettings'
import { getReaderFontFamily } from '../hooks/useReaderSettings'

interface ChapterHeadingProps {
  title: string
  translationTitle: string
  contentMode: ReaderContentMode
  translationColor: string
  originalFontFamily: ReaderFont
  translationFontFamily: ReaderFont
}

const headingClass = 'text-[1.15em] font-semibold tracking-wide'

export function ChapterHeading({
  title,
  translationTitle,
  contentMode,
  translationColor,
  originalFontFamily,
  translationFontFamily,
}: ChapterHeadingProps) {
  const originalFont = getReaderFontFamily(originalFontFamily)
  const translationFont = getReaderFontFamily(translationFontFamily)

  if (contentMode === 'original') {
    return (
      <h1 className={headingClass} style={{ fontFamily: originalFont }}>
        {title}
      </h1>
    )
  }

  if (contentMode === 'translation') {
    return (
      <h1 className={headingClass} style={{ fontFamily: translationFont }}>
        {translationTitle || title}
      </h1>
    )
  }

  const original = splitChapterHeading(title)
  const translation = splitChapterHeading(translationTitle || title)
  const hasPrefix = Boolean(original.prefix && translation.prefix)

  if (!hasPrefix) {
    return (
      <div className="space-y-2">
        <h1 className={headingClass} style={{ fontFamily: originalFont }}>
          {title}
        </h1>
        {translationTitle ? (
          <p style={{ color: translationColor, fontFamily: translationFont }}>{translationTitle}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="inline-grid w-full max-w-full grid-cols-[max-content_minmax(0,1fr)] items-baseline gap-x-3 gap-y-2">
      <span className={`${headingClass} whitespace-nowrap`} style={{ fontFamily: originalFont }}>
        {original.prefix}
      </span>
      <h1 className={headingClass} style={{ fontFamily: originalFont }}>
        {original.body}
      </h1>
      {translationTitle ? (
        <>
          <span
            className="whitespace-nowrap"
            style={{ color: translationColor, fontFamily: translationFont }}
          >
            {translation.prefix}
          </span>
          <p style={{ color: translationColor, fontFamily: translationFont }}>{translation.body}</p>
        </>
      ) : null}
    </div>
  )
}
