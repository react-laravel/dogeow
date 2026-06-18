'use client'

import { memo } from 'react'
import type { SentencePair } from '../utils/parseBook'
import type { PairDisplayMode, ReaderContentMode, ReaderTheme } from '../hooks/useReaderSettings'
import { getPairLinePresentation } from '../utils/pairDisplay'

interface SentencePairBlockProps {
  pair: SentencePair
  pairIndex: number
  displayMode: PairDisplayMode
  theme: ReaderTheme
  contentMode: ReaderContentMode
}

function PairLine({
  text,
  displayMode,
  theme,
  role,
}: {
  text: string
  displayMode: PairDisplayMode
  theme: ReaderTheme
  role: 'original' | 'translation'
}) {
  const { className, style, prefix } = getPairLinePresentation(displayMode, theme, role)

  if (prefix) {
    return (
      <p className={className} style={style}>
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
    <p className={className} style={style}>
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
}: SentencePairBlockProps) {
  const showOriginal = contentMode === 'both' || contentMode === 'original'
  const showTranslation = contentMode === 'both' || contentMode === 'translation'

  if (!pair.o && !pair.t) return null
  if (!showOriginal && !pair.t) return null
  if (!showTranslation && !pair.o) return null

  const gapClass =
    displayMode === 'card' ? 'space-y-2' : displayMode === 'border' ? 'space-y-2' : 'space-y-1.5'

  return (
    <section className={gapClass} data-pair-index={pairIndex}>
      {showOriginal && pair.o ? (
        <PairLine text={pair.o} displayMode={displayMode} theme={theme} role="original" />
      ) : null}
      {showTranslation && pair.t ? (
        <PairLine text={pair.t} displayMode={displayMode} theme={theme} role="translation" />
      ) : null}
    </section>
  )
})
