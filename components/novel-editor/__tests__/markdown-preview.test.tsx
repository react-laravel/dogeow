import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type MarkdownPreviewComponent from '../markdown-preview'

let MarkdownPreview: typeof MarkdownPreviewComponent

// Mock class-variance-authority
vi.mock('class-variance-authority', () => ({
  cx: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}))

// Mock highlight.js
vi.mock('highlight.js', () => ({
  default: {
    highlightElement: vi.fn(),
  },
}))

describe('MarkdownPreview', () => {
  beforeAll(async () => {
    MarkdownPreview = (await import('../markdown-preview')).default
  })

  it('should render markdown content', () => {
    const markdownContent = '# Hello World\n\nThis is a test.'

    render(<MarkdownPreview content={markdownContent} />)

    expect(screen.getByTestId('editor-root')).toBeInTheDocument()
    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
  })

  it('should handle empty content', () => {
    const { container } = render(<MarkdownPreview content="" />)

    expect(container.firstChild).toBeNull()
  })

  it('should apply custom className', () => {
    const markdownContent = '# Test'
    const customClass = 'custom-class'

    render(<MarkdownPreview content={markdownContent} className={customClass} />)

    const wrapper = screen.getByTestId('editor-content').parentElement
    expect(wrapper).toHaveClass(customClass)
  })
})
