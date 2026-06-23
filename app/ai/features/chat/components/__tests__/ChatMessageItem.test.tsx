/* eslint-disable @next/next/no-img-element */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatMessageItem } from '../ChatMessageItem'

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={src} alt={alt} {...props} />
  ),
}))

describe('ChatMessageItem', () => {
  it('renders user message', () => {
    render(<ChatMessageItem message={{ role: 'user', content: 'Hello assistant' }} />)
    expect(screen.getByText('Hello assistant')).toBeInTheDocument()
  })

  it('renders assistant message', () => {
    render(<ChatMessageItem message={{ role: 'assistant', content: 'Hi there!' }} />)
    expect(screen.getByText('Hi there!')).toBeInTheDocument()
  })

  it('renders image placeholder when generatingImage', () => {
    render(
      <ChatMessageItem
        message={{
          role: 'assistant',
          content: '图片提示词：柴犬',
          images: [{ id: 'slot-1', isPlaceholder: true }],
          generatingImage: true,
        }}
      />
    )
    expect(screen.getByText('生成中')).toBeInTheDocument()
  })

  it('swaps placeholder for generated image', () => {
    const { rerender } = render(
      <ChatMessageItem
        message={{
          role: 'assistant',
          content: '图片提示词：柴犬',
          images: [{ id: 'slot-1', isPlaceholder: true }],
          generatingImage: true,
        }}
      />
    )
    expect(screen.getByText('生成中')).toBeInTheDocument()

    rerender(
      <ChatMessageItem
        message={{
          role: 'assistant',
          content: '图片提示词：柴犬',
          images: [{ id: 'slot-1', url: 'https://example.com/doge.png' }],
        }}
      />
    )
    expect(screen.getByAltText('消息图片 1')).toHaveAttribute('src', 'https://example.com/doge.png')
    expect(screen.queryByText('生成中')).not.toBeInTheDocument()
  })

  it('renders page variant', () => {
    render(<ChatMessageItem variant="page" message={{ role: 'user', content: 'Hello' }} />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('renders dialog variant', () => {
    render(<ChatMessageItem variant="dialog" message={{ role: 'user', content: 'Hello' }} />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
