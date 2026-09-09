import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BookCover } from '../BookCover'

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, onError }: { src?: string; alt?: string; onError?: () => void }) => (
    <span
      data-testid="book-cover-image"
      data-src={src}
      data-alt={alt}
      onClick={() => onError?.()}
    />
  ),
}))

describe('BookCover', () => {
  it('renders the catalog cover beside the given book id', () => {
    render(<BookCover bookId="hongloumeng" fallbackIcon="📖" color="#795548" />)

    expect(screen.getByTestId('book-cover-image')).toHaveAttribute(
      'data-src',
      '/images/books/hongloumeng.jpg'
    )
    expect(screen.queryByText('📖')).not.toBeInTheDocument()
  })

  it('falls back to the emoji when the cover fails to load', () => {
    render(<BookCover bookId="hongloumeng" fallbackIcon="📖" color="#795548" />)

    fireEvent.click(screen.getByTestId('book-cover-image'))

    expect(screen.queryByTestId('book-cover-image')).not.toBeInTheDocument()
    expect(screen.getByText('📖')).toBeInTheDocument()
  })
})
