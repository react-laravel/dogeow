import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import About from '../page'

describe('About Page', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('should render about page with correct content', () => {
    render(<About />)

    expect(screen.getByText('自言自语')).toBeInTheDocument()
    expect(screen.queryByText('红楼梦对照阅读')).not.toBeInTheDocument()
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

  it('should adjust font size and text color', () => {
    render(<About />)

    fireEvent.change(screen.getByLabelText('字体大小'), { target: { value: '32' } })
    fireEvent.change(screen.getByLabelText('文字颜色'), { target: { value: '#ff0000' } })

    expect(screen.getByLabelText('自言自语内容')).toHaveStyle({
      color: '#ff0000',
      fontSize: '32px',
    })
  })

  it('should switch between horizontal and vertical text', () => {
    render(<About />)

    fireEvent.click(screen.getByRole('button', { name: '切换为竖排' }))

    const quoteList = screen.getByLabelText('自言自语内容')
    const firstQuote = screen.getByText(/世界需要更多的英雄/)

    expect(quoteList).not.toHaveStyle({ writingMode: 'vertical-rl' })
    expect(firstQuote).toHaveClass('h-full', 'shrink-0')
    expect(firstQuote).toHaveStyle({ writingMode: 'vertical-rl' })
    expect(screen.getByRole('button', { name: '切换为横排' })).toBeInTheDocument()
  })
})
