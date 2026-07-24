'use client'

import type { BookNarrationHighlight } from '@/app/book/hooks/useBookNarration'

interface NarrationHighlightedTextProps {
  text: string
  highlight?: Pick<BookNarrationHighlight, 'start' | 'end'> | null
}

export function NarrationHighlightedText({ text, highlight }: NarrationHighlightedTextProps) {
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
        className="rounded-sm bg-amber-400/55 text-inherit shadow-[inset_0_-0.12em_0_0_rgba(217,119,6,0.55)]"
        style={{ color: 'inherit' }}
      >
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </>
  )
}
