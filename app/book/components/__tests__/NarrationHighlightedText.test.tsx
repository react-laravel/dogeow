import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { NarrationHighlightedText } from '../NarrationHighlightedText'

describe('NarrationHighlightedText', () => {
  it('renders plain text without highlight', () => {
    const { container } = render(<NarrationHighlightedText text="满纸荒唐言" />)
    expect(screen.getByText('满纸荒唐言')).toBeInTheDocument()
    expect(container.querySelector('mark')).toBeNull()
  })

  it('highlights the active narration slice', () => {
    const { container } = render(
      <NarrationHighlightedText text="满纸荒唐言" highlight={{ start: 0, end: 2 }} />
    )
    const mark = container.querySelector('mark')
    expect(mark).not.toBeNull()
    expect(mark?.textContent).toBe('满纸')
    expect(container.textContent).toBe('满纸荒唐言')
  })

  it('ignores invalid highlight ranges', () => {
    const { container } = render(
      <NarrationHighlightedText text="满纸荒唐言" highlight={{ start: 3, end: 3 }} />
    )
    expect(container.querySelector('mark')).toBeNull()
  })
})
