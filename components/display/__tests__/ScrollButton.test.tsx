import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { vi } from 'vitest'
import { ScrollButton } from '../ScrollButton'

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}))

describe('ScrollButton', () => {
  it('does not render on book reading pages', () => {
    vi.mocked(usePathname).mockReturnValue('/book/hongloumeng')

    render(<ScrollButton />)

    expect(screen.queryByRole('button', { name: '回到顶部' })).not.toBeInTheDocument()
  })

  it('renders on non-reading pages', () => {
    vi.mocked(usePathname).mockReturnValue('/book')

    render(
      <div data-scroll-container>
        <ScrollButton />
      </div>
    )

    expect(screen.getByRole('button', { name: '回到顶部' })).toBeInTheDocument()
  })
})
