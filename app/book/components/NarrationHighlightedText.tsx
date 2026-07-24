'use client'

import type { BookNarrationHighlight } from '@/app/book/hooks/useBookNarration'
import type { BookTheme } from '@/app/book/utils/theme'
import { getNarrationHighlightStyle } from '@/app/book/utils/theme'

interface NarrationHighlightedTextProps {
  text: string
  highlight?: Pick<BookNarrationHighlight, 'start' | 'end'> | null
  theme?: BookTheme
}

export function NarrationHighlightedText({
  text,
  highlight,
  theme = 'light',
}: NarrationHighlightedTextProps) {
  if (!highlight || highlight.start < 0 || highlight.end <= highlight.start) {
    return <>{text}</>
  }

  const start = Math.min(highlight.start, text.length)
  const end = Math.min(highlight.end, text.length)
  if (start >= end) return <>{text}</>

  return (
    <>
      {text.slice(0, start)}
      <mark
        className="rounded-sm text-inherit"
        style={{ color: 'inherit', ...getNarrationHighlightStyle(theme) }}
      >
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </>
  )
}
