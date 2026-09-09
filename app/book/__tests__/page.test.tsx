import { fireEvent, render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { configs } from '@/app/configs'
import BookPage from '../page'

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src }: { src?: string }) => <div data-testid="book-cover-image" data-src={src} />,
}))

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))

const push = vi.fn()

describe('Book catalog page', () => {
  beforeEach(() => {
    push.mockClear()
    vi.mocked(useRouter).mockReturnValue({
      push,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>)
  })

  it('places a cover image beside each book title', () => {
    render(<BookPage />)

    for (const book of configs.books) {
      const title = book.fallbackTitle ?? book.id
      const heading = screen.getByRole('heading', { name: title })
      const card = heading.closest('button')

      expect(card).toBeTruthy()
      expect(card?.querySelector('[data-src]')).toHaveAttribute(
        'data-src',
        `/images/books/${book.id}.jpg`
      )
    }
  })

  it('opens the selected book', () => {
    render(<BookPage />)

    fireEvent.click(screen.getByRole('button', { name: /红楼梦/ }))

    expect(push).toHaveBeenCalledWith('/book/hongloumeng')
  })
})
