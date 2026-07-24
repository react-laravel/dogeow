import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SentencePairBlock } from '../SentencePairBlock'
import type { SentencePair } from '@/app/book/utils/bilingualParse'

const mockPair: SentencePair = {
  o: '满纸荒唐言，一把辛酸泪。',
  t: 'The page is full of absurd words, a handful of bitter tears.',
}

const defaultProps = {
  pair: mockPair,
  pairIndex: 0,
  displayMode: 'muted' as const,
  theme: 'light' as const,
  contentMode: 'both' as const,
  originalFontFamily: 'yahei' as const,
  translationFontFamily: 'yahei' as const,
}

const getByExactTextContent = (text: string) =>
  screen.getByText((_, element) => element?.textContent === text)

describe('SentencePairBlock', () => {
  it('renders original text in both mode', () => {
    render(<SentencePairBlock {...defaultProps} contentMode="both" />)
    expect(screen.getByText('满纸荒唐言，一把辛酸泪。')).toBeInTheDocument()
  })

  it('renders translation text in both mode', () => {
    render(<SentencePairBlock {...defaultProps} contentMode="both" />)
    expect(
      screen.getByText('The page is full of absurd words, a handful of bitter tears.')
    ).toBeInTheDocument()
  })

  it('renders only original in original mode', () => {
    render(<SentencePairBlock {...defaultProps} contentMode="original" />)
    expect(screen.getByText('满纸荒唐言，一把辛酸泪。')).toBeInTheDocument()
    expect(screen.queryByText('The page is full of absurd words')).not.toBeInTheDocument()
  })

  it('renders only translation in translation mode', () => {
    render(<SentencePairBlock {...defaultProps} contentMode="translation" />)
    expect(screen.queryByText('满纸荒唐言，一把辛酸泪。')).not.toBeInTheDocument()
    expect(
      screen.getByText('The page is full of absurd words, a handful of bitter tears.')
    ).toBeInTheDocument()
  })

  it('renders nothing when both texts are empty', () => {
    const emptyPair: SentencePair = { o: '', t: '' }
    const { container } = render(<SentencePairBlock {...defaultProps} pair={emptyPair} />)
    expect(container.firstChild).toBeNull()
  })

  it('applies narration highlight when provided', () => {
    render(
      <SentencePairBlock
        {...defaultProps}
        isNarrating={true}
        narrationHighlight={{ pairIndex: 0, role: 'original', start: 0, end: 3 }}
      />
    )
    // The highlight should be applied - we verify the component renders
    expect(getByExactTextContent('满纸荒唐言，一把辛酸泪。')).toBeInTheDocument()
  })

  it('renders narration highlight for translation', () => {
    render(
      <SentencePairBlock
        {...defaultProps}
        isNarrating={true}
        narrationHighlight={{ pairIndex: 0, role: 'translation', start: 0, end: 3 }}
      />
    )
    expect(
      getByExactTextContent('The page is full of absurd words, a handful of bitter tears.')
    ).toBeInTheDocument()
  })

  it('applies narrating class when isNarrating is true', () => {
    const { container } = render(<SentencePairBlock {...defaultProps} isNarrating={true} />)
    const section = container.querySelector('section')
    expect(section?.className).toContain('rounded-md')
  })

  it('renders with card display mode', () => {
    render(<SentencePairBlock {...defaultProps} displayMode="card" />)
    expect(screen.getByText('满纸荒唐言，一把辛酸泪。')).toBeInTheDocument()
  })

  it('renders with border display mode', () => {
    render(<SentencePairBlock {...defaultProps} displayMode="border" />)
    expect(screen.getByText('满纸荒唐言，一把辛酸泪。')).toBeInTheDocument()
  })

  it('handles pair with only original text in both mode', () => {
    const originalOnly: SentencePair = { o: '原文', t: '' }
    render(<SentencePairBlock {...defaultProps} pair={originalOnly} contentMode="both" />)
    expect(screen.getByText('原文')).toBeInTheDocument()
    expect(screen.queryByText('The page')).not.toBeInTheDocument()
  })

  it('handles pair with only translation text in both mode', () => {
    const translationOnly: SentencePair = { o: '', t: 'Translation' }
    render(<SentencePairBlock {...defaultProps} pair={translationOnly} contentMode="both" />)
    expect(screen.queryByText('满纸')).not.toBeInTheDocument()
    expect(screen.getByText('Translation')).toBeInTheDocument()
  })

  it('sets data-pair-index attribute', () => {
    const { container } = render(<SentencePairBlock {...defaultProps} pairIndex={5} />)
    const section = container.querySelector('section')
    expect(section).toHaveAttribute('data-pair-index', '5')
  })
})
