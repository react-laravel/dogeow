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
  it('renders an image placeholder first and swaps to the generated image', () => {
    const { rerender } = render(
      <ChatMessageItem
        message={{
          role: 'assistant',
          content: '图片提示词：柴犬在海边',
          images: [{ id: 'slot-1', isPlaceholder: true }],
          generatingImage: true,
        }}
      />
    )

    expect(screen.getByText('生成中')).toBeInTheDocument()
    expect(screen.queryByAltText('消息图片 1')).not.toBeInTheDocument()

    rerender(
      <ChatMessageItem
        message={{
          role: 'assistant',
          content: '图片提示词：柴犬在海边',
          images: [{ id: 'slot-1', url: 'https://example.com/doge.png' }],
        }}
      />
    )

    expect(screen.getByAltText('消息图片 1')).toHaveAttribute('src', 'https://example.com/doge.png')
    expect(screen.queryByText('生成中')).not.toBeInTheDocument()
  })
})
