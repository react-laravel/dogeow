import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChapterHeading } from '../ChapterHeading'

vi.mock('@/app/book/utils/theme', () => ({
  getBookFontFamily: (font: string) => font,
}))

vi.mock('@/app/book/utils/bilingualParse', () => ({
  splitChapterHeading: (title: string) => {
    const match = title.match(/^(第[^ ]+)\s+(.+)$/)
    if (match) {
      return { prefix: match[1], body: match[2] }
    }
    return { prefix: '', body: title }
  },
}))

describe('ChapterHeading', () => {
  const defaultProps = {
    title: '第一回 甄士隐梦幻识通灵',
    translationTitle: 'Chapter 1',
    contentMode: 'both' as const,
    translationColor: '#666',
    originalFontFamily: 'yahei' as const,
    translationFontFamily: 'song' as const,
  }

  it('renders original-only mode', () => {
    render(<ChapterHeading {...defaultProps} contentMode="original" />)
    expect(screen.getByText('第一回 甄士隐梦幻识通灵')).toBeInTheDocument()
  })

  it('renders translation-only mode', () => {
    render(<ChapterHeading {...defaultProps} contentMode="translation" />)
    expect(screen.getByText('Chapter 1')).toBeInTheDocument()
  })

  it('renders both mode with original and translation', () => {
    render(<ChapterHeading {...defaultProps} contentMode="both" />)
    expect(screen.getByText('第一回 甄士隐梦幻识通灵')).toBeInTheDocument()
    expect(screen.getByText('Chapter 1')).toBeInTheDocument()
  })

  it('falls back to original when translation title is missing in translation mode', () => {
    render(<ChapterHeading {...defaultProps} contentMode="translation" translationTitle="" />)
    expect(screen.getByText('第一回 甄士隐梦幻识通灵')).toBeInTheDocument()
  })

  it('renders both mode without prefix split', () => {
    render(
      <ChapterHeading
        {...defaultProps}
        title="Some Title"
        translationTitle="Some Translation"
        contentMode="both"
      />
    )
    expect(screen.getByText('Some Title')).toBeInTheDocument()
    expect(screen.getByText('Some Translation')).toBeInTheDocument()
  })

  it('renders inline-grid when prefix is present in both mode', () => {
    const { container } = render(
      <ChapterHeading
        {...defaultProps}
        title="第一回 甄士隐梦幻识通灵"
        translationTitle="第一回 甄士隐梦幻识通灵"
        contentMode="both"
      />
    )
    const grid = container.querySelector('.inline-grid')
    expect(grid).toBeTruthy()
  })

  it('renders div wrapper when no prefix in both mode', () => {
    const { container } = render(
      <ChapterHeading
        {...defaultProps}
        title="Simple Title"
        translationTitle="Simple Translation"
        contentMode="both"
      />
    )
    const wrapper = container.querySelector('.space-y-2')
    expect(wrapper).toBeTruthy()
  })

  it('applies font family styles', () => {
    const { container } = render(<ChapterHeading {...defaultProps} contentMode="original" />)
    const h1 = container.querySelector('h1')
    expect(h1).toHaveStyle({ fontFamily: 'yahei' })
  })
})
