'use client'

import { memo } from 'react'
import type { SentencePair } from '../utils/parseBook'
import type {
  PairDisplayMode,
  ReaderContentMode,
  ReaderFont,
  ReaderTheme,
} from '../hooks/useReaderSettings'
import { getReaderFontFamily } from '../hooks/useReaderSettings'
import { getPairLinePresentation } from '../utils/pairDisplay'
import { cn } from '@/lib/helpers'

interface SentencePairBlockProps {
  pair: SentencePair
  pairIndex: number
  displayMode: PairDisplayMode
  theme: ReaderTheme
  contentMode: ReaderContentMode
  originalFontFamily: ReaderFont
  translationFontFamily: ReaderFont
  isNarrating?: boolean
}

function PairLine({
  text,
  displayMode,
  theme,
  role,
  fontFamily,
}: {
  text: string
  displayMode: PairDisplayMode
  theme: ReaderTheme
  role: 'original' | 'translation'
  fontFamily: ReaderFont
}) {
  const { className, style, prefix } = getPairLinePresentation(displayMode, theme, role)
  const lineStyle = { ...style, fontFamily: getReaderFontFamily(fontFamily) }

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
        <span className="min-w-0 flex-1">{text}</span>
      </p>
    )
  }

  return (
    <p className={className} style={lineStyle}>
      {text}
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
        />
      ) : null}
      {showTranslation && pair.t ? (
        <PairLine
          text={pair.t}
          displayMode={displayMode}
          theme={theme}
          role="translation"
          fontFamily={translationFontFamily}
        />
      ) : null}
    </section>
  )
})
