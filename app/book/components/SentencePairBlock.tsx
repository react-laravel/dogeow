'use client'

import { memo } from 'react'
import type { SentencePair } from '@/app/book/utils/bilingualParse'
import type {
  PairDisplayMode,
  ReaderContentMode,
  ReaderFont,
  ReaderTheme,
} from '@/app/book/types/reader'
import { getBookFontFamily } from '@/app/book/utils/theme'
import { getPairLinePresentation } from '@/app/book/utils/pairDisplay'
import { cn } from '@/lib/helpers'
import type { BookNarrationHighlight } from '@/app/book/hooks/useBookNarration'

interface SentencePairBlockProps {
  pair: SentencePair
  pairIndex: number
  displayMode: PairDisplayMode
  theme: ReaderTheme
  contentMode: ReaderContentMode
  originalFontFamily: ReaderFont
  translationFontFamily: ReaderFont
  isNarrating?: boolean
  narrationHighlight?: BookNarrationHighlight | null
}

function HighlightedText({
  text,
  highlight,
}: {
  text: string
  highlight?: Pick<BookNarrationHighlight, 'start' | 'end'> | null
}) {
  if (!highlight || highlight.start < 0 || highlight.end <= highlight.start) return <>{text}</>

  const start = Math.min(highlight.start, text.length)
  const end = Math.min(highlight.end, text.length)
  if (start >= end) return <>{text}</>

  return (
    <>
      {text.slice(0, start)}
      <span className="text-amber-500 drop-shadow-[0_0_0.45px_currentColor]">
        {text.slice(start, end)}
      </span>
      {text.slice(end)}
    </>
  )
}

function PairLine({
  text,
  displayMode,
  theme,
  role,
  fontFamily,
  highlight,
}: {
  text: string
  displayMode: PairDisplayMode
  theme: ReaderTheme
  role: 'original' | 'translation'
  fontFamily: ReaderFont
  highlight?: Pick<BookNarrationHighlight, 'start' | 'end'> | null
}) {
  const { className, style, prefix } = getPairLinePresentation(displayMode, theme, role)
  const lineStyle = { ...style, fontFamily: getBookFontFamily(fontFamily) }

  if (prefix) {
    return (
      <p className={className} style={lineStyle}>
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[0.72em] font-medium tracking-wide"
          style={{
            backgroundColor:
              role === 'original'
                ? 'color-mix(in srgb, currentColor 12%, transparent)'
                : 'color-mix(in srgb, currentColor 18%, transparent)',
          }}
        >
          {prefix}
        </span>
        <span className="min-w-0 flex-1">
          <HighlightedText text={text} highlight={highlight} />
        </span>
      </p>
    )
  }

  return (
    <p className={className} style={lineStyle}>
      <HighlightedText text={text} highlight={highlight} />
    </p>
  )
}

export const SentencePairBlock = memo(function SentencePairBlock({
  pair,
  displayMode,
  theme,
  contentMode,
  pairIndex,
  originalFontFamily,
  translationFontFamily,
  isNarrating = false,
  narrationHighlight = null,
}: SentencePairBlockProps) {
  const showOriginal = contentMode === 'both' || contentMode === 'original'
  const showTranslation = contentMode === 'both' || contentMode === 'translation'

  if (!pair.o && !pair.t) return null
  if (!showOriginal && !pair.t) return null
  if (!showTranslation && !pair.o) return null

  const gapClass =
    displayMode === 'card' ? 'space-y-2' : displayMode === 'border' ? 'space-y-2' : 'space-y-1.5'

  return (
    <section
      className={cn(
        gapClass,
        isNarrating && 'rounded-md bg-current/5 px-2 py-1 ring-1 ring-current/15 transition-colors'
      )}
      data-pair-index={pairIndex}
    >
      {showOriginal && pair.o ? (
        <PairLine
          text={pair.o}
          displayMode={displayMode}
          theme={theme}
          role="original"
          fontFamily={originalFontFamily}
          highlight={narrationHighlight?.role === 'original' ? narrationHighlight : null}
        />
      ) : null}
      {showTranslation && pair.t ? (
        <PairLine
          text={pair.t}
          displayMode={displayMode}
          theme={theme}
          role="translation"
          fontFamily={translationFontFamily}
          highlight={narrationHighlight?.role === 'translation' ? narrationHighlight : null}
        />
      ) : null}
    </section>
  )
})
