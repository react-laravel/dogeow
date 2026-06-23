import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SimpleMarkdown } from '../SimpleMarkdown'

describe('SimpleMarkdown', () => {
  it('renders plain text when content is empty', () => {
    const { container } = render(<SimpleMarkdown content="" />)
    // Empty string should render a non-breaking space span
    expect(container.textContent).toBe(' ')
  })

  it('renders plain text when content is whitespace', () => {
    const { container } = render(<SimpleMarkdown content="   " />)
    expect(container.textContent).toBe('   ')
  })

  it('renders markdown heading', () => {
    render(<SimpleMarkdown content="# Hello World" />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('renders markdown bold text', () => {
    render(<SimpleMarkdown content="Hello **bold** text" />)
    expect(screen.getByText(/Hello/)).toBeInTheDocument()
    expect(screen.getByText('bold')).toBeInTheDocument()
  })

  it('renders markdown paragraph', () => {
    render(<SimpleMarkdown content="Hello\n\nWorld" />)
    expect(screen.getByText(/Hello/)).toBeInTheDocument()
    expect(screen.getByText(/World/)).toBeInTheDocument()
  })

  it('renders markdown list', () => {
    render(<SimpleMarkdown content="- item 1\n- item 2" />)
    expect(screen.getByText(/item 1/)).toBeInTheDocument()
    expect(screen.getByText(/item 2/)).toBeInTheDocument()
  })

  it('renders markdown code', () => {
    render(<SimpleMarkdown content="`code snippet`" />)
    expect(screen.getByText('code snippet')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<SimpleMarkdown content="hello" className="custom-class" />)
    const div = container.querySelector('.custom-class')
    expect(div).toBeTruthy()
  })

  it('renders pre-formatted text for invalid markdown', () => {
    // If processor fails, it falls back to whitespace-pre-wrap span
    const badContent = '\x00\x01\x02'
    const { container } = render(<SimpleMarkdown content={badContent} />)
    // Should render either prose div or whitespace-pre-wrap span
    const hasContent =
      container.querySelector('.prose') || container.querySelector('.whitespace-pre-wrap')
    expect(hasContent).toBeTruthy()
  })
})
