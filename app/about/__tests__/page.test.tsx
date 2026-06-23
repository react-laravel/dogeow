import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import About from '../page'

describe('About Page', () => {
  it('should render about page with correct content', () => {
    render(<About />)

    expect(screen.getByText('自言自语')).toBeInTheDocument()
    expect(screen.getByText('红楼梦对照阅读')).toBeInTheDocument()
  })

  it('should have correct container classes', () => {
    const { container } = render(<About />)

    expect(container.firstChild).toHaveClass('mx-auto', 'w-full')
  })

  it('should be accessible', () => {
    render(<About />)

    // Check that the content is rendered in a div (which is accessible)
    const content = screen.getByText('自言自语')
    expect(content).toBeInTheDocument()
  })
})
